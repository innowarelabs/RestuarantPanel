import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, Store, Paperclip, Smile, Send, ChevronDown, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

const CustomerChatWindow = ({ conversation, ticketDetails, messages, onMessagesChange, loading, error }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [actionError, setActionError] = useState('');

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
    const messagesEndRef = useRef(null);

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
        if (!ticketId) return;
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
            if (data?.code !== 'SUCCESS_200') {
                throw new Error(data?.message || 'Failed to resolve ticket');
            }
        } catch (err) {
            if (!silent) {
                setActionError(err.message || 'Unable to resolve ticket');
            }
        }
    };

    const handleEscalate = async () => {
        if (!ticketId) return;
        setActionError('');

        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const encodedId = encodeURIComponent(ticketId);
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${encodedId}/escalate`;

            const headers = {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
            };

            const res = await fetch(`${url}?note=${encodeURIComponent('Escalated from restaurant panel')}`, {
                method: 'POST',
                headers,
            });

            const data = await res.json();
            if (data?.code !== 'SUCCESS_200') {
                throw new Error(data?.message || 'Failed to escalate ticket');
            }
        } catch (err) {
            setActionError(err.message || 'Unable to escalate ticket');
        }
    };

    const ticketStatus = ticketDetails?.status || 'open';
    const ticketCategory = ticketDetails?.category || conversation?.tags?.[0] || 'Support';
    const orderNumber = conversation?.orderId || ticketDetails?.order_number || '#ORD-XXXX';
    const orderSubtitle = ticketDetails?.subject || `Status: ${ticketDetails?.status || 'open'}`;

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

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
    }, [normalizedMessages.length, loading]);

    return (
        <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col h-full font-['Inter',_sans-serif]">
            {!conversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>Select a conversation to start chatting</p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="px-8 pt-6 pb-1 border-b border-transparent flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-[18px] font-bold text-[#111827]">{conversation.name}</h3>
                                {conversation.online && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-2.5 h-2.5 bg-[#2BB29C] rounded-full mb-1"></div>
                                        <span className="text-[12px] text-[#2BB29C]">Online</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[13px] text-[#6B7280]">
                                Ticket ID: {ticketDetails?.ticket_number || ticketDetails?.id || conversation.ticketId}
                            </p>
                        </div>
                        <button className="text-[#9CA3AF] hover:text-[#111827] transition-colors">
                            <MoreVertical className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-8 custom-scrollbar">
                        {/* Order Summary Card */}
                        <div className="rounded-[8px] mb-8 mt-4">
                            <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-white rounded-[12px] flex items-center justify-center text-[#6B7280] shadow-sm">
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-[500] text-[#111827]">
                                            {orderNumber}
                                        </h4>
                                        <p className="text-[12px] text-[#6B7280]">
                                            {orderSubtitle}
                                        </p>
                                    </div>
                                </div>
                                <button className="text-[13px] font-[500] text-[#2BB29C] hover:underline text-left sm:text-right">
                                    View Full Order
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-transparent">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-medium text-[#6B7280]">Priority</label>
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#FEE2E2] text-[#EF4444] rounded-[6px] text-[13px]">
                                        {ticketDetails?.priority || 'Normal'} <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-medium text-[#6B7280]">Status</label>
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#DCFCE7] text-[#10B981] rounded-[6px] text-[13px]">
                                        {ticketStatus} <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-medium text-[#6B7280]">Channel</label>
                                    <div className="px-4 py-3 bg-[#F3F4F6] text-[#4B5563] rounded-[6px] text-[13px] ">
                                        Chat
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 px-4 py-2.5 bg-[#DCFCE7] text-[#10B981] rounded-[6px] text-[13px] ">
                                {ticketCategory}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-5">
                                <button
                                    type="button"
                                    onClick={handleEscalate}
                                    className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-[#E5E7EB] text-[#111827] rounded-[8px] text-[13px] hover:bg-gray-50 active:scale-[0.98] transition-all"
                                >
                                    <AlertCircle className="w-5 h-5 text-[#111827]" />
                                    Escalate to Admin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleResolveTicket(false)}
                                    className="w-full sm:flex-1 py-3 bg-[#2BB29C] text-white rounded-[8px] text-[13px] hover:bg-[#24A18C] active:scale-[0.98] transition-all"
                                >
                                    Mark Resolved
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="space-y-4 pb-10">
                            {loading && !normalizedMessages.length && (
                                <>
                                    <div className="flex flex-col items-start gap-2 animate-pulse">
                                        <div className="px-6 py-4 rounded-[22px] rounded-tl-none bg-gray-100 max-w-[80%]">
                                            <div className="h-3 bg-gray-200 rounded mb-2 w-5/6" />
                                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                                        </div>
                                        <div className="h-3 w-12 bg-gray-100 rounded ml-2" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2 animate-pulse">
                                        <div className="px-6 py-4 rounded-[22px] rounded-tr-none bg-gray-100 max-w-[80%]">
                                            <div className="h-3 bg-gray-200 rounded mb-2 w-4/6" />
                                            <div className="h-3 bg-gray-200 rounded w-3/5" />
                                        </div>
                                        <div className="h-3 w-12 bg-gray-100 rounded mr-2" />
                                    </div>
                                </>
                            )}
                            {error && !loading && (
                                <p className="text-[13px] text-red-500">{error}</p>
                            )}
                            {!loading && !normalizedMessages.length && !error && (
                                <p className="text-[13px] text-gray-400">No messages yet. Start the conversation below.</p>
                            )}
                            {normalizedMessages.map((msg) => {
                                const isRestaurant = msg.sender_type === 'restaurant';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isRestaurant ? 'items-end' : 'items-start'} gap-1`}
                                    >
                                        <div
                                            className={`px-6 py-3 rounded-[12px] text-[14px] max-w-[90%] sm:max-w-[85%] font-medium leading-relaxed ${
                                                isRestaurant
                                                    ? 'bg-[#2BB29C] text-white rounded-tr-[4px] shadow-sm text-right'
                                                    : 'bg-[#F3F4F6] text-[#111827] rounded-tl-[4px]'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className={`text-[12px] text-[#9CA3AF] font-medium ${isRestaurant ? 'mr-2' : 'ml-2'}`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                );
                            })}
                            {actionError && (
                                <p className="text-[12px] text-red-500">{actionError}</p>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="mt-auto px-4 sm:px-8 pb-4 sm:pb-8 pt-4 bg-white rounded-b-[24px]">
                        <div className="inline-flex items-center px-4 py-2 bg-[#F3F4F6] text-[#6B7280] rounded-[6px] text-[12px] font-medium mb-2">
                            Internal Notes OFF
                        </div>

                        <div className="bg-white border border-[#E5E7EB] min-h-[80px] rounded-[6px] p-4 focus-within:border-[#2BB29C] transition-all">
                            <textarea
                                rows="2"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="w-full bg-transparent border-none focus:outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF] resize-none"
                            ></textarea>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 mt-2">
                                    <button className="text-[#9CA3AF] hover:text-[#2BB29C] transition-colors active:scale-90" type="button">
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                    <button className="text-[#9CA3AF] hover:text-[#2BB29C] transition-colors active:scale-90" type="button">
                                        <Smile className="w-4 h-4" />
                                    </button>
                                    <button className="text-[12px] text-[#2BB29C] active:scale-95 transition-all hover:opacity-80" type="button">
                                        Quick Replies
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 mt-4">
                            <button
                                type="button"
                                onClick={() => handleSendMessage(false)}
                                disabled={sending || !newMessage.trim()}
                                className="w-full sm:w-auto px-5 py-3 bg-[#2BB29C] text-white rounded-[8px] text-[13px] font-[500] flex items-center justify-center gap-2 hover:bg-[#24A18C] active:scale-95 transition-all shadow-sm order-1 sm:order-1 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5 fill-current" />
                                {sending ? 'Sending…' : 'Send'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSendMessage(true)}
                                disabled={sending || !newMessage.trim()}
                                className="w-full sm:w-auto px-6 py-3 bg-white border border-[#2BB29C] text-[#2BB29C] rounded-[8px] text-[13px] font-[500] flex items-center justify-center hover:bg-[#F0FDF9] active:scale-95 transition-all order-2 sm:order-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Send & Resolve
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerChatWindow;
