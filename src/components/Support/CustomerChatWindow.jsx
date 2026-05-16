import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MoreVertical, Store, Paperclip, Smile, Send, ChevronDown, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import {
    PRIORITY_OPTIONS,
    STATUS_OPTIONS,
    getPriorityColor,
    getStatusColor,
    patchTicketById,
    normalizePriorityValue,
    normalizeStatusValue,
} from './restaurantTicketApi';

const CustomerChatWindow = ({
    conversation,
    ticketDetails,
    setTicketDetails,
    messages,
    onMessagesChange,
    loading,
    error,
    onRefreshInbox,
}) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [actionError, setActionError] = useState('');
    const [patchingPriority, setPatchingPriority] = useState(false);
    const [patchingStatus, setPatchingStatus] = useState(false);
    const [escalating, setEscalating] = useState(false);

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
    const messagesContainerRef = useRef(null);

    const ticketApiId = ticketDetails?.id || ticketDetails?.ticket_id || conversation?.ticketId;
    const prioritySelectValue = normalizePriorityValue(ticketDetails?.priority);
    const statusSelectValue = normalizeStatusValue(ticketDetails?.status);
    const isResolvedTicket = statusSelectValue === 'resolved';

    const handlePriorityChange = async (value) => {
        if (!ticketApiId || patchingPriority || patchingStatus || !accessToken) return;
        if (value === prioritySelectValue) return;
        setPatchingPriority(true);
        try {
            await patchTicketById(ticketApiId, { priority: value }, { accessToken, restaurantId });
            if (typeof setTicketDetails === 'function') {
                setTicketDetails((d) => (d ? { ...d, priority: value } : d));
            }
            toast.success('Priority updated');
        } catch (err) {
            toast.error(err?.message || 'Failed to update priority');
        } finally {
            setPatchingPriority(false);
        }
    };

    const handleStatusChange = async (apiValue) => {
        if (!ticketApiId || patchingStatus || patchingPriority || !accessToken) return;
        if (apiValue === statusSelectValue) return;
        setPatchingStatus(true);
        try {
            await patchTicketById(ticketApiId, { status: apiValue }, { accessToken, restaurantId });
            if (typeof setTicketDetails === 'function') {
                setTicketDetails((d) => (d ? { ...d, status: apiValue } : d));
            }
            toast.success('Status updated');
        } catch (err) {
            toast.error(err?.message || 'Failed to update status');
        } finally {
            setPatchingStatus(false);
        }
    };

    const ticketId = conversation?.ticketId;

    // WebSocket connection for live updates
    useEffect(() => {
        if (!ticketId || !accessToken || typeof onMessagesChange !== 'function') return;

        // Normalize base URL so we always end up with .../api/v1/chat/ws/...
        const rawBase = import.meta.env.VITE_BACKEND_URL || 'https://api.baaie.com/api/v1';
        const httpBase = rawBase.replace(/\/api\/v1\/?$/, '');
        const wsBase = httpBase.replace(/^http/, 'ws');

        const wsUrl =
            `${wsBase.replace(/\/$/, '')}/api/v1/chat/ws/tickets/${encodeURIComponent(ticketId)}?token=${encodeURIComponent(
                accessToken,
            )}`;

        console.log('[WS CustomerChatWindow] connecting to', wsUrl);

        let isMounted = true;
        let ws;
        try {
            ws = new WebSocket(wsUrl);
        } catch (err) {
            console.error('[WS CustomerChatWindow] failed to create WebSocket', err);
            return;
        }

        ws.onopen = () => {
            console.log('[WS CustomerChatWindow] connected');
        };

        ws.onerror = (event) => {
            console.error('[WS CustomerChatWindow] error', event);
        };

        ws.onclose = (event) => {
            console.log('[WS CustomerChatWindow] closed', event.code, event.reason);
        };

        ws.onmessage = (event) => {
            if (!isMounted) return;
            try {
                const data = JSON.parse(event.data);
                console.log('[WS CustomerChatWindow] message', data);
                if (data.type === 'new_message' && data.message) {
                    const incoming = data.message;
                    const mappedMessage = {
                        id: incoming.id || incoming.message_id,
                        content: incoming.message || incoming.content,
                        created_at: incoming.created_at,
                        sender_type: incoming.sender_type || incoming.sender_role || incoming.sender || 'customer',
                    };

                    onMessagesChange((prev) => {
                        const current = Array.isArray(prev) ? prev : [];
                        const exists = current.some((m) => (m.id || m.message_id) === mappedMessage.id);
                        return exists ? current : [...current, mappedMessage];
                    });
                }
            } catch (err) {
                console.error('[WS CustomerChatWindow] invalid event data', err);
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
    }, [ticketId, accessToken, onMessagesChange]);

    const handleSendMessage = async (resolveAfterSend = false) => {
        if (!ticketId || !newMessage.trim() || sending) return;
        setSending(true);
        setActionError('');

        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const encodedId = encodeURIComponent(ticketId);
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${encodedId}/messages`;

            const headers = {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
            };

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: newMessage.trim() }),
            });
            const data = await res.json();
            const isSuccessCode =
                typeof data?.code === 'string' && data.code.startsWith('SUCCESS_');

            if (!isSuccessCode) {
                throw new Error(data?.message || 'Failed to send message');
            }

            const created = data?.data || null;
            if (created && typeof onMessagesChange === 'function') {
                const mappedMessage = {
                    id: created.id || created.message_id,
                    content: created.message || created.content,
                    created_at: created.created_at,
                    sender_type: created.sender_type || created.sender_role || 'restaurant',
                };
                const current = Array.isArray(messages) ? messages : [];
                onMessagesChange([...current, mappedMessage]);
            }

            setNewMessage('');

            if (resolveAfterSend) {
                await handleResolveTicket(true);
            }
        } catch (err) {
            setActionError(err.message || 'Unable to send message');
        } finally {
            setSending(false);
        }
    };

    const handleResolveTicket = async (silent = false) => {
        if (!ticketId || isResolvedTicket) return;
        if (!silent) {
            setActionError('');
        }

        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const encodedId = encodeURIComponent(ticketId);
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${encodedId}/resolve`;

            const headers = {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
            };

            const res = await fetch(url, {
                method: 'POST',
                headers,
            });

            const data = await res.json();
            const isSuccess =
                typeof data?.code === 'string' && String(data.code).startsWith('SUCCESS_');
            if (!isSuccess) {
                throw new Error(data?.message || 'Failed to resolve ticket');
            }

            const msg =
                typeof data?.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : 'Ticket marked as resolved';
            toast.success(msg);

            const payload = data?.data;
            if (payload && typeof setTicketDetails === 'function') {
                setTicketDetails((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: payload.status ?? 'resolved',
                              resolved_at: payload.resolved_at ?? prev.resolved_at,
                          }
                        : prev,
                );
            }

            if (typeof onRefreshInbox === 'function') {
                await onRefreshInbox();
            }
        } catch (err) {
            if (!silent) {
                setActionError(err.message || 'Unable to resolve ticket');
            }
        }
    };

    const handleEscalate = async () => {
        if (!ticketApiId || isResolvedTicket || escalating) return;
        setActionError('');
        setEscalating(true);

        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const encodedId = encodeURIComponent(ticketApiId);
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${encodedId}/escalate`;

            const headers = {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
            };

            const res = await fetch(url, {
                method: 'POST',
                headers,
            });

            if (res.status !== 200) {
                let message = 'Failed to escalate ticket';
                try {
                    const errBody = await res.json();
                    if (typeof errBody?.message === 'string' && errBody.message.trim()) {
                        message = errBody.message.trim();
                    }
                } catch {
                    // ignore non-JSON error bodies
                }
                throw new Error(message);
            }

            let successMessage = 'Ticket escalated to admin';
            try {
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const text = await res.text();
                    if (text.trim()) {
                        const data = JSON.parse(text);
                        if (typeof data?.message === 'string' && data.message.trim()) {
                            successMessage = data.message.trim();
                        }
                    }
                }
            } catch {
                // 200 with empty or invalid JSON body — still success
            }

            toast.success(successMessage);

            if (typeof onRefreshInbox === 'function') {
                await onRefreshInbox();
            }
        } catch (err) {
            const msg = err.message || 'Unable to escalate ticket';
            setActionError(msg);
            toast.error(msg);
        } finally {
            setEscalating(false);
        }
    };

    const statusLabelForSubtitle =
        STATUS_OPTIONS.find((o) => o.api === statusSelectValue)?.label ||
        String(ticketDetails?.status || 'open');
    const ticketCategory = ticketDetails?.category || conversation?.tags?.[0] || 'Support';
    const orderNumber = conversation?.orderId || ticketDetails?.order_number || '#ORD-XXXX';
    const orderSubtitle = ticketDetails?.subject || `Status: ${statusLabelForSubtitle}`;

    const normalizedMessages = Array.isArray(messages)
        ? messages.map((msg) => ({
            id: msg.id || msg.message_id,
            content: msg.message || msg.content,
            created_at: msg.created_at,
            sender_type: msg.sender_type || msg.sender_role || msg.sender || 'customer',
        }))
        : [];

    const formatTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Scroll inside the message pane only (avoid scrollIntoView moving the page)
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        if (loading && !normalizedMessages.length) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [normalizedMessages.length, loading, ticketId]);

    return (
        <div className="bg-white rounded-[24px] border border-[#00000033] flex flex-col h-full min-h-0 overflow-hidden font-['Inter',_sans-serif]">
            {!conversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>Select a conversation to start chatting</p>
                </div>
            ) : (
                <div className="flex h-full min-h-0 flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between border-b border-[#00000033] px-6 pb-3 pt-4 sm:px-8 sm:pt-5">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-[18px] font-bold text-[#111827]">{conversation.name}</h3>
                                {conversation.online && (
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <div className="mb-1 h-2.5 w-2.5 rounded-full bg-[#DD2F26]"></div>
                                        <span className="text-[12px] text-[#DD2F26]">Online</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[13px] text-[#6B7280]">
                                Ticket ID: {ticketDetails?.ticket_number || ticketDetails?.id || conversation.ticketId}
                            </p>
                        </div>
                        <button className="text-[#9CA3AF] transition-colors hover:text-[#111827]" type="button">
                            <MoreVertical className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Order + actions: fixed (does not scroll) */}
                    <div className="shrink-0 px-4 pb-3 pt-2 sm:px-8">
                        <div className="rounded-[8px]">
                            <div className="mb-2 flex flex-col justify-between gap-3 rounded-[8px] border border-[#F3F4F6] bg-[#F9FAFB] p-3 sm:flex-row sm:items-center sm:gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-[#6B7280] shadow-sm">
                                        <Store className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-[500] text-[#111827]">{orderNumber}</h4>
                                        <p className="text-[12px] text-[#6B7280]">{orderSubtitle}</p>
                                    </div>
                                </div>
                                <button
                                    className="text-left text-[13px] font-[500] text-[#DD2F26] hover:underline sm:text-right"
                                    type="button"
                                >
                                    View Full Order
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 border-t border-transparent sm:grid-cols-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[12px] font-medium text-[#6B7280]"
                                        htmlFor="support-priority-select"
                                    >
                                        Priority
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="support-priority-select"
                                            value={prioritySelectValue}
                                            onChange={(e) => handlePriorityChange(e.target.value)}
                                            disabled={!ticketApiId || patchingPriority || patchingStatus}
                                            className={`w-full cursor-pointer appearance-none rounded-[6px] border-0 py-2.5 pl-3 pr-9 text-[13px] font-medium outline-none ring-0 focus:ring-2 focus:ring-[#DD2F26]/30 disabled:cursor-not-allowed disabled:opacity-60 ${getPriorityColor(prioritySelectValue)}`}
                                        >
                                            {PRIORITY_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
                                            aria-hidden
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label
                                        className="text-[12px] font-medium text-[#6B7280]"
                                        htmlFor="support-status-select"
                                    >
                                        Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="support-status-select"
                                            value={statusSelectValue}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            disabled={!ticketApiId || patchingStatus || patchingPriority}
                                            className={`w-full cursor-pointer appearance-none rounded-[6px] border-0 py-2.5 pl-3 pr-9 text-[13px] font-medium outline-none ring-0 focus:ring-2 focus:ring-[#DD2F26]/30 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusColor(statusSelectValue)}`}
                                        >
                                            {STATUS_OPTIONS.map((opt) => (
                                                <option key={opt.api} value={opt.api}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
                                            aria-hidden
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-medium text-[#6B7280]">Channel</label>
                                    <div className="rounded-[6px] bg-[#F3F4F6] px-3 py-2.5 text-[13px] text-[#4B5563]">
                                        Chat
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-[6px] bg-[#DCFCE7] px-3 py-2 text-[13px] text-[#10B981]">
                                {ticketCategory}
                            </div>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <button
                                    type="button"
                                    onClick={handleEscalate}
                                    disabled={!ticketApiId || isResolvedTicket || escalating}
                                    className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white py-2.5 text-[13px] text-[#111827] transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:flex-1"
                                >
                                    <AlertCircle className="h-5 w-5 text-[#111827]" />
                                    {escalating ? 'Escalating…' : 'Escalate to Admin'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleResolveTicket(false)}
                                    disabled={isResolvedTicket}
                                    className="w-full rounded-[8px] bg-[#DD2F26] py-2.5 text-[13px] text-white transition-all hover:bg-[#C52820] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                                >
                                    Mark Resolved
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Separator: above message thread */}
                    <div className="shrink-0 border-t border-[#00000033]" />

                    {/* Messages only — scrolls */}
                    <div
                        ref={messagesContainerRef}
                        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 sm:px-8"
                    >
                        <div className="space-y-2">
                            {loading && !normalizedMessages.length && (
                                <>
                                    <div className="flex flex-col items-start gap-1.5 animate-pulse">
                                        <div className="max-w-[80%] rounded-[22px] rounded-tl-none bg-gray-100 px-5 py-3">
                                            <div className="mb-2 h-3 w-5/6 rounded bg-gray-200" />
                                            <div className="h-3 w-2/3 rounded bg-gray-200" />
                                        </div>
                                        <div className="ml-2 h-3 w-12 rounded bg-gray-100" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 animate-pulse">
                                        <div className="max-w-[80%] rounded-[22px] rounded-tr-none bg-gray-100 px-5 py-3">
                                            <div className="mb-2 h-3 w-2/3 rounded bg-gray-200" />
                                            <div className="h-3 w-3/5 rounded bg-gray-200" />
                                        </div>
                                        <div className="mr-2 h-3 w-12 rounded bg-gray-100" />
                                    </div>
                                </>
                            )}
                            {error && !loading && <p className="text-[13px] text-red-500">{error}</p>}
                            {!loading && !normalizedMessages.length && !error && (
                                <p className="text-[13px] text-gray-400">
                                    No messages yet. Start the conversation below.
                                </p>
                            )}
                            {normalizedMessages.map((msg) => {
                                const isRestaurant = msg.sender_type === 'restaurant';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isRestaurant ? 'items-end' : 'items-start'} gap-0.5`}
                                    >
                                        <div
                                            className={`max-w-[90%] rounded-[12px] px-4 py-2.5 text-[14px] font-medium leading-relaxed sm:max-w-[85%] ${
                                                isRestaurant
                                                    ? 'bg-[#DD2F26] text-right text-white shadow-sm rounded-tr-[4px]'
                                                    : 'rounded-tl-[4px] bg-[#F3F4F6] text-[#111827]'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span
                                            className={`text-[12px] font-medium text-[#9CA3AF] ${isRestaurant ? 'mr-1' : 'ml-1'}`}
                                        >
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                );
                            })}
                            {actionError && <p className="text-[12px] text-red-500">{actionError}</p>}
                        </div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="shrink-0 rounded-b-[24px] bg-white px-4 pb-4 pt-3 sm:px-8 sm:pb-6 sm:pt-4">
                        <div className="mb-1.5 inline-flex items-center rounded-[6px] bg-[#F3F4F6] px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                            Internal Notes OFF
                        </div>

                        <div className="min-h-[72px] rounded-[6px] border border-[#00000033] bg-white p-3 transition-all focus-within:border-[#DD2F26]">
                            <textarea
                                rows="2"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="w-full resize-none border-none bg-transparent text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                            />

                            <div className="flex items-center justify-between">
                                <div className="mt-1 flex items-center gap-2">
                                    <button className="text-[#9CA3AF] transition-colors hover:text-[#DD2F26] active:scale-90" type="button">
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    <button className="text-[#9CA3AF] transition-colors hover:text-[#DD2F26] active:scale-90" type="button">
                                        <Smile className="h-4 w-4" />
                                    </button>
                                    <button className="text-[12px] text-[#DD2F26] transition-all hover:opacity-80 active:scale-95" type="button">
                                        Quick Replies
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col items-center justify-end gap-2 sm:mt-2 sm:flex-row sm:gap-3">
                            <button
                                type="button"
                                onClick={() => handleSendMessage(false)}
                                disabled={sending || !newMessage.trim()}
                                className="order-1 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#DD2F26] px-5 py-2.5 text-[13px] font-[500] text-white shadow-sm transition-all hover:bg-[#C52820] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:order-1 sm:w-auto"
                            >
                                <Send className="h-5 w-5 fill-current" />
                                {sending ? 'Sending…' : 'Send'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSendMessage(true)}
                                disabled={sending || !newMessage.trim() || isResolvedTicket}
                                className="order-2 flex w-full items-center justify-center rounded-[8px] border border-[#DD2F26] bg-white px-6 py-2.5 text-[13px] font-[500] text-[#DD2F26] transition-all hover:bg-[#FEF2F2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2 sm:w-auto"
                            >
                                Send & Resolve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerChatWindow;
