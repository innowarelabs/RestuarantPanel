import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const formatMoney = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return `$${value.toFixed(2)}`;
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '$0.00';
};

export default function AddTodaysDealModal({ isOpen, onClose, categories, accessToken, onSuccess }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [discountedPrice, setDiscountedPrice] = useState('');
    const [dealStartsAt, setDealStartsAt] = useState('');
    const [dealEndsAt, setDealEndsAt] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const selectedCategory = useMemo(
        () => categories.find((category) => category.id === selectedCategoryId) || null,
        [categories, selectedCategoryId]
    );
    const items = useMemo(
        () => (Array.isArray(selectedCategory?.dishes) ? selectedCategory.dishes : []),
        [selectedCategory]
    );
    const selectedItem = useMemo(
        () => items.find((item) => String(item.id) === selectedItemId) || null,
        [items, selectedItemId]
    );

    useEffect(() => {
        if (!isOpen) return;
        setSelectedItemId('');
        setDiscountedPrice('');
        setDealStartsAt('');
        setDealEndsAt('');
        setError('');
    }, [selectedCategoryId, isOpen]);

    const resetModal = () => {
        setSelectedCategoryId('');
        setSelectedItemId('');
        setDiscountedPrice('');
        setDealStartsAt('');
        setDealEndsAt('');
        setError('');
        setSaving(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedCategoryId || !selectedItemId) {
            setError('Please select category and item');
            return;
        }
        const priceValue = Number(discountedPrice);
        if (!Number.isFinite(priceValue)) {
            setError('Discounted price must be a number');
            return;
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
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(selectedItemId)}/todays-deal`;
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    is_todays_deal: true,
                    discounted_price: priceValue,
                    deal_starts_at: startDate.toISOString(),
                    deal_ends_at: endDate.toISOString(),
                }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log(data);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120]">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[520px] rounded-[20px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-[18px] font-bold text-[#1A1A1A]">Add Today’s Deal</h2>
                        <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
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
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Category <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="">Select category...</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Item <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    disabled={!selectedCategoryId}
                                    className={`w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors appearance-none cursor-pointer shadow-sm ${!selectedCategoryId ? 'bg-[#F3F4F6] text-[#9CA3AF]' : ''}`}
                                >
                                    <option value="">{selectedCategoryId ? 'Select item...' : 'Select category first'}</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={String(item.id)}>{item.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        {selectedItem && (
                            <div className="bg-[#F6F8F9] rounded-[12px] p-4 space-y-1">
                                <div className="text-[14px] font-[600] text-[#1A1A1A]">{selectedItem.name}</div>
                                <div className="text-[12px] text-[#6B7280]">Price: {formatMoney(selectedItem.price)}</div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Discounted Price <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="0.00"
                                value={discountedPrice}
                                onChange={(e) => setDiscountedPrice(e.target.value)}
                                disabled={!selectedItem}
                                className={`w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm ${!selectedItem ? 'bg-[#F3F4F6] text-[#9CA3AF]' : ''}`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Deal Starts At</label>
                                <input
                                    type="datetime-local"
                                    value={dealStartsAt}
                                    onChange={(e) => setDealStartsAt(e.target.value)}
                                    disabled={!selectedItem}
                                    className={`w-full h-[46px] px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] ${!selectedItem ? 'bg-[#F3F4F6] text-[#9CA3AF]' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Deal Ends At</label>
                                <input
                                    type="datetime-local"
                                    value={dealEndsAt}
                                    onChange={(e) => setDealEndsAt(e.target.value)}
                                    disabled={!selectedItem}
                                    className={`w-full h-[46px] px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] ${!selectedItem ? 'bg-[#F3F4F6] text-[#9CA3AF]' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2.5 text-[14px] font-[500] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 text-[14px] font-[500] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] transition-all disabled:opacity-70"
                        >
                            {saving ? 'Saving...' : 'Save Deal'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
