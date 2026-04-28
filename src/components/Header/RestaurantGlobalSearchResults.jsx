import {
    ShoppingBag,
    User,
    UtensilsCrossed,
    LayoutGrid,
    Gift,
    Ticket,
    ChevronRight,
} from 'lucide-react';

function formatMoney(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return null;
    return `$${n.toFixed(2)}`;
}

function formatShortDate(iso) {
    if (!iso || typeof iso !== 'string') return null;
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return null;
    }
}

/** Result groups (keys match normalized `results` — `users` API arrays are mapped to `customers`). */
const SECTIONS = [
    {
        key: 'orders',
        label: 'Orders',
        icon: ShoppingBag,
        getTitle: (item) => {
            if (item.order_number) return String(item.order_number);
            const total = formatMoney(item.total_amount);
            if (total) return `Order · ${total}`;
            return item.id ? `Order ${String(item.id).slice(0, 8)}…` : 'Order';
        },
    },
    {
        key: 'customers',
        label: 'Users',
        icon: User,
        getTitle: (item) => item.full_name || item.name || item.email || 'User',
    },
    {
        key: 'menu_items',
        label: 'Menu items',
        icon: UtensilsCrossed,
        getTitle: (item) => item.name || item.title || item.dish_name || 'Item',
    },
    {
        key: 'categories',
        label: 'Categories',
        icon: LayoutGrid,
        getTitle: (item) => item.name || item.title || 'Category',
    },
    {
        key: 'rewards',
        label: 'Rewards',
        icon: Gift,
        getTitle: (item) => item.title || item.name || 'Reward',
    },
    {
        key: 'tickets',
        label: 'Support tickets',
        icon: Ticket,
        getTitle: (item) => item.ticket_number || item.subject || 'Ticket',
    },
    // {
    //     key: 'campaigns',
    //     label: 'Campaigns',
    //     icon: Megaphone,
    //     getTitle: (item) => item.title || item.name || 'Campaign',
    // },
];

const MATCH_SCANS = {
    orders: [
        (i) => i.order_number,
        (i) => i.reference,
        (i) => i.customer_name,
        (i) => i.status,
        (i) => i.payment_status,
        (i) => (i.total_amount != null ? String(i.total_amount) : null),
        (i) => i.id,
        (i) => (i.created_at ? String(i.created_at) : null),
    ],
    customers: [(i) => i.email, (i) => i.full_name, (i) => i.name, (i) => i.phone, (i) => i.phone_number, (i) => i.role],
    menu_items: [(i) => i.name, (i) => i.title, (i) => i.description, (i) => i.category_name],
    categories: [(i) => i.name, (i) => i.title, (i) => i.description],
    rewards: [(i) => i.title, (i) => i.reward_type, (i) => (i.points_required != null ? String(i.points_required) : null)],
    tickets: [(i) => i.ticket_number, (i) => i.subject, (i) => i.status, (i) => i.priority],
    // campaigns: [(i) => i.title, (i) => i.status, (i) => i.campaign_type, (i) => (i.total_sent != null ? String(i.total_sent) : null)],
};

function includesQuery(value, nq) {
    if (value == null) return false;
    const s = String(value);
    if (!s || !nq) return false;
    return s.toLowerCase().includes(nq);
}

function getSubtitleCandidates(sectionKey, item) {
    switch (sectionKey) {
        case 'orders':
            return [
                item.payment_status && `Payment: ${item.payment_status}`,
                item.total_amount != null && formatMoney(item.total_amount) && `Total: ${formatMoney(item.total_amount)}`,
                formatShortDate(item.created_at),
                item.status && `Status: ${item.status}`,
            ].map((x) => (x == null ? null : String(x)));
        case 'customers':
            return [item.email, item.phone || item.phone_number, item.full_name || item.name, item.role && `Role: ${item.role}`].map(
                (x) => (x == null ? null : String(x)),
            );
        case 'menu_items':
            return [
                item.price != null ? `Price: ${formatMoney(item.price)}` : null,
                item.description,
                item.category_name,
                item.is_available === false ? 'Unavailable' : null,
            ]
                .map((x) => (x == null || x === '' ? null : String(x)))
                .filter(Boolean);
        case 'categories':
            return [
                typeof item.is_visible === 'boolean' && !item.is_visible ? 'Hidden from menu' : null,
                item.description,
            ]
                .map((x) => (x == null || x === '' ? null : String(x)))
                .filter(Boolean);
        case 'rewards':
            return [
                item.reward_type && String(item.reward_type).replace(/_/g, ' '),
                item.points_required != null && `${item.points_required} pts`,
                item.is_active === false ? 'Inactive' : null,
            ]
                .map((x) => (x == null ? null : String(x)))
                .filter(Boolean);
        case 'tickets':
            return [item.subject, item.ticket_number, item.priority && `Priority: ${item.priority}`].map((x) => (x == null ? null : String(x)));
        // case 'campaigns':
        //     return [
        //         item.campaign_type && String(item.campaign_type).toUpperCase(),
        //         item.total_sent != null && `${item.total_sent.toLocaleString()} sent`,
        //         item.status,
        //     ]
        //         .map((x) => (x == null ? null : String(x)))
        //         .filter(Boolean);
        default:
            return [];
    }
}

