import React from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';

const SupportTicketsWidget = () => {
    const tickets = [
        {
            id: 'TKT-2847',
            title: 'Order not received - Customer complaint',
            time: '15 min ago',
            priority: 'HIGH',
        },
        {
            id: 'TKT-2846',
            title: 'Wrong item delivered',
            time: '1 hour ago',
            priority: 'MEDIUM',
        },
        {
            id: 'TKT-2845',
            title: 'Refund request for order #1432',
            time: '2 hours ago',
            priority: 'HIGH',
        }
    ];

    return (
        <div className="bg-white rounded-[16px] border border-[#00000033] h-full flex flex-col">
            <div className="p-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[16px] font-[800] text-[#111827]">Support & Tickets</h3>
                    <span className="bg-[#FEE2E2] text-[#EF4444] text-[13px]   px-5 py-2 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <p className='mt-1'>12 Open</p>
                    </span>
                </div>

                <div className="space-y-4">
                    {tickets.map((ticket, index) => (
                        <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-[500] text-[#111827] mb-0.5">{ticket.title}</h4>
                                    <p className="text-[11px] text-gray-500">Ticket #{ticket.id}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{ticket.time}</p>
                                </div>
                            </div>
                            <div>
                                <span className={`text-[10px] px-4 py-2 rounded-[4px] uppercase ${ticket.priority === 'HIGH'
                                    ? 'bg-[#FEE2E2] text-[#EF4444]'
                                    : 'bg-[#FEF3C7] text-[#F59E0B]'
                                    }`}>
                                    {ticket.priority}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto p-4 bg-[#E5F9F6] rounded-b-[16px] border-t border-[#E5E7EB]">
                <button className="w-full text-center text-[14px] font-[800] text-[#374151] hover:text-[#111827] transition-colors cursor-pointer">
                    View All Tickets
                </button>
            </div>
        </div>
    );
};

export default SupportTicketsWidget;
