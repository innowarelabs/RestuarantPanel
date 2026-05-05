import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export default function AddTopSellerModal({ isOpen, onClose, categories, accessToken, onSuccess }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');
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

    useEffect(() => {
        if (!isOpen) return;
        setSelectedItemId('');
        setError('');
    }, [selectedCategoryId, isOpen]);

    const resetModal = () => {
        setSelectedCategoryId('');
        setSelectedItemId('');
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
        if (saving) return;
        setSaving(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(selectedItemId)}/best-seller`;
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ is_best_seller: true }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log(data);
            if (!res.ok) {
                const message =
                    data && typeof data === 'object'
                        ? data.message || data.error || 'Failed to update best seller'
                        : typeof data === 'string' && data.trim()
                            ? data.trim()
                            : 'Failed to update best seller';
                setError(message);
                return;
            }
            if (onSuccess) await onSuccess();
            handleClose();
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Failed to update best seller';
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
                        <h2 className="text-[18px] font-bold text-[#1A1A1A]">Add Top Seller</h2>
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
                                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors appearance-none cursor-pointer shadow-sm"
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
                                    className={`w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors appearance-none cursor-pointer shadow-sm ${!selectedCategoryId ? 'bg-[#F3F4F6] text-[#9CA3AF]' : ''}`}
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

                        <div className="flex items-center justify-between bg-[#F6F8F9] rounded-[12px] p-4">
                            <div>
                                <h4 className="text-[14px] font-[600] text-[#1A1A1A]">Best Seller</h4>
                                <p className="text-[12px] text-[#6B7280]">Mark item as top seller</p>
                            </div>
                            <div
                                className="w-[44px] h-[24px] rounded-full p-1 bg-[#DD2F26] cursor-default select-none pointer-events-none"
                                role="presentation"
                                title="Best seller is always on for Add Top Seller"
                            >
                                <div className="w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform translate-x-[20px]" />
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
                            className="px-6 py-2.5 text-[14px] font-[500] text-white bg-[#DD2F26] rounded-[8px] shadow-lg shadow-[#DD2F26]/20 hover:bg-[#C52820] transition-all disabled:opacity-70"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
