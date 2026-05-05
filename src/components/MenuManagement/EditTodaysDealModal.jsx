import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const formatMoney = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return `$${value.toFixed(2)}`;
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '$0.00';
};

const toDatetimeLocalValue = (value) => {
    if (!value || typeof value !== 'string') return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EditTodaysDealModal({ isOpen, onClose, deal, categories, accessToken, onSuccess }) {
    const [discountedPrice, setDiscountedPrice] = useState('');
    const [variantDiscounts, setVariantDiscounts] = useState({});
    const [dealStartsAt, setDealStartsAt] = useState('');
    const [dealEndsAt, setDealEndsAt] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const categoryName = useMemo(() => {
        if (!deal?.category_id) return '-';
        const cat = categories.find((c) => c.id === deal.category_id);
        return cat?.name || '-';
    }, [categories, deal]);

    const hasVariants = !!deal?.has_variants || (Array.isArray(deal?.variants) && deal.variants.length > 0);
    const variants = Array.isArray(deal?.variants) ? deal.variants : [];

    useEffect(() => {
        if (!isOpen || !deal) return;
        setError('');
        setDealStartsAt(toDatetimeLocalValue(deal.deal_starts_at));
        setDealEndsAt(toDatetimeLocalValue(deal.deal_ends_at));
        const dealHasVariants =
            !!deal?.has_variants || (Array.isArray(deal?.variants) && deal.variants.length > 0);
        const dealVariants = Array.isArray(deal?.variants) ? deal.variants : [];
        if (dealHasVariants) {
            const next = {};
            dealVariants.forEach((variant) => {
                const value = Number(variant?.discounted_price);
                next[String(variant.id)] = Number.isFinite(value) ? String(value) : '';
            });
            setVariantDiscounts(next);
            setDiscountedPrice('');
        } else {
            const value = Number(deal?.discounted_price);
            setDiscountedPrice(Number.isFinite(value) ? String(value) : '');
            setVariantDiscounts({});
        }
    }, [isOpen, deal]);

    const handleClose = () => {
        if (saving) return;
        setError('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!deal?.id) return;
        if (hasVariants) {
            const invalid = variants.some((variant) => {
                const input = variantDiscounts[String(variant.id)];
                if (input === undefined || String(input).trim() === '') return true;
                const value = Number(input);
                return !Number.isFinite(value);
            });
            if (invalid) {
                setError('Variant discounted prices are required');
                return;
            }
        } else {
            if (!discountedPrice.trim()) {
                setError('Discounted price is required');
                return;
            }
            const priceValue = Number(discountedPrice);
            if (!Number.isFinite(priceValue)) {
                setError('Discounted price must be a number');
                return;
            }
        }
        if (!dealStartsAt || !dealEndsAt) {
            setError('Deal start and end time are required');
            return;
        }
        const startDate = new Date(dealStartsAt);
        const endDate = new Date(dealEndsAt);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            setError('Deal start or end time is invalid');
            return;
        }
        if (saving) return;
        setSaving(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const dishId = String(deal.id);
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(dishId)}/todays-deal`;
            const variantsPayload = hasVariants
                ? variants.map((variant) => ({
                    ...variant,
                    discounted_price: Number(variantDiscounts[String(variant.id)]),
                }))
                : [];
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    is_todays_deal: true,
                    deal_starts_at: startDate.toISOString(),
                    deal_ends_at: endDate.toISOString(),
                    ...(hasVariants
                        ? { variants: variantsPayload, discounted_price: 0, price: 0 }
                        : { discounted_price: Number(discountedPrice) }),
                }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                const message =
                    data && typeof data === 'object'
                        ? data.message || data.error || 'Failed to update deal'
                        : typeof data === 'string' && data.trim()
                            ? data.trim()
                            : 'Failed to update deal';
                setError(message);
                return;
            }
            if (onSuccess) await onSuccess();
            handleClose();
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Failed to update deal';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !deal) return null;

    return (
        <div className="fixed inset-0 z-[120]">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[520px] rounded-[20px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-[18px] font-bold text-[#1A1A1A]">Edit Today’s Deal</h2>
                        <button type="button" onClick={handleClose} disabled={saving} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-60">
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {!!error && (
                            <div className="bg-[#FEE2E2] text-[#991B1B] text-[12px] px-3 py-2 rounded-[8px]">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Category</label>
                            <div className="w-full h-[46px] px-4 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#374151] flex items-center">
                                {categoryName}
                            </div>
                        </div>

                        <div className="bg-[#F6F8F9] rounded-[12px] p-4 space-y-1">
                            <div className="text-[14px] font-[600] text-[#1A1A1A]">{deal.name || 'Item'}</div>
                            <div className="text-[12px] text-[#6B7280]">Price: {formatMoney(deal.price)}</div>
                        </div>

                        {hasVariants ? (
                            <div className="space-y-3">
                                <label className="block text-[14px] font-[500] text-[#374151]">Variants Discounted Price <span className="text-red-500">*</span></label>
                                <div className="space-y-2">
                                    {variants.map((variant) => (
                                        <div key={variant.id} className="flex items-center justify-between gap-3 border border-[#E5E7EB] rounded-[10px] px-4 py-3 bg-white">
                                            <div>
                                                <div className="text-[14px] font-[600] text-[#111827]">{variant.name}</div>
                                                <div className="text-[12px] text-[#6B7280]">Price: {formatMoney(variant.price)}</div>
                                            </div>
                                            <div className="relative w-[160px]">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-[13px]">$</span>
                                                <input
                                                    type="text"
                                                    placeholder="0.00"
                                                    value={variantDiscounts[String(variant.id)] ?? ''}
                                                    onChange={(e) => setVariantDiscounts((prev) => ({ ...prev, [String(variant.id)]: e.target.value }))}
                                                    disabled={saving}
                                                    className="w-full h-[40px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Discounted Price <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-[14px]">$</span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        value={discountedPrice}
                                        onChange={(e) => setDiscountedPrice(e.target.value)}
                                        disabled={saving}
                                        className="w-full h-[46px] pl-8 pr-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Deal Starts At</label>
                                <input
                                    type="datetime-local"
                                    value={dealStartsAt}
                                    onChange={(e) => setDealStartsAt(e.target.value)}
                                    disabled={saving}
                                    className="w-full h-[46px] px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] disabled:opacity-60"
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Deal Ends At</label>
                                <input
                                    type="datetime-local"
                                    value={dealEndsAt}
                                    onChange={(e) => setDealEndsAt(e.target.value)}
                                    disabled={saving}
                                    className="w-full h-[46px] px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="px-5 py-2.5 text-[14px] font-[500] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 text-[14px] font-[500] text-white bg-[#DD2F26] rounded-[8px] shadow-lg shadow-[#DD2F26]/20 hover:bg-[#C52820] transition-all disabled:opacity-70"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
