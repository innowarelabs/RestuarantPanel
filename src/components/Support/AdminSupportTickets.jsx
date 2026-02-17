import React from 'react';
import { Eye } from 'lucide-react';

const AdminSupportTickets = ({ onViewTicket }) => {
    const tickets = [
        {
            id: "#T-1234",
            title: "Payout not received for last week",
            orderId: "#ORD-8760-8755",
            category: "Payouts",
            categoryColor: "bg-green-100 text-green-600",
            priority: "Urgent",
            priorityColor: "bg-red-50 text-red-500",
            status: "In Progress",
            statusColor: "bg-blue-50 text-blue-500 font-medium border border-blue-100",
            updated: "1h ago"
        },
        {
            id: "#T-1233",
            title: "Menu items not syncing properly",
            category: "Technical",
            categoryColor: "bg-blue-100 text-blue-600",
            priority: "High",
            priorityColor: "bg-orange-50 text-orange-500",
            status: "Awaiting Info",
            statusColor: "bg-yellow-50 text-yellow-600 font-medium border border-yellow-100",
            updated: "3h ago"
        },
        {
            id: "#T-1232",
            title: "Unable to access analytics dashboard",
            category: "Technical",
            categoryColor: "bg-blue-100 text-blue-600",
            priority: "Normal",
            priorityColor: "bg-gray-100 text-gray-600",
            status: "Open",
            statusColor: "bg-green-50 text-green-600 font-medium border border-green-100",
            updated: "1 day ago"
        },
        {
            id: "#T-1231",
            title: "Integration with POS system not working",
            orderId: "#ORD-8750",
            category: "Integrations",
            categoryColor: "bg-yellow-100 text-yellow-600",
            priority: "High",
            priorityColor: "bg-orange-50 text-orange-500",
            status: "In Progress",
            statusColor: "bg-blue-50 text-blue-500 font-medium border border-blue-100",
            updated: "5h ago"
        },
        {
            id: "#T-1230",
            title: "Request to increase menu item limit",
            category: "Account",
            categoryColor: "bg-indigo-100 text-indigo-600",
            priority: "Low",
            priorityColor: "bg-blue-50 text-blue-400",
            status: "Resolved",
            statusColor: "bg-indigo-50 text-indigo-600 font-medium border border-indigo-100",
            updated: "2 days ago"
        }
    ];

    return (
        <div className="bg-white rounded-[12px] border border-[#00000033] overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-general-text">Admin Support Tickets</h2>
                <p className="text-[13px] text-gray-500">5 tickets</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#F9FAFB] text-[12px] sm:text-[12px] font-[500] text-gray-500 text-nowrap  tracking-wider">
                            <th className="px-6 text-nowrap py-4">Ticket ID</th>
                            <th className="px-6 text-nowrap py-4">Title</th>
                            <th className="px-6 text-nowrap py-4">Category</th>
                            <th className="px-6 text-nowrap py-4">Priority</th>
                            <th className="px-6 text-nowrap py-4">Status</th>
                            <th className="px-6 text-nowrap py-4">Last Updated</th>
                            <th className="px-6 text-nowrap py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tickets.map((ticket, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-5 text-nowrap text-[14px] font-[500] text-general-text">
                                    {ticket.id}
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-[14px] font-[500] text-nowrap text-general-text mb-0.5">{ticket.title}</p>
                                    {ticket.orderId && <p className="text-[12px] text-gray-400">{ticket.orderId}</p>}
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-1 rounded-[6px] text-[10px] font-bold ${ticket.categoryColor}`}>
                                        {ticket.category}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-[6px] text-[10px] font-bold ${ticket.priorityColor}`}>
                                        {ticket.priority}
                                        <svg className="w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className={`inline-flex items-center text-nowrap px-3 py-1 text-nowrap rounded-[6px] text-[10px] font-bold ${ticket.statusColor}`}>
                                        {ticket.status}
                                        <svg className="w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-[13px] text-gray-500">
                                    {ticket.updated}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => onViewTicket && onViewTicket(ticket)}
                                        className="inline-flex items-center gap-1.5 text-[13px] font-[500] text-primary hover:underline"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSupportTickets;
