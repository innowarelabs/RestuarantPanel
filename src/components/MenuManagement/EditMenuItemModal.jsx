import { useCallback, useMemo, useState } from 'react';
import { X, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

const cleanUrl = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
};

const makeClientId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toNumberOrNull = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const buildInitialFromItem = (item) => {
    const raw = item && typeof item === 'object' ? item : {};
    const rawVariants = Array.isArray(raw.variants) ? raw.variants : [];
    const rawAddons = Array.isArray(raw.addons) ? raw.addons : [];
    const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
    const rawImages = Array.isArray(raw.images) ? raw.images : [];
    const rawCategoryId = typeof raw.categoryId === 'string' ? raw.categoryId : typeof raw.category_id === 'string' ? raw.category_id : '';

    return {
        openSections: {
            basic: true,
            pricing: true,
            variants: !!raw.has_variants,
            addons: false,
            inventory: false,
            images: false,
            tags: false,
            availability: false,
        },
        form: {
            name: typeof raw.name === 'string' ? raw.name : '',
            description: typeof raw.description === 'string' ? raw.description : '',
            categoryId: rawCategoryId,
            hasVariants: !!raw.has_variants,
            price: raw.price === 0 || raw.price ? String(raw.price) : '',
            discountedPrice: raw.discounted_price === 0 || raw.discounted_price ? String(raw.discounted_price) : '',
            prepTimeMinutes: raw.prep_time_minutes === 0 || raw.prep_time_minutes ? String(raw.prep_time_minutes) : '',
            trackInventory:
                typeof raw.track_inventory === 'boolean' ? raw.track_inventory : (typeof raw.stock_quantity === 'number' ? raw.stock_quantity > 0 : false),
            stockQuantity: raw.stock_quantity === 0 || raw.stock_quantity ? String(raw.stock_quantity) : '',
            lowStockAlert: raw.low_stock_alert === 0 || raw.low_stock_alert ? String(raw.low_stock_alert) : '10',
            isAvailable: raw.is_available !== false,
            catering: !!raw.catering,
            cateringMinimumOrder:
                raw.catering_minimum_order === 0 || raw.catering_minimum_order ? String(raw.catering_minimum_order) : '',
        },
        variants: rawVariants.map((variant) => ({
            clientId: makeClientId(),
            serverId: typeof variant?.id === 'string' ? variant.id : '',
            name: typeof variant?.name === 'string' ? variant.name : '',
            price: variant?.price === 0 || variant?.price ? String(variant.price) : '',
        })),
        addons: rawAddons.map((addon) => ({
            clientId: makeClientId(),
            serverId: typeof addon?.id === 'string' ? addon.id : '',
            name: typeof addon?.name === 'string' ? addon.name : '',
            price: addon?.price === 0 || addon?.price ? String(addon.price) : '',
            image: typeof addon?.image === 'string' ? addon.image : '',
        })),
        tags: rawTags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim()),
        imagesText: rawImages.map(cleanUrl).filter(Boolean).join('\n'),
    };
};

