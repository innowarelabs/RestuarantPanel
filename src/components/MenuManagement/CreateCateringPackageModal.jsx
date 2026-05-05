import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendBaseUrl } from '../../utils/backendUrl';

const isErrorPayload = (data) => {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.code !== 'string') return false;
    const code = data.code.trim().toUpperCase();
    if (!code) return false;
    if (code.startsWith('SUCCESS_')) return false;
    if (code.startsWith('ERROR_')) return true;
    if (code.endsWith('_400') || code.endsWith('_401') || code.endsWith('_403') || code.endsWith('_404') || code.endsWith('_422') || code.endsWith('_500'))
        return true;
    return false;
};

const DEFAULT_TRAY_OPTIONS = ['Full Tray', 'Half Tray', 'Quarter Tray', 'Medium Tray', 'Large Tray'];

const toFiniteNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const parseServesNumber = (raw) => {
    if (raw === null || raw === undefined) return 0;
    const str = String(raw).trim();
    if (!str) return 0;
    const direct = toFiniteNumber(str);
    if (direct !== null) return Math.max(0, Math.floor(direct));
    const match = str.match(/\d+(\.\d+)?/);
    if (match) {
        const n = Number(match[0]);
        return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return 0;
};

const newItemRow = () => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dish_id: '',
    tray_size: '',
    quantity: '1',
});

function packageItemsToFormRows(pkg) {
    const list = pkg && Array.isArray(pkg.items) ? pkg.items : [];
    if (!list.length) return [newItemRow()];
    return list.map((line, idx) => {
        const lid =
            line && typeof line === 'object' && typeof line.id === 'string'
                ? line.id
                : `idx-${idx}`;
        return {
            key: `edit-${lid}-${idx}`,
            dish_id:
                line && typeof line.dish_id === 'string'
                    ? line.dish_id
                    : line?.dish_id != null
                        ? String(line.dish_id)
                        : '',
            tray_size: line && typeof line.tray_size === 'string' ? line.tray_size : '',
            quantity: String(Math.max(1, Math.floor(Number(line?.quantity)) || 1)),
        };
    });
}

