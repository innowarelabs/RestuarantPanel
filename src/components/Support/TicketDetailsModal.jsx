import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { X, Clock, Paperclip, Send, FileText } from 'lucide-react';

const getBaseUrl = () => (import.meta.env.VITE_BACKEND_URL || 'https://api.baaie.com').replace(/\/$/, '');

/** API often returns `/uploads/...` — join with API origin for browser navigation. */
const resolveAttachmentHref = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const base = getBaseUrl();
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${path}`;
};

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

/** Short relative labels for Details tab (e.g. "2 days ago", "1h ago"). */
const formatRelativeTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDateTime(dateString);
};

/** Pill shell + semantic colors — same as `AdminSupportTickets` table tags. */
const SUPPORT_TAG_PILL =
    'inline-flex items-center max-w-full gap-0.5 rounded-[6px] px-3 py-1 text-[12px] font-medium leading-[18px] tracking-normal';

const supportTagFontStyle = { fontFamily: '"Sofia Pro", ui-sans-serif, system-ui, sans-serif' };

const getSupportCategoryColor = (type) => {
    const value = String(type || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
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

const getSupportPriorityColor = (priority) => {
    const value = String(priority || '').toLowerCase();
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

const getSupportStatusColor = (status) => {
    const value = String(status || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
    switch (value) {
        case 'open':
        case 'pending':
            return 'bg-[#DCFCE7] text-[#16A34A]';
        case 'in_progress':
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

const DetailField = ({ label, children, className = '', valueClassName = '' }) => (
    <div className={className}>
        <p className="mb-1.5 text-[11px] font-[700] uppercase tracking-widest text-gray-400">{label}</p>
        {typeof children === 'string' || typeof children === 'number' ? (
            <p className={`text-[14px] font-[600] text-[#111827] ${valueClassName}`}>{children}</p>
        ) : (
            children
        )}
    </div>
);

