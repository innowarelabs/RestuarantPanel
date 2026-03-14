import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Eye } from 'lucide-react';

const AdminSupportTickets = ({ onViewTicket, refreshKey }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getRestaurantId = () => {
        const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return (fromUser || fromStorage).trim();
    };

    const restaurantId = getRestaurantId();

    const getCategoryColor = (type) => {
        const value = (type || '').toLowerCase();
        switch (value) {
            case 'billing':
                return 'bg-green-100 text-green-600';
            case 'technical':
                return 'bg-blue-100 text-blue-600';
            case 'account':
                return 'bg-indigo-100 text-indigo-600';
            case 'integrations':
                return 'bg-yellow-100 text-yellow-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getPriorityColor = (priority) => {
        const value = (priority || '').toLowerCase();
        switch (value) {
            case 'high':
                return 'bg-red-50 text-red-500';
            case 'medium':
                return 'bg-orange-50 text-orange-500';
            case 'low':
                return 'bg-blue-50 text-blue-400';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusColor = (status) => {
        const value = (status || '').toLowerCase();
        switch (value) {
            case 'open':
            case 'pending':
                return 'bg-green-50 text-green-600 font-medium border border-green-100';
            case 'in_progress':
            case 'in progress':
                return 'bg-blue-50 text-blue-500 font-medium border border-blue-100';
            case 'awaiting_info':
            case 'waiting_customer':
                return 'bg-yellow-50 text-yellow-600 font-medium border border-yellow-100';
            case 'resolved':
            case 'closed':
                return 'bg-indigo-50 text-indigo-600 font-medium border border-indigo-100';
            default:
                return 'bg-gray-50 text-gray-600 font-medium border border-gray-100';
        }
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    useEffect(() => {
        const fetchTickets = async () => {
            if (!accessToken) return;

            setLoading(true);
            setError('');

            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/`;

                const headers = {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                };

                const res = await fetch(url, {
                    method: 'GET',
                    headers,
                });

                const json = await res.json();
                const data = json?.data || json || {};
                const rawTickets = Array.isArray(data?.tickets)
                    ? data.tickets
                    : Array.isArray(data)
                        ? data
                        : Array.isArray(json?.tickets)
                            ? json.tickets
                            : [];

                const mapped = rawTickets.map((t) => {
                    const id = t.id || t.ticket_id || t.ticket_number || '';
                    const ticketNumber = t.ticket_number || id || '';
                    const subject = t.subject || t.title || 'No Subject';
                    const orderNumber = t.order_number || t.orderId || '';
                    const ticketType = t.ticket_type || t.category || 'General';
                    const priority = (t.priority || 'medium').charAt(0).toUpperCase() + (t.priority || 'medium').slice(1).toLowerCase();
                    const statusRaw = t.status || 'open';
                    const status =
                        statusRaw.toLowerCase() === 'open'
                            ? 'Open'
                            : statusRaw.toLowerCase() === 'in_progress' || statusRaw.toLowerCase() === 'in progress'
                                ? 'In Progress'
                                : statusRaw.toLowerCase() === 'resolved'
                                    ? 'Resolved'
                                    : statusRaw.toLowerCase() === 'closed'
                                        ? 'Closed'
                                        : statusRaw;

                    return {
                        id: ticketNumber || id,
                        apiId: t.id || t.ticket_id || '',
                        title: subject,
                        orderId: orderNumber ? `#${orderNumber}` : '',
                        category: ticketType.charAt(0).toUpperCase() + ticketType.slice(1),
                        categoryColor: getCategoryColor(ticketType),
                        priority,
                        priorityColor: getPriorityColor(t.priority),
                        status,
                        statusColor: getStatusColor(statusRaw),
                        updated: formatRelativeTime(t.updated_at || t.created_at),
                        restaurantName: t.restaurant_name || '',
                        commentsCount: typeof t.comments_count === 'number' ? t.comments_count : null,
                        raw: t,
                    };
                });

                setTickets(mapped);
            } catch (err) {
                setError(err.message || 'Failed to load admin support tickets');
                setTickets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [accessToken, restaurantId, refreshKey]);

    return (
        <div className="bg-white rounded-[12px] border border-[#00000033] overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-general-text">Admin Support Tickets</h2>
                <p className="text-[13px] text-gray-500">
                    {loading ? 'Loading tickets…' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`}
                </p>
            </div>
            {error ? (
                <div className="p-5 text-[13px] text-red-500">
                    {error}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F9FAFB] text-[12px] sm:text-[12px] font-[500] text-gray-500 text-nowrap  tracking-wider">
                                <th className="px-6 text-nowrap py-4">Ticket ID</th>
                                <th className="px-6 text-nowrap py-4">Title</th>
                                <th className="px-6 text-nowrap py-4">Restaurant</th>
                                <th className="px-6 text-nowrap py-4">Category</th>
                                <th className="px-6 text-nowrap py-4">Priority</th>
                                <th className="px-6 text-nowrap py-4">Status</th>
                                <th className="px-6 text-nowrap py-4">Comments</th>
                                <th className="px-6 text-nowrap py-4">Last Updated</th>
                                <th className="px-6 text-nowrap py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tickets.map((ticket, index) => (
                                <tr key={ticket.id || index} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5 text-nowrap text-[14px] font-[500] text-general-text">
                                        {ticket.id}
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[14px] font-[500] text-nowrap text-general-text mb-0.5">
                                            {ticket.title}
                                        </p>
                                        {ticket.orderId && (
                                            <p className="text-[12px] text-gray-400">
                                                {ticket.orderId}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-[13px] text-gray-600">
                                        {ticket.restaurantName || '-'}
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
                                    <td className="px-6 py-5 text-[13px] text-gray-600">
                                        {ticket.commentsCount !== null ? ticket.commentsCount : '-'}
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
                            {!loading && tickets.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-5 text-center text-[13px] text-gray-500"
                                    >
                                        No admin support tickets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminSupportTickets;
