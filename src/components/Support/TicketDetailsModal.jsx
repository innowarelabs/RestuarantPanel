import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Clock, Paperclip, Send, FileText } from 'lucide-react';

const getBaseUrl = () => (import.meta.env.VITE_BACKEND_URL || 'https://api.baaie.com').replace(/\/$/, '');

const formatDateTime = (s) => {
    if (!s) return '—';
    try {
        return new Date(s).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return s;
    }
};

const labelize = (v) => {
    if (v == null || v === '') return '—';
    const t = String(v);
    if (t.includes('_')) {
        return t
            .split('_')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join(' ');
    }
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};

const getPriorityChipClass = (p) => {
    const v = (p || '').toLowerCase();
    if (v === 'high') return 'bg-red-50 text-red-600';
    if (v === 'medium') return 'bg-orange-50 text-orange-500';
    if (v === 'low') return 'bg-blue-50 text-blue-500';
    return 'bg-gray-100 text-gray-600';
};

const getTypeBadgeClass = (t) => {
    const v = (t || '').toLowerCase();
    if (v === 'technical') return 'bg-blue-100 text-blue-600';
    if (v === 'billing') return 'bg-green-100 text-green-600';
    if (v === 'account') return 'bg-indigo-100 text-indigo-600';
    if (v === 'integrations') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
};

const getStatusBadgeClass = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'open' || v === 'pending') {
        return 'bg-green-50 text-green-600 font-medium border border-green-100';
    }
    if (v === 'in_progress' || v === 'in progress') {
        return 'bg-blue-50 text-blue-500 font-medium border border-blue-100';
    }
    if (v === 'awaiting_info' || v === 'waiting_customer') {
        return 'bg-yellow-50 text-yellow-600 font-medium border border-yellow-100';
    }
    if (v === 'resolved' || v === 'closed') {
        return 'bg-indigo-50 text-indigo-600 font-medium border border-indigo-100';
    }
    return 'bg-gray-50 text-gray-600 font-medium border border-gray-100';
};

const DetailField = ({ label, children, className = '' }) => (
    <div className={className}>
        <p className="text-[11px] font-[700] uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
        {typeof children === 'string' || typeof children === 'number' ? (
            <p className="text-[14px] font-[500] text-[#111827]">{children}</p>
        ) : (
            children
        )}
    </div>
);

