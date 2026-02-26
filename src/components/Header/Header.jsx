import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/store";
import toast from "react-hot-toast";
import { Search, Bell, Plus, Menu, LogOut } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import OrderToast from "./OrderToast";
import AddMenuItemModal from "./AddMenuItemModal";

export default function Header({ onMobileMenuClick }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth?.user);
    const restaurantName = useSelector((state) => state.auth?.restaurantName);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

    const displayName = restaurantName?.trim() || "Restaurant";
    const displayEmail = user?.email || "john@example.com";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();

    // Demo: Show Order Toast on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            toast.custom((t) => (
                <OrderToast
                    t={t}
                    orderId="ORD-2310"
                    onViewOrder={() => console.log('View Order Clicked')}
                />
            ), { duration: 5000, position: 'top-right' });
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        setIsDropdownOpen(false);
        toast.success("Successfully logged out");
        navigate('/login');
    };

    return (
        <header className="h-[70px] bg-white border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 z-50 px-3 sm:px-4 md:px-8 gap-2">
            {/* LEFT SIDE — Mobile Menu & Search */}
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
                <button
                    onClick={onMobileMenuClick}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition md:hidden shrink-0"
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-general-text" />
                </button>

                {/* Search Bar — Now visible on mobile with flex-1 */}
                <div className="flex items-center bg-[#F5F5F5] rounded-[8px] px-3 sm:px-4 w-full md:w-[400px] h-[38px] sm:h-[44px]">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#99A1AF] mr-2" />
                    <input
                        type="text"
                        placeholder="Search orders, customers, menu items..."
                        className="bg-transparent outline-none text-[13px] sm:text-[14px] w-full placeholder-[#99A1AF] font-medium"
                    />
                </div>
            </div>

            {/* RIGHT SIDE — Quick Add + Bell + User */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Quick Add — visible on mobile as icon, label on lg+ */}
                <button
                    onClick={() => setIsAddMenuItemModalOpen(true)}
                    className="flex lg:gap-2 bg-[#24B99E] p-2 lg:px-4 h-[38px] sm:h-[40px] justify-center items-center rounded-[8px] hover:bg-[#24B99E]/90 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5 text-white" />
                    <p className="hidden lg:block text-[14px] font-[500] text-white">Add Menu Item</p>
                </button>

                {/* Bell Icon */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setIsNotificationPanelOpen(!isNotificationPanelOpen);
                            setIsDropdownOpen(false);
                        }}
                        className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A1A1A]" />
                        <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#FF4B4B] rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold border-2 border-white box-content">3</span>
                    </button>

                    <NotificationPanel
                        isOpen={isNotificationPanelOpen}
                        onClose={() => setIsNotificationPanelOpen(false)}
                    />
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
                            <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight mb-0.5 group-hover:text-[#24B99E] transition-colors">
                                {displayName}
                            </p>
                            <p className="text-[12px] text-[#6B6B6B] leading-tight font-medium">Restaurant Owner</p>
                        </div>
                        <div className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] bg-[#24B99E] rounded-full flex items-center justify-center text-white font-bold text-[13px] sm:text-[14px] shadow-sm group-hover:shadow-md transition-all">
                            {initials || "JB"}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-4 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                                    <p className="text-sm font-bold text-gray-900">
                                        {displayName}
                                    </p>
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

            <AddMenuItemModal
                isOpen={isAddMenuItemModalOpen}
                onClose={() => setIsAddMenuItemModalOpen(false)}
            />
        </header>
    );
}
