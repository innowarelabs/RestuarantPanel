const API_BASE = 'https://api.baaie.com';

const formatMoney = (n) => {
    if (n == null || Number.isNaN(Number(n))) return '$0';
    return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

/** Inclusive window of `days` ending today (local calendar dates). */
export function periodDateRange(days) {
    const end = new Date();
    end.setHours(12, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (Math.max(1, days) - 1));
    const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    return { start_date: fmt(start), end_date: fmt(end) };
}

export function mapTopItemsToExportRows(items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.map((row) => {
        const share = Number(row.share_pct);
        const pct = Number.isFinite(share) ? `${Math.round(share * 10) / 10}%` : '0%';
        return {
            id: row.dish_id,
            name: row.item_name || '—',
            category: row.category_name || '—',
            orders: Number(row.orders_count) || 0,
            revenue: formatMoney(row.revenue),
            sharePct: pct,
        };
    });
}

/** Rows shaped for `TopSellingItems` list UI */
export function mapTopItemsToUiRows(items) {
    return mapTopItemsToExportRows(items).map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.category,
        orders: r.orders,
        revenue: r.revenue,
        percentage: r.sharePct,
    }));
}

/**
 * @param {{ accessToken?: string, user?: object, period: '7d' | '30d' }} opts
 * @returns {Promise<object[]>} raw API `items` array
 */
export async function fetchTopSellingItems({ accessToken, user, period }) {
    const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
    const restaurantId = user?.restaurant_id || localStorage.getItem('restaurant_id') || '';
    const days = period === '7d' ? 7 : 30;
    const { start_date, end_date } = periodDateRange(days);
    const params = new URLSearchParams({
        days: String(days),
        limit: '10',
        start_date,
        end_date,
    });
    const url = `${baseUrl}/api/v1/analytics/restaurant/top-items?${params.toString()}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
        },
    });
    const contentType = res.headers.get('content-type');
    const body = contentType?.includes('application/json') ? await res.json() : {};
    if (res.ok && body?.code === 'SUCCESS_200' && Array.isArray(body.data?.items)) {
        return body.data.items;
    }
    return [];
}