const TicketDetailsModal = ({ isOpen, onClose, ticket, onTicketUpdated }) => {
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
    /** File queued to upload after message send (Conversation → paperclip). */
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [statusPatching, setStatusPatching] = useState(false);

    const conversationContainerRef = useRef(null);
    const attachmentInputRef = useRef(null);

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

    /** Reload ticket JSON + messages without full-modal loading flash. */
    const refetchTicketDetails = async () => {
        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId || !accessToken) return;

        try {
            const baseUrl = getBaseUrl();
            const url = `${baseUrl}/api/v1/tickets/${encodeURIComponent(apiTicketId)}`;
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }
            const res = await fetch(url, { method: 'GET', headers });
            const json = await res.json();
            const details = json?.data ?? null;
            if (details) {
                setTicketDetails(details);
                if (Array.isArray(details.conversation) && details.conversation.length) {
                    const mappedConversation = details.conversation.map(mapApiMessageToUi).filter(Boolean);
                    if (mappedConversation.length) setMessages(mappedConversation);
                }
            }
            await fetchMessages(apiTicketId);
        } catch (e) {
            console.error('refetchTicketDetails failed', e);
        }
    };

    const postTicketAttachment = async (ticketId, file) => {
        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}/attachments`;
        const formData = new FormData();
        formData.append('file', file);
        const headers = {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
        };
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
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
            const msg = json?.message || json?.error || 'Failed to upload attachment';
            throw new Error(msg);
        }
        if (json?.code != null && !String(json.code).startsWith('SUCCESS')) {
            throw new Error(json?.message || 'Failed to upload attachment');
        }
        return json;
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
            setPendingAttachment(null);
            if (attachmentInputRef.current) attachmentInputRef.current.value = '';
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
        const file = pendingAttachment;
        if ((!text && !file) || !accessToken) return;

        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId) return;

        try {
            setSending(true);
            setError('');

            if (text) {
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
            }

            if (file) {
                await postTicketAttachment(apiTicketId, file);
                setPendingAttachment(null);
                if (attachmentInputRef.current) attachmentInputRef.current.value = '';
                await refetchTicketDetails();
                setActiveTab('Attachments');
                toast.success('Attachment uploaded');
            }
        } catch (e) {
            const msg = e.message || 'Failed to send';
            setError(msg);
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    const patchTicketStatus = async (status) => {
        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId || !accessToken) return;
        setStatusPatching(true);
        try {
            const baseUrl = getBaseUrl();
            const url = `${baseUrl}/api/v1/tickets/${encodeURIComponent(apiTicketId)}`;
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }
            const res = await fetch(url, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status }),
            });
            const raw = await res.text();
            let json = {};
            if (raw) {
                try {
                    json = JSON.parse(raw);
                } catch {
                    json = {};
                }
            }
            if (!res.ok || (json.code != null && !String(json.code).startsWith('SUCCESS'))) {
                throw new Error(json.message || json.error || 'Update failed');
            }
            toast.success('Ticket updated');
            await refetchTicketDetails();
            if (typeof onTicketUpdated === 'function') {
                onTicketUpdated();
            }
        } catch (e) {
            toast.error(e.message || 'Failed to update ticket');
        } finally {
            setStatusPatching(false);
        }
    };

    const displaySubject = d?.subject || ticket?.title || '—';
    const displayTicketNo = d?.ticket_number || ticket?.id || '—';
    const displayStatus = d?.status != null ? labelize(d.status) : ticket?.status || '—';
    const statusForStyle = d?.status || (ticket?.raw && ticket.raw.status) || 'open';
    const priorityForStyle = d?.priority || (ticket?.raw && ticket.raw.priority) || 'medium';
    const descriptionText = d?.description || '';
    const attachments = Array.isArray(d?.attachments) ? d.attachments : [];

    const rawStatusNorm = String(statusForStyle || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
    const isTerminalStatus = rawStatusNorm === 'resolved' || rawStatusNorm === 'closed';

    const categoryLabel =
        d?.category != null && String(d.category).trim() !== ''
            ? labelize(d.category)
            : d?.ticket_type != null
              ? labelize(d.ticket_type)
              : ticket?.category
                ? String(ticket.category)
                : '—';

    const categoryTypeKey = String(
        d?.ticket_type || d?.category || ticket?.categoryType || ticket?.raw?.ticket_type || ticket?.raw?.category || ''
    )
        .toLowerCase()
        .replace(/\s+/g, '_');

    const orderDisplay =
        d?.order_number != null && String(d.order_number).trim() !== ''
            ? String(d.order_number).trim().startsWith('#')
                ? String(d.order_number).trim()
                : `#${String(d.order_number).trim()}`
            : null;

    const priorityStr = String(priorityForStyle || '').toLowerCase();
    const slaTargetDisplay = (() => {
        if (!d) return '—';
        if (d.sla_target != null && String(d.sla_target).trim()) return String(d.sla_target).trim();
        const labelKeys = ['sla_resolution_label', 'response_sla_label', 'sla_label'];
        for (const k of labelKeys) {
            if (d[k]) return String(d[k]);
        }
        const hourKeys = ['sla_hours', 'response_sla_hours', 'first_response_sla_hours', 'sla_resolution_hours'];
        for (const k of hourKeys) {
            const n = d[k];
            if (typeof n === 'number' && !Number.isNaN(n)) return `${n} hours`;
        }
        if (priorityStr === 'urgent' || priorityStr === 'high') return '24 hours';
        if (priorityStr === 'medium') return '48 hours';
        if (priorityStr === 'low') return '72 hours';
        return '—';
    })();

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
                <div className="flex h-full min-h-0 items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            );
        }

        switch (activeTab) {
            case 'Conversation':
                return (
                    <div className="flex h-full min-h-0 flex-col">
                        <div
                            ref={conversationContainerRef}
                            className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 custom-scrollbar"
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

                        <div className="shrink-0 border-t border-gray-100 bg-[#F9FAFB]/50 px-6 pb-3 pt-2">
                            {error && <p className="mb-1.5 text-[12px] text-red-500">{error}</p>}
                            <div className="mb-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    className="cursor-default rounded-[6px] border border-gray-200 bg-white px-2.5 py-0.5 text-[10px] font-[700] uppercase tracking-wider text-[#6B7280]"
                                >
                                    Internal Notes OFF
                                </button>
                            </div>

                            <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
                                <textarea
                                    rows="2"
                                    placeholder="Type your message..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="custom-scrollbar w-full resize-none border-none bg-transparent text-[14px] font-[500] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                                />
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <input
                                        ref={attachmentInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            setPendingAttachment(f || null);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        title="Attach file"
                                        disabled={sending}
                                        onClick={() => attachmentInputRef.current?.click()}
                                        className="shrink-0 cursor-pointer text-[#9CA3AF] transition-colors hover:text-[#DD2F26] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    {pendingAttachment ? (
                                        <div className="flex min-w-0 items-center gap-2 text-[12px] font-[500] text-[#374151]">
                                            <span className="truncate" title={pendingAttachment.name}>
                                                {pendingAttachment.name}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={sending}
                                                onClick={() => {
                                                    setPendingAttachment(null);
                                                    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
                                                }}
                                                className="shrink-0 text-[11px] font-[600] text-primary hover:underline disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={sending || (!replyText.trim() && !pendingAttachment)}
                                    className={`flex shrink-0 items-center gap-2 rounded-[8px] bg-[#DD2F26] px-5 py-1.5 text-[13px] font-[600] text-white shadow-md transition-all hover:bg-[#C52820] active:scale-95 ${
                                        sending || (!replyText.trim() && !pendingAttachment)
                                            ? 'cursor-not-allowed opacity-70'
                                            : ''
                                    }`}
                                >
                                    <Send className="h-4 w-4" />
                                    {sending ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'Details': {
                return (
                    <div className="h-full min-h-0 overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                            <DetailField label="Category">
                                <span
                                    className={`${SUPPORT_TAG_PILL} ${getSupportCategoryColor(categoryTypeKey)}`}
                                    style={supportTagFontStyle}
                                >
                                    <span className="truncate">{categoryLabel}</span>
                                </span>
                            </DetailField>
                            <DetailField label="Priority">
                                <span
                                    className={`${SUPPORT_TAG_PILL} ${
                                        ticket?.priority && !d?.priority
                                            ? ticket.priorityColor
                                            : getSupportPriorityColor(priorityForStyle)
                                    }`}
                                    style={supportTagFontStyle}
                                >
                                    <span className="truncate">
                                        {d?.priority != null ? labelize(d.priority) : ticket?.priority || '—'}
                                    </span>
                                </span>
                            </DetailField>
                            <DetailField label="Status">
                                <span
                                    className={`${SUPPORT_TAG_PILL} ${
                                        ticket?.status && !d?.status
                                            ? ticket.statusColor
                                            : getSupportStatusColor(rawStatusNorm)
                                    }`}
                                    style={supportTagFontStyle}
                                >
                                    <span className="truncate">
                                        {d?.status != null ? labelize(d.status) : displayStatus}
                                    </span>
                                </span>
                            </DetailField>
                            <DetailField label="Created">{formatRelativeTime(d?.created_at)}</DetailField>
                            <DetailField label="Last Updated">
                                {formatRelativeTime(d?.updated_at || d?.last_response_at)}
                            </DetailField>
                            <DetailField label="Assigned To">Admin Team</DetailField>
                        </div>

                        <div className="mt-6 space-y-6">
                            <DetailField label="Related Order">
                                {orderDisplay ? (
                                    <p className="text-[14px] font-[600] text-[#DD2F26]">{orderDisplay}</p>
                                ) : (
                                    <p className="text-[14px] font-[600] text-[#111827]">—</p>
                                )}
                            </DetailField>

                            <DetailField label="Description">
                                <p className="whitespace-pre-wrap text-[14px] font-[500] leading-relaxed text-[#4B5563]">
                                    {descriptionText || '—'}
                                </p>
                            </DetailField>

                            <DetailField label="SLA Target">{slaTargetDisplay}</DetailField>

                            {d?.resolution ? (
                                <DetailField label="Resolution">
                                    <p className="whitespace-pre-wrap text-[14px] font-[500] leading-relaxed text-[#111827]">
                                        {d.resolution}
                                    </p>
                                </DetailField>
                            ) : null}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={statusPatching || isTerminalStatus}
                                onClick={() => patchTicketStatus('resolved')}
                                className="rounded-[8px] bg-[#DD2F26] px-5 py-2.5 text-[14px] font-[600] text-white shadow-sm transition-colors hover:bg-[#C52820] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Resolve Ticket
                            </button>
                            <button
                                type="button"
                                disabled={statusPatching || !isTerminalStatus}
                                onClick={() => patchTicketStatus('open')}
                                className="rounded-[8px] border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-[600] text-[#111827] shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Reopen Ticket
                            </button>
                        </div>
                    </div>
                );
            }
            case 'Attachments':
                return (
                    <div className="h-full min-h-0 overflow-y-auto p-6 custom-scrollbar">
                        {attachments.length === 0 ? (
                            <p className="text-[14px] text-gray-500">No attachments.</p>
                        ) : (
                            <ul className="space-y-3">
                                {attachments.map((a, i) => {
                                    const name = a.file_name || a.name || a.filename || `File ${i + 1}`;
                                    const href = resolveAttachmentHref(a.url);
                                    return (
                                        <li
                                            key={a.id || `${name}-${i}`}
                                            className="overflow-hidden rounded-[12px] border border-gray-100 bg-[#F9FAFB]"
                                        >
                                            {href ? (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex cursor-pointer items-center gap-3 px-4 py-3 text-inherit no-underline transition-colors hover:bg-gray-100"
                                                >
                                                    <FileText className="h-8 w-8 shrink-0 text-gray-400" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[14px] font-[600] text-[#111827]">{name}</p>
                                                        {a.size != null && a.size !== '' && (
                                                            <p className="text-[11px] text-gray-400">
                                                                {typeof a.size === 'number'
                                                                    ? `${(a.size / 1024).toFixed(1)} KB`
                                                                    : a.size}
                                                            </p>
                                                        )}
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-3 px-4 py-3">
                                                    <FileText className="h-8 w-8 shrink-0 text-gray-400" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[14px] font-[600] text-[#111827]">{name}</p>
                                                        {a.size != null && a.size !== '' && (
                                                            <p className="text-[11px] text-gray-400">
                                                                {typeof a.size === 'number'
                                                                    ? `${(a.size / 1024).toFixed(1)} KB`
                                                                    : a.size}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
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
                    <div className="h-full min-h-0 overflow-y-auto p-6 custom-scrollbar">
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
                className="flex h-[min(90vh,670px)] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#00000033] bg-white shadow-2xl duration-200 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 border-b border-gray-100 p-5">
                    <div className="flex flex-col gap-0">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-left text-[20px] font-bold leading-[24px] tracking-normal text-[#111827]">
                                {displaySubject}
                            </h2>
                            <button
                                onClick={onClose}
                                className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                </div>

                <div className="flex h-[52px] shrink-0 items-stretch border-b border-gray-100 bg-[#F9FAFB]/30 px-2 overflow-x-auto no-scrollbar sm:px-4">
                    <div className="flex min-h-0 min-w-max items-stretch">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`relative flex items-center px-3 text-[13px] font-[600] transition-all sm:px-4 ${
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

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{renderContent()}</div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
