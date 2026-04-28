import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/store";
import toast from "react-hot-toast";
import { Search, Bell, Plus, Menu, LogOut } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import AddMenuItemModal from "./AddMenuItemModal";
import RestaurantGlobalSearchResults from "./RestaurantGlobalSearchResults";
import { useOrderNotifications } from "../../context/OrderNotificationsContext";

/** Normalize restaurant global-search API body into `{ query, results }` for the dropdown. */
function normalizeGlobalSearchPayload(raw) {
    if (!raw || typeof raw !== "object") return null;
    const inner = raw.data != null && typeof raw.data === "object" ? raw.data : raw;
    let query = typeof inner.query === "string" ? inner.query : "";
    let results = inner.results != null && typeof inner.results === "object" ? { ...inner.results } : null;

    if (!results) {
        results = {};
        for (const [k, v] of Object.entries(inner)) {
            if (k === "query" || k === "code" || k === "message" || k === "errors" || k === "data") continue;
            if (Array.isArray(v)) results[k] = v;
        }
    }

    if (!results.menu_items && Array.isArray(results.dishes)) results.menu_items = results.dishes;
    if (!results.menu_items && Array.isArray(results.items)) results.menu_items = results.items;
    if (!results.customers && Array.isArray(results.users)) results.customers = results.users;

    const totalHits =
        typeof inner.total_hits === "number"
            ? inner.total_hits
            : typeof inner.totalHits === "number"
                ? inner.totalHits
                : null;

    return { query, results, totalHits };
}

function isGlobalSearchErrorPayload(json) {
    if (!json || typeof json !== "object") return false;
    const code = typeof json.code === "string" ? json.code.trim().toUpperCase() : "";
    if (code.startsWith("SUCCESS_")) return false;
    if (code.startsWith("ERROR_")) return true;
    if (code.endsWith("_400") || code.endsWith("_401") || code.endsWith("_403") || code.endsWith("_404") || code.endsWith("_422") || code.endsWith("_500")) return true;
    return false;
}

