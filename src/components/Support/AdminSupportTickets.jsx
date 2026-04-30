import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ChevronDown, Eye } from 'lucide-react';

const PRIORITY_OPTIONS = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
];

/** Same API values as admin-panel `SupportTickets.jsx` → PATCH `/api/v1/tickets/{id}` body `{ status }`. */
const STATUS_OPTIONS = [
    { label: 'Pending', api: 'open' },
    { label: 'In Progress', api: 'in_progress' },
    { label: 'Resolved', api: 'resolved' },
    { label: 'Closed', api: 'closed' },
    { label: 'Waiting customer', api: 'waiting_customer' },
];

const formatPatchError = (json) => {
    if (!json || typeof json !== 'object') return 'Update failed';
    const detail = json.detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const lines = detail
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const msg = item.msg || item.message || 'Invalid value';
                const loc = Array.isArray(item.loc) ? item.loc.filter((x) => x !== 'body') : [];
                const field = loc.length ? String(loc[loc.length - 1]) : '';
                return field ? `${field}: ${msg}` : msg;
            })
            .filter(Boolean);
        if (lines.length) return lines.join('\n');
    }
    if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
    return 'Update failed';
};

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

    const [menu, setMenu] = useState(null);
    /** `apiId` while PATCH in flight — blocks duplicate submits. */
    const [patchingId, setPatchingId] = useState(null);
    const menuDropdownRef = useRef(null);

    /** Category tag colors (design spec). */
    const getCategoryColor = (type) => {
        const value = (type || '').toLowerCase();
        switch (value) {
            case 'billing':
            case 'payment':
            case 'payouts':
                return 'bg-[#DD2F2633] text-[#16A34A]';
            case 'technical':
                return 'bg-[#DBEAFE] text-[#2563EB]';
            case 'integrations':
            case 'integration':
                return 'bg-[#FEF3C7] text-[#CA8A04]';
            case 'account':
            case 'support':
                return 'bg-[#E0E7FF] text-[#6366F1]';
            default:
                return 'bg-[#F3F4F6] text-[#4B5563]';
        }
    };

    /** Priority: same tag shell as category; semantic colors. */
    const getPriorityColor = (priority) => {
        const value = (priority || '').toLowerCase();
        switch (value) {
            case 'high':
            case 'urgent':
                return 'bg-[#FEE2E2] text-[#DC2626]';
            case 'medium':
            case 'normal':
                return 'bg-[#FFEDD5] text-[#EA580C]';
            case 'low':
                return 'bg-[#DBEAFE] text-[#2563EB]';
            default:
                return 'bg-[#F3F4F6] text-[#4B5563]';
        }
    };

    /** Status: same tag shell as category; semantic colors. */
    const getStatusColor = (status) => {
        const value = (status || '').toLowerCase();
        switch (value) {
            case 'open':
            case 'pending':
                return 'bg-[#DCFCE7] text-[#16A34A]';
            case 'in_progress':
            case 'in progress':
                return 'bg-[#DBEAFE] text-[#2563EB]';
            case 'awaiting_info':
            case 'waiting_customer':
                return 'bg-[#FEF3C7] text-[#CA8A04]';
            case 'resolved':
                return 'bg-[#EEF2FF] text-[#4F46E5]';
            case 'closed':
                return 'bg-[#F3F4F6] text-[#6B7280]';
            default:
                return 'bg-[#F3F4F6] text-[#4B5563]';
        }
    };

    /** Shared pill: padding 4px 12px, radius 6px, Sofia Pro 12px / 18px / 500 (from global font). */
    const tagPillClass = 'inline-flex items-center gap-0.5 rounded-[6px] px-3 py-1 text-[12px] font-medium leading-[18px] tracking-normal';
    /** Priority / status triggers: extra gap between label and chevron. */
    const tagPillInteractiveClass =
        'inline-flex items-center gap-2 rounded-[6px] px-3 py-1 text-[12px] font-medium leading-[18px] tracking-normal';

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

    const patchTicket = useCallback(
        async (apiId, body) => {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            if (!accessToken) throw new Error('Not authenticated');
            if (!apiId) throw new Error('Missing ticket id');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/${encodeURIComponent(apiId)}`;
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify(body),
            });
            const raw = await res.text();
            let json = {};
            if (raw) {
                try {
                    json = JSON.parse(raw);
                } catch {
                    json = { message: raw };
                }
            }
            if (!res.ok) {
                throw new Error(formatPatchError(json));
            }
            if (json.code != null && !String(json.code).startsWith('SUCCESS')) {
                throw new Error(json.message || formatPatchError(json) || 'Update failed');
            }
            return json.data ?? json;
        },
        [accessToken, restaurantId],
    );

    const openMenu = (field, ticket, e) => {
        if (!ticket.apiId || patchingId === ticket.apiId) return;
        const r = e.currentTarget.getBoundingClientRect();
        setMenu((prev) =>
            prev && prev.apiId === ticket.apiId && prev.field === field
                ? null
                : {
                      field,
                      apiId: ticket.apiId,
                      top: r.bottom + 4,
                      left: r.left,
                      minWidth: r.width,
                  },
        );
    };

    const applyPriority = async (apiId, value) => {
        if (!apiId || patchingId) return;
        setPatchingId(apiId);
        setMenu(null);
        try {
            await patchTicket(apiId, { priority: value });
            const label = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            setTickets((prev) =>
                prev.map((row) =>
                    row.apiId === apiId
                        ? {
                              ...row,
                              priority: label,
                              priorityRaw: value,
                              priorityColor: getPriorityColor(value),
                              updated: 'Just now',
                          }
                        : row,
                ),
            );
            toast.success('Priority updated');
        } catch (err) {
            toast.error(err.message || 'Failed to update priority');
        } finally {
            setPatchingId(null);
        }
    };

    const applyStatus = async (apiId, api) => {
        if (!apiId || patchingId) return;
        setPatchingId(apiId);
        setMenu(null);
        try {
            await patchTicket(apiId, { status: api });
            const opt = STATUS_OPTIONS.find((o) => o.api === api);
            const label = opt ? opt.label : api;
            setTickets((prev) =>
                prev.map((row) =>
                    row.apiId === apiId
                        ? {
                              ...row,
                              status: label,
                              statusApi: api,
                              statusColor: getStatusColor(api),
                              updated: 'Just now',
                          }
                        : row,
                ),
            );
            toast.success('Status updated');
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        } finally {
            setPatchingId(null);
        }
    };

    useEffect(() => {
        if (!menu) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setMenu(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menu]);

    useEffect(() => {
        if (!menu) return;
        const onPointerDown = (e) => {
            const t = e.target;
            if (menuDropdownRef.current?.contains(t)) return;
            if (t.closest?.('[data-ticket-inline-dropdown-trigger]')) return;
            setMenu(null);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [menu]);

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
                    const statusApi = String(statusRaw).toLowerCase().replace(/\s+/g, '_');
                    const status =
                        statusApi === 'open' || statusApi === 'pending'
                            ? 'Pending'
                            : statusApi === 'in_progress'
                              ? 'In Progress'
                              : statusApi === 'resolved'
                                ? 'Resolved'
                                : statusApi === 'closed'
                                  ? 'Closed'
                                  : statusApi === 'waiting_customer' || statusApi === 'awaiting_info'
                                    ? 'Waiting customer'
                                    : String(statusRaw);

                    const orderRaw =
                        orderNumber != null && String(orderNumber).trim() !== '' ? String(orderNumber).trim() : '';
                    const orderDisplay = orderRaw ? `Order #${orderRaw.replace(/^#/, '')}` : '';
                    const categoryType = String(t.ticket_type || t.category || 'general')
                        .toLowerCase()
                        .replace(/\s+/g, '_');
                    const priorityRaw = String(t.priority || 'medium').toLowerCase();

                    return {
                        id: ticketNumber || id,
                        apiId: t.id || t.ticket_id || '',
                        title: subject,
                        orderDisplay,
                        category: ticketType.charAt(0).toUpperCase() + ticketType.slice(1).toLowerCase(),
                        categoryType,
                        categoryColor: getCategoryColor(categoryType),
                        priority,
                        priorityRaw,
                        priorityColor: getPriorityColor(priorityRaw),
                        status,
                        statusApi,
                        statusColor: getStatusColor(statusApi),
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
        <>
        <div className="bg-white rounded-[12px] border border-[#00000033] overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <h2
                    className="text-[18px] font-bold leading-[21.6px] tracking-normal text-[#111827]"
                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                >
                    Admin Support Tickets
                </h2>
                <p className="mt-1 text-[13px] leading-[18px] text-[#6B7280]" style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}>
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
                            <tr className="bg-[#F9FAFB]">
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Ticket ID
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Title
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Restaurant
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Category
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Priority
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Status
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Comments
                                </th>
                                <th
                                    className="px-6 py-4 text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Last Updated
                                </th>
                                <th
                                    className="px-6 py-4 text-right text-nowrap text-[12px] font-medium leading-[18px] tracking-normal text-[#6B7280]"
                                    style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tickets.map((ticket, index) => (
                                <tr key={ticket.apiId || ticket.id || index} className="hover:bg-gray-50/50 transition-colors">
                                    <td
                                        className="px-6 py-5 text-nowrap text-[14px] font-medium leading-[21px] text-[#111827]"
                                        style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                    >
                                        {ticket.id}
                                    </td>
                                    <td className="px-6 py-5">
                                        <p
                                            className="text-[14px] font-medium leading-[21px] text-[#111827]"
                                            style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                        >
                                            {ticket.title}
                                        </p>
                                        {ticket.orderDisplay ? (
                                            <p
                                                className="mt-0.5 text-[12px] font-normal leading-[18px] text-[#6B7280]"
                                                style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                            >
                                                {ticket.orderDisplay}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td
                                        className="px-6 py-5 text-nowrap text-[14px] font-medium leading-[21px] text-[#111827]"
                                        style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                    >
                                        {ticket.restaurantName || '-'}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span
                                            className={`${tagPillClass} ${getCategoryColor(ticket.categoryType)}`}
                                            style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                        >
                                            {ticket.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            type="button"
                                            data-ticket-inline-dropdown-trigger
                                            disabled={!ticket.apiId || patchingId === ticket.apiId}
                                            onClick={(e) => openMenu('priority', ticket, e)}
                                            className={`${tagPillInteractiveClass} ${getPriorityColor(ticket.priorityRaw)} max-w-full cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-60`}
                                            style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                        >
                                            <span className="truncate">{ticket.priority}</span>
                                            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            type="button"
                                            data-ticket-inline-dropdown-trigger
                                            disabled={!ticket.apiId || patchingId === ticket.apiId}
                                            onClick={(e) => openMenu('status', ticket, e)}
                                            className={`${tagPillInteractiveClass} text-nowrap ${getStatusColor(ticket.statusApi)} max-w-full cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-60`}
                                            style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                        >
                                            <span className="truncate">{ticket.status}</span>
                                            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                                        </button>
                                    </td>
                                    <td
                                        className="px-6 py-5 text-nowrap text-[14px] font-medium leading-[21px] text-[#111827]"
                                        style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                    >
                                        {ticket.commentsCount !== null ? ticket.commentsCount : '-'}
                                    </td>
                                    <td
                                        className="px-6 py-5 text-nowrap text-[14px] font-medium leading-[21px] text-[#111827]"
                                        style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                    >
                                        {ticket.updated}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onViewTicket && onViewTicket(ticket)}
                                            className="inline-flex items-center gap-1.5 text-[14px] font-medium leading-[21px] text-primary hover:underline"
                                            style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                        >
                                            <Eye className="h-3.5 w-3.5 shrink-0" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && tickets.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-6 py-5 text-center text-[14px] font-medium leading-[21px] text-[#6B7280]"
                                        style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
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
        {menu && menu.apiId && (
            <ul
                ref={menuDropdownRef}
                className="fixed z-[100] max-h-64 min-w-[168px] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
                style={{
                    top: menu.top,
                    left: menu.left,
                    minWidth: Math.max(menu.minWidth || 0, 168),
                }}
                role="listbox"
            >
                    {menu.field === 'priority'
                        ? PRIORITY_OPTIONS.map((opt) => {
                              const row = tickets.find((t) => t.apiId === menu.apiId);
                              const active = row && row.priorityRaw === opt.value;
                              return (
                                  <li key={opt.value}>
                                      <button
                                          type="button"
                                          disabled={patchingId === menu.apiId}
                                          onClick={() => applyPriority(menu.apiId, opt.value)}
                                          className={`w-full px-4 py-2.5 text-left text-[13px] font-medium leading-[18px] text-[#111827] hover:bg-gray-50 disabled:opacity-50 ${
                                              active ? 'bg-gray-50' : ''
                                          }`}
                                          style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                      >
                                          {opt.label}
                                      </button>
                                  </li>
                              );
                          })
                        : STATUS_OPTIONS.map((opt) => {
                              const row = tickets.find((t) => t.apiId === menu.apiId);
                              const active = row && row.statusApi === opt.api;
                              return (
                                  <li key={opt.api}>
                                      <button
                                          type="button"
                                          disabled={patchingId === menu.apiId}
                                          onClick={() => applyStatus(menu.apiId, opt.api)}
                                          className={`w-full px-4 py-2.5 text-left text-[13px] font-medium leading-[18px] text-[#111827] hover:bg-gray-50 disabled:opacity-50 ${
                                              active ? 'bg-gray-50' : ''
                                          }`}
                                          style={{ fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' }}
                                      >
                                          {opt.label}
                                      </button>
                                  </li>
                              );
                          })}
            </ul>
        )}
        </>
    );
};

export default AdminSupportTickets;
