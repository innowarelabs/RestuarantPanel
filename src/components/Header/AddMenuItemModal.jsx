import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function AddMenuItemModal({ isOpen, onClose }) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const restaurantId = useMemo(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('restaurant_id') : '';
        if (stored && typeof stored === 'string') return stored.trim();
        const fromUser =
            typeof user?.restaurant_id === 'string'
                ? user.restaurant_id
                : typeof user?.id === 'string'
                    ? user.id
                    : '';
        return fromUser.trim();
    }, [user]);

    const [form, setForm] = useState({
        name: '',
        categoryId: '',
        description: '',
        price: '',
        prepTimeMinutes: '15',
        hasVariants: false,
        trackInventory: false,
        stockQuantity: '',
        lowStockAlert: '10',
        isAvailable: true,
        catering: false,
        cateringMinimumOrder: '0',
    });
    const [variants, setVariants] = useState([{ name: '', price: '', sku: '' }]);
    const [addons, setAddons] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const resetFormState = () => {
        setForm({
            name: '',
            categoryId: '',
            description: '',
            price: '',
            prepTimeMinutes: '15',
            hasVariants: false,
            trackInventory: false,
            stockQuantity: '',
            lowStockAlert: '10',
            isAvailable: true,
            catering: false,
            cateringMinimumOrder: '0',
        });
        setVariants([{ name: '', price: '', sku: '' }]);
        setAddons([]);
        setSelectedTags([]);
        setTagInput('');
        setImageFiles([]);
        setError('');
    };

    const handleClose = () => {
        resetFormState();
        onClose();
    };

    const normalizeUrl = (value) => {
        if (typeof value !== 'string') return '';
        return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    };

    const extractUploadedImageUrl = (data) => {
        if (!data) return '';
        if (typeof data === 'string') {
            const text = data.trim();
            if (!text) return '';
            try {
                const parsed = JSON.parse(text);
                return extractUploadedImageUrl(parsed);
            } catch {
                return normalizeUrl(text);
            }
        }
        if (data && typeof data === 'object') {
            if (data.data && typeof data.data === 'object') {
                const nested = data.data;
                if (typeof nested.url === 'string') return normalizeUrl(nested.url);
                if (typeof nested.image_url === 'string') return normalizeUrl(nested.image_url);
            }
            if (typeof data.url === 'string') return normalizeUrl(data.url);
            if (typeof data.image_url === 'string') return normalizeUrl(data.image_url);
        }
        return '';
    };

    const extractCategoriesList = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data !== 'object') return [];
        if (Array.isArray(data.data)) return data.data;
        if (data.data && typeof data.data === 'object' && Array.isArray(data.data.categories)) return data.data.categories;
        if (Array.isArray(data.categories)) return data.categories;
        return [];
    };

    const mapCategory = (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const id =
            typeof raw.id === 'string'
                ? raw.id
                : typeof raw.id === 'number'
                    ? String(raw.id)
                    : typeof raw.category_id === 'string'
                        ? raw.category_id
                        : typeof raw.category_id === 'number'
                            ? String(raw.category_id)
                            : typeof raw.uuid === 'string'
                                ? raw.uuid
                                : typeof raw._id === 'string'
                                    ? raw._id
                                    : '';
        const name = typeof raw.name === 'string' ? raw.name : '';
        if (!id || !name) return null;
        return { id, name };
    };

    const uploadImage = async (file) => {
        if (!file) throw new Error('Image file is missing');
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/upload/image`;
        const body = new FormData();
        body.append('file', file);

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body,
        });

        const contentType = res.headers.get('content-type');
        const data = contentType?.includes('application/json') ? await res.json() : await res.text();
        const uploadedUrl = extractUploadedImageUrl(data);
        if (!res.ok) throw new Error('Image upload failed');
        if (!uploadedUrl) throw new Error('Image upload did not return a link');
        return uploadedUrl;
    };

    const addVariant = () => {
        setVariants((prev) => [...prev, { name: '', price: '', sku: '' }]);
    };

    const updateVariant = (index, key, value) => {
        setVariants((prev) => prev.map((variant, idx) => (idx === index ? { ...variant, [key]: value } : variant)));
    };

    const addAddOn = () => {
        setAddons((prev) => [...prev, { id: `addon-${Date.now()}`, name: '', price: '' }]);
    };

    const updateAddOn = (id, key, value) => {
        setAddons((prev) => prev.map((addon) => (addon.id === id ? { ...addon, [key]: value } : addon)));
    };

    const addTag = (value) => {
        const nextTag = value.trim();
        if (!nextTag) return;
        setSelectedTags((prev) => {
            if (prev.some((t) => t.toLowerCase() === nextTag.toLowerCase())) return prev;
            return [...prev, nextTag];
        });
        setTagInput('');
    };

    const handleTagKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(tagInput);
        }
    };

    const removeTag = (tag) => {
        setSelectedTags((prev) => prev.filter((t) => t !== tag));
    };

    const loadCategories = useCallback(async () => {
        if (!isOpen) return;
        if (!restaurantId) return;
        setLoadingCategories(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/with-counts?restaurant_id=${restaurantId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) throw new Error('Failed to load categories');
            const list = extractCategoriesList(data).map(mapCategory).filter(Boolean);
            setCategories(list);
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Failed to load categories';
            setError(message);
        } finally {
            setLoadingCategories(false);
        }
    }, [accessToken, isOpen, restaurantId]);

    const handleSubmit = async (keepOpen) => {
        if (!restaurantId) {
            setError('Restaurant not found. Please login again.');
            return;
        }
        if (!form.name.trim() || !form.categoryId) {
            setError('Please fill required fields');
            return;
        }
        if (!form.hasVariants && !form.price.trim()) {
            setError('Price is required');
            return;
        }
        if (saving) return;

        const priceValue = form.hasVariants ? 0 : Number(form.price);
        if (!form.hasVariants && !Number.isFinite(priceValue)) {
            setError('Price must be a number');
            return;
        }
        const prepValue = Number(form.prepTimeMinutes);
        if (form.prepTimeMinutes && !Number.isFinite(prepValue)) {
            setError('Prep time must be a number');
            return;
        }
        const stockValue = Number(form.stockQuantity);
        const lowStockValue = Number(form.lowStockAlert);
        const cateringMinValue = Number(form.cateringMinimumOrder);
        if (form.trackInventory && form.stockQuantity.trim() && !Number.isFinite(stockValue)) {
            setError('Stock quantity must be a number');
            return;
        }
        if (form.trackInventory && form.lowStockAlert.trim() && !Number.isFinite(lowStockValue)) {
            setError('Low stock alert must be a number');
            return;
        }
        if (form.catering && form.cateringMinimumOrder.trim() && !Number.isFinite(cateringMinValue)) {
            setError('Catering minimum order must be a number');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const images = imageFiles.length ? await Promise.all(imageFiles.map((file) => uploadImage(file))) : [];
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                images,
                tags: selectedTags,
                price: form.hasVariants ? 0 : priceValue,
                discounted_price: 0,
                has_variants: !!form.hasVariants,
                prep_time_minutes: Number.isFinite(prepValue) ? Math.trunc(prepValue) : 0,
                track_inventory: !!form.trackInventory,
                stock_quantity: form.trackInventory && Number.isFinite(stockValue) ? Math.trunc(stockValue) : 0,
                low_stock_alert: form.trackInventory && Number.isFinite(lowStockValue) ? Math.trunc(lowStockValue) : 10,
                number_of_orders: 0,
                is_available: !!form.isAvailable,
                catering: !!form.catering,
                catering_minimum_order: form.catering && Number.isFinite(cateringMinValue) ? Math.trunc(cateringMinValue) : 0,
                is_best_seller: false,
                is_todays_deal: false,
                deal_starts_at: null,
                deal_ends_at: null,
                restaurant_id: restaurantId,
                category_id: form.categoryId,
                variants: form.hasVariants
                    ? variants
                        .map((variant) => ({
                            name: variant.name?.trim() || '',
                            price: Number(variant.price),
                            sku: variant.sku?.trim() || '',
                        }))
                        .filter((variant) => variant.name && Number.isFinite(variant.price))
                    : [],
                addons: addons
                    .map((addon) => ({
                        name: addon.name?.trim() || '',
                        price: Number(addon.price),
                    }))
                    .filter((addon) => addon.name && Number.isFinite(addon.price)),
            };

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/item`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                const message =
                    data && typeof data === 'object'
                        ? data.message || data.error || 'Failed to create item'
                        : typeof data === 'string' && data.trim()
                            ? data.trim()
                            : 'Failed to create item';
                setError(message);
                return;
            }

            setRefreshKey((prev) => prev + 1);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('menu-item-added'));
            }
            await loadCategories();
            if (keepOpen) {
                resetFormState();
                return;
            }
            handleClose();
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Failed to create item';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        void loadCategories();
    }, [loadCategories, refreshKey]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={handleClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Add Menu Item</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Add a new item to a category. Fields with <span className="text-red-500">*</span> are required.</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {!!error && (
                        <div className="bg-[#FEE2E2] text-[#991B1B] text-[12px] px-3 py-2 rounded-[8px]">
                            {error}
                        </div>
                    )}

                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Item Name <span className="text-red-500">*</span></label>
                            <span className="text-[12px] text-gray-400">{form.name.length}/100 characters</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Zinger Burger"
                            value={form.name}
                            maxLength={100}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Category <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">{loadingCategories ? 'Loading categories...' : 'Select a category...'}</option>
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
                        <div className="flex justify-between mb-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Description</label>
                            <span className="text-[12px] text-gray-400">{form.description.length}/200 characters</span>
                        </div>
                        <textarea
                            rows={3}
                            maxLength={200}
                            placeholder="Describe your menu item..."
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full p-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 resize-none shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Images</label>
                        <label className="border border-dashed border-[#E5E7EB] rounded-[12px] h-[140px] flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5 text-[#6B7280]" />
                            </div>
                            <p className="text-[14px] text-[#374151] font-medium">Drag & drop images here or <span className="text-[#2BB29C]">browse</span></p>
                            <p className="text-[12px] text-gray-400 mt-1">Square images preferred • Max 8 images • 3MB each</p>
                            {!!imageFiles.length && (
                                <p className="text-[12px] text-gray-500 mt-2">{imageFiles.length} file(s) selected</p>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Has Variants?</h4>
                            <p className="text-[12px] text-gray-500">E.g., Small, Medium, Large</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${form.hasVariants ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setForm((prev) => ({ ...prev, hasVariants: !prev.hasVariants }))}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.hasVariants ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {form.hasVariants ? (
                        <div className="space-y-3">
                            <label className="block text-[14px] font-[500] text-[#374151]">Variants <span className="text-red-500">*</span></label>
                            {variants.map((variant, idx) => (
                                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input
                                        type="text"
                                        placeholder="Size name"
                                        value={variant.name}
                                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                        className="flex-1 h-[42px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                    />
                                    <div className="relative w-[120px]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                        <input
                                            type="text"
                                            placeholder="0.00"
                                            value={variant.price}
                                            onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                                            className="w-full h-[42px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="SKU"
                                        value={variant.sku}
                                        onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                                        className="w-[100px] h-[42px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                    />
                                </div>
                            ))}
                            <button onClick={addVariant} className="flex items-center gap-1 text-[13px] font-medium text-[#2BB29C] hover:text-[#249A88] active:scale-95 transition-transform">
                                <Plus size={14} /> Add variant
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Price <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    value={form.price}
                                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                                    className="w-full h-[46px] pl-8 pr-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Add-ons (Modifiers)</label>
                        <button type="button" onClick={addAddOn} className="flex items-center gap-1 text-[13px] font-medium text-[#2BB29C] hover:text-[#249A88] active:scale-95 transition-transform">
                            <Plus size={14} /> Add an add-on
                        </button>
                        {!!addons.length && (
                            <div className="space-y-3 mt-3">
                                {addons.map((addon) => (
                                    <div key={addon.id} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Add-on name"
                                            value={addon.name}
                                            onChange={(e) => updateAddOn(addon.id, 'name', e.target.value)}
                                            className="flex-1 h-[42px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                        />
                                        <div className="relative w-[120px]">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                            <input
                                                type="text"
                                                placeholder="0.00"
                                                value={addon.price}
                                                onChange={(e) => updateAddOn(addon.id, 'price', e.target.value)}
                                                className="w-full h-[42px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Prep Time (minutes)</label>
                        <input
                            type="text"
                            placeholder="15"
                            value={form.prepTimeMinutes}
                            onChange={(e) => setForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-2">Tags</label>
                        <input
                            type="text"
                            placeholder="Type a tag and press Enter"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => addTag(tagInput)}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                        />
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedTags.map((tag) => (
                                    <div key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] font-medium border border-[#E5E7EB] text-[#4B5563] bg-white">
                                        <span>{tag}</span>
                                        <button type="button" onClick={() => removeTag(tag)} className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Track Inventory</h4>
                            <p className="text-[12px] text-gray-500">Monitor stock levels for this item</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${form.trackInventory ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setForm((prev) => ({ ...prev, trackInventory: !prev.trackInventory }))}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.trackInventory ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {form.trackInventory && (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex-1">
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Stock Quantity</label>
                                <input
                                    type="text"
                                    placeholder="100"
                                    value={form.stockQuantity}
                                    onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Low Stock Alert</label>
                                <input
                                    type="text"
                                    placeholder="10"
                                    value={form.lowStockAlert}
                                    onChange={(e) => setForm((prev) => ({ ...prev, lowStockAlert: e.target.value }))}
                                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Catering</h4>
                            <p className="text-[12px] text-gray-500">Enable minimum order for catering</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${form.catering ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() =>
                                setForm((prev) => ({
                                    ...prev,
                                    catering: !prev.catering,
                                    cateringMinimumOrder: !prev.catering ? prev.cateringMinimumOrder : '0',
                                }))
                            }
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.catering ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {form.catering && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Minimum Order</label>
                            <input
                                type="text"
                                placeholder="0"
                                value={form.cateringMinimumOrder}
                                onChange={(e) => setForm((prev) => ({ ...prev, cateringMinimumOrder: e.target.value }))}
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Available</h4>
                            <p className="text-[12px] text-gray-500">Show this item to customers</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${form.isAvailable ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setForm((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.isAvailable ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl shadow-inner">
                    <button
                        onClick={handleClose}
                        className="w-full sm:w-auto order-3 sm:order-1 px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={saving}
                        className="w-full sm:w-auto order-1 sm:order-2 px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        {saving ? 'Saving...' : 'Save & Add Another'}
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={saving}
                        className="w-full sm:w-auto order-2 sm:order-3 px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        {saving ? 'Saving...' : 'Save Item'}
                    </button>
                </div>
            </div>
        </div>
    );
}
