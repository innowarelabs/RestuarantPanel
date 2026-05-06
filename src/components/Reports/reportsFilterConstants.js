export const DATE_RANGE_OPTIONS = [
    { value: 'last-7', label: 'Last 7 Days', days: 7 },
    { value: 'last-30', label: 'Last 30 Days', days: 30 },
    { value: 'last-90', label: 'Last 90 Days', days: 90 },
    { value: 'this-year', label: 'This year', days: 365 },
];

export function dateRangeToDays(value) {
    const opt = DATE_RANGE_OPTIONS.find((o) => o.value === value);
    return opt?.days ?? 30;
}

export function daysToDateRangeValue(days) {
    const match = DATE_RANGE_OPTIONS.find((o) => o.days === days);
    return match?.value ?? 'last-30';
}

export const ORDER_TYPE_FILTER_OPTIONS = [
    { value: 'delivery', label: 'Delivery' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'dine_in', label: 'Dine-in' },
    { value: 'all', label: 'All' },
];

export const ORDER_PAYMENT_FILTER_OPTIONS = [
    { value: 'card', label: 'Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'all', label: 'All' },
];

/** UI order type → GET /api/v1/reports/order-report `order_type` */
export function mapOrderTypeForOrderReportApi(orderType) {
    if (!orderType || orderType === 'all') return null;
    if (orderType === 'dine_in') return 'dine-in';
    return orderType;
}

/** UI payment → `payment_method` (credit card, debit card, cash, cash on delivery) */
export function mapPaymentForOrderReportApi(paymentMethod) {
    if (!paymentMethod || paymentMethod === 'all') return null;
    if (paymentMethod === 'card') return 'credit card';
    return paymentMethod;
}

const DEFAULT_ORDER_REPORT_LIMIT = 50;

export const DEFAULT_ORDER_REPORT_FILTERS = {
    dateRange: 'last-30',
    orderType: 'delivery',
    paymentMethod: 'card',
};

/**
 * Query string for GET /api/v1/reports/order-report
 * @param {{ dateRange: string, orderType: string, paymentMethod: string }} f — matches Order Reports filter draft
 * @param {number} [limit] — max recent orders (1–500), default 50 when omitted
 */
export function buildOrderReportQuery(f, limit = DEFAULT_ORDER_REPORT_LIMIT) {
    const p = new URLSearchParams();
    const days = dateRangeToDays(f.dateRange);
    p.set('days', String(Math.min(365, Math.max(1, days))));
    const ot = mapOrderTypeForOrderReportApi(f.orderType);
    if (ot) p.set('order_type', ot);
    const pay = mapPaymentForOrderReportApi(f.paymentMethod);
    if (pay) p.set('payment_method', pay);
    const lim = Math.min(500, Math.max(1, Math.round(Number(limit)) || DEFAULT_ORDER_REPORT_LIMIT));
    p.set('limit', String(lim));
    return p.toString();
}

export const ORDER_SOURCE_FILTER_OPTIONS = [
    { value: 'ubereats', label: 'UberEats' },
    { value: 'doordash', label: 'DoorDash' },
    { value: 'inhouse', label: 'In-house' },
    { value: 'all', label: 'All' },
];

const DEFAULT_RECENT_ORDERS_LIMIT = 50;

/**
 * GET /api/v1/reports/order-report/recent-orders query string.
 * @param {{
 *   period?: string,
 *   days?: number,
 *   limit?: number,
 *   orderStatus?: { all?: boolean, completed?: boolean, cancelled?: boolean, refunded?: boolean },
 *   payment?: { all?: boolean, card?: boolean, cash?: boolean, contactless?: boolean },
 * }} opts
 */
export function buildRecentOrdersQuery(opts = {}) {
    const {
        period = 'monthly',
        days = 30,
        limit = DEFAULT_RECENT_ORDERS_LIMIT,
        orderStatus,
        payment,
    } = opts;
    const p = new URLSearchParams();
    const per = ['daily', 'weekly', 'monthly'].includes(period) ? period : 'monthly';
    p.set('period', per);
    const d = Math.min(365, Math.max(1, Number(days) || 1));
    p.set('days', String(d));
    const lim = Math.min(500, Math.max(1, Math.round(Number(limit)) || DEFAULT_RECENT_ORDERS_LIMIT));
    p.set('limit', String(lim));

    if (orderStatus && !orderStatus.all) {
        if (orderStatus.completed) p.append('order_status', 'completed');
        if (orderStatus.cancelled) p.append('order_status', 'cancelled');
        if (orderStatus.refunded) p.append('order_status', 'refunded');
    }

    if (payment && !payment.all) {
        if (payment.card) p.append('payment_method', 'card');
        if (payment.cash) p.append('payment_method', 'cash');
        if (payment.contactless) p.append('payment_method', 'contactless');
    }

    return p.toString();
}
