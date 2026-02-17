import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import mainLogo from "../../assets/Logos/mainLogoWIthText(white).svg";
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

    const handleClick = (item) => {
        localStorage.setItem('sidebarSelected', item.key.toString());
        navigate(item.path);
    };

    return (
        <aside
            className={`
        flex flex-col h-full transition-all duration-300 ease-in-out bg-primary text-white border-r border-white/10
        ${isCollapsed ? 'w-16' : 'w-[261px]'}
      `}
        >
            {/* Logo Section */}
            <div className={`h-[70px] flex items-center border-b px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed ? (
                    <img src={mainLogo} alt="RekNTek" className="w-[140px] h-[35px] ml-2.5" />
                ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">R</div>
                )}

                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-lg  hover:bg-white/10 transition-all text-white hidden md:block"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar ${isCollapsed ? "py-[16px] px-[7px]" : "p-[16px]"}`}>
                {/* Menu Items Container */}
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === pathname;
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