const TicketDetailsModal = ({ isOpen, onClose, ticket }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [activeTab, setActiveTab] = useState('Conversation');
    const [ticketDetails, setTicketDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [error, setError] = useState('');

    const conversationContainerRef = useRef(null);

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

    const tabs = ['Conversation', 'Details', 'Attachments', 'Timeline'];

    const resolveTicketIdForApi = () => {
        if (!ticket) return '';
        return String(ticket.apiId || ticket.raw?.id || ticket.id || '')
            .trim();
    };

    const d = ticketDetails;

    const mapApiMessageToUi = (msg) => {
        if (!msg || typeof msg !== 'object') return null;
        const id = msg.id || msg.message_id || msg.comment_id || `temp-${Math.random().toString(36).slice(2)}`;
        const text = msg.comment || msg.message || msg.content || '';
        const createdAt = msg.created_at || msg.timestamp || null;
        const role = msg.user_role || msg.sender_role || (msg.is_internal ? 'internal' : 'restaurant');

        return {
            id,
            text,
            createdAt,
            role,
        };
    };

    const fetchMessages = async (ticketId) => {
        if (!ticketId || !accessToken) return;

        try {
            setLoadingMessages(true);
            setError('');

            const baseUrl = getBaseUrl();
            const idParam = encodeURIComponent(ticketId);
            const url = `${baseUrl}/api/v1/tickets/${idParam}/messages`;

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }

            const res = await fetch(url, { method: 'GET', headers });
            const json = await res.json();

            const data = json?.data;
            const rawMessages = Array.isArray(data?.messages)
                ? data.messages
                : Array.isArray(data)
                  ? data
                  : Array.isArray(json?.messages)
                    ? json.messages
                    : Array.isArray(json)
                      ? json
                      : [];

            const mapped = rawMessages.map(mapApiMessageToUi).filter(Boolean);

            setMessages(mapped);
        } catch (e) {
            setError(e.message || 'Failed to load messages');
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const fetchTicketDetails = async () => {
        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId || !accessToken) {
            setTicketDetails(null);
            return;
        }

        try {
            setLoadingDetails(true);
            setTicketDetails(null);
            setMessages([]);

            const baseUrl = getBaseUrl();
            const idParam = encodeURIComponent(apiTicketId);
            const url = `${baseUrl}/api/v1/tickets/${idParam}`;

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }

            const res = await fetch(url, { method: 'GET', headers });
            const json = await res.json();
            if (json?.code && String(json.code).indexOf('SUCCESS') !== 0 && res.ok === false) {
                throw new Error(json?.message || 'Failed to load ticket');
            }

            const details = json?.data ?? null;
            setTicketDetails(details);

            if (details && Array.isArray(details.conversation) && details.conversation.length) {
                const mappedConversation = details.conversation.map(mapApiMessageToUi).filter(Boolean);
                if (mappedConversation.length) {
                    setMessages(mappedConversation);
                }
            }

            await fetchMessages(apiTicketId);
        } catch (e) {
            console.error('Failed to load ticket details', e);
            setTicketDetails(ticket?.raw || null);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('Conversation');
            return;
        }
        if (ticket) {
            setActiveTab('Conversation');
            setReplyText('');
            setError('');
        }
    }, [isOpen, ticket]);

    useEffect(() => {
        if (!isOpen || !ticket) return;
        fetchTicketDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, ticket?.apiId, ticket?.id]);

    useEffect(() => {
        if (!conversationContainerRef.current) return;
        const container = conversationContainerRef.current;
        container.scrollTop = container.scrollHeight;
    }, [messages.length]);

    useEffect(() => {
        if (!isOpen) return;
        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId || !accessToken) return;

        const rawBase = getBaseUrl();
        const httpBase = rawBase.replace(/\/api\/v1\/?$/, '');
        const wsBase = httpBase.replace(/^http/, 'ws');

        const wsUrl = `${wsBase.replace(/\/$/, '')}/api/v1/chat/ws/tickets/${encodeURIComponent(
            apiTicketId
        )}?token=${encodeURIComponent(accessToken)}`;

        let isMounted = true;
        let ws;
        try {
            ws = new WebSocket(wsUrl);
        } catch (err) {
            console.error('[WS RestaurantTicket] failed to create WebSocket', err);
            return;
        }

        ws.onmessage = (event) => {
            if (!isMounted) return;
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_message' && data.message) {
                    const mapped = mapApiMessageToUi(data.message);
                    if (!mapped) return;
                    setMessages((prev) => {
                        const current = Array.isArray(prev) ? prev : [];
                        const exists = current.some((m) => m.id === mapped.id);
                        return exists ? current : [...current, mapped];
                    });
                }
            } catch (err) {
                console.error('[WS RestaurantTicket] invalid event data', err);
            }
        };

        return () => {
            isMounted = false;
            try {
                ws && ws.close();
            } catch {
                // ignore
            }
        };
    }, [isOpen, ticket?.apiId, ticket?.id, accessToken]);

    const handleSendMessage = async () => {
        const text = (replyText || '').trim();
        if (!text || !accessToken) return;

        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId) return;

        try {
            setSending(true);
            setError('');

            const baseUrl = getBaseUrl();
            const idParam = encodeURIComponent(apiTicketId);
            const url = `${baseUrl}/api/v1/tickets/${idParam}/messages`;

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ comment: text }),
            });

            const json = await res.json();
            const code = json?.code;
            const ok = res.ok || (code && typeof code === 'string' && code.startsWith('SUCCESS_'));

            if (!ok) {
                const message = json?.message || 'Failed to send message';
                throw new Error(message);
            }

            setReplyText('');
            await fetchMessages(apiTicketId);
        } catch (e) {
            setError(e.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const displaySubject = d?.subject || ticket?.title || '—';
    const displayTicketNo = d?.ticket_number || ticket?.id || '—';
    const displayStatus = d?.status != null ? labelize(d.status) : ticket?.status || '—';
    const statusForStyle = d?.status || (ticket?.raw && ticket.raw.status) || 'open';
    const priorityForStyle = d?.priority || (ticket?.raw && ticket.raw.priority) || 'medium';
    const descriptionText = d?.description || '';
    const attachments = Array.isArray(d?.attachments) ? d.attachments : [];

    const buildTimeline = () => {
        const events = [];
        if (d?.created_at) {
            events.push({ key: 'created', title: 'Ticket created', at: d.created_at, by: d.created_by_name || '—' });
        }
        if (d?.first_response_at) {
            events.push({
                key: 'first',
                title: 'First response',
                at: d.first_response_at,
                by: d.assigned_to_name || 'Support',
            });
        }
        if (d?.last_response_at && d?.last_response_at !== d?.first_response_at) {
            events.push({
                key: 'last',
                title: 'Last activity',
                at: d.last_response_at,
                by: d.assigned_to_name || '—',
            });
        }
        if (d?.updated_at && d?.created_at && d.updated_at !== d.created_at) {
            events.push({ key: 'updated', title: 'Updated', at: d.updated_at, by: d.created_by_name || '—' });
        }
        if (d?.resolved_at) {
            events.push({ key: 'resolved', title: 'Resolved', at: d.resolved_at, by: d.resolved_by_id ? '—' : '—' });
        }
        if (d?.closed_at) {
            events.push({ key: 'closed', title: 'Closed', at: d.closed_at, by: '—' });
        }
        return events.sort((a, b) => new Date(a.at) - new Date(b.at));
    };

    const renderContent = () => {
        if (loadingDetails) {
            return (
                <div className="flex min-h-[320px] items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            );
        }

        switch (activeTab) {
            case 'Conversation':
                return (
                    <div className="flex max-h-[450px] flex-col">
                        <div
                            ref={conversationContainerRef}
                            className="h-[350px] space-y-6 overflow-y-auto p-6 custom-scrollbar"
                        >
                            {loadingMessages && (
                                <p className="text-[12px] text-gray-500">Loading conversation…</p>
                            )}
                            {!loadingMessages && messages.length === 0 && (
                                <p className="text-[12px] text-gray-500">
                                    {d?.comments_count === 0 || messages.length === 0
                                        ? 'No messages yet. Start the conversation below.'
                                        : 'No messages to display.'}
                                </p>
                            )}

                            {messages.map((msg) => {
                                const isRestaurant =
                                    msg.role === 'restaurant' || msg.role === 'owner' || msg.role === 'manager';

                                const timeLabel = msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '';

                                if (isRestaurant) {
                                    return (
                                        <div key={msg.id} className="flex flex-col items-end gap-1.5">
                                            <div className="max-w-[85%] rounded-[18px] rounded-tr-none bg-[#DD2F26] px-5 py-3.5 text-[14px] font-[500] leading-relaxed text-white shadow-sm">
                                                {msg.text}
                                            </div>
                                            <span className="mr-2 text-[11px] font-[500] text-gray-400">
                                                You{timeLabel ? ` • ${timeLabel}` : ''}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className="flex flex-col items-start gap-1.5">
                                        <div className="max-w-[85%] rounded-[18px] rounded-tl-none bg-[#F3F4F6] px-5 py-3.5 text-[14px] font-[500] text-[#111827] leading-relaxed">
                                            {msg.text}
                                        </div>
                                        <span className="ml-2 text-[11px] font-[500] text-gray-400">
                                            Admin{timeLabel ? ` • ${timeLabel}` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-gray-100 bg-[#F9FAFB]/50 p-6">
                            {error && <p className="mb-2 text-[12px] text-red-500">{error}</p>}
                            <div className="mb-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    className="cursor-default rounded-[6px] border border-gray-200 bg-white px-3 py-1 text-[10px] font-[700] uppercase tracking-wider text-[#6B7280]"
                                >
                                    Internal Notes OFF
                                </button>
                            </div>

                            <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
                                <textarea
                                    rows="2"
                                    placeholder="Type your message..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="custom-scrollbar w-full resize-none border-none bg-transparent text-[14px] font-[500] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                                />
                                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-5 text-[#9CA3AF]">
                                        <button type="button" className="cursor-pointer active:scale-90 transition-colors hover:text-[#DD2F26]">
                                            <Paperclip className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px] font-[700] text-[#DD2F26] transition-all hover:bg-[#DD2F26]/5 active:scale-95"
                                        >
                                            Quick Replies
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={sending || !replyText.trim()}
                                        className={`flex items-center gap-2 rounded-[8px] bg-[#DD2F26] px-6 py-2 text-[13px] font-[600] text-white shadow-md transition-all hover:bg-[#C52820] active:scale-95 ${
                                            sending || !replyText.trim() ? 'cursor-not-allowed opacity-70' : ''
                                        }`}
                                    >
                                        <Send className="h-4 w-4" />
                                        {sending ? 'Sending…' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Details': {
                return (
                    <div className="max-h-[450px] space-y-6 overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <DetailField label="Ticket number">{d?.ticket_number || ticket?.id || '—'}</DetailField>
                            <DetailField label="Ticket type">
                                <span
                                    className={`inline-flex rounded-[6px] px-2 py-1 text-[10px] font-bold ${
                                        ticket?.category && !d?.ticket_type
                                            ? ticket.categoryColor
                                            : getTypeBadgeClass(d?.ticket_type)
                                    }`}
                                >
                                    {d?.ticket_type != null ? labelize(d.ticket_type) : ticket?.category || '—'}
                                </span>
                            </DetailField>
                            <DetailField label="Priority">
                                <span
                                    className={`inline-flex rounded-[6px] px-2 py-1 text-[10px] font-bold ${
                                        ticket?.priority && !d?.priority ? ticket.priorityColor : getPriorityChipClass(priorityForStyle)
                                    }`}
                                >
                                    {d?.priority != null ? labelize(d.priority) : ticket?.priority || '—'}
                                </span>
                            </DetailField>
                            <DetailField label="Status">
                                <span
                                    className={`inline-flex rounded-[6px] px-3 py-1 text-[10px] font-bold ${
                                        ticket?.status && !d?.status ? ticket.statusColor : getStatusBadgeClass(statusForStyle)
                                    }`}
                                >
                                    {d?.status != null ? labelize(d.status) : displayStatus}
                                </span>
                            </DetailField>
                            <DetailField label="Order number">
                                {d?.order_number != null && d.order_number !== ''
                                    ? d.order_number
                                    : '—'}
                            </DetailField>
                            <DetailField label="Preferred contact">
                                {d?.preferred_contact != null ? labelize(d.preferred_contact) : '—'}
                            </DetailField>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <DetailField label="Created by">{d?.created_by_name || '—'}</DetailField>
                            <DetailField label="Assigned to">{d?.assigned_to_name || 'Unassigned'}</DetailField>
                            <DetailField label="Restaurant">{d?.restaurant_name || ticket?.restaurantName || '—'}</DetailField>
                            <DetailField label="Restaurant email">{d?.restaurant_email || '—'}</DetailField>
                            <DetailField label="Owner email">{d?.owner_email || '—'}</DetailField>
                        </div>

                        <div>
                            <p className="text-[11px] font-[700] uppercase tracking-widest text-gray-400 mb-1.5">Subject</p>
                            <p className="text-[14px] font-[600] text-[#111827]">{d?.subject || ticket?.title || '—'}</p>
                        </div>

                        <div>
                            <p className="text-[11px] font-[700] uppercase tracking-widest text-gray-400 mb-1.5">Description</p>
                            <p className="whitespace-pre-wrap text-[14px] font-[500] leading-relaxed text-[#4B5563]">
                                {descriptionText || '—'}
                            </p>
                        </div>

                        {d?.resolution && (
                            <div>
                                <p className="text-[11px] font-[700] uppercase tracking-widest text-gray-400 mb-1.5">Resolution</p>
                                <p className="whitespace-pre-wrap text-[14px] font-[500] text-[#111827]">{d.resolution}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 text-[12px] text-gray-500 sm:grid-cols-2">
                            {d?.id && (
                                <p>
                                    <span className="font-[600] text-gray-400">ID:</span> {d.id}
                                </p>
                            )}
                            {typeof d?.comments_count === 'number' && (
                                <p>
                                    <span className="font-[600] text-gray-400">Comments count:</span> {d.comments_count}
                                </p>
                            )}
                        </div>
                    </div>
                );
            }
            case 'Attachments':
                return (
                    <div className="min-h-[200px] p-6">
                        {attachments.length === 0 ? (
                            <p className="text-[14px] text-gray-500">No attachments.</p>
                        ) : (
                            <ul className="space-y-3">
                                {attachments.map((a, i) => {
                                    const name = a.file_name || a.name || a.filename || `File ${i + 1}`;
                                    return (
                                        <li
                                            key={a.id || i}
                                            className="flex items-center gap-3 rounded-[12px] border border-gray-100 bg-[#F9FAFB] px-4 py-3"
                                        >
                                            <FileText className="h-8 w-8 shrink-0 text-gray-400" />
                                            <div className="min-w-0">
                                                <p className="truncate text-[14px] font-[600] text-[#111827]">{name}</p>
                                                {a.size && (
                                                    <p className="text-[11px] text-gray-400">
                                                        {typeof a.size === 'number' ? `${(a.size / 1024).toFixed(1)} KB` : a.size}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            case 'Timeline': {
                const timeline = buildTimeline();
                return (
                    <div className="min-h-[200px] p-6">
                        {timeline.length === 0 ? (
                            <p className="text-[14px] text-gray-500">No timeline events yet.</p>
                        ) : (
                            <div className="relative space-y-8 pl-1 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-[2px] before:bg-gray-100">
                                {timeline.map((item, idx) => (
                                    <div key={`${item.key}-${item.at}-${idx}`} className="relative flex gap-4 pl-10">
                                        <div className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#ECFDF5] shadow-sm">
                                            <Clock className="h-4 w-4 text-[#10B981]" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-[600] text-[#111827]">{item.title}</h4>
                                            <p className="text-[12px] font-[500] text-gray-500">
                                                {formatDateTime(item.at)}
                                                {item.by && item.by !== '—' ? ` · ${item.by}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            default:
                return null;
        }
    };

    if (!isOpen || !ticket) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 duration-200 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[90vh] overflow-hidden overflow-y-auto rounded-[12px] border border-[#00000033] bg-white shadow-2xl duration-200 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-gray-100 p-5">
                    <div className="mb-1 flex items-start justify-between gap-2">
                        <h2 className="text-left text-[18px] font-bold text-[#111827]">{displaySubject}</h2>
                        <button
                            onClick={onClose}
                            className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-[500] uppercase tracking-wide text-gray-500">{displayTicketNo}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                        <span
                            className={`inline-flex rounded-[4px] px-2 py-0.5 text-[11px] font-bold ${
                                d ? getStatusBadgeClass(d.status) : ticket?.statusColor || getStatusBadgeClass(statusForStyle)
                            }`}
                        >
                            {displayStatus}
                        </span>
                    </div>
                </div>

                <div className="flex border-b border-gray-100 bg-[#F9FAFB]/30 px-2 sm:px-4 overflow-x-auto no-scrollbar">
                    <div className="flex min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`relative px-3 py-3 text-[13px] font-[600] transition-all sm:px-4 ${
                                    activeTab === tab ? 'text-[#DD2F26]' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#DD2F26]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-[min(520px,70vh)] custom-scrollbar overflow-y-auto overflow-x-hidden">{renderContent()}</div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