export default function EditMenuItemModal({ isOpen, onClose, item, categories, onSave, saving, errorLines }) {
    const initial = buildInitialFromItem(item);
    const [openSections, setOpenSections] = useState(initial.openSections);
    const [form, setForm] = useState(initial.form);
    const [variants, setVariants] = useState(initial.variants);
    const [addons, setAddons] = useState(initial.addons);
    const [tags, setTags] = useState(initial.tags);
    const [tagInput, setTagInput] = useState('');
    const [imagesText, setImagesText] = useState(initial.imagesText);

    const toggleSection = (section) => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

    const addTag = useCallback((value) => {
        const next = value.trim();
        if (!next) return;
        setTags((prev) => {
            const exists = prev.some((t) => t.toLowerCase() === next.toLowerCase());
            if (exists) return prev;
            return [...prev, next];
        });
        setTagInput('');
    }, []);

    const canSave = useMemo(() => {
        if (!form.name.trim()) return false;
        if (!form.categoryId) return false;

        const prep = toNumberOrNull(form.prepTimeMinutes);
        if (prep === null) return false;

        if (form.trackInventory) {
            const stock = toNumberOrNull(form.stockQuantity);
            if (stock === null) return false;
            const lowStock = toNumberOrNull(form.lowStockAlert);
            if (lowStock === null) return false;
        }

        if (form.catering) {
            const min = toNumberOrNull(form.cateringMinimumOrder);
            if (min === null) return false;
        }

        if (form.hasVariants) {
            const cleanedVariants = variants
                .map((variant) => ({
                    name: variant.name?.trim() || '',
                    price: toNumberOrNull(variant.price),
                }))
                .filter((variant) => variant.name && variant.price !== null);
            if (cleanedVariants.length === 0) return false;
            return !saving;
        }

        const price = toNumberOrNull(form.price);
        if (price === null) return false;
        return !saving;
    }, [form, saving, variants]);

    if (!isOpen) return null;

    const submit = () => {
        if (!canSave) return;
        if (!item?.id) return;

        const prepMinutesValue = toNumberOrNull(form.prepTimeMinutes);
        const discountedValue = toNumberOrNull(form.discountedPrice);
        const stockValue = form.trackInventory ? toNumberOrNull(form.stockQuantity) : 0;
        const lowStockValue = form.trackInventory ? toNumberOrNull(form.lowStockAlert) : 10;
        const cateringMinValue = form.catering ? toNumberOrNull(form.cateringMinimumOrder) : 0;

        const cleanedVariants = form.hasVariants
            ? variants
                .map((variant) => ({
                    ...(variant.serverId ? { id: variant.serverId } : {}),
                    name: variant.name?.trim() || '',
                    price: toNumberOrNull(variant.price),
                }))
                .filter((variant) => variant.name && variant.price !== null)
                .map((variant) => ({ ...variant, price: Number(variant.price) }))
            : [];

        const cleanedAddons = addons
            .map((addon) => ({
                ...(addon.serverId ? { id: addon.serverId } : {}),
                name: addon.name?.trim() || '',
                price: toNumberOrNull(addon.price),
                image: cleanUrl(addon.image),
            }))
            .filter((addon) => addon.name && addon.price !== null)
            .map((addon) => ({ ...addon, price: Number(addon.price) }));

        const images = imagesText
            .split('\n')
            .map(cleanUrl)
            .filter(Boolean);

        const isVariantsPayload = !!form.hasVariants && cleanedVariants.length > 0;
        const priceValue = !isVariantsPayload ? toNumberOrNull(form.price) : 0;

        onSave?.({
            itemId: String(item.id),
            categoryId: form.categoryId,
            payload: {
                name: form.name.trim(),
                description: form.description.trim(),
                images,
                tags,
                price: isVariantsPayload ? 0 : (priceValue === null ? 0 : Number(priceValue)),
                discounted_price: isVariantsPayload ? 0 : (discountedValue === null ? null : Number(discountedValue)),
                has_variants: isVariantsPayload,
                prep_time_minutes: prepMinutesValue === null ? 0 : Math.trunc(prepMinutesValue),
                track_inventory: !!form.trackInventory,
                stock_quantity: stockValue === null ? 0 : Math.trunc(stockValue),
                low_stock_alert: lowStockValue === null ? 10 : Math.trunc(lowStockValue),
                is_available: !!form.isAvailable,
                catering: !!form.catering,
                catering_minimum_order: cateringMinValue === null ? 0 : Math.trunc(cateringMinValue),
                variants: cleanedVariants,
                addons: cleanedAddons,
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-[16px] w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-[18px] font-bold text-[#111827]">Edit Item</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600" disabled={saving}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-white">
                    {!!errorLines?.length && (
                        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 space-y-1">
                            {errorLines.map((line, idx) => (
                                <div key={`${line}-${idx}`}>{line}</div>
                            ))}
                        </div>
                    )}

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('basic')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Basic Details</span>
                            {openSections.basic ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>

                        {openSections.basic && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                        Item Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                        className="w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                        disabled={saving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.categoryId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                            className="w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] appearance-none cursor-pointer"
                                            disabled={saving}
                                        >
                                            <option value="">Select a category...</option>
                                            {(Array.isArray(categories) ? categories : []).map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Description</label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full p-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] resize-none"
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('pricing')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Pricing</span>
                            {openSections.pricing ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>

                        {openSections.pricing && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-[8px]">
                                    <div>
                                        <h4 className="text-[13px] font-semibold text-[#111827]">Enable Variants</h4>
                                        <p className="text-[11px] text-gray-500">Multiple sizes or options</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${form.hasVariants ? 'bg-[#DD2F26]' : 'bg-gray-300'} ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={() => {
                                            if (saving) return;
                                            setForm((prev) => ({ ...prev, hasVariants: !prev.hasVariants }));
                                            setOpenSections((prev) => ({ ...prev, variants: true }));
                                        }}
                                        disabled={saving}
                                    >
                                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.hasVariants ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {!form.hasVariants && (
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                            Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                                            <input
                                                type="text"
                                                value={form.price}
                                                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                                                className="w-full h-[40px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('variants')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Variants</span>
                            {openSections.variants ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {openSections.variants && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                                {!form.hasVariants ? (
                                    <div className="text-[13px] text-gray-500">Enable variants from Pricing to edit this section.</div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {variants.map((variant) => (
                                                <div key={variant.clientId} className="grid grid-cols-12 gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => setVariants((prev) => prev.map((v) => (v.clientId === variant.clientId ? { ...v, name: e.target.value } : v)))}
                                                        placeholder="Variant name"
                                                        className="col-span-7 h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                                        disabled={saving}
                                                    />
                                                    <div className="col-span-4 relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                                                        <input
                                                            type="text"
                                                            value={variant.price}
                                                            onChange={(e) => setVariants((prev) => prev.map((v) => (v.clientId === variant.clientId ? { ...v, price: e.target.value } : v)))}
                                                            placeholder="Price"
                                                            className="w-full h-[40px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setVariants((prev) => prev.filter((v) => v.clientId !== variant.clientId))}
                                                        className={`col-span-1 h-[40px] rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                        disabled={saving}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVariants((prev) => [
                                                    ...prev,
                                                    { clientId: makeClientId(), serverId: '', name: '', price: '' },
                                                ])
                                            }
                                            className={`w-full h-[40px] rounded-[10px] border border-[#E5E7EB] text-[13px] font-[600] text-[#374151] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            disabled={saving}
                                        >
                                            <Plus size={16} /> Add Variant
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('addons')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Add-ons</span>
                            {openSections.addons ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {openSections.addons && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                                <div className="space-y-3">
                                    {addons.map((addon) => (
                                        <div key={addon.clientId} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                type="text"
                                                value={addon.name}
                                                onChange={(e) => setAddons((prev) => prev.map((a) => (a.clientId === addon.clientId ? { ...a, name: e.target.value } : a)))}
                                                placeholder="Add-on name"
                                                className="col-span-6 h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                                disabled={saving}
                                            />
                                            <input
                                                type="text"
                                                value={addon.price}
                                                onChange={(e) => setAddons((prev) => prev.map((a) => (a.clientId === addon.clientId ? { ...a, price: e.target.value } : a)))}
                                                placeholder="Price"
                                                className="col-span-3 h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                                disabled={saving}
                                            />
                                            <input
                                                type="text"
                                                value={addon.image}
                                                onChange={(e) => setAddons((prev) => prev.map((a) => (a.clientId === addon.clientId ? { ...a, image: e.target.value } : a)))}
                                                placeholder="Image URL"
                                                className="col-span-2 h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                                disabled={saving}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setAddons((prev) => prev.filter((a) => a.clientId !== addon.clientId))}
                                                className={`col-span-1 h-[40px] rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                disabled={saving}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAddons((prev) => [...prev, { clientId: makeClientId(), serverId: '', name: '', price: '', image: '' }])}
                                    className={`w-full h-[40px] rounded-[10px] border border-[#E5E7EB] text-[13px] font-[600] text-[#374151] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    disabled={saving}
                                >
                                    <Plus size={16} /> Add Add-on
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('inventory')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Inventory</span>
                            {openSections.inventory ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {openSections.inventory && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-[8px]">
                                    <div>
                                        <h4 className="text-[13px] font-semibold text-[#111827]">Track Inventory</h4>
                                        <p className="text-[11px] text-gray-500">Enable stock quantity and alerts</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${form.trackInventory ? 'bg-[#DD2F26]' : 'bg-gray-300'} ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={() => {
                                            if (saving) return;
                                            setForm((prev) => ({ ...prev, trackInventory: !prev.trackInventory }));
                                        }}
                                        disabled={saving}
                                    >
                                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.trackInventory ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Stock Quantity</label>
                                        <input
                                            type="text"
                                            value={form.stockQuantity}
                                            onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                                            className={`w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] ${form.trackInventory ? '' : 'bg-gray-50 text-gray-400'}`}
                                            disabled={saving || !form.trackInventory}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Low Stock Alert</label>
                                        <input
                                            type="text"
                                            value={form.lowStockAlert}
                                            onChange={(e) => setForm((prev) => ({ ...prev, lowStockAlert: e.target.value }))}
                                            className={`w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] ${form.trackInventory ? '' : 'bg-gray-50 text-gray-400'}`}
                                            disabled={saving || !form.trackInventory}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('images')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Images</span>
                            {openSections.images ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {openSections.images && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                                <label className="block text-[13px] font-medium text-[#374151]">Image URLs (one per line)</label>
                                <textarea
                                    rows={4}
                                    value={imagesText}
                                    onChange={(e) => setImagesText(e.target.value)}
                                    className="w-full p-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#DD2F26] resize-none"
                                    disabled={saving}
                                />
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('tags')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Tags</span>
                            {openSections.tags ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {openSections.tags && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault();
                                                addTag(tagInput);
                                            }
                                        }}
                                        placeholder="Type and press Enter"
                                        className="flex-1 h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                        disabled={saving}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addTag(tagInput)}
                                        className={`h-[40px] px-4 rounded-[8px] bg-[#DD2F26] text-white text-[13px] font-[600] hover:bg-[#C52820] transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        disabled={saving}
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                                            className={`px-3 py-1 rounded-full border border-[#E5E7EB] text-[12px] text-[#374151] hover:bg-gray-50 transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            disabled={saving}
                                        >
                                            {tag} <span className="ml-1 text-gray-400">×</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button onClick={() => toggleSection('availability')} className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors">
                            <span className="text-[14px] font-semibold text-[#111827]">Availability</span>
                            {openSections.availability ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {openSections.availability && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Prep Time (minutes) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.prepTimeMinutes}
                                            onChange={(e) => setForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))}
                                            className="w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="flex items-end justify-between bg-gray-50 p-3 rounded-[8px]">
                                        <div>
                                            <h4 className="text-[13px] font-semibold text-[#111827]">Available</h4>
                                            <p className="text-[11px] text-gray-500">Show to customers</p>
                                        </div>
                                        <button
                                            type="button"
                                            className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${form.isAvailable ? 'bg-[#DD2F26]' : 'bg-gray-300'} ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                            onClick={() => {
                                                if (saving) return;
                                                setForm((prev) => ({ ...prev, isAvailable: !prev.isAvailable }));
                                            }}
                                            disabled={saving}
                                        >
                                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.isAvailable ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-[8px]">
                                    <div>
                                        <h4 className="text-[13px] font-semibold text-[#111827]">Catering</h4>
                                        <p className="text-[11px] text-gray-500">Enable catering for this item</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${form.catering ? 'bg-[#DD2F26]' : 'bg-gray-300'} ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={() => {
                                            if (saving) return;
                                            setForm((prev) => ({ ...prev, catering: !prev.catering }));
                                        }}
                                        disabled={saving}
                                    >
                                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${form.catering ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Catering Minimum Order</label>
                                    <input
                                        type="text"
                                        value={form.cateringMinimumOrder}
                                        onChange={(e) => setForm((prev) => ({ ...prev, cateringMinimumOrder: e.target.value }))}
                                        className={`w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] ${form.catering ? '' : 'bg-gray-50 text-gray-400'}`}
                                        disabled={saving || !form.catering}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        className={`px-4 py-2.5 rounded-[8px] text-[13px] font-medium text-white transition-colors ${canSave ? 'bg-[#DD2F26] hover:bg-[#C52820]' : 'bg-gray-300 cursor-not-allowed'}`}
                        disabled={!canSave}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
