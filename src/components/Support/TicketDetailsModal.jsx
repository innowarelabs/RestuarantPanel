import React, { useState } from 'react';
import { X, Clock, Paperclip, Send, FileText, ChevronRight } from 'lucide-react';

const TicketDetailsModal = ({ isOpen, onClose, ticket }) => {
    const [activeTab, setActiveTab] = useState('Conversation');

    if (!isOpen || !ticket) return null;

    const tabs = ['Conversation', 'Details', 'Attachments', 'Timeline'];

    const renderContent = () => {
        switch (activeTab) {
            case 'Conversation':
                return (
                    <div className="flex flex-col max-h-[450px]">
                        <div className="overflow-y-auto p-6 space-y-6 h-[350px] custom-scrollbar">
                            {/* User Message */}
                            <div className="flex flex-col items-end gap-1.5">
                                <div className="px-5 py-3.5 bg-[#2BB29C] text-white rounded-[18px] rounded-tr-none text-[14px] max-w-[85%] font-[500] leading-relaxed shadow-sm">
                                    I was supposed to receive my weekly payout on Monday but it hasn't arrived yet. My bank account details are correct.
                                    <div className="mt-3 p-2.5 bg-white/10 rounded-[8px] flex items-center gap-2 border border-white/10">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span className="text-[12px] font-medium">bank-statement.pdf</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-400 font-[500] mr-2">You • 01:54</span>
                            </div>

                            {/* Admin Message */}
                            <div className="flex flex-col items-start gap-1.5">
                                <div className="px-5 py-3.5 bg-[#F3F4F6] text-[#111827] rounded-[18px] rounded-tl-none text-[14px] max-w-[85%] font-[500] leading-relaxed">
                                    Thank you for contacting us. We're looking into your payout issue and will update you within 24 hours.
                                </div>
                                <span className="text-[11px] text-gray-400 font-[500] ml-2">Admin Team • 02:30</span>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-gray-100 bg-[#F9FAFB]/50">
                            <div className="flex items-center gap-2 mb-4">
                                <button className="px-3 py-1 bg-white border border-gray-200 text-[#6B7280] rounded-[6px] text-[10px] font-[700] uppercase tracking-wider hover:bg-gray-50 transition-all">Internal Notes OFF</button>
                            </div>

                            <div className="bg-white rounded-[12px] p-4 border border-[#E5E7EB] shadow-sm">
                                <textarea
                                    rows="2"
                                    placeholder="Type your message..."
                                    className="w-full bg-transparent border-none focus:outline-none text-[14px] font-[500] text-[#111827] placeholder:text-[#9CA3AF] resize-none custom-scrollbar"
                                ></textarea>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-5 text-[#9CA3AF]">
                                        <button className="hover:text-[#2BB29C] transition-colors cursor-pointer active:scale-90"><Paperclip className="w-4 h-4" /></button>
                                        <button className="flex items-center gap-2 text-[12px] font-[700] text-[#2BB29C] active:scale-95 px-2 py-1 hover:bg-[#2BB29C]/5 rounded-md transition-all">
                                            Quick Replies
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="px-6 py-2 bg-[#2BB29C] text-white rounded-[8px] text-[13px] font-[600] flex items-center gap-2 hover:bg-[#24A18C] active:scale-95 transition-all shadow-md shadow-[#2BB29C]/10">
                                            <Send className="w-4 h-4" />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Details':
                return (
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[450px] custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                                <p className="text-[14px] font-[600] text-general-text">{ticket.category}</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Priority</label>
                                <span className={`inline-flex px-2 py-1 rounded-[6px] text-[10px] font-bold ${ticket.priorityColor}`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <div>
                                <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                                <span className={`inline-flex px-3 py-1 rounded-[6px] text-[10px] font-bold ${ticket.statusColor}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div>
                                <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Created</label>
                                <p className="text-[14px] font-[500] text-general-text">2 days ago</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Last Updated</label>
                                <p className="text-[14px] font-[500] text-general-text">{ticket.updated}</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Assigned To</label>
                                <p className="text-[14px] font-[500] text-general-text">Admin Team</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Related Order</label>
                            <p className="text-[14px] font-[600] text-[#2BB29C] hover:underline cursor-pointer">{ticket.orderId || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                            <p className="text-[14px] font-[500] text-[#4B5563] leading-relaxed">
                                {ticket.title}. I was supposed to receive my weekly payout on Monday but it hasn't arrived yet. My bank account details are correct.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-10 mt-auto border-t border-gray-100">
                            <button className="flex-1 py-2.5 bg-[#2BB29C] text-white rounded-[8px] text-[13px] font-[600] hover:bg-[#24A18C] active:scale-[0.98] transition-all">
                                Resolve Ticket
                            </button>
                            <button className="flex-1 py-2.5 border border-gray-200 text-[#4B5563] rounded-[8px] text-[13px] font-[600] hover:bg-gray-50 active:scale-[0.98] transition-all">
                                Reopen Ticket
                            </button>
                        </div>
                    </div>
                );
            case 'Attachments':
                return (
                    <div className="p-6 h-full min-h-[450px]">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div className="p-4 border border-gray-100 rounded-[12px] bg-[#F9FAFB] hover:border-[#2BB29C] transition-all cursor-pointer group">
                                <div className="w-full aspect-square bg-white rounded-[8px] border border-gray-100 flex items-center justify-center mb-3">
                                    <FileText className="w-10 h-10 text-gray-300 group-hover:text-[#2BB29C] transition-colors" />
                                </div>
                                <h4 className="text-[12px] font-[600] text-general-text truncate mb-1">bank-statement.pdf</h4>
                                <p className="text-[10px] text-gray-400 font-bold">1.2 MB</p>
                            </div>
                        </div>
                    </div>
                );
            case 'Timeline':
                return (
                    <div className="p-6 h-full min-h-[450px]">
                        <div className="relative space-y-10 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {[
                                { title: 'Ticket created', time: '2 days ago', user: 'You' },
                                { title: 'Status changed to In Progress', time: '1 day ago', user: 'Admin Team' },
                                { title: 'Attachment uploaded', time: '2 days ago', user: 'You' },
                                { title: 'Priority changed to Urgent', time: '1 day ago', user: 'You' }
                            ].map((item, idx) => (
                                <div key={idx} className="relative flex items-center gap-5 pl-10">
                                    <div className="absolute left-0 w-8 h-8 bg-[#ECFDF5] rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm">
                                        <Clock className="w-4 h-4 text-[#10B981]" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-[600] text-general-text mb-0.5">{item.title}</h4>
                                        <p className="text-[11px] text-gray-400 font-[500] uppercase tracking-wide">{item.time} • {item.user}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[12px] border border-[#00000033] w-[500px] max-w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-[18px] font-bold text-general-text">{ticket.title}</h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-gray-500 font-[500] uppercase tracking-wide">{ticket.id}</span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <span className={`text-[11px] font-bold ${ticket.statusColor} px-2 py-0.5 rounded-[4px]`}>{ticket.status}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-5 flex border-b border-gray-100 bg-[#F9FAFB]/30 overflow-x-auto no-scrollbar">
                    <div className="flex min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-[13px] font-[600] transition-all relative ${activeTab === tab
                                    ? 'text-[#2BB29C]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2BB29C] rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-x-auto custom-scrollbar">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