export default function CreateCateringPackageModal({
    isOpen,
    onClose,
    categories,
    accessToken,
    onSuccess,
    editingPackage,
    duplicateSource,
}) {
    const [name, setName] = useState('');
    const [serves, setServes] = useState('');
    const [price, setPrice] = useState('');
    const [items, setItems] = useState([newItemRow()]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const dishOptions = useMemo(() => {
        const out = [];
        (Array.isArray(categories) ? categories : []).forEach((cat) => {
            const dishes = Array.isArray(cat?.dishes) ? cat.dishes : [];
            dishes.forEach((dish) => {
                if (!dish || typeof dish !== 'object') return;
                const id = typeof dish.id === 'string' ? dish.id : dish.id != null ? String(dish.id) : '';
                const dishName = typeof dish.name === 'string' ? dish.name : '';
                if (!id || !dishName) return;
                const rawVariants = Array.isArray(dish.variants) ? dish.variants : [];
                const variantLabels = rawVariants
                    .map((v) => (v && typeof v === 'object' && typeof v.name === 'string' ? v.name.trim() : ''))
                    .filter(Boolean);
                out.push({
                    id,
                    label: dishName,
                    categoryName: typeof cat.name === 'string' ? cat.name : '',
                    trayOptions: variantLabels.length ? [...new Set(variantLabels)] : DEFAULT_TRAY_OPTIONS,
                });
            });
        });
        return out;
    }, [categories]);

    const isEditMode = !!(editingPackage && editingPackage.id != null && String(editingPackage.id).trim());

    useEffect(() => {
        if (!isOpen) return;
        setError('');
        setSaving(false);
        if (isEditMode && editingPackage) {
            setName(typeof editingPackage.name === 'string' ? editingPackage.name : '');
            const sn = editingPackage.serves;
            setServes(
                typeof sn === 'number' && Number.isFinite(sn) ? String(sn) : typeof sn === 'string' ? sn : ''
            );
            const pn = toFiniteNumber(editingPackage.price);
            setPrice(pn !== null ? String(pn) : '');
            setItems(packageItemsToFormRows(editingPackage));
        } else if (!isEditMode && duplicateSource && typeof duplicateSource === 'object') {
            const baseName = typeof duplicateSource.name === 'string' ? duplicateSource.name.trim() : '';
            setName(baseName ? `${baseName} (copy)` : '');
            const sn = duplicateSource.serves;
            setServes(
                typeof sn === 'number' && Number.isFinite(sn) ? String(sn) : typeof sn === 'string' ? sn : ''
            );
            const pn = toFiniteNumber(duplicateSource.price);
            setPrice(pn !== null ? String(pn) : '');
            setItems(packageItemsToFormRows(duplicateSource));
        } else {
            setName('');
            setServes('');
            setPrice('');
            setItems([newItemRow()]);
        }
    }, [isOpen, isEditMode, editingPackage, duplicateSource]);

    const dishById = useMemo(() => {
        const m = new Map();
        dishOptions.forEach((d) => m.set(d.id, d));
        return m;
    }, [dishOptions]);

    const previewLines = useMemo(() => {
        const lines = [];
        if (name.trim()) lines.push(name.trim());
        const s = serves.trim();
        const p = price.trim();
        if (s || p) {
            const parts = [];
            if (s) parts.push(`Serves ${s}`);
            if (p) parts.push(`$${p}`);
            lines.push(parts.join(' · '));
        }
        items.forEach((row, idx) => {
            const d = row.dish_id ? dishById.get(row.dish_id) : null;
            if (!d && !row.tray_size) return;
            const bits = [];
            if (d) bits.push(d.label);
            if (row.tray_size) bits.push(row.tray_size);
            bits.push(`×${Math.max(1, Math.floor(Number(row.quantity)) || 1)}`);
            lines.push(`${idx + 1}. ${bits.join(' — ')}`);
        });
        return lines;
    }, [name, serves, price, items, dishById]);

    const handleClose = () => {
        if (saving) return;
        onClose();
    };

    const updateItem = (key, patch) => {
        setItems((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    const handleDishChange = (key, dishId) => {
        const d = dishId ? dishById.get(dishId) : null;
        const nextTray = d?.trayOptions?.[0] || '';
        updateItem(key, { dish_id: dishId, tray_size: nextTray });
    };

    const addRow = () => setItems((prev) => [...prev, newItemRow()]);
    const removeRow = (key) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Please enter a package name');
            return;
        }
        const priceNum = toFiniteNumber(price);
        if (priceNum === null || priceNum < 0) {
            setError('Please enter a valid price');
            return;
        }
        const validItems = items.filter((row) => row.dish_id);
        if (!validItems.length) {
            setError('Add at least one menu item');
            return;
        }
        for (const row of validItems) {
            if (!row.tray_size?.trim()) {
                setError('Select a tray size for each item');
                return;
            }
        }
        if (saving) return;
        setSaving(true);
        setError('');
        try {
            const baseUrl = getBackendBaseUrl();
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const payload = {
                name: name.trim(),
                serves: parseServesNumber(serves),
                price: priceNum,
                items: validItems.map((row) => ({
                    dish_id: row.dish_id,
                    tray_size: String(row.tray_size).trim(),
                    quantity: Math.max(1, Math.floor(Number(row.quantity)) || 1),
                })),
            };

            const packageId =
                isEditMode && editingPackage?.id != null ? String(editingPackage.id).trim() : '';
            const url =
                isEditMode && packageId
                    ? `${baseUrl.replace(/\/$/, '')}/api/v1/catering-packages/${encodeURIComponent(packageId)}`
                    : `${baseUrl.replace(/\/$/, '')}/api/v1/catering-packages/`;
            const method = isEditMode && packageId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log(`${method} catering-packages`, { url, status: res.status, ok: res.ok, body: data });
            if (!res.ok || isErrorPayload(data)) {
                const message =
                    data && typeof data === 'object'
                        ? data.message || data.error || data.detail || 'Request failed'
                        : typeof data === 'string' && data.trim()
                            ? data.trim()
                            : 'Request failed';
                const text = typeof message === 'string' ? message : 'Request failed';
                setError(text);
                toast.error(text);
                return;
            }
            const successMsg =
                data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : isEditMode
                        ? 'Catering package updated successfully'
                        : 'Catering package created successfully';
            toast.success(successMsg);
            if (typeof onSuccess === 'function') {
                await onSuccess();
            }
            onClose();
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Request failed';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130]">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white w-full max-w-[640px] rounded-[12px] overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-[18px] font-bold text-[#1A1A1A]">
                            {isEditMode ? 'Edit Catering Package' : 'Create Catering Package'}
                        </h2>
                        <button type="button" onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors" disabled={saving}>
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="p-5 space-y-6 max-h-[min(70vh,720px)] overflow-y-auto custom-scrollbar">
                        {!!error && <div className="bg-[#FEE2E2] text-[#991B1B] text-[12px] px-3 py-2 rounded-[8px]">{error}</div>}

                        <section>
                            <h3 className="text-[15px] font-bold text-[#111827] mb-3">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[13px] font-[500] text-[#374151] mb-1.5">Package Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Office Lunch Package"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-[44px] px-4 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-[500] text-[#374151] mb-1.5">Serves</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 10 people"
                                            value={serves}
                                            onChange={(e) => setServes(e.target.value)}
                                            className="w-full h-[44px] px-4 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-[500] text-[#374151] mb-1.5">Price</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]">$</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="e.g., 95"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="w-full h-[44px] pl-8 pr-4 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h3 className="text-[15px] font-bold text-[#111827]">Package Items</h3>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-[#DD2F26] text-[#DD2F26] text-[13px] font-[600] bg-white hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    Add Item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {items.map((row) => {
                                    const dishMeta = row.dish_id ? dishById.get(row.dish_id) : null;
                                    const baseTrays = dishMeta?.trayOptions?.length ? dishMeta.trayOptions : DEFAULT_TRAY_OPTIONS;
                                    const trayChoices =
                                        row.tray_size && !baseTrays.includes(row.tray_size)
                                            ? [row.tray_size, ...baseTrays]
                                            : baseTrays;
                                    return (
                                        <div
                                            key={row.key}
                                            className="flex flex-wrap items-end gap-3 p-3 rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA]"
                                        >
                                            <div className="flex-1 min-w-[160px]">
                                                <label className="block text-[12px] font-[500] text-[#6B7280] mb-1">Menu Item</label>
                                                <div className="relative">
                                                    <select
                                                        value={row.dish_id}
                                                        onChange={(e) => handleDishChange(row.key, e.target.value)}
                                                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#DD2F26] appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select dish…</option>
                                                        {dishOptions.map((d) => (
                                                            <option key={d.id} value={d.id}>
                                                                {d.categoryName ? `${d.label} (${d.categoryName})` : d.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full sm:w-[140px]">
                                                <label className="block text-[12px] font-[500] text-[#6B7280] mb-1">Tray Size</label>
                                                <div className="relative">
                                                    <select
                                                        value={row.tray_size}
                                                        onChange={(e) => updateItem(row.key, { tray_size: e.target.value })}
                                                        disabled={!row.dish_id}
                                                        className={`w-full h-[42px] px-3 pr-8 border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#DD2F26] appearance-none cursor-pointer ${
                                                            !row.dish_id ? 'bg-[#F3F4F6] text-[#9CA3AF]' : 'bg-white'
                                                        }`}
                                                    >
                                                        <option value="">{row.dish_id ? 'Select size…' : 'Select dish first'}</option>
                                                        {trayChoices.map((t) => (
                                                            <option key={t} value={t}>
                                                                {t}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-[72px]">
                                                <label className="block text-[12px] font-[500] text-[#6B7280] mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={row.quantity}
                                                    onChange={(e) => updateItem(row.key, { quantity: e.target.value })}
                                                    className="w-full h-[42px] px-2 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] outline-none focus:border-[#DD2F26]"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.key)}
                                                disabled={saving || items.length <= 1}
                                                className="h-[42px] w-[42px] shrink-0 flex items-center justify-center rounded-[8px] text-[#EF4444] hover:bg-red-50 border border-transparent hover:border-red-100 disabled:opacity-30"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#7F1D1D]">
                            <div className="font-[600] text-[#991B1B] mb-1">Package Preview</div>
                            {previewLines.length ? (
                                <ul className="list-disc pl-4 space-y-0.5 text-[#374151]">
                                    {previewLines.map((line, i) => (
                                        <li key={`${line}-${i}`}>{line}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[#9CA3AF]">Fill in the form to see a summary.</p>
                            )}
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="h-[40px] px-4 border border-[#E5E7EB] text-[#374151] rounded-[8px] text-[13px] font-[600] hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="h-[40px] px-4 bg-[#DD2F26] text-white rounded-[8px] text-[13px] font-[600] hover:bg-[#C52820] transition-colors disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : isEditMode ? 'Update Catering Package' : 'Save Catering Package'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
