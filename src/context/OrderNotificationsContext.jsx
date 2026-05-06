import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map GET /notifications `items` to in-app notification rows */
function mapApiItemsToNotifications(items) {
  const raw = Array.isArray(items) ? items : [];
  const mapped = raw.map((item) => {
    const apiItems = Array.isArray(item.items) ? item.items : [];
    const itemsText = apiItems.map((i) => `${i.name || 'Item'} × ${i.quantity ?? 1}`).join(', ');
    const apiId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
    const description =
      typeof item.message === 'string' && item.message.trim()
        ? item.message.trim()
        : `Order #${item.order_number || 'ORD-?'} from ${item.customer_name || 'Customer'}`;
    return {
      id: apiId || `api-${item.order_number || ''}-${item.order_id || ''}`,
      type: 'Order',
      title: 'New Order Request',
      description,
      itemsText,
      orderNumber: item.order_number || 'ORD-?',
      customerName: item.customer_name || 'Customer',
      orderId: item.order_id || null,
      items: apiItems,
      time: undefined,
      isUnread: item.is_read === false,
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
    };
  });
  mapped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return mapped;
}

export function OrderNotificationsProvider({ children, onViewOrder }) {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);
  const restaurantId =
    (user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('restaurant_id') : null) ||
    '';

  const [notifications, dispatch] = useReducer(notificationsReducer, []);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  /** Header bell badge — not derived from filtered modal list */
  const [unreadBadgeCount, setUnreadBadgeCount] = useState(0);
  const listFilterByRef = useRef('all');
  const fetchNotificationsByFilterRef = useRef(async () => {});
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

  const markAsRead = useCallback(
    async (id) => {
      if (id == null || id === '') return true;
      const idStr = String(id);

      const useReadApi = UUID_RE.test(idStr) && accessToken && restaurantId?.trim();

      if (useReadApi) {
        try {
          const url = `${API_BASE}/api/v1/restaurants/${encodeURIComponent(
            restaurantId.trim(),
          )}/notifications/${encodeURIComponent(idStr)}/read`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });

          const data = await res.json().catch(() => null);
          const code = typeof data?.code === 'string' ? data.code.trim().toUpperCase() : '';
          const success =
            res.ok &&
            (!code || code.includes('SUCCESS') || code.endsWith('_200') || code.endsWith('_201')) &&
            !(code && code.startsWith('ERROR_'));

          if (!success) {
            console.error('[OrderNotifications] notification read failed', { status: res.status, data });
            const msg =
              data && typeof data.message === 'string' && data.message.trim()
                ? data.message.trim()
                : 'Could not mark notification as read';
            toast.error(msg);
            return false;
          }
        } catch (err) {
          console.error('[OrderNotifications] notification read network error', err);
          toast.error('Network error while marking notification read');
          return false;
        }
      }

      dispatch({ type: 'MARK_READ', id: idStr });
      setUnreadBadgeCount((c) => Math.max(0, c - 1));
      return true;
    },
    [accessToken, restaurantId],
  );

  const markAllAsRead = useCallback(async () => {
    if (!accessToken || !restaurantId?.trim()) {
      toast.error('Missing restaurant or session');
      return;
    }

    try {
      const url = `${API_BASE}/api/v1/restaurants/${encodeURIComponent(
        restaurantId.trim(),
      )}/notifications/read-all`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);
      const code = typeof data?.code === 'string' ? data.code.trim().toUpperCase() : '';
      const success =
        res.ok &&
        (!code || code.includes('SUCCESS') || code.endsWith('_200') || code.endsWith('_201'));

      if (!success || (code && code.startsWith('ERROR_'))) {
        console.error('[OrderNotifications] read-all failed', { status: res.status, data });
        const msg =
          data && typeof data.message === 'string' && data.message.trim()
            ? data.message.trim()
            : 'Could not mark notifications as read';
        toast.error(msg);
        return;
      }

      dispatch({ type: 'MARK_ALL_READ' });
      setUnreadBadgeCount(0);
      void fetchNotificationsByFilterRef.current(listFilterByRef.current);
    } catch (err) {
      console.error('[OrderNotifications] read-all network error', err);
      toast.error('Network error while marking notifications read');
    }
  }, [accessToken, restaurantId]);

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
      } catch {
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

  const fetchNotificationsByFilter = useCallback(
    async (filterBy) => {
      const normalized =
        filterBy === 'unread' || filterBy === 'today' || filterBy === 'all' ? filterBy : 'all';
      if (!accessToken || !restaurantId?.trim()) return;

      listFilterByRef.current = normalized;
      setNotificationsLoading(true);
      try {
        const params = new URLSearchParams({
          type: 'new_order',
          limit: '20',
          filter_by: normalized,
        });
        const url = `${API_BASE}/api/v1/restaurants/${encodeURIComponent(
          restaurantId.trim(),
        )}/notifications?${params.toString()}`;
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
        const mapped = mapApiItemsToNotifications(items);
        dispatch({ type: 'SET', payload: mapped });

        if (normalized === 'all') {
          setUnreadBadgeCount(mapped.filter((n) => n.isUnread).length);
        } else {
          const paramsAll = new URLSearchParams({
            type: 'new_order',
            limit: '20',
            filter_by: 'all',
          });
          const urlAll = `${API_BASE}/api/v1/restaurants/${encodeURIComponent(
            restaurantId.trim(),
          )}/notifications?${paramsAll.toString()}`;
          const resAll = await fetch(urlAll, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          const dataAll = await resAll.json().catch(() => null);
          if (resAll.ok && dataAll && !(dataAll.code && String(dataAll.code).startsWith('ERROR_'))) {
            const payloadAll = dataAll.data || dataAll;
            const itemsAll = Array.isArray(payloadAll?.items) ? payloadAll.items : [];
            const mappedAll = mapApiItemsToNotifications(itemsAll);
            setUnreadBadgeCount(mappedAll.filter((n) => n.isUnread).length);
          }
        }
      } catch (err) {
        console.error('[OrderNotifications] Failed to fetch notifications', err);
      } finally {
        setNotificationsLoading(false);
      }
    },
    [accessToken, restaurantId],
  );

  fetchNotificationsByFilterRef.current = fetchNotificationsByFilter;

  useEffect(() => {
    if (!accessToken || !restaurantId?.trim()) return;
    void fetchNotificationsByFilter('all');
  }, [accessToken, restaurantId, fetchNotificationsByFilter]);

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

            void fetchNotificationsByFilterRef.current(listFilterByRef.current);

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
        } catch {
          // ignore non-JSON WS payloads
        }
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

  const value = {
    notifications,
    unreadCount: unreadBadgeCount,
    notificationsLoading,
    fetchNotificationsByFilter,
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
      notificationsLoading: false,
      fetchNotificationsByFilter: async () => {},
      addNotification: () => {},
      markAsRead: async () => true,
      markAllAsRead: () => {},
    };
  }
  return ctx;
}
