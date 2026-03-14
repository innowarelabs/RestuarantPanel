import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CustomerSupportInbox from './CustomerSupportInbox';
import CustomerChatWindow from './CustomerChatWindow';

const CustomerSupportLayout = ({ refreshKey }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loadingInbox, setLoadingInbox] = useState(false);
    const [inboxError, setInboxError] = useState('');

    const [ticketDetails, setTicketDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingTicket, setLoadingTicket] = useState(false);
    const [ticketError, setTicketError] = useState('');

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

    useEffect(() => {
        const fetchInbox = async () => {
            setLoadingInbox(true);
            setInboxError('');
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/support/inbox`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });

                const data = await res.json();
                const items = Array.isArray(data?.data?.conversations)
                    ? data.data.conversations
                    : Array.isArray(data?.conversations)
                        ? data.conversations
                        : Array.isArray(data)
                            ? data
                            : [];

                if (!Array.isArray(items)) {
                    throw new Error('Unexpected inbox response format');
                }

                const mapped = items.map((item, index) => {
                    const ticketId = item.id || item.ticket_id || item.ticketId || index;
                    const customer = item.customer || {};
                    const order = item.order || {};
                    const tags = Array.isArray(item.tags)
                        ? item.tags.map((t) => t.label || t)
                        : [];

                    return {
                        id: ticketId,
                        ticketId,
                        ticketNumber: item.ticket_number,
                        name: customer.name || 'Customer',
                        avatar: customer.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer',
                        online: customer.is_online === true,
                        orderId: order.order_number || '#ORD-XXXX',
                        time: item.last_message_relative || '',
                        lastMessage: item.last_message || '',
                        tags: tags.length ? tags : [item.category_label || item.category || 'Support'],
                        hasMessage: true,
                        hasEmail: false,
                        hasAttachment: false,
                        isBot: false,
                        progress: undefined,
                        statusColor: '#2BB29C',
                    };
                });

                setConversations(mapped);
                if (mapped.length > 0) {
                    setSelectedConversation(mapped[0]);
                }
            } catch (error) {
                setInboxError(error.message || 'Failed to load support inbox');
            } finally {
                setLoadingInbox(false);
            }
        };

        if (accessToken) {
            fetchInbox();
        }
    }, [accessToken, restaurantId, refreshKey]);

    useEffect(() => {
        const fetchTicket = async () => {
            if (!selectedConversation?.ticketId) {
                setTicketDetails(null);
                setMessages([]);
                return;
            }

            // Clear previous messages immediately when switching conversations
            setMessages([]);

            setLoadingTicket(true);
            setTicketError('');

            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

                const ticketId = encodeURIComponent(selectedConversation.ticketId);

                const detailUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${ticketId}`;
                const messagesUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${ticketId}/messages`;

                const headers = {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                };

                const [detailRes, messagesRes] = await Promise.all([
                    fetch(detailUrl, { method: 'GET', headers }),
                    fetch(messagesUrl, { method: 'GET', headers }),
                ]);

                const detailJson = await detailRes.json();
                const messagesJson = await messagesRes.json();

                setTicketDetails(detailJson?.data || detailJson || null);

                const messagesData = messagesJson?.data;
                const msgs = Array.isArray(messagesData?.messages)
                    ? messagesData.messages
                    : Array.isArray(messagesData)
                        ? messagesData
                        : Array.isArray(messagesJson)
                            ? messagesJson
                            : [];

                setMessages(Array.isArray(msgs) ? msgs : []);
            } catch (error) {
                setTicketError(error.message || 'Failed to load conversation');
            } finally {
                setLoadingTicket(false);
            }
        };

        if (accessToken && selectedConversation?.ticketId) {
            fetchTicket();
        }
    }, [accessToken, restaurantId, selectedConversation]);

    // Fallback polling to keep messages fresh if WebSocket doesn't deliver
    useEffect(() => {
        if (!accessToken || !selectedConversation?.ticketId) return;

        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) return;

        const ticketId = encodeURIComponent(selectedConversation.ticketId);
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/support/tickets/${ticketId}/messages`;

        const headers = {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
        };

        const interval = setInterval(async () => {
            try {
                const res = await fetch(url, { method: 'GET', headers });
                const messagesJson = await res.json();
                const messagesData = messagesJson?.data;
                const msgs = Array.isArray(messagesData?.messages)
                    ? messagesData.messages
                    : Array.isArray(messagesData)
                        ? messagesData
                        : Array.isArray(messagesJson)
                            ? messagesJson
                            : [];

                if (Array.isArray(msgs)) {
                    setMessages((prev) => {
                        const current = Array.isArray(prev) ? prev : [];
                        const byId = new Map();
                        current.forEach((m) => byId.set(m.id || m.message_id, m));
                        msgs.forEach((m) => {
                            const id = m.id || m.message_id;
                            if (!byId.has(id)) byId.set(id, m);
                        });
                        return Array.from(byId.values());
                    });
                }
            } catch {
                // ignore polling errors
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [accessToken, restaurantId, selectedConversation?.ticketId]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[600px] pb-10 lg:pb-0">
            <div className="w-full lg:w-[400px] flex-shrink-0 h-full">
                <CustomerSupportInbox
                    conversations={conversations}
                    activeId={selectedConversation?.id}
                    onSelect={setSelectedConversation}
                />
                {loadingInbox && (
                    <p className="mt-2 text-xs text-gray-500 px-2">Loading conversations…</p>
                )}
                {inboxError && (
                    <p className="mt-2 text-xs text-red-500 px-2">{inboxError}</p>
                )}
            </div>
            <div className="flex-1">
                <CustomerChatWindow
                    conversation={selectedConversation}
                    ticketDetails={ticketDetails}
                    messages={messages}
                    onMessagesChange={setMessages}
                    loading={loadingTicket}
                    error={ticketError}
                />
            </div>
        </div>
    );
};

export default CustomerSupportLayout;