export default function Header({ onMobileMenuClick }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth?.user);
    const accessToken = useSelector((state) => state.auth?.accessToken);
    const restaurantName = useSelector((state) => state.auth?.restaurantName);
    const { unreadCount } = useOrderNotifications();

    const [globalSearchUnlocked, setGlobalSearchUnlocked] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [searchData, setSearchData] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const searchDebounceRef = useRef(null);
    const searchRequestId = useRef(0);
    const searchContainerRef = useRef(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

    const restaurantId = useMemo(() => {
        const fromUser = user && typeof user === "object" && typeof user.restaurant_id === "string" ? user.restaurant_id : "";
        let fromStorage = "";
        try {
            fromStorage = localStorage.getItem("restaurant_id") || "";
        } catch {
            fromStorage = "";
        }
        return (fromUser || fromStorage).trim();
    }, [user]);

    const displayName = restaurantName?.trim() || "Restaurant";
    const displayEmail = user?.email || "john@example.com";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();

    const dismissSearchPanel = useCallback(() => {
        searchRequestId.current += 1;
        setSearchData(null);
        setSearchError(null);
        setSearchLoading(false);
    }, []);

    const handleGlobalSearchClose = useCallback(() => {
        dismissSearchPanel();
    }, [dismissSearchPanel]);

    const handleGlobalSearchPick = useCallback(
        (key, _item) => {
            switch (key) {
                case "orders":
                    navigate("/orders");
                    break;
                case "customers":
                    navigate("/customers");
                    break;
                case "menu_items":
                case "categories":
                    navigate("/menu-management");
                    break;
                case "rewards":
                    navigate("/loyalty-program");
                    break;
                case "tickets":
                    navigate("/supports");
                    break;
                // case "campaigns":
                //     navigate("/admin-dashboard");
                //     break;
                default:
                    navigate("/admin-dashboard");
                    break;
            }
            setGlobalSearchQuery("");
            dismissSearchPanel();
        },
        [dismissSearchPanel, navigate],
    );

    useEffect(() => {
        const q = globalSearchQuery.trim();
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        if (!q) {
            searchRequestId.current += 1;
            setSearchData(null);
            setSearchError(null);
            setSearchLoading(false);
            return;
        }

        searchDebounceRef.current = setTimeout(async () => {
            const id = ++searchRequestId.current;
            setSearchLoading(true);
            setSearchError(null);
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error("VITE_BACKEND_URL is missing");
                const url = new URL(`${baseUrl.replace(/\/$/, "")}/api/v1/restaurants/global-search`);
                url.searchParams.set("q", q);
                url.searchParams.set("limit", "5");

                const res = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { "X-Restaurant-Id": restaurantId } : {}),
                    },
                });

                const contentType = res.headers.get("content-type");
                const json = contentType?.includes("application/json") ? await res.json() : null;

                if (id !== searchRequestId.current) return;

                if (!res.ok || (json && isGlobalSearchErrorPayload(json))) {
                    const msg =
                        (json && typeof json.message === "string" && json.message.trim()) ||
                        (typeof json === "object" && json?.error) ||
                        "Search failed";
                    setSearchData(null);
                    setSearchError(typeof msg === "string" ? msg : "Search failed");
                    return;
                }

                if (json && typeof json === "object") {
                    const normalized = normalizeGlobalSearchPayload(json);
                    setSearchData(
                        normalized && normalized.results
                            ? { ...normalized, query: normalized.query || q }
                            : { query: q, results: {}, totalHits: null },
                    );
                    setSearchError(null);
                } else {
                    setSearchData({ query: q, results: {}, totalHits: null });
                    setSearchError(null);
                }
            } catch (e) {
                if (id !== searchRequestId.current) return;
                setSearchData(null);
                setSearchError(typeof e?.message === "string" ? e.message : "Search failed");
            } finally {
                if (id === searchRequestId.current) {
                    setSearchLoading(false);
                }
            }
        }, 400);

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [globalSearchQuery, accessToken, restaurantId]);

    useEffect(() => {
        function handlePointerDown(e) {
            if (!searchContainerRef.current?.contains(e.target)) {
                dismissSearchPanel();
            }
        }
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [dismissSearchPanel]);

    const handleLogout = () => {
        dispatch(logout());
        setIsDropdownOpen(false);
        toast.success("Successfully logged out");
        navigate("/login");
    };

    return (
        <header className="h-[70px] bg-white border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 z-50 px-3 sm:px-4 md:px-0 gap-2">
            {/* LEFT — mobile menu only (no desktop spacer; avoids line/gap next to sidebar) */}
            <div className="flex items-center shrink-0 md:hidden">
                <button
                    onClick={onMobileMenuClick}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition shrink-0"
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-general-text" />
                </button>
            </div>

            {/* CENTER — Global search (desktop, matches admin-panel) */}
            <div className="hidden md:flex flex-1 px-[32px] min-w-0">
                <div ref={searchContainerRef} className="relative w-full max-w-[329px]">
                    <div className="flex items-center bg-[#F5F5F5] rounded-[8px] px-4 w-full h-[44px]">
                        <input
                            id="header-global-search"
                            type="search"
                            name="header_global_search"
                            value={globalSearchQuery}
                            onChange={(e) => setGlobalSearchQuery(e.target.value)}
                            onFocus={() => setGlobalSearchUnlocked(true)}
                            placeholder="Search orders, customers, menu items…"
                            className="bg-transparent outline-none text-[14px] w-full placeholder-[#99A1AF] font-medium"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            readOnly={!globalSearchUnlocked}
                            data-1p-ignore
                            data-lpignore="true"
                            data-bwignore
                            data-form-type="other"
                            aria-label="Global search"
                            aria-expanded={Boolean(globalSearchQuery.trim() && (searchLoading || searchData || searchError))}
                        />
                        <Search className="w-5 h-5 text-[#99A1AF] ml-[9px] shrink-0" />
                    </div>
                    {globalSearchQuery.trim() && (searchLoading || searchData || searchError) && (
                        <RestaurantGlobalSearchResults
                            data={searchData}
                            query={globalSearchQuery}
                            loading={searchLoading}
                            error={searchError}
                            onPickItem={handleGlobalSearchPick}
                            onClose={handleGlobalSearchClose}
                        />
                    )}
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 md:pr-[32px] flex-1 md:flex-initial justify-end">
                <button
                    onClick={() => setIsAddMenuItemModalOpen(true)}
                    className="flex lg:gap-2 bg-[#DD2F26] p-2 lg:px-4 h-[38px] sm:h-[40px] justify-center items-center rounded-[8px] hover:bg-[#DD2F26]/90 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5 text-white" />
                    <p className="hidden lg:block text-[14px] font-[500] text-white">Add Menu Item</p>
                </button>

                <div className="relative">
                    <button
                        onClick={() => {
                            setIsNotificationPanelOpen(!isNotificationPanelOpen);
                            setIsDropdownOpen(false);
                        }}
                        className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A1A1A]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#FF4B4B] rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold border-2 border-white box-content min-w-[14px]">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} />
                </div>

                <div className="relative border-l border-[#E5E7EB] pl-2 sm:pl-6 py-1 h-[36px] sm:h-[40px] flex items-center">
                    <button
                        onClick={() => {
                            setIsDropdownOpen(!isDropdownOpen);
                            setIsNotificationPanelOpen(false);
                        }}
                        className="flex items-center gap-2 sm:gap-3 transition hover:cursor-pointer group"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight mb-0.5 group-hover:text-[#DD2F26] transition-colors">
                                {displayName}
                            </p>
                            <p className="text-[12px] text-[#6B6B6B] leading-tight font-medium">Restaurant Owner</p>
                        </div>
                        <div className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] bg-[#DD2F26] rounded-full flex items-center justify-center text-white font-bold text-[13px] sm:text-[14px] shadow-sm group-hover:shadow-md transition-all">
                            {initials || "JB"}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-4 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                                    <p className="text-sm font-bold text-gray-900">{displayName}</p>
                                    <p className="text-[12px] text-gray-500 mt-0.5 font-medium">{displayEmail}</p>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition text-left text-sm text-gray-700 hover:cursor-pointer group"
                                >
                                    <LogOut className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold text-red-600">Logout</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AddMenuItemModal isOpen={isAddMenuItemModalOpen} onClose={() => setIsAddMenuItemModalOpen(false)} />
        </header>
    );
}
