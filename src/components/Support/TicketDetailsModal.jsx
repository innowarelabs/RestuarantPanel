import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Clock, Paperclip, Send, FileText, ChevronRight } from 'lucide-react';

const TicketDetailsModal = ({ isOpen, onClose, ticket }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [activeTab, setActiveTab] = useState('Conversation');
    const [ticketDetails, setTicketDetails] = useState(null);
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
        return encodeURIComponent(ticket.apiId || ticket.raw?.id || ticket.id || '');
    };

    const effectiveDetails = ticketDetails || ticket;

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

            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/${ticketId}/messages`;

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

            const mapped = rawMessages
                .map(mapApiMessageToUi)
                .filter(Boolean);

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
        if (!apiTicketId || !accessToken) return;

        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/${apiTicketId}`;

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }

            const res = await fetch(url, { method: 'GET', headers });
            const json = await res.json();

            const details = json?.data || json || null;
            setTicketDetails(details);

            if (Array.isArray(details?.conversation)) {
                const mappedConversation = details.conversation
                    .map(mapApiMessageToUi)
                    .filter(Boolean);
                if (mappedConversation.length) {
                    setMessages(mappedConversation);
                }
            }

            await fetchMessages(apiTicketId);
        } catch (e) {
            // If details fail, we still want the list ticket data to show
            console.error('Failed to load ticket details', e);
        }
    };

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

    // WebSocket for live ticket conversation between restaurant and admin (best-effort)
    useEffect(() => {
        if (!isOpen) return;
        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId || !accessToken) return;

        const rawBase = import.meta.env.VITE_BACKEND_URL || 'https://api.baaie.com/api/v1';
        const httpBase = rawBase.replace(/\/api\/v1\/?$/, '');
        const wsBase = httpBase.replace(/^http/, 'ws');

        const wsUrl = `${wsBase.replace(/\/$/, '')}/api/v1/chat/ws/tickets/${encodeURIComponent(
            apiTicketId,
        )}?token=${encodeURIComponent(accessToken)}`;

        console.log('[WS RestaurantTicket] connecting to', wsUrl);

        let isMounted = true;
        let ws;
        try {
            ws = new WebSocket(wsUrl);
        } catch (err) {
            console.error('[WS RestaurantTicket] failed to create WebSocket', err);
            return;
        }

        ws.onopen = () => {
            console.log('[WS RestaurantTicket] connected');
        };

        ws.onerror = (event) => {
            console.error('[WS RestaurantTicket] error', event);
        };

        ws.onclose = (event) => {
            console.log('[WS RestaurantTicket] closed', event.code, event.reason);
        };

        ws.onmessage = (event) => {
            if (!isMounted) return;
            try {
                const data = JSON.parse(event.data);
                console.log('[WS RestaurantTicket] message', data);
                if (data.type === 'new_message' && data.message) {
                    const mapped = mapApiMessageToUi(data.message);
                    if (!mapped) return;

                    setMessages((prev) => {
                        const current = Array.isArray(prev) ? prev : [];
                        const exists = current.some((m) => (m.id || m.message_id) === mapped.id);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, ticket?.apiId, ticket?.id, accessToken]);

    const handleSendMessage = async () => {
        const text = (replyText || '').trim();
        if (!text || !accessToken) return;

        const apiTicketId = resolveTicketIdForApi();
        if (!apiTicketId) return;

        try {
            setSending(true);
            setError('');

            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/${apiTicketId}/messages`;

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            };
            if (restaurantId) {
                headers['X-Restaurant-Id'] = restaurantId;
            }

            const payload = { comment: text };

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            const code = json?.code;
            const ok = res.ok || (code && typeof code === 'string' && code.startsWith('SUCCESS_'));

            if (!ok) {
                const message = json?.message || 'Failed to send message';
                throw new Error(message);
            }

            setReplyText('');

            // Refresh messages after successful send
            await fetchMessages(apiTicketId);
        } catch (e) {
            setError(e.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Conversation':
                return (
                    <div className="flex flex-col max-h-[450px]">
                        <div
                            ref={conversationContainerRef}
                            className="overflow-y-auto p-6 space-y-6 h-[350px] custom-scrollbar"
                        >
                            {loadingMessages && (
                                <p className="text-[12px] text-gray-500">Loading conversation…</p>
                            )}
                            {!loadingMessages && messages.length === 0 && (
                                <p className="text-[12px] text-gray-500">No messages yet. Start the conversation.</p>
                            )}

                            {messages.map((msg) => {
                                const isRestaurant =
                                    msg.role === 'restaurant' ||
                                    msg.role === 'owner' ||
                                    msg.role === 'manager';

                                const timeLabel = msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })
                                    : '';

                                if (isRestaurant) {
                                    return (
                                        <div key={msg.id} className="flex flex-col items-end gap-1.5">
                                            <div className="px-5 py-3.5 bg-[#DD2F26] text-white rounded-[18px] rounded-tr-none text-[14px] max-w-[85%] font-[500] leading-relaxed shadow-sm">
                                                {msg.text}
                                            </div>
                                            <span className="text-[11px] text-gray-400 font-[500] mr-2">
                                                You{timeLabel ? ` • ${timeLabel}` : ''}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className="flex flex-col items-start gap-1.5">
                                        <div className="px-5 py-3.5 bg-[#F3F4F6] text-[#111827] rounded-[18px] rounded-tl-none text-[14px] max-w-[85%] font-[500] leading-relaxed">
                                            {msg.text}
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-[500] ml-2">
                                            Admin{timeLabel ? ` • ${timeLabel}` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-gray-100 bg-[#F9FAFB]/50">
                            {error && (
                                <p className="mb-2 text-[12px] text-red-500">
                                    {error}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    type="button"
                                    className="px-3 py-1 bg-white border border-gray-200 text-[#6B7280] rounded-[6px] text-[10px] font-[700] uppercase tracking-wider cursor-default"
                                >
                                    Internal Notes OFF
                                </button>
                            </div>

                            <div className="bg-white rounded-[12px] p-4 border border-[#E5E7EB] shadow-sm">
                                <textarea
                                    rows="2"
                                    placeholder="Type your message..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full bg-transparent border-none focus:outline-none text-[14px] font-[500] text-[#111827] placeholder:text-[#9CA3AF] resize-none custom-scrollbar"
                                ></textarea>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-5 text-[#9CA3AF]">
                                        <button
                                            type="button"
                                            className="hover:text-[#DD2F26] transition-colors cursor-pointer active:scale-90"
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 text-[12px] font-[700] text-[#DD2F26] active:scale-95 px-2 py-1 hover:bg-[#DD2F26]/5 rounded-md transition-all"
                                        >
                                            Quick Replies
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSendMessage}
                                            disabled={sending || !replyText.trim()}
                                            className={`px-6 py-2 bg-[#DD2F26] text-white rounded-[8px] text-[13px] font-[600] flex items-center gap-2 hover:bg-[#C52820] active:scale-95 transition-all shadow-md shadow-[#DD2F26]/10 ${sending || !replyText.trim() ? 'opacity-70 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            <Send className="w-4 h-4" />
                                            {sending ? 'Sending…' : 'Send'}
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
                            <p className="text-[14px] font-[600] text-[#DD2F26] hover:underline cursor-pointer">{ticket.orderId || 'N/A'}</p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-[700] text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                            <p className="text-[14px] font-[500] text-[#4B5563] leading-relaxed">
                                {ticket.title}. I was supposed to receive my weekly payout on Monday but it hasn't arrived yet. My bank account details are correct.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-10 mt-auto border-t border-gray-100">
                            <button className="flex-1 py-2.5 bg-[#DD2F26] text-white rounded-[8px] text-[13px] font-[600] hover:bg-[#C52820] active:scale-[0.98] transition-all">
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
                            <div className="p-4 border border-gray-100 rounded-[12px] bg-[#F9FAFB] hover:border-[#DD2F26] transition-all cursor-pointer group">
                                <div className="w-full aspect-square bg-white rounded-[8px] border border-gray-100 flex items-center justify-center mb-3">
                                    <FileText className="w-10 h-10 text-gray-300 group-hover:text-[#DD2F26] transition-colors" />
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

    if (!isOpen || !ticket) return null;

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
                                    ? 'text-[#DD2F26]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#DD2F26] rounded-full"></div>
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
