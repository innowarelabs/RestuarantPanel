import React from 'react';
import { MoreVertical, Store, Paperclip, Smile, Send, ChevronDown, AlertCircle } from 'lucide-react';

const CustomerChatWindow = ({ conversation }) => {
    if (!conversation) {
        return (
            <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex items-center justify-center text-gray-400 h-full">
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col h-[600px] lg:h-full font-['Inter',_sans-serif]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-transparent flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-[18px] font-bold text-[#111827]">{conversation.name}</h3>
                        {conversation.online && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-2.5 h-2.5 bg-[#2BB29C] rounded-full mb-1"></div>
                                <span className="text-[12px] text-[#2BB29C]">Online</span>
                            </div>
                        )}
                    </div>
                    <p className="text-[13px] text-[#6B7280]">Ticket ID: CT-001</p>
                </div>
                <button className="text-[#9CA3AF] hover:text-[#111827] transition-colors">
                    <MoreVertical className="w-6 h-6" />
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 custom-scrollbar">
                {/* Order Summary Card */}
                <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[8px] p-4 mb-8 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white rounded-[12px] flex items-center justify-center text-[#6B7280] shadow-sm">
                                <Store className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-[500] text-[#111827]">{conversation.orderId}</h4>
                                <p className="text-[12px] text-[#6B7280]">3 items • $24.50 • Out for Delivery</p>
                            </div>
                        </div>
                        <button className="text-[13px] font-[500] text-[#2BB29C] hover:underline text-left sm:text-right">View Full Order</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-transparent">
                        <div className="space-y-2">
                            <label className="text-[12px] font-medium text-[#6B7280]">Priority</label>
                            <div className="flex items-center justify-between px-4 py-3 bg-[#FEE2E2] text-[#EF4444] rounded-[6px] text-[13px] cursor-pointer transition-all active:scale-[0.98]">
                                Urgent <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-medium text-[#6B7280]">Status</label>
                            <div className="flex items-center justify-between px-4 py-3 bg-[#DCFCE7] text-[#10B981] rounded-[6px] text-[13px] cursor-pointer transition-all active:scale-[0.98]">
                                Open <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-medium text-[#6B7280]">Channel</label>
                            <div className="px-4 py-3 bg-[#F3F4F6] text-[#4B5563] rounded-[6px] text-[13px] ">
                                Chat
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 px-4 py-2.5 bg-[#DCFCE7] text-[#10B981] rounded-[6px] text-[13px] ">
                        Delivery
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-5">
                        <button className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-[#E5E7EB] text-[#111827] rounded-[8px] text-[13px] hover:bg-gray-50 active:scale-[0.98] transition-all">
                            <AlertCircle className="w-5 h-5 text-[#111827]" />
                            Escalate to Admin
                        </button>
                        <button className="w-full sm:flex-1 py-3 bg-[#2BB29C] text-white rounded-[8px] text-[13px] hover:bg-[#24A18C] active:scale-[0.98] transition-all">
                            Mark Resolved
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-8 pb-10">
                    <div className="flex flex-col items-start gap-2">
                        <div className="px-6 py-4 bg-[#F3F4F6] text-[#111827] rounded-[22px] rounded-tl-none text-[14px] max-w-[90%] sm:max-w-[85%] font-medium leading-relaxed">
                            I can't find the delivery driver. Can you call them?
                        </div>
                        <span className="text-[12px] text-[#9CA3AF] ml-2 font-medium">23:12</span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="px-6 py-5 bg-[#2BB29C] text-white rounded-[22px] rounded-tr-none text-[14px] max-w-[90%] sm:max-w-[85%] font-medium leading-relaxed shadow-sm text-right">
                            I've contacted the driver and they're 2 minutes away from your location.
                        </div>
                        <span className="text-[12px] text-[#9CA3AF] mr-2 font-medium">23:17</span>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                        <div className="px-6 py-4 bg-[#F3F4F6] text-[#111827] rounded-[22px] rounded-tl-none text-[14px] max-w-[90%] sm:max-w-[85%] font-medium leading-relaxed">
                            Great, I'll wait for the driver.
                        </div>
                        <span className="text-[12px] text-[#9CA3AF] ml-2 font-medium">23:22</span>
                    </div>
                </div>
            </div>

            {/* Chat Input Area */}
            <div className="mt-auto px-4 sm:px-8 pb-4 sm:pb-8 pt-4 bg-white rounded-b-[24px]">
                <div className="inline-flex items-center px-4 py-2 bg-[#F3F4F6] text-[#6B7280] rounded-[6px] text-[12px] font-medium mb-2">
                    Internal Notes OFF
                </div>

                <div className="bg-white border border-[#E5E7EB] min-h-[80px] rounded-[6px] p-4 focus-within:border-[#2BB29C] transition-all">
                    <textarea
                        rows="2"
                        placeholder="Type your message..."
                        className="w-full bg-transparent border-none focus:outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF] resize-none"
                    ></textarea>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 mt-2">
                            <button className="text-[#9CA3AF] hover:text-[#2BB29C] transition-colors active:scale-90"><Paperclip className="w-4 h-4" /></button>
                            <button className="text-[#9CA3AF] hover:text-[#2BB29C] transition-colors active:scale-90"><Smile className="w-4 h-4" /></button>
                            <button className="text-[12px] text-[#2BB29C] active:scale-95 transition-all hover:opacity-80">
                                Quick Replies
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 mt-4">
                    <button className="w-full sm:w-auto px-5 py-3 bg-[#8EE4D3] text-white rounded-[8px] text-[13px] font-[500] flex items-center justify-center gap-2 hover:bg-[#7AD9C5] active:scale-95 transition-all shadow-sm order-1 sm:order-1">
                        <Send className="w-5 h-5 fill-current" />
                        Send
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 bg-white border border-[#2BB29C] text-[#2BB29C] rounded-[8px] text-[13px] font-[500] flex items-center justify-center hover:bg-[#F0FDF9] active:scale-95 transition-all order-2 sm:order-2">
                        Send & Resolve
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerChatWindow;
