/**
 * Shared ticket PATCH + priority UI config (same as Admin Support → PATCH /api/v1/tickets/{id}).
 */

export const PRIORITY_OPTIONS = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
];

/** Same as Admin Support: PATCH `/api/v1/tickets/{id}` body `{ status }`. */
export const STATUS_OPTIONS = [
    { label: 'Pending', api: 'open' },
    { label: 'In Progress', api: 'in_progress' },
    { label: 'Resolved', api: 'resolved' },
    { label: 'Closed', api: 'closed' },
    { label: 'Waiting customer', api: 'waiting_customer' },
];

/** Status pill colors (Admin Support table + Customer chat). */
export const getStatusColor = (status) => {
    const value = String(status || '').toLowerCase().replace(/\s+/g, '_');
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

export const formatPatchError = (json) => {
    if (!json || typeof json !== 'object') return 'Update failed';
    const detail = json.detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const lines = detail
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const msg = item.msg || item.message || 'Invalid value';
                const loc = Array.isArray(item.loc) ? item.loc.filter((x) => x !== 'body') : [];
                const field = loc.length ? String(loc[loc.length - 1]) : '';
                return field ? `${field}: ${msg}` : msg;
            })
            .filter(Boolean);
        if (lines.length) return lines.join('\n');
    }
    if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
    return 'Update failed';
};

/** Priority pill colors (Admin Support table + Customer chat). */
export const getPriorityColor = (priority) => {
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

/**
 * PATCH `/api/v1/tickets/{id}` — same as Admin Support priority/status updates.
 */
export async function patchTicketById(apiId, body, { accessToken, restaurantId }) {
    const baseUrl = import.meta.env.VITE_BACKEND_URL;
    if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
    if (!accessToken) throw new Error('Not authenticated');
    if (!apiId) throw new Error('Missing ticket id');

    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/${encodeURIComponent(apiId)}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
        },
        body: JSON.stringify(body),
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
        throw new Error(formatPatchError(json));
    }
    if (json.code != null && !String(json.code).startsWith('SUCCESS')) {
        throw new Error(json.message || formatPatchError(json) || 'Update failed');
    }
    return json.data ?? json;
}

/** Map API priority to PRIORITY_OPTIONS value (urgent → high). */
export function normalizePriorityValue(priority) {
    const v = String(priority || 'medium').toLowerCase();
    if (v === 'urgent') return 'high';
    if (PRIORITY_OPTIONS.some((o) => o.value === v)) return v;
    return 'medium';
}

/** Map ticket API status to `STATUS_OPTIONS[].api` for controlled selects. */
export function normalizeStatusValue(status) {
    const raw = String(status || 'open').trim().toLowerCase().replace(/\s+/g, '_');
    const allowed = new Set(STATUS_OPTIONS.map((o) => o.api));
    if (allowed.has(raw)) return raw;
    if (raw === 'pending') return 'open';
    if (raw === 'in_progress' || raw === 'in-progress') return 'in_progress';
    if (raw === 'awaiting_info') return 'waiting_customer';
    return 'open';
}