function getDisplayLines(sectionKey, item, searchQuery, getDefaultTitle) {
    const nq = (searchQuery || '').trim().toLowerCase();
    const getFallback = () => {
        const primary = getDefaultTitle(item);
        return { primary, subtitle: null };
    };
    if (!nq) {
        return getFallback();
    }

    const scan = MATCH_SCANS[sectionKey];
    if (scan) {
        for (const get of scan) {
            const v = get(item);
            if (v == null || v === '') continue;
            if (includesQuery(v, nq)) {
                const primary = String(v);
                const pLower = primary.toLowerCase();
                const rest = getSubtitleCandidates(sectionKey, item).find((s) => s && s.toLowerCase() !== pLower);
                return { primary, subtitle: rest || null };
            }
        }
    }

    if (item && typeof item === 'object') {
        for (const [k, v] of Object.entries(item)) {
            if (k === 'id' || k === 'restaurant_id') continue;
            if (typeof v === 'number' && includesQuery(String(v), nq)) {
                const primary = String(v);
                const pLower = primary.toLowerCase();
                const rest = getSubtitleCandidates(sectionKey, item).find((s) => s && s.toLowerCase() !== pLower);
                return { primary, subtitle: rest || null };
            }
            if (typeof v !== 'string' || !v.trim()) continue;
            if (includesQuery(v, nq)) {
                const primary = v;
                const pLower = primary.toLowerCase();
                const rest = getSubtitleCandidates(sectionKey, item).find((s) => s && s.toLowerCase() !== pLower);
                return { primary, subtitle: rest || null };
            }
        }
    }

    return getFallback();
}

function statusBadgeKey(sectionKey) {
    return sectionKey === 'orders' || sectionKey === 'tickets' || sectionKey === 'rewards';
}

export default function RestaurantGlobalSearchResults({ data, query, loading, error, onPickItem, onClose }) {
    if (!query?.trim() && !loading) return null;

    const results = data?.results;
    const visibleTotal = results
        ? SECTIONS.reduce((acc, { key }) => {
              const arr = results[key];
              return acc + (Array.isArray(arr) ? arr.length : 0);
          }, 0)
        : 0;

    const summaryCount = typeof data?.totalHits === 'number' ? data.totalHits : visibleTotal;

    if (loading) {
        return (
            <div
                className="absolute top-[calc(100%+8px)] left-0 z-[60] w-full min-w-[320px] max-w-[min(100vw-64px,420px)] rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-lg"
                role="listbox"
            >
                <div className="flex items-center justify-center gap-2 py-6 text-[14px] text-[#6B6B6B]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Searching…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="absolute top-[calc(100%+8px)] left-0 z-[60] w-full min-w-[320px] max-w-[min(100vw-64px,420px)] rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-lg"
                role="alert"
            >
                <p className="text-[14px] text-[#B91C1C]">{error}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2 text-[12px] text-[#6B6B6B] hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        );
    }

    if (data == null) return null;

    const hasAny =
        results &&
        SECTIONS.some(({ key }) => {
            const arr = results[key];
            return Array.isArray(arr) && arr.length > 0;
        });

    return (
        <div
            className="absolute top-[calc(100%+8px)] left-0 z-[60] max-h-[min(70vh,480px)] w-full min-w-[320px] max-w-[min(100vw-64px,420px)] overflow-y-auto rounded-[12px] border border-[#E5E7EB] bg-white py-2 shadow-lg"
            role="listbox"
        >
            <div className="border-b border-[#F0F0F0] px-3 py-2">
                <p className="text-[12px] font-medium text-[#6B6B6B]">
                    {summaryCount} result{summaryCount !== 1 ? 's' : ''} for &quot;{data.query || query}&quot;
                </p>
            </div>

            {!hasAny && <p className="px-3 py-6 text-center text-[14px] text-[#6B6B6B]">No results found</p>}

            {hasAny &&
                SECTIONS.map(({ key, label, icon: Icon, getTitle }) => {
                    const items = results[key];
                    if (!Array.isArray(items) || items.length === 0) return null;
                    const q = data?.query || query;
                    return (
                        <div key={key} className="py-1">
                            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#99A1AF]">{label}</p>
                            <ul className="px-1">
                                {items.map((item, idx) => {
                                    const { primary, subtitle } = getDisplayLines(key, item, q, getTitle);
                                    const badge =
                                        key === 'rewards' && item.reward_type
                                            ? String(item.reward_type).replace(/_/g, ' ')
                                            : item.status;
                                    return (
                                        <li key={item.id ?? `${key}-${idx}`}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => onPickItem(key, item)}
                                                className="flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left text-[14px] text-[#1A1A1A] transition hover:bg-[#F5F5F5]"
                                            >
                                                <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="block break-words font-medium leading-tight text-[#1A1A1A]">
                                                        {primary}
                                                    </span>
                                                    {subtitle ? (
                                                        <span className="mt-0.5 block line-clamp-2 text-[12px] leading-snug text-[#6B6B6B]">
                                                            {subtitle}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {statusBadgeKey(key) && badge && (
                                                    <span className="mt-0.5 shrink-0 self-start rounded px-1.5 py-0.5 text-[10px] font-medium capitalize text-[#6B6B6B] max-w-[100px] truncate">
                                                        {badge}
                                                    </span>
                                                )}
                                                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 self-start text-[#C4C4C4]" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}

            <button
                type="button"
                onClick={onClose}
                className="mt-0 w-full border-t border-[#F0F0F0] px-3 py-2 text-center text-[12px] text-[#6B6B6B] hover:bg-gray-50"
            >
                Close
            </button>
        </div>
    );
}
