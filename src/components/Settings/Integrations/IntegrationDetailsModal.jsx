import React from 'react';
import { X, RefreshCcw } from 'lucide-react';

const IntegrationDetailsModal = ({ isOpen, onClose, platform }) => {
    if (!isOpen || !platform) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">{platform.name} Details</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Review integration performance and connection status.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Integration Stats */}
                    <div className="bg-[#F8F9FA] rounded-[12px] p-5 space-y-4 border border-[#E5E7EB]/50">
                        <h4 className="text-[15px] font-[600] text-[#111827]">Integration Stats</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[14px]">
                                <span className="text-[#6B7280]">Connected Since</span>
                                <span className="text-[#111827] font-[500]">15 Jan 2025</span>
                            </div>
                            <div className="flex justify-between items-center text-[14px]">
                                <span className="text-[#6B7280]">Imported Orders</span>
                                <span className="text-[#111827] font-[500]">385</span>
                            </div>
                            <div className="flex justify-between items-center text-[14px]">
                                <span className="text-[#6B7280]">Last Sync Time</span>
                                <span className="text-[#111827] font-[500]">2 mins ago</span>
                            </div>
                            <div className="flex justify-between items-center text-[14px]">
                                <span className="text-[#6B7280]">Failed Sync Attempts</span>
                                <span className="text-[#EF4444] font-[600]">0</span>
                            </div>
                        </div>
                    </div>

                    {/* Connection Details */}
                    <div className="border border-[#E5E7EB] rounded-[12px] p-5 space-y-4 bg-white">
                        <h4 className="text-[15px] font-[600] text-[#111827]">Connection Details</h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[12px] font-[500] text-[#9CA3AF] uppercase tracking-wider mb-1">API Key</p>
                                <div className="px-3 py-2 bg-gray-50 rounded-[6px] text-[13px] font-[500] text-[#4B5563] truncate">
                                    {platform.name.toLowerCase().replace(' ', '_')}_live_abc123
                                </div>
                            </div>
                            <div>
                                <p className="text-[12px] font-[500] text-[#9CA3AF] uppercase tracking-wider mb-1">Store ID</p>
                                <div className="px-3 py-2 bg-gray-50 rounded-[6px] text-[13px] font-[500] text-[#4B5563]">
                                    store_456
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Buttons matched AddMenuItemModal */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white shadow-inner">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => { }}
                        className="flex items-center gap-2 px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        <RefreshCcw size={18} />
                        Resync Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IntegrationDetailsModal;
