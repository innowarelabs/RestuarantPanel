import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';

const SupportHeader = ({ activeTab, onTabChange, onNewTicket, onFilter }) => {
    const subtitle = "Manage customer issues or raise tickets to the platform.";

    return (
        <div className="bg-white border border-[#00000033] rounded-[16px] p-4 sm:p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
                <div>
                    <h1 className="text-[24px] font-[800] text-[#111827] mb-0.5">Support Center</h1>
                    <p className="text-[14px] text-[#6B7280]">{subtitle}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-[240px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ticket ID…"
                            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#2BB29C]/20 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={onFilter}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] font-[500] text-[#4B5563] hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Filter className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            Filter
                        </button>

                        <button
                            onClick={onNewTicket}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#2BB29C] text-white rounded-[8px] text-[13px] font-[600] hover:bg-[#24A18C] transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            New Ticket
                        </button>
                    </div>
                </div>
            </div>

            <div className="inline-flex p-1 bg-[#F3F4F6] rounded-[8px]">
                <button
                    onClick={() => onTabChange('customer')}
                    className={`px-8 py-2.5 rounded-[6px] text-[14px] font-[500] transition-all ${activeTab === 'customer'
                        ? 'bg-white text-[#111827] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                >
                    Customer Support
                </button>
                <button
                    onClick={() => onTabChange('admin')}
                    className={`px-8 py-2.5 rounded-[6px] text-[14px] font-[500] transition-all ${activeTab === 'admin'
                        ? 'bg-white text-[#111827] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                >
                    Admin Support
                </button>
            </div>
        </div>
    );
};


export default SupportHeader;
