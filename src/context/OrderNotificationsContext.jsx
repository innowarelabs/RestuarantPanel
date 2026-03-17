import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import OrderToast from '../components/Header/OrderToast';

// Activity WebSocket: always use api.baaie.com as per NEW_ORDER_WEBHOOK_GUIDELINE.md
const ACTIVITY_WS_BASE = 'wss://api.baaie.com';
const API_BASE =
  (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')) ||
  'https://api.baaie.com';

// Notification shape: { id, type, title, description, time, isUnread, orderNumber?, customerName?, itemsText?, createdAt }
function notificationsReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [{ ...action.payload, id: action.payload.id || `n-${Date.now()}-${Math.random().toString(36).slice(2)}` }, ...state];
    case 'MARK_READ':
      return state.map((n) => (n.id === action.id ? { ...n, isUnread: false } : n));
    case 'MARK_ALL_READ':
      return state.map((n) => ({ ...n, isUnread: false }));
    case 'SET':
      return Array.isArray(action.payload) ? action.payload : state;
    default:
      return state;
  }
}

const OrderNotificationsContext = createContext(null);

export function OrderNotificationsProvider({ children, onViewOrder }) {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);
  const restaurantId =
    (user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('restaurant_id') : null) ||
    '';

  const [notifications, dispatch] = useReducer(notificationsReducer, []);
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const onViewOrderRef = useRef(onViewOrder);
  onViewOrderRef.current = onViewOrder;

  const addNotification = useCallback((notification) => {
    dispatch({
      type: 'ADD',
      payload: {
        ...notification,
        isUnread: notification.isUnread !== false,
        createdAt: notification.createdAt || Date.now(),
      },
    });
  }, []);

  const markAsRead = useCallback((id) => {
    dispatch({ type: 'MARK_READ', id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      if (!orderId || !accessToken) {
        toast.error('Unable to update order status. Please try again.');
        return false;
      }

      try {
        const url = `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/status`;
        const res = await fetch(url, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!res.ok) {
          let message = 'Failed to update order status';
          try {
            const data = await res.json();
            if (data?.message) message = data.message;
          } catch {
            // ignore parse errors
          }
          toast.error(message);
          return false;
        }

        if (status === 'completed') {
          toast.success('Order accepted');
        } else if (status === 'cancelled') {
          toast.success('Order declined');
        }

        return true;
      } catch (err) {
        toast.error('Network error while updating order status');
        return false;
      }
    },
    [accessToken]
  );

  const acceptOrder = useCallback(
    async (orderId) => updateOrderStatus(orderId, 'completed'),
    [updateOrderStatus]
  );

  const declineOrder = useCallback(
    async (orderId) => updateOrderStatus(orderId, 'cancelled'),
    [updateOrderStatus]
  );

  useEffect(() => {
    if (!accessToken || !restaurantId) return;

    const fetchNotifications = async () => {
      try {
        const url = `${API_BASE}/api/v1/restaurants/${encodeURIComponent(
          restaurantId,
        )}/notifications?type=new_order&limit=20`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || (data.code && String(data.code).startsWith('ERROR_'))) {
          console.error('[OrderNotifications] Notifications API error', {
            status: res.status,
            body: data,
          });
          return;
        }

        const payload = data.data || data;
        const items = Array.isArray(payload?.items) ? payload.items : [];

        const mapped = items.map((item) => {
          const apiItems = Array.isArray(item.items) ? item.items : [];
          const itemsText = apiItems
            .map((i) => `${i.name || 'Item'} × ${i.quantity ?? 1}`)
            .join(', ');

          return {
            id: item.id || `api-${item.order_number || ''}-${item.order_id || ''}`,
            type: 'Order',
            title: 'New Order Request',
            description: `Order #${item.order_number || 'ORD-?'} from ${item.customer_name || 'Customer'}`,
            itemsText,
            orderNumber: item.order_number || 'ORD-?',
            customerName: item.customer_name || 'Customer',
            orderId: item.order_id || null,
            items: apiItems,
            time: undefined, // computed in NotificationPanel from createdAt
            isUnread: item.is_read === false,
            createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          };
        });

        // Newest first (backend already does this, but enforce just in case)
        mapped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        dispatch({ type: 'SET', payload: mapped });
      } catch (err) {
        console.error('[OrderNotifications] Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
  }, [accessToken, restaurantId]);

  // WebSocket: connect to wss://api.baaie.com/api/v1/activity/ws?token=<access_token>
  useEffect(() => {
    if (!accessToken || !restaurantId) return;

    let ws = null;
    let reconnectTimeoutId = null;
    let cancelled = false;
     let attempt = 0;
     const MAX_ATTEMPTS = 5;

    const connect = () => {
      if (cancelled) return;
      attempt += 1;
      if (attempt > MAX_ATTEMPTS) {
        console.error(
          '[OrderNotifications] WebSocket: max reconnect attempts reached. Giving up.',
        );
        return;
      }

      const wsUrl = `${ACTIVITY_WS_BASE}/api/v1/activity/ws?token=${encodeURIComponent(accessToken)}`;
      console.info(
        '[OrderNotifications] Opening WebSocket',
        wsUrl.replace(accessToken, '<token>'),
        'restaurantId=',
        restaurantId,
      );

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.info('[OrderNotifications] WebSocket connected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.info('[OrderNotifications] WS message', {
            event: data?.event,
            type: data?.type,
            restaurant_id: data?.restaurant_id,
          });
          if (data.event === 'activity' && data.type === 'new_order' && data.restaurant_id === restaurantId) {
            console.info('[OrderNotifications] New order activity received', {
              order_id: data.order_id,
              order_number: data.order_number,
              customer_name: data.customer_name,
              items_count: Array.isArray(data.items) ? data.items.length : 0,
            });

            const items = data.items || [];
            const itemsText = items.map((i) => `${i.name || 'Item'} × ${i.quantity ?? 1}`).join(', ');
            const orderNumber = data.order_number || 'ORD-?';
            const customerName = data.customer_name || 'Customer';
            const orderId = data.order_id || null;

            const notification = {
              id: `order-${orderNumber}-${Date.now()}`,
              type: 'Order',
              title: 'New Order Request',
              description: `Order #${orderNumber} from ${customerName}`,
              itemsText,
              orderNumber,
              customerName,
              orderId,
              items: data.items,
              time: 'Just now',
              isUnread: true,
              createdAt: Date.now(),
            };

            addNotification(notification);

            toast.custom(
              (t) => (
                <OrderToast
                  t={t}
                  orderId={orderNumber}
                  onViewOrder={() => {
                    onViewOrderRef.current?.(orderNumber);
                    toast.dismiss(t.id);
                  }}
                />
              ),
              { duration: 8000, position: 'top-right' }
            );
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        console.error('[OrderNotifications] WebSocket error (see Network > WS for details)');
      };

      ws.onclose = (event) => {
        console.warn(
          '[OrderNotifications] WebSocket closed',
          'code=',
          event.code,
          'reason=',
          event.reason || '(none)',
        );
        wsRef.current = null;
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        // Reconnect after 5s if not cancelled (e.g. server temporarily down)
        if (!cancelled && accessToken && restaurantId) {
          reconnectTimeoutId = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [accessToken, restaurantId, addNotification]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    acceptOrder,
    declineOrder,
  };

  return (
    <OrderNotificationsContext.Provider value={value}>
      {children}
    </OrderNotificationsContext.Provider>
  );
}

export function useOrderNotifications() {
  const ctx = useContext(OrderNotificationsContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }
  return ctx;
}
