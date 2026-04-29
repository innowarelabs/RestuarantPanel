import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Users,
    BarChart3,
    Gift,
    FileBarChart,
    Headphones,
    Settings as SettingsIcon,
} from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const RESTAURANT_OPEN_STORAGE_KEY = 'restaurantPanelAcceptingOrders';

const navItems = [
    { key: 1, name: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { key: 2, name: 'Orders', icon: ShoppingBag, path: '/orders' },
    { key: 3, name: 'Menu Management', icon: UtensilsCrossed, path: '/menu-management' },
    { key: 4, name: 'Customers', icon: Users, path: '/customers' },
    { key: 5, name: 'Analytics', icon: BarChart3, path: '/global-analytics' },
    { key: 6, name: 'Loyalty Program', icon: Gift, path: '/loyalty-program' },
    { key: 7, name: 'Reports', icon: FileBarChart, path: '/reports' },
    { key: 8, name: 'Support', icon: Headphones, path: '/supports' },
    { key: 9, name: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;
    const restaurantName = useSelector((state) => state.auth?.restaurantName);
    const displayName = restaurantName?.trim() || 'Restaurant';
    const initial = displayName.charAt(0).toUpperCase() || 'R';

    const [isRestaurantOpen, setIsRestaurantOpen] = useState(() => {
        try {
            const v = localStorage.getItem(RESTAURANT_OPEN_STORAGE_KEY);
            return v !== 'false';
        } catch {
            return true;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(RESTAURANT_OPEN_STORAGE_KEY, String(isRestaurantOpen));
        } catch {
            /* ignore */
        }
    }, [isRestaurantOpen]);

    const toggleRestaurantOpen = useCallback(() => {
        setIsRestaurantOpen((v) => !v);
    }, []);

    const handleClick = (item) => {
        localStorage.setItem('sidebarSelected', item.key.toString());
        navigate(item.path);
    };

    const openStatusTooltipId = 'sidebar-open-status-tooltip';

    return (
        <aside
            className={`
        flex flex-col h-full transition-all duration-300 ease-in-out bg-primary text-white border-r border-white/10
        ${isCollapsed ? 'w-16' : 'w-[261px]'}
      `}
        >
            {/* Brand + open/closed toggle (toggle sits below name, right-aligned) */}
            {isCollapsed ? (
                <div className="flex flex-col items-center gap-2 border-b border-white/10 px-2 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-base font-bold leading-none text-primary">
                        {initial}
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isRestaurantOpen}
                        onClick={toggleRestaurantOpen}
                        data-tooltip-id={openStatusTooltipId}
                        data-tooltip-content={
                            isRestaurantOpen ? 'Open — accepting orders' : 'Closed'
                        }
                        className={`relative flex h-5 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                            isRestaurantOpen ? 'bg-primary' : 'bg-[#D1D5DB]'
                        }`}
                        aria-label={isRestaurantOpen ? 'Mark restaurant as closed' : 'Mark restaurant as open'}
                    >
                        <span
                            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                                isRestaurantOpen ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                    <Tooltip
                        id={openStatusTooltipId}
                        place="right"
                        offset={8}
                        anchorSelect={`[data-tooltip-id="${openStatusTooltipId}"]`}
                        positionStrategy="fixed"
                        style={{
                            backgroundColor: '#15B99E',
                            color: '#fff',
                            fontSize: '0.875rem',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '0.3rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                            zIndex: 9999,
                        }}
                    />
                    <button
                        onClick={onToggleCollapse}
                        className="rounded-lg p-1.5 text-white transition-all hover:bg-white/10 hidden md:block"
                        aria-label="Expand sidebar"
                    >
                        <ChevronRight size={22} />
                    </button>
                </div>
            ) : (
                <div className="border-b border-white/10 px-3 py-3 sm:px-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-base font-bold leading-none text-primary">
                                    {initial}
                                </div>
                                <span className="truncate text-[15px] font-semibold leading-tight text-white">
                                    {displayName}
                                </span>
                            </div>
                            <button
                                onClick={onToggleCollapse}
                                className="shrink-0 rounded-lg p-1.5 text-white transition-all hover:bg-white/10 hidden md:block"
                                aria-label="Collapse sidebar"
                            >
                                <ChevronLeft size={22} />
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <div
                                className="box-border flex h-[22px] w-[83px] shrink-0 items-center justify-between rounded-[6px] bg-[#FFFFFF] px-[6px] py-[4px] shadow-sm"
                            >
                                <span
                                    className="min-w-0 truncate font-sans text-[10px] font-normal leading-[10px] tracking-normal text-primary"
                                >
                                    {isRestaurantOpen ? 'Open' : 'Closed'}
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isRestaurantOpen}
                                    onClick={toggleRestaurantOpen}
                                    className={`relative box-border flex h-[14px] w-8 shrink-0 items-center rounded-full p-[2px] transition-colors ${
                                        isRestaurantOpen ? 'bg-primary' : 'bg-[#D1D5DB]'
                                    }`}
                                    aria-label={
                                        isRestaurantOpen ? 'Mark restaurant as closed' : 'Mark restaurant as open'
                                    }
                                >
                                    <span
                                        className={`pointer-events-none block h-[10px] w-[10px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                                            isRestaurantOpen ? 'translate-x-[18px]' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar ${isCollapsed ? "py-[16px] px-[7px]" : "p-[16px]"}`}>
                {/* Menu Items Container */}
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        // Reports: stay active on /reports and all child routes (e.g. /reports/sales-reports)
                        const isActive =
                            item.path === '/reports'
                                ? pathname === '/reports' || pathname.startsWith('/reports/')
                                : item.path === pathname;
                        const tooltipId = `sidebar-tooltip-${item.key}`;

                        return (
                            <div key={item.key} className="group relative">
                                <button
                                    onClick={() => handleClick(item)}
                                    data-tooltip-id={isCollapsed ? tooltipId : undefined}
                                    data-tooltip-content={isCollapsed ? item.name : undefined}
                                    className={`w-full flex items-center gap-2 px-2.5 cursor-pointer h-[55px] rounded-[14px] transition-all
                      ${isActive
                                            ? 'bg-white text-primary font-medium'
                                            : 'hover:bg-white/15'
                                        } ${isCollapsed ? "justify-center" : "justify-start"}`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-white'}`} />
                                    {!isCollapsed && <span className="text-[14px] font-medium truncate">{item.name}</span>}
                                </button>
                                {/* Tooltip when collapsed */}
                                {isCollapsed && (
                                    <Tooltip
                                        id={tooltipId}
                                        place="right"
                                        offset={12}
                                        anchorSelect={`[data-tooltip-id="${tooltipId}"]`}
                                        positionStrategy="fixed"
                                        style={{
                                            backgroundColor: '#15B99E',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: '0.3rem',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                            zIndex: 9999,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Section (Separator + Help Card) */}
                {!isCollapsed && (
                    <div className="mt-auto">
                        {/* Separator - Now balanced spacing */}
                        <div className="h-[1px] bg-white -mx-4 mt-8 mb-8" />

                        {/* Need Help Card */}
                        <div className="mx-1 mb-4">
                            <div className="bg-white rounded-[12px] p-5 shadow-lg">
                                <p className="text-[#4A5565] text-[14px] mb-2 font-medium">Need help?</p>
                                <button
                                    onClick={() => navigate('/supports')}
                                    className="text-primary text-[15px] font-bold hover:underline transition-all flex items-center gap-1"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </aside>
    );
}
