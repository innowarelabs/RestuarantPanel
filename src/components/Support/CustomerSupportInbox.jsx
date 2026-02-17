import React from 'react';
import { MessageSquare, Paperclip, Mail, Bot } from 'lucide-react';

const CustomerSupportInbox = ({ conversations, activeId, onSelect }) => {
    return (
        <div className="bg-white rounded-[16px] border border-[#00000033] overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-general-text">Customer Support Inbox</h2>
                <p className="text-[12px] text-gray-500">{conversations.length} active conversations</p>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv)}
                        className={`p-6 flex gap-4 cursor-pointer transition-colors relative border-b border-gray-100 last:border-0 ${activeId === conv.id ? 'bg-[#F0FDF9]' : 'hover:bg-gray-50/50'
                            }`}
                    >
                        <div className="relative flex-shrink-0">
                            <img src={conv.avatar} alt={conv.name} className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-50" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[16px] font-bold text-[#111827] truncate">{conv.name}</h3>
                                    {conv.online && <div className="w-2.5 h-2.5 bg-[#2BB29C] rounded-full"></div>}
                                </div>
                                <span className="text-[14px] text-gray-400 whitespace-nowrap ml-2">{conv.time}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-2 text-[14px] text-gray-400 font-medium tracking-tight">
                                <span>{conv.orderId}</span>
                                {conv.hasMessage && <MessageSquare className="w-4 h-4 stroke-[1.5]" />}
                                {conv.hasEmail && <Mail className="w-4 h-4 stroke-[1.5]" />}
                                {conv.hasAttachment && <Paperclip className="w-4 h-4 stroke-[1.5]" />}
                                {conv.isBot && <Bot className="w-4 h-4 stroke-[1.5]" />}
                            </div>

                            <p className={`text-[14px] mb-3 truncate font-[400] ${activeId === conv.id ? 'text-[#6B7280]' : 'text-[#6B7280]'}`}>
                                {conv.lastMessage}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {conv.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className={`px-3 py-1 rounded-[6px] text-[12px] font-[500] ${tag === 'Urgent' ? 'bg-[#FFF1F2] text-[#E11D48]' :
                                            tag === 'High' ? 'bg-[#FFFBEB] text-[#D97706]' :
                                                tag === 'Normal' ? 'bg-[#F9FAFB] text-[#4B5563]' :
                                                    tag === 'Low' ? 'bg-[#F0F9FF] text-[#0284C7]' :
                                                        tag === 'Open' ? 'bg-[#ECFDF5] text-[#10B981]' :
                                                            tag === 'New' ? 'bg-[#EFF6FF] text-[#3B82F6]' :
                                                                tag === 'Resolved' ? 'bg-[#EEF2FF] text-[#6366F1]' :
                                                                    tag === 'Escalated' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                                                                        tag === 'Waiting' ? 'bg-[#FFFBEB] text-[#F59E0B]' :
                                                                            'bg-[#F3F4F6] text-[#6B7280]'
                                            }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {conv.progress && (
                                <div className="h-[6px] w-[80%] bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${conv.progress}%`,
                                            backgroundColor: conv.statusColor || '#E5E7EB'
                                        }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default CustomerSupportInbox;
