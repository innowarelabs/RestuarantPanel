/**
 * Build query string for GET `/api/v1/tickets/` (see API: skip, limit, status, panel_status,
 * priority, priorities, ticket_type, search, from_date, to_date, start_date, end_date, assigned_to).
 *
 * @param {object} filters — UI / normalized filter object from Support page
 * @returns {URLSearchParams}
 */
export function buildTicketsListSearchParams(filters) {
    const params = new URLSearchParams();
    const skip = Number(filters?.skip);
    const limit = Number(filters?.limit);
    params.set('skip', Number.isFinite(skip) && skip >= 0 ? String(skip) : '0');
    params.set(
        'limit',
        Number.isFinite(limit) && limit >= 1 && limit <= 100 ? String(Math.min(100, limit)) : '20',
    );

    const panelMap = {
        Pending: 'pending',
        'In Progress': 'in_progress',
        Resolved: 'resolved',
    };
    const statuses = Array.isArray(filters?.status) ? filters.status : [];
    statuses.forEach((label) => {
        const v = panelMap[label];
        if (v) params.append('panel_status', v);
    });

    const priorities = Array.isArray(filters?.priority) ? filters.priority : [];
    priorities.forEach((label) => {
        const p = String(label || '').toLowerCase();
        if (p === 'low' || p === 'medium' || p === 'high') {
            params.append('priorities', p);
        }
    });

    const assignedMap = {
        Restaurant: 'restaurant',
        'Admin Team': 'admin_team',
    };
    const assignedLabels = Array.isArray(filters?.assignedTo) ? filters.assignedTo : [];
    assignedLabels.forEach((label) => {
        const api = assignedMap[label];
        if (api) params.append('assigned_to', api);
    });

    const from = (filters?.fromDate || '').trim();
    const to = (filters?.toDate || '').trim();
    if (from) params.set('from_date', from);
    if (to) params.set('to_date', to);

    const q = typeof filters?.search === 'string' ? filters.search.trim() : '';
    if (q) params.set('search', q);

    return params;
}
