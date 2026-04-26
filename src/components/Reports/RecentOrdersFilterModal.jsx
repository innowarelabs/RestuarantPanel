import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';

export const RECENT_ORDERS_FILTER_DEFAULTS = {
    orderStatus: { all: true, completed: false, cancelled: false, refunded: false },
    orderSource: { all: true, app: false, uberEats: false, deliveroo: false, walkIn: false },
    payment: { all: true, card: false, cash: false, contactless: false },
};

const ORDER_STATUS_ROWS = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'refunded', label: 'Refunded' },
];

const ORDER_SOURCE_ROWS = [
    { key: 'all', label: 'All' },
    { key: 'app', label: 'App' },
    { key: 'uberEats', label: 'Uber Eats' },
    { key: 'deliveroo', label: 'Deliveroo' },
    { key: 'walkIn', label: 'Walk-in' },
];

const PAYMENT_ROWS = [
    { key: 'all', label: 'All' },
    { key: 'card', label: 'Card' },
    { key: 'cash', label: 'Cash' },
    { key: 'contactless', label: 'Contactless' },
];

function toggleOrderStatus(prev, k) {
    const next = { ...prev.orderStatus, [k]: !prev.orderStatus[k] };
    if (k === 'all' && next.all) {
        return { ...prev, orderStatus: { all: true, completed: false, cancelled: false, refunded: false } };
    }
    if (k !== 'all' && next[k]) {
        return { ...prev, orderStatus: { ...next, all: false } };
    }
    const hasSpecific = next.completed || next.cancelled || next.refunded;
    if (!next.all && !hasSpecific) {
        return { ...prev, orderStatus: { all: true, completed: false, cancelled: false, refunded: false } };
    }
    if (hasSpecific) {
        return { ...prev, orderStatus: { ...next, all: false } };
    }
    return { ...prev, orderStatus: { all: true, completed: false, cancelled: false, refunded: false } };
}

function toggleOrderSource(prev, k) {
    const next = { ...prev.orderSource, [k]: !prev.orderSource[k] };
    if (k === 'all' && next.all) {
        return {
            ...prev,
            orderSource: { all: true, app: false, uberEats: false, deliveroo: false, walkIn: false },
        };
    }
    if (k !== 'all' && next[k]) {
        return { ...prev, orderSource: { ...next, all: false } };
    }
    const hasSpecific = next.app || next.uberEats || next.deliveroo || next.walkIn;
    if (!next.all && !hasSpecific) {
        return {
            ...prev,
            orderSource: { all: true, app: false, uberEats: false, deliveroo: false, walkIn: false },
        };
    }
    if (hasSpecific) {
        return { ...prev, orderSource: { ...next, all: false } };
    }
    return {
        ...prev,
        orderSource: { all: true, app: false, uberEats: false, deliveroo: false, walkIn: false },
    };
}

function togglePayment(prev, k) {
    const next = { ...prev.payment, [k]: !prev.payment[k] };
    if (k === 'all' && next.all) {
        return { ...prev, payment: { all: true, card: false, cash: false, contactless: false } };
    }
    if (k !== 'all' && next[k]) {
        return { ...prev, payment: { ...next, all: false } };
    }
    const hasSpecific = next.card || next.cash || next.contactless;
    if (!next.all && !hasSpecific) {
        return { ...prev, payment: { all: true, card: false, cash: false, contactless: false } };
    }
    if (hasSpecific) {
        return { ...prev, payment: { ...next, all: false } };
    }
    return { ...prev, payment: { all: true, card: false, cash: false, contactless: false } };
}

const RecentOrdersFilterModal = ({ isOpen, onClose, draft, onChange, onReset, onApply }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-orders-filters-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                    <h2 id="recent-orders-filters-title" className="text-[16px] font-bold text-[#0F1724]">
                        Filters
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-5 py-5 custom-scrollbar">
                    <div>
                        <p className="mb-3 font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">Order Status</p>
                        <ul className="space-y-2.5">
                            {ORDER_STATUS_ROWS.map((row) => {
                                const checked = draft.orderStatus[row.key];
                                return (
                                    <li key={row.key}>
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => onChange((p) => toggleOrderStatus(p, row.key))}
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-primary bg-white focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 checked:border-primary checked:bg-primary"
                                                />
                                                {checked && (
                                                    <Check
                                                        className="pointer-events-none absolute h-2.5 w-2.5 text-white"
                                                        strokeWidth={3.5}
                                                        aria-hidden
                                                    />
                                                )}
                                            </span>
                                            <span className="text-[14px] text-[#111827]">{row.label}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="mt-6">
                        <p className="mb-3 font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">Order Source</p>
                        <ul className="space-y-2.5">
                            {ORDER_SOURCE_ROWS.map((row) => {
                                const checked = draft.orderSource[row.key];
                                return (
                                    <li key={row.key}>
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => onChange((p) => toggleOrderSource(p, row.key))}
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-primary bg-white focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 checked:border-primary checked:bg-primary"
                                                />
                                                {checked && (
                                                    <Check
                                                        className="pointer-events-none absolute h-2.5 w-2.5 text-white"
                                                        strokeWidth={3.5}
                                                        aria-hidden
                                                    />
                                                )}
                                            </span>
                                            <span className="text-[14px] text-[#111827]">{row.label}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="mt-6">
                        <p className="mb-3 font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">Payment Method</p>
                        <ul className="space-y-2.5">
                            {PAYMENT_ROWS.map((row) => {
                                const checked = draft.payment[row.key];
                                return (
                                    <li key={row.key}>
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => onChange((p) => togglePayment(p, row.key))}
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-primary bg-white focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 checked:border-primary checked:bg-primary"
                                                />
                                                {checked && (
                                                    <Check
                                                        className="pointer-events-none absolute h-2.5 w-2.5 text-white"
                                                        strokeWidth={3.5}
                                                        aria-hidden
                                                    />
                                                )}
                                            </span>
                                            <span className="text-[14px] text-[#111827]">{row.label}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-[#E5E7EB] p-4 sm:flex-row sm:items-center sm:justify-stretch sm:gap-3">
                    <button
                        type="button"
                        onClick={onReset}
                        className="h-10 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[14px] font-[500] text-[#0F1724] transition hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onApply}
                        className="h-10 flex-1 rounded-lg bg-primary px-4 text-[14px] font-[600] text-white transition hover:bg-primary/90"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecentOrdersFilterModal;
