/** @param {string} [iso] */
export function formatShortTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/** @param {string} [iso] */
export function formatTimelineStamp(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    if (sameDay) {
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/** @param {string} [s] */
function humanizeStatus(s) {
    return String(s || '')
        .replace(/-/g, '_')
        .split('_')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * @param {unknown} timeline
 * @returns {Array<{ id: string, label: string, time: string, isCancelled: boolean }>}
 */
export function mapApiTimelineToDisplayEvents(timeline) {
    if (!Array.isArray(timeline) || !timeline.length) return [];
    const sorted = [...timeline].sort(
        (a, b) =>
            new Date((a && a.created_at) || 0).getTime() - new Date((b && b.created_at) || 0).getTime(),
    );
    return sorted.map((ev, i) => {
        const st = String((ev && ev.status) || '').toLowerCase();
        const rawLab = (ev && ev.label) != null ? String(ev.label).trim() : '';
        let label = rawLab || humanizeStatus((ev && ev.status) || 'Update');
        if (st === 'mark_as_ready' || /^mark\s*as\s*ready$/i.test(String(label).trim())) {
            label = 'Ready';
        }
        const isCancelled = st === 'cancelled' || st === 'canceled' || label.toLowerCase().includes('cancel');
        return {
            id: (ev && ev.id) != null ? String(ev.id) : `tl-${i}`,
            label,
            time: formatTimelineStamp((ev && ev.created_at) || null),
            isCancelled,
        };
    });
}
