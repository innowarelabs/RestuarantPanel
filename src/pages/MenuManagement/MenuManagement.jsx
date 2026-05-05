import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, X, Eye, Copy, DollarSign, TrendingUp, Package } from 'lucide-react';
import AddMenuItemModal from '../../components/Header/AddMenuItemModal';
import EditMenuItemModal from '../../components/MenuManagement/EditMenuItemModal';
import MenuPreviewModal from '../../components/MenuManagement/MenuPreviewModal';
import AddCategoryModal from '../../components/MenuManagement/AddCategoryModal';
import CreateCateringPackageModal from '../../components/MenuManagement/CreateCateringPackageModal';
import EditCategoryModal from '../../components/MenuManagement/EditCategoryModal';
import AddTodaysDealModal from '../../components/MenuManagement/AddTodaysDealModal';
import EditTodaysDealModal from '../../components/MenuManagement/EditTodaysDealModal';
import AddTopSellerModal from '../../components/MenuManagement/AddTopSellerModal';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { getBackendBaseUrl } from '../../utils/backendUrl';

const normalizeUrl = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
};

const toValidationErrorLines = (data) => {
    if (!data || typeof data !== 'object') return [];
    if (!Array.isArray(data.detail)) return [];
    return data.detail
        .map((item) => {
            if (!item || typeof item !== 'object') return '';
            const loc = Array.isArray(item.loc) ? item.loc : [];
            const field = typeof loc.at(-1) === 'string' ? loc.at(-1) : '';
            const msg = typeof item.msg === 'string' ? item.msg : '';
            const label = field ? `${field}: ` : '';
            return `${label}${msg}`.trim();
        })
        .filter(Boolean);
};

const isErrorPayload = (data) => {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.code !== 'string') return false;
    const code = data.code.trim().toUpperCase();
    if (!code) return false;
    if (code.startsWith('SUCCESS_')) return false;
    if (code.startsWith('ERROR_')) return true;
    if (code.endsWith('_400') || code.endsWith('_401') || code.endsWith('_403') || code.endsWith('_404') || code.endsWith('_422') || code.endsWith('_500')) return true;
    return false;
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
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) return data.data.data;
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.categories)) return data.data.categories;
    if (Array.isArray(data.categories)) return data.categories;
    return [];
};

const extractCateringPackagesList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data !== 'object') return [];
    /** GET /api/v1/catering-packages/: { code, data: { data: Package[], total, dashboard } } */
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) {
        return data.data.data;
    }
    if (Array.isArray(data.data)) return data.data;
    if (data.data && typeof data.data === 'object') {
        if (Array.isArray(data.data.items)) return data.data.items;
        if (Array.isArray(data.data.packages)) return data.data.packages;
        if (typeof data.data.id === 'string' || typeof data.data.id === 'number') return [data.data];
    }
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.packages)) return data.packages;
    return [];
};

/** Dashboard stats bundled with GET /api/v1/catering-packages/ */
const extractCateringDashboard = (payload) => {
    if (!payload || typeof payload !== 'object') return null;
    const inner = payload.data;
    if (!inner || typeof inner !== 'object') return null;
    const dash = inner.dashboard;
    if (!dash || typeof dash !== 'object') return null;
    return dash;
};

const formatMoney = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return `$${value.toFixed(2)}`;
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '$0.00';
};

const toFiniteNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

/** Stable key for matching a catering package line item when deleting/updating. */
const getCateringLineItemKey = (line) => {
    if (!line || typeof line !== 'object') return '';
    if (typeof line.id === 'string' && line.id.trim()) return `id:${line.id.trim()}`;
    const dishId = line.dish_id != null ? String(line.dish_id) : '';
    const tray =
        typeof line.tray_size === 'string' ? line.tray_size.trim() : String(line.tray_size ?? '').trim();
    const qRaw = line.quantity;
    const qty =
        typeof qRaw === 'number' && Number.isFinite(qRaw)
            ? Math.floor(qRaw)
            : Math.floor(Number(qRaw)) || 0;
    return `d:${dishId}|t:${tray}|q:${qty}`;
};

const parseCateringPackageServes = (pkg) => {
    if (!pkg || typeof pkg !== 'object') return 0;
    const sn = pkg.serves;
    if (typeof sn === 'number' && Number.isFinite(sn)) return Math.max(0, Math.floor(sn));
    if (typeof sn === 'string' && sn.trim()) {
        const n = Number(sn.trim());
        return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return 0;
};

const formatDateTime = (value) => {
    if (!value || typeof value !== 'string') return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString();
};

const getPricingDisplay = (entity) => {
    const hasVariants = !!entity?.has_variants || (Array.isArray(entity?.variants) && entity.variants.length > 0);
    if (hasVariants) {
        const rawVariants = Array.isArray(entity?.variants) ? entity.variants : [];
        const minVariant = rawVariants.reduce((best, variant) => {
            if (!variant || typeof variant !== 'object') return best;
            const variantPriceNumber = toFiniteNumber(variant.price);
            const variantDiscountedNumber = toFiniteNumber(variant.discounted_price);
            const variantHasDiscount = variantDiscountedNumber !== null && variantDiscountedNumber > 0;
            const effective = variantHasDiscount ? variantDiscountedNumber : variantPriceNumber;
            if (effective === null) return best;
            if (!best || effective < best.effective) {
                return {
                    effective,
                    priceNumber: variantPriceNumber,
                    discountedNumber: variantDiscountedNumber,
                    hasDiscount: variantHasDiscount,
                };
            }
            return best;
        }, null);

        if (minVariant) {
            const price = minVariant.hasDiscount && minVariant.priceNumber !== null ? formatMoney(minVariant.priceNumber) : formatMoney(minVariant.effective);
            const discounted =
                minVariant.hasDiscount && minVariant.discountedNumber !== null ? formatMoney(minVariant.discountedNumber) : '';
            return { price, discounted, hasDiscount: !!(minVariant.hasDiscount && discounted) };
        }
    }

    const basePrice = formatMoney(entity?.price);
    const discountedNumber = toFiniteNumber(entity?.discounted_price);
    const hasDiscount = discountedNumber !== null && discountedNumber > 0;
    const discounted = hasDiscount ? formatMoney(discountedNumber) : '';
    return { price: basePrice, discounted, hasDiscount };
};

const mapDishToMenuItem = (dish) => {
    if (!dish || typeof dish !== 'object') return null;
    const id = typeof dish.id === 'string' ? dish.id : typeof dish.id === 'number' ? String(dish.id) : '';
    const name = typeof dish.name === 'string' ? dish.name : '';
    if (!id || !name) return null;

    const images = Array.isArray(dish.images) ? dish.images : [];
    const firstImage = typeof images[0] === 'string' ? normalizeUrl(images[0]) : '';
    const price = formatMoney(dish.price);
    const discountedNumber = toFiniteNumber(dish.discounted_price);
    const discountedPrice = discountedNumber !== null ? formatMoney(discountedNumber) : '';
    const hasDiscount = discountedNumber !== null && discountedNumber > 0;
    const prepTimeMinutes = typeof dish.prep_time_minutes === 'number' ? dish.prep_time_minutes : null;
    const prepTime = typeof prepTimeMinutes === 'number' ? `${prepTimeMinutes} min` : '';
    const numberOfOrders = typeof dish.number_of_orders === 'number' ? dish.number_of_orders : 0;
    const isAvailable = typeof dish.is_available === 'boolean' ? dish.is_available : true;
    const hasVariants = !!dish.has_variants || (Array.isArray(dish.variants) && dish.variants.length > 0);
    const rawVariants = Array.isArray(dish.variants) ? dish.variants : [];
    const minVariant = rawVariants.reduce((best, variant) => {
        if (!variant || typeof variant !== 'object') return best;
        const variantPriceNumber = toFiniteNumber(variant.price);
        const variantDiscountedNumber = toFiniteNumber(variant.discounted_price);
        const variantHasDiscount = variantDiscountedNumber !== null && variantDiscountedNumber > 0;
        const effective = variantHasDiscount ? variantDiscountedNumber : variantPriceNumber;
        if (effective === null) return best;
        if (!best || effective < best.effective) {
            return {
                effective,
                priceNumber: variantPriceNumber,
                discountedNumber: variantDiscountedNumber,
                hasDiscount: variantHasDiscount,
            };
        }
        return best;
    }, null);
    const minVariantPrice = minVariant ? formatMoney(minVariant.effective) : '';
    const minVariantOriginalPrice = minVariant?.priceNumber !== null && minVariant?.priceNumber !== undefined ? formatMoney(minVariant.priceNumber) : '';
    const minVariantDiscountedPrice =
        minVariant?.discountedNumber !== null && minVariant?.discountedNumber !== undefined ? formatMoney(minVariant.discountedNumber) : '';
    const minVariantHasDiscount = !!minVariant?.hasDiscount && !!minVariantDiscountedPrice;

    return {
        id,
        name,
        sales: '',
        prepTime,
        price,
        discountedPrice,
        hasDiscount,
        hasVariants,
        minVariantPrice,
        minVariantOriginalPrice,
        minVariantDiscountedPrice,
        minVariantHasDiscount,
        orders: { current: numberOfOrders, total: '' },
        status: isAvailable,
        image: firstImage || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80',
    };
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
    if (!name) return null;
    const safeId = id || name;
    const description = typeof raw.description === 'string' ? raw.description : '';
    const imageRaw =
        (typeof raw.image === 'string' && raw.image) ||
        (typeof raw.image_url === 'string' && raw.image_url) ||
        (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
        '';
    const imageUrl = imageRaw ? normalizeUrl(imageRaw) : '';
    const visible = typeof raw.visible === 'boolean' ? raw.visible : true;
    const count =
        typeof raw.count === 'number'
            ? raw.count
            : typeof raw.dish_count === 'number'
                ? raw.dish_count
                : typeof raw.dishes_count === 'number'
                    ? raw.dishes_count
            : typeof raw.items_count === 'number'
                ? raw.items_count
                : typeof raw.itemsCount === 'number'
                    ? raw.itemsCount
                    : 0;
    const dishes = Array.isArray(raw.dishes) ? raw.dishes : [];
    return { id: safeId, name, description, imageUrl, visible, count, dishes };
};

function AddCateringItemModal({ isOpen, onClose, categories, accessToken, onSuccess }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [cateringEnabled, setCateringEnabled] = useState(false);
    const [minimumOrder, setMinimumOrder] = useState('');
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
        setSelectedCategoryId('');
        setSelectedItemId('');
        setCateringEnabled(false);
        setMinimumOrder('');
        setError('');
        setSaving(false);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedItemId('');
        setCateringEnabled(false);
        setMinimumOrder('');
        setError('');
    }, [isOpen, selectedCategoryId]);

    useEffect(() => {
        if (!selectedItem) {
            setCateringEnabled(false);
            setMinimumOrder('');
            return;
        }
        setCateringEnabled(!!selectedItem?.catering);
        const fromItem = toFiniteNumber(selectedItem?.catering_minimum_order);
        setMinimumOrder(fromItem !== null ? String(fromItem) : '');
    }, [selectedItem]);

    const handleClose = () => {
        if (saving) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedCategoryId || !selectedItemId) {
            setError('Please select category and item');
            return;
        }
        const dishId = selectedItemId;
        const minValueRaw = toFiniteNumber(minimumOrder);
        if (cateringEnabled && (minValueRaw === null || minValueRaw < 0)) {
            setError('Minimum order must be a valid number');
            return;
        }
        if (saving) return;

        setSaving(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(dishId)}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    catering: !!cateringEnabled,
                    catering_minimum_order: cateringEnabled ? Number(minValueRaw ?? 0) : 0,
                }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
                const message =
                    data && typeof data === 'object'
                        ? data.message || data.error || 'Failed to save catering item'
                        : typeof data === 'string' && data.trim()
                            ? data.trim()
                            : 'Failed to save catering item';
                setError(message);
                return;
            }
            if (onSuccess) await onSuccess();
            onClose();
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Failed to save catering item';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130]">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[520px] rounded-[20px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-[18px] font-bold text-[#1A1A1A]">Add Catering Item</h2>
                        <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors" disabled={saving}>
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

                        {selectedItem && (
                            <div className="border border-[#E5E7EB] rounded-[12px] p-4 bg-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[14px] font-[600] text-[#111827]">Catering</div>
                                        <div className="text-[12px] text-[#6B7280]">Enable/disable catering for this item</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCateringEnabled((prev) => !prev)}
                                        className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${cateringEnabled ? 'bg-[#DD2F26]' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${cateringEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-[500] text-[#374151] mb-1.5">Catering Minimum Order</label>
                                    <input
                                        type="text"
                                        placeholder="Minimum Order Stock"
                                        value={minimumOrder}
                                        onChange={(e) => setMinimumOrder(e.target.value)}
                                        className="w-full h-[44px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="h-[40px] px-4 border border-[#E5E7EB] text-[#374151] rounded-[10px] text-[13px] font-[600] hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="h-[40px] px-4 bg-[#DD2F26] text-white rounded-[10px] text-[13px] font-[600] hover:bg-[#C52820] transition-colors disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MenuManagement() {
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

    const [activeCategory, setActiveCategory] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [isAddTodaysDealModalOpen, setIsAddTodaysDealModalOpen] = useState(false);
    const [isAddTopSellerModalOpen, setIsAddTopSellerModalOpen] = useState(false);
    const [isAddCateringItemModalOpen, setIsAddCateringItemModalOpen] = useState(false);
    const [isCreateCateringPackageModalOpen, setIsCreateCateringPackageModalOpen] = useState(false);
    const [editingCateringPackage, setEditingCateringPackage] = useState(null);
    const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
    const [menuType, setMenuType] = useState('regular');
    const [cateringMenuSearch, setCateringMenuSearch] = useState('');
    const [activeCateringCategoryId, setActiveCateringCategoryId] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryMenu, setCategoryMenu] = useState(null);
    const [duplicateCategorySource, setDuplicateCategorySource] = useState(null);
    const [cateringDuplicateSource, setCateringDuplicateSource] = useState(null);
    const [cateringPackageMenu, setCateringPackageMenu] = useState(null);
    const [viewingCateringPackage, setViewingCateringPackage] = useState(null);
    const [updatingItem, setUpdatingItem] = useState(false);
    const [updatingItemErrorLines, setUpdatingItemErrorLines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesErrorLines, setCategoriesErrorLines] = useState([]);
    const [todaysDeals, setTodaysDeals] = useState([]);
    const [todaysDealsLoading, setTodaysDealsLoading] = useState(false);
    const [bestSellers, setBestSellers] = useState([]);
    const [bestSellersLoading, setBestSellersLoading] = useState(false);
    const [updatingBestSellerIds, setUpdatingBestSellerIds] = useState([]);
    const [updatingCateringIds, setUpdatingCateringIds] = useState([]);
    const [cateringPackages, setCateringPackages] = useState([]);
    const [cateringPackagesLoading, setCateringPackagesLoading] = useState(false);
    const [cateringPackagesError, setCateringPackagesError] = useState('');
    const [cateringDashboard, setCateringDashboard] = useState(null);
    const [removingTodaysDealIds, setRemovingTodaysDealIds] = useState([]);
    const [editingTodaysDeal, setEditingTodaysDeal] = useState(null);
    const [deleteTodaysDealTarget, setDeleteTodaysDealTarget] = useState(null);
    const [deleteTodaysDealError, setDeleteTodaysDealError] = useState('');
    const [deletingDishIds, setDeletingDishIds] = useState([]);
    const [togglingAvailabilityIds, setTogglingAvailabilityIds] = useState([]);
    const [menuListError, setMenuListError] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const [savingCategoryErrorLines, setSavingCategoryErrorLines] = useState([]);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(false);
    const [deleteCategoryErrorLines, setDeleteCategoryErrorLines] = useState([]);
    const [deleteCateringPackageTarget, setDeleteCateringPackageTarget] = useState(null);
    const [deletingCateringPackage, setDeletingCateringPackage] = useState(false);
    const [deleteCateringPackageErrorLines, setDeleteCateringPackageErrorLines] = useState([]);
    const [deleteCateringLineItemTarget, setDeleteCateringLineItemTarget] = useState(null);
    const [deletingCateringLineItem, setDeletingCateringLineItem] = useState(false);
    const [deleteCateringLineItemErrorLines, setDeleteCateringLineItemErrorLines] = useState([]);
    const [updatingCategory, setUpdatingCategory] = useState(false);
    const [updatingCategoryErrorLines, setUpdatingCategoryErrorLines] = useState([]);

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setUpdatingItemErrorLines([]);
        setIsEditModalOpen(true);
    };

    const openEditCategory = (category) => {
        if (!category) return;
        setDuplicateCategorySource(null);
        setSelectedCategory(category);
        setUpdatingCategoryErrorLines([]);
        setIsEditCategoryModalOpen(true);
        setCategoryMenu(null);
    };

    const openDeleteCategory = (category) => {
        if (!category) return;
        setDeleteCategoryErrorLines([]);
        setDeleteCategoryTarget(category);
        setCategoryMenu(null);
    };

    const closeDeleteCategory = useCallback(() => {
        if (deletingCategory) return;
        setDeleteCategoryTarget(null);
        setDeleteCategoryErrorLines([]);
    }, [deletingCategory]);

    const closeDeleteCateringPackage = useCallback(() => {
        if (deletingCateringPackage) return;
        setDeleteCateringPackageTarget(null);
        setDeleteCateringPackageErrorLines([]);
    }, [deletingCateringPackage]);

    const closeDeleteCateringLineItem = useCallback(() => {
        if (deletingCateringLineItem) return;
        setDeleteCateringLineItemTarget(null);
        setDeleteCateringLineItemErrorLines([]);
    }, [deletingCateringLineItem]);

    const confirmDeleteCategory = async () => {
        if (!deleteCategoryTarget || deletingCategory) return;
        setDeletingCategory(true);
        setDeleteCategoryErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/${encodeURIComponent(deleteCategoryTarget.id)}`;

            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            const ok =
                res.ok &&
                data &&
                typeof data === 'object' &&
                typeof data.code === 'string' &&
                data.code.trim().toUpperCase().startsWith('SUCCESS_');

            if (!ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setDeleteCategoryErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to delete category';
                    setDeleteCategoryErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setDeleteCategoryErrorLines([data.trim()]);
                } else {
                    setDeleteCategoryErrorLines(['Failed to delete category']);
                }
                return;
            }

            setDeleteCategoryTarget(null);
            await fetchCategories();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to delete category';
            setDeleteCategoryErrorLines([message]);
        } finally {
            setDeletingCategory(false);
        }
    };

    useEffect(() => {
        if (!categoryMenu) return;
        const closeMenu = () => setCategoryMenu(null);
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeMenu();
        };

        window.addEventListener('scroll', closeMenu, true);
        window.addEventListener('resize', closeMenu);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('scroll', closeMenu, true);
            window.removeEventListener('resize', closeMenu);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [categoryMenu]);

    useEffect(() => {
        if (!cateringPackageMenu) return;
        const closeMenu = () => setCateringPackageMenu(null);
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeMenu();
        };

        window.addEventListener('scroll', closeMenu, true);
        window.addEventListener('resize', closeMenu);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('scroll', closeMenu, true);
            window.removeEventListener('resize', closeMenu);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [cateringPackageMenu]);

    useEffect(() => {
        if (!viewingCateringPackage) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setViewingCateringPackage(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [viewingCateringPackage]);

    useEffect(() => {
        if (menuType !== 'catering') setViewingCateringPackage(null);
    }, [menuType]);

    useEffect(() => {
        if (!deleteCategoryTarget) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDeleteCategory();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeDeleteCategory, deleteCategoryTarget]);

    useEffect(() => {
        if (!deleteCateringPackageTarget) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDeleteCateringPackage();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeDeleteCateringPackage, deleteCateringPackageTarget]);

    useEffect(() => {
        if (!deleteCateringLineItemTarget) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDeleteCateringLineItem();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeDeleteCateringLineItem, deleteCateringLineItemTarget]);

    const fetchCategories = useCallback(async () => {
        if (!restaurantId) {
            setCategories([]);
            setCategoriesErrorLines(['Restaurant not found. Please login again.']);
            return;
        }
        setCategoriesLoading(true);
        setCategoriesErrorLines([]);
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
            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setCategoriesErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to load categories';
                    setCategoriesErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setCategoriesErrorLines([data.trim()]);
                } else {
                    setCategoriesErrorLines(['Failed to load categories']);
                }
                setCategories([]);
                return;
            }

            const list = extractCategoriesList(data).map(mapCategory).filter(Boolean);
            setCategories(list);
            setCategoriesErrorLines([]);
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to load categories';
            setCategoriesErrorLines([message]);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    }, [accessToken, restaurantId]);

    const fetchCateringPackages = useCallback(async () => {
        const baseUrl = getBackendBaseUrl();
        if (!baseUrl) {
            setCateringPackages([]);
            setCateringPackagesError('');
            setCateringDashboard(null);
            return;
        }
        setCateringPackagesLoading(true);
        setCateringPackagesError('');
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/catering-packages/`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
                const msg =
                    data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : 'Could not load catering packages';
                setCateringPackages([]);
                setCateringPackagesError(msg);
                setCateringDashboard(null);
                return;
            }
            const raw = extractCateringPackagesList(data);
            setCateringPackages(Array.isArray(raw) ? raw : []);
            setCateringDashboard(extractCateringDashboard(data));
        } catch (e) {
            const msg = typeof e?.message === 'string' ? e.message : 'Could not load catering packages';
            setCateringPackages([]);
            setCateringPackagesError(msg);
            setCateringDashboard(null);
        } finally {
            setCateringPackagesLoading(false);
        }
    }, [accessToken]);

    const confirmDeleteCateringPackage = async () => {
        if (!deleteCateringPackageTarget || deletingCateringPackage) return;
        setDeletingCateringPackage(true);
        setDeleteCateringPackageErrorLines([]);
        try {
            const baseUrl = getBackendBaseUrl();
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/catering-packages/${encodeURIComponent(deleteCateringPackageTarget.id)}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log('DELETE /api/v1/catering-packages/{package_id}', { status: res.status, ok: res.ok, body: data });

            const ok =
                res.ok &&
                data &&
                typeof data === 'object' &&
                typeof data.code === 'string' &&
                data.code.trim().toUpperCase().startsWith('SUCCESS_');

            if (!ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setDeleteCateringPackageErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to delete catering package';
                    setDeleteCateringPackageErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setDeleteCateringPackageErrorLines([data.trim()]);
                } else {
                    setDeleteCateringPackageErrorLines(['Failed to delete catering package']);
                }
                return;
            }

            const successMsg =
                data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : 'Catering package deleted successfully';
            toast.success(successMsg);

            setDeleteCateringPackageTarget(null);
            await fetchCateringPackages();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to delete catering package';
            setDeleteCateringPackageErrorLines([message]);
        } finally {
            setDeletingCateringPackage(false);
        }
    };

    const confirmDeleteCateringLineItem = async () => {
        if (!deleteCateringLineItemTarget || deletingCateringLineItem) return;
        const { packageId, lineKey } = deleteCateringLineItemTarget;
        if (!packageId || !lineKey) return;

        const pkg = cateringPackages.find((p) => String(p.id) === String(packageId));
        if (!pkg) {
            setDeleteCateringLineItemErrorLines(['Package not found. Refresh and try again.']);
            return;
        }

        const rawItems = Array.isArray(pkg.items) ? pkg.items : [];
        const remaining = rawItems.filter((row) => row && getCateringLineItemKey(row) !== lineKey);

        if (remaining.length === rawItems.length) {
            setDeleteCateringLineItemErrorLines(['That line item was not found on the package.']);
            return;
        }
        if (remaining.length < 1) {
            toast.error('A package must include at least one item.');
            return;
        }

        const name = typeof pkg.name === 'string' ? pkg.name.trim() : '';
        if (!name) {
            setDeleteCateringLineItemErrorLines(['Package name is missing.']);
            return;
        }

        const priceNum = toFiniteNumber(pkg.price);
        if (priceNum === null || priceNum < 0) {
            setDeleteCateringLineItemErrorLines(['Invalid package price.']);
            return;
        }

        const payload = {
            name,
            serves: parseCateringPackageServes(pkg),
            price: priceNum,
            items: remaining.map((line) => ({
                dish_id: typeof line.dish_id === 'string' ? line.dish_id : String(line.dish_id ?? ''),
                tray_size: String(line.tray_size ?? '').trim(),
                quantity: Math.max(1, Math.floor(Number(line.quantity)) || 1),
            })),
        };

        setDeletingCateringLineItem(true);
        setDeleteCateringLineItemErrorLines([]);
        try {
            const baseUrl = getBackendBaseUrl();
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/catering-packages/${encodeURIComponent(String(packageId))}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log('PUT catering-packages (remove line item)', { url, status: res.status, ok: res.ok, body: data });

            const ok =
                res.ok &&
                data &&
                typeof data === 'object' &&
                typeof data.code === 'string' &&
                data.code.trim().toUpperCase().startsWith('SUCCESS_');

            if (!ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setDeleteCateringLineItemErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to update package';
                    setDeleteCateringLineItemErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setDeleteCateringLineItemErrorLines([data.trim()]);
                } else {
                    setDeleteCateringLineItemErrorLines(['Failed to update package']);
                }
                return;
            }

            const successMsg =
                data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : 'Item removed from package';
            toast.success(successMsg);

            setDeleteCateringLineItemTarget(null);
            await fetchCateringPackages();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to update package';
            setDeleteCateringLineItemErrorLines([message]);
        } finally {
            setDeletingCateringLineItem(false);
        }
    };

    const fetchTodaysDeals = useCallback(async () => {
        if (!restaurantId) return;
        setTodaysDealsLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/todays-deals?restaurant_id=${restaurantId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log(data);
            if (!res.ok || isErrorPayload(data)) {
                setTodaysDeals([]);
                return;
            }
            const deals = Array.isArray(data?.data?.deals) ? data.data.deals : [];
            setTodaysDeals(deals);
        } catch (e) {
            console.log(e);
            setTodaysDeals([]);
        } finally {
            setTodaysDealsLoading(false);
        }
    }, [accessToken, restaurantId]);

    const fetchBestSellers = useCallback(async () => {
        if (!restaurantId) return;
        setBestSellersLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/best-sellers?restaurant_id=${restaurantId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
                setBestSellers([]);
                return;
            }
            const list =
                Array.isArray(data?.data?.best_sellers)
                    ? data.data.best_sellers
                    : Array.isArray(data?.data?.deals)
                        ? data.data.deals
                        : Array.isArray(data?.data?.items)
                            ? data.data.items
                            : [];
            setBestSellers(list);
        } catch {
            setBestSellers([]);
        } finally {
            setBestSellersLoading(false);
        }
    }, [accessToken, restaurantId]);

    useEffect(() => {
        void fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        void fetchTodaysDeals();
    }, [fetchTodaysDeals]);

    useEffect(() => {
        void fetchBestSellers();
    }, [fetchBestSellers]);

    useEffect(() => {
        if (menuType !== 'catering') return;
        void fetchCateringPackages();
    }, [menuType, fetchCateringPackages]);

    useEffect(() => {
        if (!cateringPackages.length) {
            setActiveCateringCategoryId('');
            return;
        }
        const ids = cateringPackages.map((p) => String(p.id));
        const idSet = new Set(ids);
        if (!activeCateringCategoryId || !idSet.has(activeCateringCategoryId)) {
            setActiveCateringCategoryId(ids[0]);
        }
    }, [cateringPackages, activeCateringCategoryId]);

    const handleDealSuccess = useCallback(async () => {
        await Promise.all([fetchCategories(), fetchTodaysDeals()]);
    }, [fetchCategories, fetchTodaysDeals]);

    const deleteDish = useCallback(async (dishId) => {
        const id = typeof dishId === 'string' ? dishId : typeof dishId === 'number' ? String(dishId) : '';
        if (!id) return;
        setDeletingDishIds((prev) => [...prev, id]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(id)}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) return;
            await Promise.all([fetchCategories(), fetchTodaysDeals(), fetchBestSellers()]);
        } catch {
            return;
        } finally {
            setDeletingDishIds((prev) => prev.filter((value) => value !== id));
        }
    }, [accessToken, fetchBestSellers, fetchCategories, fetchTodaysDeals]);

    const removeTodaysDeal = useCallback(async (deal) => {
        const dishId = deal?.id ? String(deal.id) : '';
        if (!dishId) return { ok: false, message: 'Invalid deal' };
        setRemovingTodaysDealIds((prev) => [...prev, dishId]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(dishId)}/todays-deal`;

            const hasVariants = !!deal?.has_variants || (Array.isArray(deal?.variants) && deal.variants.length > 0);
            const payload = hasVariants
                ? {
                    price: 0,
                    discounted_price: 0,
                    is_todays_deal: false,
                    varients: (Array.isArray(deal?.variants) ? deal.variants : []).map((variant) => ({
                        id: variant?.id,
                        name: variant?.name,
                        price: variant?.price,
                        discounted_price: 0,
                    })),
                }
                : {
                    discounted_price: 0,
                    is_todays_deal: false,
                    deal_starts_at: null,
                    deal_ends_at: null,
                };

            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
                let message = 'Failed to remove deal';
                if (data && typeof data === 'object') {
                    message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : message;
                } else if (typeof data === 'string' && data.trim()) {
                    message = data.trim();
                }
                return { ok: false, message };
            }
            await handleDealSuccess();
            return { ok: true };
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to remove deal';
            return { ok: false, message };
        } finally {
            setRemovingTodaysDealIds((prev) => prev.filter((id) => id !== dishId));
        }
    }, [accessToken, handleDealSuccess]);

    const closeDeleteTodaysDeal = useCallback(() => {
        const id = deleteTodaysDealTarget?.id ? String(deleteTodaysDealTarget.id) : '';
        if (id && removingTodaysDealIds.includes(id)) return;
        setDeleteTodaysDealTarget(null);
        setDeleteTodaysDealError('');
    }, [deleteTodaysDealTarget, removingTodaysDealIds]);

    const confirmDeleteTodaysDeal = async () => {
        if (!deleteTodaysDealTarget) return;
        setDeleteTodaysDealError('');
        const result = await removeTodaysDeal(deleteTodaysDealTarget);
        if (!result.ok) {
            setDeleteTodaysDealError(result.message || 'Failed to remove deal');
            return;
        }
        setDeleteTodaysDealTarget(null);
    };

    const handleBestSellerSuccess = useCallback(async () => {
        await Promise.all([fetchCategories(), fetchBestSellers()]);
    }, [fetchCategories, fetchBestSellers]);

    const handleCateringSuccess = useCallback(async () => {
        await fetchCategories();
    }, [fetchCategories]);

    const updateBestSeller = useCallback(async (dishId, isBestSeller) => {
        if (!dishId) return;
        setUpdatingBestSellerIds((prev) => [...prev, dishId]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(dishId)}/best-seller`;
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ is_best_seller: !!isBestSeller }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log(data);
        } catch (e) {
            console.log(e);
        } finally {
            setUpdatingBestSellerIds((prev) => prev.filter((id) => id !== dishId));
            void fetchBestSellers();
        }
    }, [accessToken, fetchBestSellers]);

    const disableCateringItem = useCallback(async (dishId) => {
        if (!dishId) return;
        setUpdatingCateringIds((prev) => [...prev, dishId]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dishes/${encodeURIComponent(dishId)}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    catering: false,
                    catering_minimum_order: 0,
                }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) return;
            await fetchCategories();
        } catch {
            return;
        } finally {
            setUpdatingCateringIds((prev) => prev.filter((id) => id !== dishId));
        }
    }, [accessToken, fetchCategories]);

    useEffect(() => {
        const handleRefresh = () => {
            void fetchCategories();
        };
        window.addEventListener('menu-item-added', handleRefresh);
        return () => {
            window.removeEventListener('menu-item-added', handleRefresh);
        };
    }, [fetchCategories]);

    useEffect(() => {
        if (!categories.length) {
            setActiveCategory('');
            return;
        }
        const stillExists = categories.some((c) => c.name === activeCategory);
        if (!activeCategory || !stillExists) setActiveCategory(categories[0].name);
    }, [activeCategory, categories]);

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

    const handleAddCategory = async ({ name, description, imageFile, existingImageUrl }) => {
        if (!restaurantId) {
            setSavingCategoryErrorLines(['Restaurant not found. Please login again.']);
            return;
        }
        if (!name?.trim()) return;
        const reusedUrl =
            typeof existingImageUrl === 'string' && existingImageUrl.trim() ? existingImageUrl.trim() : '';
        if (!imageFile && !reusedUrl) return;
        if (savingCategory) return;

        setSavingCategory(true);
        setSavingCategoryErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const imageUrl = imageFile ? await uploadImage(imageFile) : reusedUrl;
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/category`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    name: name.trim(),
                    image_url: imageUrl,
                    description: description?.trim() || '',
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setSavingCategoryErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to create category';
                    setSavingCategoryErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setSavingCategoryErrorLines([data.trim()]);
                } else {
                    setSavingCategoryErrorLines(['Failed to create category']);
                }
                return;
            }

            setIsAddCategoryModalOpen(false);
            setDuplicateCategorySource(null);
            await fetchCategories();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to create category';
            setSavingCategoryErrorLines([message]);
        } finally {
            setSavingCategory(false);
        }
    };

    const handleUpdateCategory = async ({ name, isVisible }) => {
        const cat = selectedCategory;
        if (!restaurantId) {
            setUpdatingCategoryErrorLines(['Restaurant not found. Please login again.']);
            return;
        }
        if (!cat?.id) return;
        const trimmed = typeof name === 'string' ? name.trim() : '';
        if (!trimmed) {
            setUpdatingCategoryErrorLines(['Category name is required']);
            return;
        }
        if (updatingCategory) return;

        setUpdatingCategory(true);
        setUpdatingCategoryErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/${encodeURIComponent(cat.id)}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    name: trimmed,
                    description: typeof cat.description === 'string' ? cat.description : '',
                    image_url: typeof cat.imageUrl === 'string' ? cat.imageUrl : '',
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setUpdatingCategoryErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to update category';
                    setUpdatingCategoryErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setUpdatingCategoryErrorLines([data.trim()]);
                } else {
                    setUpdatingCategoryErrorLines(['Failed to update category']);
                }
                return;
            }

            const desiredVisible = isVisible !== false;
            const wasVisible = cat.visible !== false;
            if (desiredVisible !== wasVisible) {
                const toggleUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/category/${encodeURIComponent(cat.id)}/toggle?is_active=${desiredVisible ? 'true' : 'false'}`;
                const toggleRes = await fetch(toggleUrl, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                });
                const toggleContentType = toggleRes.headers.get('content-type');
                const toggleData =
                    toggleContentType?.includes('application/json') ? await toggleRes.json() : await toggleRes.text();
                if (!toggleRes.ok || isErrorPayload(toggleData)) {
                    const lines = toValidationErrorLines(toggleData);
                    if (lines.length) {
                        setUpdatingCategoryErrorLines(['Category was updated, but visibility could not be saved.', ...lines]);
                    } else if (toggleData && typeof toggleData === 'object') {
                        const message =
                            typeof toggleData.message === 'string'
                                ? toggleData.message
                                : typeof toggleData.error === 'string'
                                    ? toggleData.error
                                    : 'Visibility update failed';
                        setUpdatingCategoryErrorLines(['Category was updated, but visibility could not be saved.', message]);
                    } else if (typeof toggleData === 'string' && toggleData.trim()) {
                        setUpdatingCategoryErrorLines([
                            'Category was updated, but visibility could not be saved.',
                            toggleData.trim(),
                        ]);
                    } else {
                        setUpdatingCategoryErrorLines(['Category was updated, but visibility could not be saved.']);
                    }
                    await fetchCategories();
                    return;
                }
            }

            setIsEditCategoryModalOpen(false);
            setSelectedCategory(null);
            await fetchCategories();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to update category';
            setUpdatingCategoryErrorLines([message]);
        } finally {
            setUpdatingCategory(false);
        }
    };

    const putMenuItem = useCallback(
        async (itemId, categoryId, payload) => {
            if (!restaurantId) {
                return { ok: false, errorLines: ['Restaurant not found. Please login again.'] };
            }
            if (!itemId) return { ok: false, errorLines: ['Missing item'] };
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/item/${encodeURIComponent(itemId)}`;

                const res = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                    body: JSON.stringify({
                        restaurant_id: restaurantId,
                        ...(categoryId ? { category_id: categoryId } : {}),
                        ...payload,
                    }),
                });

                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();
                if (!res.ok || isErrorPayload(data)) {
                    const lines = toValidationErrorLines(data);
                    if (lines.length) {
                        return { ok: false, errorLines: lines };
                    }
                    if (data && typeof data === 'object') {
                        const message =
                            typeof data.message === 'string'
                                ? data.message
                                : typeof data.error === 'string'
                                    ? data.error
                                    : 'Failed to update item';
                        return { ok: false, errorLines: [message] };
                    }
                    if (typeof data === 'string' && data.trim()) {
                        return { ok: false, errorLines: [data.trim()] };
                    }
                    return { ok: false, errorLines: ['Failed to update item'] };
                }

                return { ok: true };
            } catch (e) {
                const message = typeof e?.message === 'string' ? e.message : 'Failed to update item';
                return { ok: false, errorLines: [message] };
            }
        },
        [accessToken, restaurantId]
    );

    const handleUpdateItem = async ({ itemId, categoryId, payload }) => {
        if (!itemId) return;
        if (updatingItem) return;

        setUpdatingItem(true);
        setUpdatingItemErrorLines([]);
        try {
            const result = await putMenuItem(itemId, categoryId, payload);
            if (!result.ok) {
                setUpdatingItemErrorLines(result.errorLines);
                return;
            }

            setIsEditModalOpen(false);
            setSelectedItem(null);
            await fetchCategories();
        } finally {
            setUpdatingItem(false);
        }
    };

    const toggleMenuItemAvailability = async (item) => {
        if (!item?.id || !item.categoryId) return;
        if (togglingAvailabilityIds.includes(item.id)) return;

        setMenuListError('');
        setTogglingAvailabilityIds((prev) => [...prev, item.id]);
        try {
            const nextAvailable = !item.status;
            const result = await putMenuItem(item.id, item.categoryId, { is_available: nextAvailable });
            if (!result.ok) {
                setMenuListError(result.errorLines?.[0] || 'Failed to update availability');
                return;
            }
            await fetchCategories();
        } finally {
            setTogglingAvailabilityIds((prev) => prev.filter((id) => id !== item.id));
        }
    };

    const filteredCategories = useMemo(() => {
        const q = categorySearch.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c) => c.name.toLowerCase().includes(q));
    }, [categorySearch, categories]);

    const openedCategory = useMemo(() => {
        if (!categoryMenu?.categoryId) return null;
        return categories.find((c) => c.id === categoryMenu.categoryId) || null;
    }, [categories, categoryMenu]);

    const activeCategoryData = useMemo(() => {
        if (!activeCategory) return null;
        return categories.find((c) => c.name === activeCategory) || null;
    }, [activeCategory, categories]);

    const itemsLoading = categoriesLoading;

    const menuItems = useMemo(() => {
        if (categoriesLoading) return [];
        if (!activeCategoryData) return [];
        const dishes = Array.isArray(activeCategoryData?.dishes) ? activeCategoryData.dishes : [];
        if (!dishes.length) return [];
        const mapped = dishes
            .map((dish) => {
                const mappedDish = mapDishToMenuItem(dish);
                if (!mappedDish) return null;
                return {
                    ...mappedDish,
                    rawDish: dish,
                    categoryId: activeCategoryData.id,
                    categoryName: activeCategoryData.name,
                };
            })
            .filter(Boolean);
        return mapped;
    }, [activeCategoryData, categoriesLoading]);

    const cateringItems = useMemo(() => {
        const list = [];
        categories.forEach((category) => {
            const dishes = Array.isArray(category?.dishes) ? category.dishes : [];
            dishes.forEach((dish) => {
                if (!dish || typeof dish !== 'object') return;
                if (!dish.catering) return;
                list.push({
                    id: String(dish.id),
                    name: dish.name || '-',
                    categoryName: category.name || '-',
                    imageUrl: dish.images?.[0] ? normalizeUrl(dish.images[0]) : '',
                    minimumOrder: toFiniteNumber(dish.catering_minimum_order),
                    catering: !!dish.catering,
                    price: dish.price,
                    discounted_price: dish.discounted_price,
                    has_variants: dish.has_variants,
                    variants: Array.isArray(dish.variants) ? dish.variants : [],
                });
            });
        });
        return list;
    }, [categories]);

    const cateringCategoriesSidebarRows = useMemo(() => {
        return cateringPackages
            .map((pkg) => {
                if (!pkg || typeof pkg !== 'object') return null;
                const id = typeof pkg.id === 'string' ? pkg.id : pkg.id != null ? String(pkg.id) : '';
                if (!id) return null;
                const name = typeof pkg.name === 'string' ? pkg.name : '—';
                const itemCount = Array.isArray(pkg.items) ? pkg.items.length : 0;
                return { id, name, itemCount };
            })
            .filter(Boolean);
    }, [cateringPackages]);

    const filteredCateringCategoriesSidebar = useMemo(() => {
        const q = cateringMenuSearch.trim().toLowerCase();
        if (!q) return cateringCategoriesSidebarRows;
        return cateringCategoriesSidebarRows.filter((row) => row.name.toLowerCase().includes(q));
    }, [cateringMenuSearch, cateringCategoriesSidebarRows]);

    const selectedCateringPackage = useMemo(() => {
        if (!activeCateringCategoryId) return null;
        return cateringPackages.find((p) => String(p.id) === activeCateringCategoryId) || null;
    }, [activeCateringCategoryId, cateringPackages]);

    const selectedPackageLineItems = useMemo(() => {
        const items = selectedCateringPackage && Array.isArray(selectedCateringPackage.items) ? selectedCateringPackage.items : [];
        return items.filter((row) => row && typeof row === 'object');
    }, [selectedCateringPackage]);

    const cateringDashboardStats = useMemo(() => {
        const dash = cateringDashboard;
        if (!dash || typeof dash !== 'object') {
            return {
                revenueToday: null,
                moName: null,
                moOrders: null,
                moSales: null,
                topName: null,
                topOrders: null,
                topServes: null,
                topPrice: null,
            };
        }
        const revenueToday =
            typeof dash.revenue_today === 'number' && Number.isFinite(dash.revenue_today) ? dash.revenue_today : null;
        const mo =
            dash.most_ordered_item && typeof dash.most_ordered_item === 'object' ? dash.most_ordered_item : null;
        const moName = typeof mo?.name === 'string' && mo.name.trim() ? mo.name.trim() : null;
        const moOrders =
            typeof mo?.orders_7d === 'number' && Number.isFinite(mo.orders_7d) ? mo.orders_7d : null;
        const moSales =
            typeof mo?.sales_7d === 'number' && Number.isFinite(mo.sales_7d) ? mo.sales_7d : null;

        const tp = dash.top_package && typeof dash.top_package === 'object' ? dash.top_package : null;
        const topName = typeof tp?.name === 'string' && tp.name.trim() ? tp.name.trim() : null;
        const topOrders =
            typeof tp?.orders_7d === 'number' && Number.isFinite(tp.orders_7d) ? tp.orders_7d : null;
        let topServes = null;
        if (tp && typeof tp.serves === 'number' && Number.isFinite(tp.serves)) topServes = tp.serves;
        else if (tp && tp.serves != null) {
            const n = Number(tp.serves);
            if (Number.isFinite(n)) topServes = n;
        }
        const topPrice = tp ? toFiniteNumber(tp.price) : null;

        return {
            revenueToday,
            moName,
            moOrders,
            moSales,
            topName,
            topOrders,
            topServes,
            topPrice,
        };
    }, [cateringDashboard]);

    return (
        <div className="mx-auto min-w-0 max-w-[1600px] animate-in fade-in duration-500">
            <div className="mb-6 flex flex-col gap-4 bg-transparent sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-sans text-[14px] font-medium leading-[21px] text-[#6B7280] sm:self-center">Menu Type</span>
                    <div className="inline-flex w-fit rounded-[10px] bg-[#E8EAED] p-1">
                        <button
                            type="button"
                            onClick={() => setMenuType('regular')}
                            className={`rounded-[8px] px-4 py-2 font-sans text-[14px] font-medium transition-colors ${
                                menuType === 'regular' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-[#6B7280]'
                            }`}
                        >
                            Regular Menu
                        </button>
                        <button
                            type="button"
                            onClick={() => setMenuType('catering')}
                            className={`rounded-[8px] px-4 py-2 font-sans text-[14px] font-medium transition-colors ${
                                menuType === 'catering' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-[#6B7280]'
                            }`}
                        >
                            Catering Menu
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            setEditingCateringPackage(null);
                            setCateringDuplicateSource(null);
                            setIsCreateCateringPackageModalOpen(true);
                        }}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-primary/25 bg-white px-4 font-sans text-[14px] font-medium text-primary shadow-sm transition-colors hover:bg-[#FEF2F2]"
                    >
                        <Plus size={18} strokeWidth={2.25} />
                        Create Catering Package
                    </button>
                    {menuType === 'regular' && (
                    <button
                        type="button"
                        onClick={() => setIsAddMenuItemModalOpen(true)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 font-sans text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#C52820]"
                    >
                        <Plus size={18} strokeWidth={2.25} className="text-white" />
                        Add Menu Item
                    </button>
                    )}
                </div>
            </div>

            {menuType === 'catering' ? (
                <>
                    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
                        <div className="min-w-0 xl:col-span-4 min-h-[520px] rounded-[12px] border border-[#00000033] bg-white p-5">
                            <h2 className="text-[18px] font-bold text-[#111827] mb-4">Catering Categories</h2>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search packages..."
                                    className="w-full pl-9 pr-4 py-2 bg-[#F3F4F6] rounded-[8px] text-[14px] outline-none border border-transparent focus:border-[#DD2F26] transition-colors"
                                    value={cateringMenuSearch}
                                    onChange={(e) => setCateringMenuSearch(e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCateringPackage(null);
                                    setCateringDuplicateSource(null);
                                    setIsCreateCateringPackageModalOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 border border-[#DD2F26] text-[#DD2F26] bg-white hover:bg-[#FEF2F2] py-2.5 rounded-[8px] font-medium text-[14px] mb-6 transition-colors cursor-pointer"
                            >
                                <Plus size={18} />
                                Add Category
                            </button>
                            <div className="space-y-1 overflow-y-auto max-h-[320px] no-scrollbar pr-1">
                                {filteredCateringCategoriesSidebar.length ? (
                                    filteredCateringCategoriesSidebar.map((cat) => {
                                        const selected = activeCateringCategoryId === cat.id;
                                        return (
                                            <div
                                                key={cat.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    setActiveCateringCategoryId(cat.id);
                                                    setCateringPackageMenu(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setActiveCateringCategoryId(cat.id);
                                                        setCateringPackageMenu(null);
                                                    }
                                                }}
                                                className={`group flex items-center justify-between p-3 rounded-[8px] cursor-pointer border transition-all ${
                                                    selected
                                                        ? 'bg-[#FEF2F2] border-[#DD2F26]'
                                                        : 'bg-white border-transparent hover:bg-gray-50'
                                                }`}
                                            >
                                                <div>
                                                    <h3
                                                        className={`text-[16px] font-[400] flex items-center gap-2 ${
                                                            selected ? 'text-[#111827]' : 'text-[#374151]'
                                                        }`}
                                                    >
                                                        {cat.name}
                                                    </h3>
                                                    <p className="text-[12px] text-gray-500">
                                                        {cat.itemCount} item{cat.itemCount === 1 ? '' : 's'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        className={`p-1.5 rounded-md transition-colors ${
                                                            selected
                                                                ? 'text-[#DD2F26] hover:bg-[#FEF2F2]'
                                                                : 'text-gray-400 hover:text-[#DD2F26] hover:bg-gray-100'
                                                        }`}
                                                        aria-label="View package details"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const full = cateringPackages.find((p) => String(p.id) === String(cat.id));
                                                            if (full) setViewingCateringPackage(full);
                                                        }}
                                                    >
                                                        <Eye size={16} aria-hidden />
                                                    </button>
                                                    <div className="relative">
                                                        <MoreVertical
                                                            size={16}
                                                            className="text-gray-400 cursor-pointer hover:text-gray-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCategoryMenu(null);
                                                                const MENU_WIDTH = 128;
                                                                const PADDING = 8;
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const top = Math.round(rect.bottom + 6);
                                                                const desiredLeft = Math.round(rect.right - MENU_WIDTH);
                                                                const maxLeft = Math.max(PADDING, window.innerWidth - MENU_WIDTH - PADDING);
                                                                const left = Math.max(PADDING, Math.min(desiredLeft, maxLeft));

                                                                setCateringPackageMenu((prev) =>
                                                                    prev?.packageId === cat.id ? null : { packageId: cat.id, top, left }
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-[13px] text-gray-500 py-2">
                                        {cateringPackages.length === 0 && !cateringPackagesLoading
                                            ? 'No catering packages yet'
                                            : 'No packages match your search'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-col gap-6 xl:col-span-8">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {cateringPackagesLoading ? (
                                <>
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={`catering-dash-skel-${i}`}
                                            className="rounded-[12px] border border-[#00000033] bg-white p-4 animate-pulse"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="h-3 w-32 bg-gray-200 rounded" />
                                                <div className="h-5 w-5 shrink-0 rounded bg-gray-200" />
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                <div className="h-7 w-28 bg-gray-200 rounded" />
                                                <div className="h-3 w-36 bg-gray-200 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <div className="rounded-[12px] border border-[#00000033] bg-white p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-[600] uppercase tracking-wide text-[#9CA3AF]">
                                                Catering Revenue Today
                                            </p>
                                            <DollarSign size={20} className="text-[#DD2F26] shrink-0" aria-hidden />
                                        </div>
                                        <p className="text-[22px] font-bold text-[#111827] mt-3 tabular-nums">
                                            {formatMoney(cateringDashboardStats.revenueToday ?? 0)}
                                        </p>
                                        <p className="text-[12px] text-[#6B7280] mt-1">
                                            From completed catering orders today
                                        </p>
                                    </div>
                                    <div className="rounded-[12px] border border-[#00000033] bg-white p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-[600] uppercase tracking-wide text-[#9CA3AF]">
                                                Most Ordered Item
                                            </p>
                                            <TrendingUp size={20} className="text-[#DD2F26] shrink-0" aria-hidden />
                                        </div>
                                        <p className="text-[16px] font-[600] text-[#111827] mt-3 leading-tight">
                                            {cateringDashboardStats.moName ?? 'No data yet'}
                                        </p>
                                        <p className="text-[12px] text-[#6B7280] mt-1 tabular-nums">
                                            {cateringDashboardStats.moOrders != null
                                                ? `${cateringDashboardStats.moOrders} orders (7D)`
                                                : '—'}
                                        </p>
                                        {cateringDashboardStats.moSales != null ? (
                                            <p className="text-[12px] text-[#374151] mt-0.5 tabular-nums">
                                                Sales (7D): {formatMoney(cateringDashboardStats.moSales)}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="rounded-[12px] border border-[#00000033] bg-white p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-[600] uppercase tracking-wide text-[#9CA3AF]">
                                                Top Package
                                            </p>
                                            <Package size={20} className="text-[#DD2F26] shrink-0" aria-hidden />
                                        </div>
                                        <p className="text-[16px] font-[600] text-[#111827] mt-3 leading-tight">
                                            {cateringDashboardStats.topName ?? 'No data yet'}
                                        </p>
                                        <p className="text-[12px] text-[#6B7280] mt-1 tabular-nums">
                                            {cateringDashboardStats.topOrders != null
                                                ? `${cateringDashboardStats.topOrders} orders (7D)`
                                                : '—'}
                                        </p>
                                        {cateringDashboardStats.topName &&
                                        (cateringDashboardStats.topServes != null ||
                                            cateringDashboardStats.topPrice != null) ? (
                                            <p className="text-[12px] text-[#374151] mt-0.5">
                                                {cateringDashboardStats.topServes != null ? (
                                                    <>Serves {cateringDashboardStats.topServes}</>
                                                ) : null}
                                                {cateringDashboardStats.topServes != null &&
                                                cateringDashboardStats.topPrice != null ? (
                                                    <span className="text-[#9CA3AF]"> · </span>
                                                ) : null}
                                                {cateringDashboardStats.topPrice != null ? (
                                                    <span className="tabular-nums">
                                                        {formatMoney(cateringDashboardStats.topPrice)}
                                                    </span>
                                                ) : null}
                                            </p>
                                        ) : null}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="min-w-0 overflow-hidden rounded-[12px] border border-[#00000033] bg-white">
                            {cateringPackagesError && (
                                <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                                    {cateringPackagesError}
                                </div>
                            )}
                            <div className="border-b border-[#E5E7EB] px-5 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-[16px] font-bold text-[#111827]">Package items</h3>
                                    {selectedCateringPackage ? (
                                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-[11px] leading-tight text-[#374151] sm:text-[12px]">
                                            {typeof selectedCateringPackage.serves === 'number' &&
                                            Number.isFinite(selectedCateringPackage.serves) ? (
                                                <span className="whitespace-nowrap tabular-nums">
                                                    <span className="font-[600] text-[#6B7280]">SERVES:</span>{' '}
                                                    <span className="font-[600] text-[#111827]">
                                                        {selectedCateringPackage.serves}
                                                    </span>
                                                </span>
                                            ) : null}
                                            {toFiniteNumber(selectedCateringPackage.price) !== null ||
                                            selectedCateringPackage.price != null ? (
                                                <span className="whitespace-nowrap tabular-nums">
                                                    <span className="font-[600] text-[#6B7280]">PRICE:</span>{' '}
                                                    <span className="font-[600] text-[#111827]">
                                                        {formatMoney(
                                                            toFiniteNumber(selectedCateringPackage.price) ??
                                                                selectedCateringPackage.price
                                                        )}
                                                    </span>
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                                <table className="w-full min-w-[720px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-[#E5E7EB] text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider bg-gray-50/50">
                                            <th className="px-4 py-4 whitespace-nowrap">Item Name</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Tray size</th>
                                            {/* <th className="px-6 py-4 whitespace-nowrap">Unit price</th> */}
                                            <th className="px-4 py-4 whitespace-nowrap">Qty</th>
                                            {/* <th className="px-6 py-4 whitespace-nowrap">Line total</th> */}
                                            <th className="px-4 py-4 whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                        {cateringPackagesLoading ? (
                                            Array.from({ length: 5 }).map((_, idx) => (
                                                <tr key={`catering-line-skel-${idx}`} className="animate-pulse">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-[48px] h-[48px] rounded-[10px] bg-gray-200" />
                                                            <div className="h-4 w-40 bg-gray-200 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-4 w-24 bg-gray-200 rounded" />
                                                    </td>
                                                    {/* <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-4 w-16 bg-gray-200 rounded" />
                                                    </td> */}
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="h-4 w-8 bg-gray-200 rounded" />
                                                    </td>
                                                    {/* <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-4 w-14 bg-gray-200 rounded" />
                                                    </td> */}
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-9 w-9 bg-gray-200 rounded-md" />
                                                            <div className="h-9 w-9 bg-gray-100 rounded-md" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : !selectedCateringPackage ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-16">
                                                    <div className="w-full flex items-center justify-center">
                                                        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-gray-200 rounded-[12px] bg-gray-50 px-8 py-10 w-full max-w-[520px]">
                                                            <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                                                                <Search className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                            <div className="text-[14px] font-[600] text-[#111827]">
                                                                {cateringPackages.length === 0
                                                                    ? 'No catering packages yet'
                                                                    : 'No package selected'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : selectedPackageLineItems.length ? (
                                            selectedPackageLineItems.map((line) => {
                                                const lineId =
                                                    typeof line.id === 'string'
                                                        ? line.id
                                                        : line.id != null
                                                            ? String(line.id)
                                                            : `${line.dish_id}-${line.tray_size}`;
                                                const dishName =
                                                    typeof line.dish_name === 'string' && line.dish_name.trim()
                                                        ? line.dish_name.trim()
                                                        : '—';
                                                const tray =
                                                    typeof line.tray_size === 'string' && line.tray_size.trim()
                                                        ? line.tray_size.trim()
                                                        : '—';
                                                const qty =
                                                    typeof line.quantity === 'number' && Number.isFinite(line.quantity)
                                                        ? line.quantity
                                                        : null;
                                                const imgUrl =
                                                    typeof line.dish_image === 'string' && line.dish_image.trim()
                                                        ? normalizeUrl(line.dish_image.trim())
                                                        : '';

                                                return (
                                                    <tr key={lineId} className="hover:bg-gray-50 group transition-colors">
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-4">
                                                                {imgUrl ? (
                                                                    <img
                                                                        src={imgUrl}
                                                                        alt=""
                                                                        className="w-[48px] h-[48px] rounded-[10px] object-cover border border-gray-100"
                                                                    />
                                                                ) : (
                                                                    <div className="w-[48px] h-[48px] rounded-[10px] bg-[#F3F4F6] border border-gray-100 shrink-0" />
                                                                )}
                                                                <div>
                                                                    <p className="text-[16px] font-[400] text-[#111827]">{dishName}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-[14px] text-[#374151] whitespace-nowrap">{tray}</td>
                                                        {/* Unit price column — commented out */}
                                                        <td className="px-4 py-4 text-[14px] text-[#374151] whitespace-nowrap tabular-nums">
                                                            {qty !== null ? qty : '—'}
                                                        </td>
                                                        {/* Line total column — commented out */}
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    aria-label="Edit catering package"
                                                                    className="text-[#DD2F26] hover:text-[#DD2F26] p-2 rounded-md transition-colors cursor-pointer"
                                                                    onClick={() => {
                                                                        if (!selectedCateringPackage?.id) return;
                                                                        const pid = String(selectedCateringPackage.id);
                                                                        const pkg =
                                                                            cateringPackages.find((p) => String(p.id) === pid) ??
                                                                            selectedCateringPackage;
                                                                        setCateringDuplicateSource(null);
                                                                        setEditingCateringPackage(pkg);
                                                                        setIsCreateCateringPackageModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    aria-label="Remove line item from package"
                                                                    className="text-[#EF4444] hover:text-[#D14343] hover:bg-red-50 p-2 rounded-md transition-colors cursor-pointer"
                                                                    onClick={() => {
                                                                        if (!selectedCateringPackage?.id) return;
                                                                        const dishName =
                                                                            typeof line.dish_name === 'string' &&
                                                                            line.dish_name.trim()
                                                                                ? line.dish_name.trim()
                                                                                : 'this item';
                                                                        const packageName =
                                                                            typeof selectedCateringPackage.name === 'string'
                                                                                ? selectedCateringPackage.name
                                                                                : 'Package';
                                                                        setDeleteCateringLineItemErrorLines([]);
                                                                        setDeleteCateringLineItemTarget({
                                                                            packageId: String(selectedCateringPackage.id),
                                                                            lineKey: getCateringLineItemKey(line),
                                                                            dishName,
                                                                            packageName,
                                                                        });
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-16">
                                                    <div className="w-full flex items-center justify-center">
                                                        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-gray-200 rounded-[12px] bg-gray-50 px-8 py-10 w-full max-w-[520px]">
                                                            <div className="text-[14px] font-[600] text-[#111827]">No line items in this package</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
            <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
                {/* Left Sidebar: Categories */}
                <div className="min-w-0 xl:col-span-4 h-[475px] rounded-[12px] border border-[#00000033] bg-white p-5">
                    <h2 className="text-[18px] font-bold text-[#111827] mb-4">Categories</h2>

                    {/* Search */}
                    <div className="relative mb-4 ">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-9 pr-4 py-2 bg-[#F3F4F6] rounded-[8px] text-[14px] outline-none border border-transparent focus:border-[#DD2F26] transition-colors"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                        />
                    </div>

                    {/* Add Category Button */}
                    <button
                        onClick={() => {
                            setSavingCategoryErrorLines([]);
                            setDuplicateCategorySource(null);
                            setIsAddCategoryModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 border border-[#DD2F26] text-[#DD2F26] bg-white hover:bg-[#FEF2F2] py-2.5 rounded-[8px] font-medium text-[14px] mb-6 transition-colors cursor-pointer"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>

                    {/* Categories List */}
                    <div className="space-y-1 overflow-y-auto max-h-[250px] no-scrollbar">
                        {categoriesLoading ? (
                            <div className="space-y-2 animate-pulse py-1">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={`cat-skel-${idx}`} className="flex items-center justify-between p-3 rounded-[8px] border border-transparent bg-white">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 shrink-0 rounded-[8px] bg-gray-200" />
                                            <div className="space-y-2 min-w-0 flex-1">
                                                <div className="h-4 w-36 bg-gray-200 rounded" />
                                                <div className="h-3 w-20 bg-gray-100 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-4 w-4 bg-gray-200 rounded shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ) : categoriesErrorLines.length ? (
                            <div className="text-[13px] text-red-600 space-y-1 py-2">
                                {categoriesErrorLines.map((line, idx) => (
                                    <div key={`${line}-${idx}`}>{line}</div>
                                ))}
                            </div>
                        ) : filteredCategories.length ? (
                            filteredCategories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.name);
                                    setCategoryMenu(null);
                                }}
                                className={`group flex items-center justify-between p-3 rounded-[8px] cursor-pointer border transition-all
                                ${activeCategory === cat.name
                                        ? 'bg-[#FEF2F2] border-[#DD2F26]'
                                        : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    {typeof cat.imageUrl === 'string' && cat.imageUrl.trim() ? (
                                        <img
                                            src={cat.imageUrl}
                                            alt=""
                                            className="w-10 h-10 shrink-0 rounded-[8px] object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 shrink-0 rounded-[8px] bg-[#F3F4F6] border border-gray-100" aria-hidden />
                                    )}
                                    <div className="min-w-0">
                                        <h3
                                            className={`text-[16px] font-[400] flex items-center gap-2 ${
                                                activeCategory === cat.name ? 'text-[#111827]' : 'text-[#374151]'
                                            }`}
                                        >
                                            {cat.name}
                                        </h3>
                                        <p className="text-[12px] text-gray-500">{cat.count} items</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 relative shrink-0">
                                    {/* <Eye size={16} className={`cursor-pointer ${cat.visible ? 'text-[#DD2F26]' : 'text-gray-300'}`} /> */}
                                    <div className="relative">
                                        <MoreVertical
                                            size={16}
                                            className="text-gray-400 cursor-pointer hover:text-gray-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const MENU_WIDTH = 128;
                                                const PADDING = 8;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const top = Math.round(rect.bottom + 6);
                                                const desiredLeft = Math.round(rect.right - MENU_WIDTH);
                                                const maxLeft = Math.max(PADDING, window.innerWidth - MENU_WIDTH - PADDING);
                                                const left = Math.max(PADDING, Math.min(desiredLeft, maxLeft));

                                                setCategoryMenu((prev) => (prev?.categoryId === cat.id ? null : { categoryId: cat.id, top, left }));
                                                setCateringPackageMenu(null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="text-[13px] text-gray-500 py-2">No categories found</div>
                        )}
                    </div>
                </div>

                {/* Right Side Column (Table) */}
                <div className="flex min-w-0 flex-col gap-6 xl:col-span-8">
                    <div className="min-w-0 overflow-hidden rounded-[12px] border border-[#00000033] bg-white">
                        {!!menuListError && (
                            <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                                {menuListError}
                            </div>
                        )}
                        <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                            <table className="w-full min-w-[920px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-[#E5E7EB] text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider bg-gray-50/50">
                                        <th className="px-4 py-4 whitespace-nowrap">Item Name</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Prep Time</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Price</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Orders (7d)</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB]">
                                    {itemsLoading ? (
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <tr key={`item-skel-${idx}`} className="animate-pulse">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-[48px] h-[48px] rounded-[10px] bg-gray-200" />
                                                        <div className="space-y-2">
                                                            <div className="h-4 w-40 bg-gray-200 rounded" />
                                                            <div className="h-3 w-24 bg-gray-100 rounded" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 w-16 bg-gray-200 rounded" />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 w-14 bg-gray-200 rounded" />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-10 bg-gray-200 rounded" />
                                                        <div className="h-3 w-16 bg-gray-100 rounded" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="h-[23px] w-[44px] bg-gray-200 rounded-full" />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-9 w-9 bg-gray-200 rounded-md" />
                                                        <div className="h-9 w-9 bg-gray-100 rounded-md" />
                                                        <div className="h-9 w-9 bg-gray-100 rounded-md" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : menuItems.length ? (
                                        menuItems.map((item) => {
                                            const isDeleting = deletingDishIds.includes(item.id);
                                            const isTogglingAvailability = togglingAvailabilityIds.includes(item.id);
                                            return (
                                            <tr key={item.id} className="hover:bg-gray-50 group transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <img src={item.image} alt={item.name} className="w-[48px] h-[48px] rounded-[10px] object-cover border border-gray-100" />
                                                        <div>
                                                            <p className="text-[16px] font-[400] text-[#111827]">{item.name}</p>
                                                            <p className="text-[12px] text-[#6B7280]">{item.sales}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[14px] text-[#374151] whitespace-nowrap">{item.prepTime}</td>
                                                <td className="px-6 py-4 text-[14px] font-[500] text-[#111827] whitespace-nowrap">
                                                    {item.hasVariants && item.minVariantPrice ? (
                                                        item.minVariantHasDiscount && item.minVariantOriginalPrice ? (
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="line-through text-[#9CA3AF] font-[400]">{item.minVariantOriginalPrice}</span>
                                                                <span className="text-[#DD2F26] font-[600]">{item.minVariantDiscountedPrice}</span>
                                                            </div>
                                                        ) : (
                                                            item.minVariantPrice
                                                        )
                                                    ) : item.hasDiscount && item.discountedPrice ? (
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="line-through text-[#9CA3AF] font-[400]">{item.price}</span>
                                                            <span className="text-[#DD2F26] font-[600]">{item.discountedPrice}</span>
                                                        </div>
                                                    ) : (
                                                        item.price
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-[500] text-[#111827]">{item.orders.current}</span>
                                                        <span className="text-[11px] text-[#9CA3AF]">{item.orders.total}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        aria-label={item.status ? 'Mark unavailable' : 'Mark available'}
                                                        onClick={() => {
                                                            if (isTogglingAvailability) return;
                                                            void toggleMenuItemAvailability(item);
                                                        }}
                                                        disabled={isTogglingAvailability}
                                                        className={`w-[44px] h-[23px] rounded-full p-1 transition-colors ${item.status ? 'bg-[#DD2F26]' : 'bg-gray-300'} ${isTogglingAvailability ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <div className={`w-[16px] h-[15px] bg-white rounded-full shadow-sm transform transition-transform ${item.status ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const rawDish = item?.rawDish && typeof item.rawDish === 'object' ? item.rawDish : null;
                                                                if (!rawDish) return;
                                                                handleEditClick({
                                                                    ...rawDish,
                                                                    categoryId: item.categoryId,
                                                                    categoryName: item.categoryName,
                                                                });
                                                            }}
                                                            className="text-[#DD2F26] hover:text-[#DD2F26] p-2 rounded-md transition-colors cursor-pointer"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (isDeleting) return;
                                                                void deleteDish(item.id);
                                                            }}
                                                            disabled={isDeleting}
                                                            className={`text-[#EF4444] hover:text-[#D14343] hover:bg-red-50 p-2 rounded-md transition-colors ${isDeleting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16">
                                                <div className="w-full flex items-center justify-center">
                                                    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-gray-200 rounded-[12px] bg-gray-50 px-8 py-10 w-full max-w-[520px]">
                                                        <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                                                            <Search className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                        <div className="text-[14px] font-[600] text-[#111827]">No Item Found</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 min-w-0 rounded-[12px] border border-[#00000033] bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-[800] text-[#111827]">Today’s Deal</h3>
                    <button
                        onClick={() => setIsAddTodaysDealModalOpen(true)}
                        className="h-[38px] px-4 bg-[#DD2F26] text-white rounded-[10px] text-[13px] font-[600] hover:bg-[#C52820] transition-colors"
                    >
                        + Add Today’s Deal
                    </button>
                </div>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                    <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                        <table className="w-full min-w-[920px] border-collapse text-left">
                        <thead className="bg-[#F9FAFB]">
                            <tr>
                                <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Item</th>
                                <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Category</th>
                                <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Price</th>
                                <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Discounted Price</th>
                                <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Deal Starts</th>
                                <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Deal Ends</th>
                                <th className="px-6 py-3 text-[12px] font-[600] text-[#6B7280] uppercase w-[120px]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaysDealsLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
                                        Loading deals...
                                    </td>
                                </tr>
                            ) : todaysDeals.length ? (
                                todaysDeals.map((deal) => {
                                    const categoryName = categories.find((category) => category.id === deal.category_id)?.name || '-';
                                    const pricing = getPricingDisplay(deal);
                                    const isRemoving = removingTodaysDealIds.includes(String(deal.id));
                                    return (
                                    <tr key={deal.id} className="border-t border-[#E5E7EB]">
                                        <td className="px-4 py-4 text-[14px] text-[#111827]">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={deal.images?.[0] ? normalizeUrl(deal.images[0]) : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80'}
                                                    alt={deal.name}
                                                    className="w-[40px] h-[40px] rounded-[10px] object-cover border border-gray-100"
                                                />
                                                <span>{deal.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[14px] text-[#111827]">
                                            {categoryName}
                                        </td>
                                        <td
                                            className={`px-4 py-4 text-[14px] ${pricing.hasDiscount ? 'line-through text-[#9CA3AF]' : 'text-[#111827]'}`}
                                        >
                                            {pricing.price}
                                        </td>
                                        <td className="px-4 py-4 text-[14px] font-[600] text-[#DD2F26]">
                                            {pricing.hasDiscount && pricing.discounted ? pricing.discounted : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-[13px] text-[#6B7280]">{formatDateTime(deal.deal_starts_at)}</td>
                                        <td className="px-4 py-4 text-[13px] text-[#6B7280]">{formatDateTime(deal.deal_ends_at)}</td>
                                        <td className="px-6 py-4 w-[120px]">
                                            <button
                                                type="button"
                                                onClick={() => setEditingTodaysDeal(deal)}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-[#DD2F26] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeleteTodaysDealError('');
                                                    setDeleteTodaysDealTarget(deal);
                                                }}
                                                disabled={isRemoving}
                                                className={`inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer ${isRemoving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
                                        No deals found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-6 min-w-0 rounded-[12px] border border-[#00000033] bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-[800] text-[#111827]">Top Seller</h3>
                    <button
                        onClick={() => setIsAddTopSellerModalOpen(true)}
                        className="h-[38px] px-4 bg-[#DD2F26] text-white rounded-[10px] text-[13px] font-[600] hover:bg-[#C52820] transition-colors"
                    >
                        + Add Top Seller
                    </button>
                </div>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                    <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                        <table className="w-full min-w-[720px] border-collapse text-left">
                            <thead className="bg-[#F9FAFB]">
                                <tr>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Item</th>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Category</th>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Price</th>
                                    <th className="px-6 py-3 text-[12px] font-[600] text-[#6B7280] uppercase w-[140px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bestSellersLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
                                            Loading top sellers...
                                        </td>
                                    </tr>
                                ) : bestSellers.length ? (
                                    bestSellers.map((item) => {
                                        const imageUrl = item.images?.[0] ? normalizeUrl(item.images[0]) : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80';
                                        const categoryName = categories.find((category) => category.id === item.category_id)?.name || '-';
                                        const pricing = getPricingDisplay(item);
                                        const isUpdating = updatingBestSellerIds.includes(item.id);
                                        return (
                                            <tr key={item.id} className="border-t border-[#E5E7EB]">
                                                <td className="px-4 py-4 text-[14px] text-[#111827]">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.name}
                                                            className="w-[40px] h-[40px] rounded-[10px] object-cover border border-gray-100"
                                                        />
                                                        <span>{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-[14px] text-[#111827]">{categoryName}</td>
                                                <td className="px-4 py-4 text-[14px] font-[500] text-[#111827] whitespace-nowrap">
                                                    {pricing.hasDiscount && pricing.discounted ? (
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="line-through text-[#9CA3AF] font-[400]">{pricing.price}</span>
                                                            <span className="text-[#DD2F26] font-[600]">{pricing.discounted}</span>
                                                        </div>
                                                    ) : (
                                                        pricing.price
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 w-[140px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateBestSeller(item.id, false)}
                                                        disabled={isUpdating}
                                                        className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${item.is_best_seller === false ? 'bg-gray-300' : 'bg-[#DD2F26]'} ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${item.is_best_seller === false ? 'translate-x-0' : 'translate-x-[20px]'}`} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
                                            No top sellers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-6 min-w-0 rounded-[12px] border border-[#00000033] bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-[800] text-[#111827]">Catering Items</h3>
                    <button
                        onClick={() => setIsAddCateringItemModalOpen(true)}
                        className="h-[38px] px-4 bg-[#DD2F26] text-white rounded-[10px] text-[13px] font-[600] hover:bg-[#C52820] transition-colors"
                    >
                        + Add Catering Item
                    </button>
                </div>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                    <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                        <table className="w-full min-w-[880px] border-collapse text-left">
                            <thead className="bg-[#F9FAFB]">
                                <tr>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Item</th>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Category</th>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Price</th>
                                    <th className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase">Minimum Order</th>
                                    <th className="px-6 py-3 text-[12px] font-[600] text-[#6B7280] uppercase w-[140px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoriesLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
                                            Loading catering items...
                                        </td>
                                    </tr>
                                ) : cateringItems.length ? (
                                    cateringItems.map((item) => {
                                        const isUpdating = updatingCateringIds.includes(item.id);
                                        const pricing = getPricingDisplay(item);
                                        return (
                                        <tr key={item.id} className="border-t border-[#E5E7EB]">
                                            <td className="px-4 py-4 text-[14px] text-[#111827]">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={item.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80'}
                                                        alt={item.name}
                                                        className="w-[40px] h-[40px] rounded-[10px] object-cover border border-gray-100"
                                                    />
                                                    <span>{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-[14px] text-[#111827]">{item.categoryName}</td>
                                            <td className="px-4 py-4 text-[14px] font-[500] text-[#111827] whitespace-nowrap">
                                                {pricing.hasDiscount && pricing.discounted ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="line-through text-[#9CA3AF] font-[400]">{pricing.price}</span>
                                                        <span className="text-[#DD2F26] font-[600]">{pricing.discounted}</span>
                                                    </div>
                                                ) : (
                                                    pricing.price
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-[14px] text-[#111827]">
                                                {typeof item.minimumOrder === 'number' ? item.minimumOrder : '-'}
                                            </td>
                                            <td className="px-6 py-4 w-[140px]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!item.catering) return;
                                                        if (isUpdating) return;
                                                        void disableCateringItem(item.id);
                                                    }}
                                                    disabled={!item.catering || isUpdating}
                                                    className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${item.catering ? 'bg-[#DD2F26]' : 'bg-gray-300'} ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${item.catering ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-[13px] text-[#6B7280]">
                                            No catering items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
                </>
            )}

            {/* Quick Analytics */}
            {/* <div className="bg-white rounded-[12px] border border-[#00000033] p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-[#DD2F26] w-5 h-5" />
                    <h3 className="text-[16px] font-[800] text-[#111827]">Quick Analytics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-[#00000033] rounded-[12px] h-[104px] p-4 flex gap-4 hover:shadow-sm transition-shadow">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80" className="w-[60px] h-[60px] rounded-[10px] object-cover" alt="Best Seller" />
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-orange-400 text-[12px]">✨</span>
                                <span className="text-[10px] font-[400] font-poppins text-[#9CA3AF] uppercase">Best Seller Today</span>
                            </div>
                            <h4 className="text-[16px] text-[#111827]">Zinger Burger</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[12px] text-[#6B7280]">324 orders today</span>
                                <span className="text-[12px] text-[#6B7280]">18.2% contribution</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#00000033] rounded-[12px] p-4 h-[104px] flex gap-4 hover:shadow-sm transition-shadow">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80" className="w-[60px] h-[60px] rounded-[10px] object-cover" alt="Best Seller" />
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <TrendingUp className="text-[#DD2F26] w-3 h-3" />
                                <span className="text-[10px] font-[400] font-poppins text-[#9CA3AF] uppercase">Rising Star</span>
                            </div>
                            <h4 className="text-[16px]  text-[#111827]">Loaded Fries</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[12px] text-[#6B7280]">98 orders today</span>
                                <span className="text-[12px] text-[#6B7280]">12.5% contribution</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#00000033] rounded-[12px] h-[104px] p-4 flex gap-4 hover:shadow-sm transition-shadow">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80" className="w-[60px] h-[60px] rounded-[10px] object-cover" alt="Best Seller" />
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <TrendingUp className="text-[#DD2F26] w-3 h-3" />
                                <span className="text-[10px] font-[400] font-poppins text-[#9CA3AF] uppercase">Rising Star</span>
                            </div>
                            <h4 className="text-[16px]  text-[#111827]">Fries Combo</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[12px] text-[#6B7280]">198 orders today</span>
                                <span className="text-[12px] text-[#6B7280]">10.5% contribution</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* <div className="mt-6">
                <div className="bg-white rounded-[12px] border border-[#00000033] p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mb-4">
                        <Eye size={32} className="text-[#DD2F26]" />
                    </div>
                    <h3 className="text-[16px] font-[800] text-[#111827] mb-2">Live Preview</h3>
                    <p className="text-center text-[11px] text-[#6B7280] mb-6">See how your menu looks for your customers on the mobile app and web.</p>
                    <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="w-full bg-[#DD2F26] text-white text-[14px] font-[500] py-3.5 rounded-[12px] shadow-sm hover:bg-[#C52820] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Eye size={18} />
                        Preview Menu
                    </button>
                </div>
            </div> */}

            {/* Modals */}
            <AddMenuItemModal isOpen={isAddMenuItemModalOpen} onClose={() => setIsAddMenuItemModalOpen(false)} />
            <EditMenuItemModal
                key={`${selectedItem?.id || 'none'}-${isEditModalOpen ? 'open' : 'closed'}`}
                isOpen={isEditModalOpen}
                onClose={() => {
                    if (updatingItem) return;
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                    setUpdatingItemErrorLines([]);
                }}
                categories={categories}
                item={selectedItem}
                onSave={handleUpdateItem}
                saving={updatingItem}
                errorLines={updatingItemErrorLines}
            />
            <MenuPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
            />
            <AddTodaysDealModal
                isOpen={isAddTodaysDealModalOpen}
                onClose={() => setIsAddTodaysDealModalOpen(false)}
                categories={categories}
                accessToken={accessToken}
                onSuccess={handleDealSuccess}
            />
            <EditTodaysDealModal
                isOpen={!!editingTodaysDeal}
                onClose={() => setEditingTodaysDeal(null)}
                deal={editingTodaysDeal}
                categories={categories}
                accessToken={accessToken}
                onSuccess={handleDealSuccess}
            />
            <AddTopSellerModal
                isOpen={isAddTopSellerModalOpen}
                onClose={() => setIsAddTopSellerModalOpen(false)}
                categories={categories}
                accessToken={accessToken}
                onSuccess={handleBestSellerSuccess}
            />
            <AddCateringItemModal
                isOpen={isAddCateringItemModalOpen}
                onClose={() => setIsAddCateringItemModalOpen(false)}
                categories={categories}
                accessToken={accessToken}
                onSuccess={handleCateringSuccess}
            />
            <CreateCateringPackageModal
                isOpen={isCreateCateringPackageModalOpen}
                onClose={() => {
                    setIsCreateCateringPackageModalOpen(false);
                    setEditingCateringPackage(null);
                    setCateringDuplicateSource(null);
                }}
                categories={categories}
                accessToken={accessToken}
                onSuccess={fetchCateringPackages}
                editingPackage={editingCateringPackage}
                duplicateSource={cateringDuplicateSource}
            />
            {viewingCateringPackage ? (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
                    onMouseDown={() => setViewingCateringPackage(null)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-[640px] max-h-[85vh] shadow-xl overflow-hidden flex flex-col"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-[18px] font-bold text-[#111827] truncate">
                                    {typeof viewingCateringPackage.name === 'string' && viewingCateringPackage.name.trim()
                                        ? viewingCateringPackage.name.trim()
                                        : 'Catering package'}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[13px] text-[#374151]">
                                    <span className="tabular-nums">
                                        <span className="font-[600] text-[#6B7280]">SERVES:</span>{' '}
                                        {parseCateringPackageServes(viewingCateringPackage)}
                                    </span>
                                    <span className="text-[#E5E7EB]">|</span>
                                    <span className="tabular-nums">
                                        <span className="font-[600] text-[#6B7280]">PRICE:</span>{' '}
                                        {formatMoney(
                                            toFiniteNumber(viewingCateringPackage.price) ?? viewingCateringPackage.price
                                        )}
                                    </span>
                                    {typeof viewingCateringPackage.items_count === 'number' &&
                                    Number.isFinite(viewingCateringPackage.items_count) ? (
                                        <>
                                            <span className="text-[#E5E7EB]">|</span>
                                            <span className="tabular-nums">
                                                <span className="font-[600] text-[#6B7280]">ITEMS:</span>{' '}
                                                {viewingCateringPackage.items_count}
                                            </span>
                                        </>
                                    ) : null}
                                </div>
                                {(typeof viewingCateringPackage.created_at === 'string' ||
                                    typeof viewingCateringPackage.updated_at === 'string') && (
                                    <p className="text-[11px] text-[#9CA3AF] mt-2">
                                        {typeof viewingCateringPackage.created_at === 'string' ? (
                                            <>Created {formatDateTime(viewingCateringPackage.created_at)}</>
                                        ) : null}
                                        {typeof viewingCateringPackage.created_at === 'string' &&
                                        typeof viewingCateringPackage.updated_at === 'string'
                                            ? ' · '
                                            : ''}
                                        {typeof viewingCateringPackage.updated_at === 'string' ? (
                                            <>Updated {formatDateTime(viewingCateringPackage.updated_at)}</>
                                        ) : null}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingCateringPackage(null)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
                            <h3 className="text-[14px] font-bold text-[#111827] mb-3">Package items</h3>
                            {(() => {
                                const rows = (Array.isArray(viewingCateringPackage.items)
                                    ? viewingCateringPackage.items
                                    : []
                                ).filter((row) => row && typeof row === 'object');
                                if (!rows.length) {
                                    return (
                                        <p className="text-[13px] text-[#6B7280] py-6 text-center border border-dashed border-gray-200 rounded-[12px] bg-gray-50">
                                            No items in this package.
                                        </p>
                                    );
                                }
                                return (
                                    <div className="max-w-full overflow-x-auto rounded-[10px] border border-[#E5E7EB]">
                                        <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
                                            <thead>
                                                <tr className="border-b border-[#E5E7EB] text-[11px] font-[600] text-[#6B7280] uppercase tracking-wide bg-gray-50/80">
                                                    <th className="px-3 py-3">Item</th>
                                                    <th className="px-3 py-3 whitespace-nowrap">Tray size</th>
                                                    <th className="px-3 py-3 whitespace-nowrap">Qty</th>
                                                    <th className="px-3 py-3 whitespace-nowrap text-right">Line total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E5E7EB]">
                                                {rows.map((line, idx) => {
                                                    const lineKey =
                                                        typeof line.id === 'string'
                                                            ? line.id
                                                            : line.id != null
                                                                ? String(line.id)
                                                                : `row-${idx}`;
                                                    const dishName =
                                                        typeof line.dish_name === 'string' && line.dish_name.trim()
                                                            ? line.dish_name.trim()
                                                            : '—';
                                                    const tray =
                                                        typeof line.tray_size === 'string' && line.tray_size.trim()
                                                            ? line.tray_size.trim()
                                                            : '—';
                                                    const qty =
                                                        typeof line.quantity === 'number' && Number.isFinite(line.quantity)
                                                            ? line.quantity
                                                            : '—';
                                                    const imgUrl =
                                                        typeof line.dish_image === 'string' && line.dish_image.trim()
                                                            ? normalizeUrl(line.dish_image.trim())
                                                            : '';
                                                    const lineTotal =
                                                        typeof line.line_total === 'number' && Number.isFinite(line.line_total)
                                                            ? formatMoney(line.line_total)
                                                            : '—';
                                                    const unitHint =
                                                        (typeof line.dish_discounted_price === 'number' &&
                                                            Number.isFinite(line.dish_discounted_price) &&
                                                            line.dish_discounted_price > 0) ||
                                                        (typeof line.dish_price === 'number' &&
                                                            Number.isFinite(line.dish_price))
                                                            ? formatMoney(
                                                                  typeof line.dish_discounted_price === 'number' &&
                                                                      Number.isFinite(line.dish_discounted_price) &&
                                                                      line.dish_discounted_price > 0
                                                                      ? line.dish_discounted_price
                                                                      : line.dish_price
                                                              )
                                                            : null;
                                                    return (
                                                        <tr key={lineKey}>
                                                            <td className="px-3 py-3 align-middle">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    {imgUrl ? (
                                                                        <img
                                                                            src={imgUrl}
                                                                            alt=""
                                                                            className="w-10 h-10 rounded-[8px] object-cover border border-gray-100 shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-[8px] bg-[#F3F4F6] border border-gray-100 shrink-0" />
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <p className="font-[500] text-[#111827] truncate">{dishName}</p>
                                                                        {unitHint ? (
                                                                            <p className="text-[11px] text-[#6B7280] mt-0.5 tabular-nums">
                                                                                Unit {unitHint}
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-[#374151] whitespace-nowrap align-middle">
                                                                {tray}
                                                            </td>
                                                            <td className="px-3 py-3 tabular-nums text-[#374151] align-middle">{qty}</td>
                                                            <td className="px-3 py-3 text-right tabular-nums text-[#111827] align-middle">
                                                                {lineTotal}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0 bg-white">
                            <button
                                type="button"
                                onClick={() => setViewingCateringPackage(null)}
                                className="px-5 py-2.5 rounded-[8px] text-[14px] font-medium bg-[#DD2F26] text-white hover:bg-[#C52820] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            {isAddCategoryModalOpen && (
                <AddCategoryModal
                    isOpen={true}
                    duplicateSource={duplicateCategorySource}
                    onClose={() => {
                        setIsAddCategoryModalOpen(false);
                        setSavingCategoryErrorLines([]);
                        setDuplicateCategorySource(null);
                    }}
                    onSave={handleAddCategory}
                    saving={savingCategory}
                    errorLines={savingCategoryErrorLines}
                />
            )}
            <EditCategoryModal
                isOpen={isEditCategoryModalOpen}
                onClose={() => {
                    if (updatingCategory) return;
                    setIsEditCategoryModalOpen(false);
                    setSelectedCategory(null);
                    setUpdatingCategoryErrorLines([]);
                }}
                category={selectedCategory}
                onSave={handleUpdateCategory}
                saving={updatingCategory}
                errorLines={updatingCategoryErrorLines}
            />
            {categoryMenu && openedCategory && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999]"
                    onMouseDown={() => setCategoryMenu(null)}
                >
                    <div
                        className="fixed w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1"
                        style={{ top: `${categoryMenu.top}px`, left: `${categoryMenu.left}px` }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => openEditCategory(openedCategory)}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Edit2 size={14} /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!openedCategory) return;
                                setDuplicateCategorySource(openedCategory);
                                setCategoryMenu(null);
                                setIsAddCategoryModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Copy size={14} /> Duplicate
                        </button>
                        <button
                            type="button"
                            onClick={() => openDeleteCategory(openedCategory)}
                            className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>,
                document.body
            )}
            {cateringPackageMenu && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999]"
                    onMouseDown={() => setCateringPackageMenu(null)}
                >
                    <div
                        className="fixed w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1"
                        style={{ top: `${cateringPackageMenu.top}px`, left: `${cateringPackageMenu.left}px` }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const pid = cateringPackageMenu?.packageId;
                                if (!pid) return;
                                const pkg = cateringPackages.find((p) => String(p.id) === pid);
                                if (!pkg) return;
                                setCateringDuplicateSource(null);
                                setEditingCateringPackage(pkg);
                                setCateringPackageMenu(null);
                                setIsCreateCateringPackageModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Edit2 size={14} /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const pid = cateringPackageMenu?.packageId;
                                if (!pid) return;
                                const pkg = cateringPackages.find((p) => String(p.id) === pid);
                                if (!pkg) return;
                                setEditingCateringPackage(null);
                                setCateringDuplicateSource(pkg);
                                setCateringPackageMenu(null);
                                setIsCreateCateringPackageModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Copy size={14} /> Duplicate
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const pid = cateringPackageMenu?.packageId;
                                if (!pid) return;
                                const pkg = cateringPackages.find((p) => String(p.id) === pid);
                                setDeleteCateringPackageErrorLines([]);
                                setDeleteCateringPackageTarget({
                                    id: pid,
                                    name: typeof pkg?.name === 'string' ? pkg.name : 'this package',
                                });
                                setCateringPackageMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>,
                document.body
            )}
            {deleteTodaysDealTarget && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
                    onMouseDown={closeDeleteTodaysDeal}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-[460px] shadow-xl overflow-hidden"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-[18px] font-bold text-[#111827]">Remove Today’s Deal</h2>
                            <button
                                type="button"
                                onClick={closeDeleteTodaysDeal}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                disabled={removingTodaysDealIds.includes(String(deleteTodaysDealTarget.id))}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 bg-white">
                            {!!deleteTodaysDealError && (
                                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                                    {deleteTodaysDealError}
                                </div>
                            )}

                            <div className="text-[14px] text-[#374151]">
                                Remove today’s deal from{' '}
                                <span className="font-medium text-[#111827]">{deleteTodaysDealTarget.name || 'this item'}</span>
                                ? Discount will be cleared and the item will no longer show as a deal.
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteTodaysDeal}
                                className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                                disabled={removingTodaysDealIds.includes(String(deleteTodaysDealTarget.id))}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDeleteTodaysDeal()}
                                className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white transition-colors ${
                                    removingTodaysDealIds.includes(String(deleteTodaysDealTarget.id))
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-[#EF4444] hover:bg-[#D14343]'
                                }`}
                                disabled={removingTodaysDealIds.includes(String(deleteTodaysDealTarget.id))}
                            >
                                {removingTodaysDealIds.includes(String(deleteTodaysDealTarget.id)) ? 'Removing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deleteCategoryTarget && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
                    onMouseDown={closeDeleteCategory}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-[460px] shadow-xl overflow-hidden"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-[18px] font-bold text-[#111827]">Delete Category</h2>
                            <button
                                onClick={closeDeleteCategory}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                disabled={deletingCategory}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 bg-white">
                            {!!deleteCategoryErrorLines.length && (
                                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 space-y-1">
                                    {deleteCategoryErrorLines.map((line, idx) => (
                                        <div key={`${line}-${idx}`}>{line}</div>
                                    ))}
                                </div>
                            )}

                            <div className="text-[14px] text-[#374151]">
                                Are you sure you want to delete <span className="font-medium text-[#111827]">{deleteCategoryTarget.name}</span>?
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
                            <button
                                onClick={closeDeleteCategory}
                                className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                                disabled={deletingCategory}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteCategory}
                                className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white transition-colors ${deletingCategory ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#EF4444] hover:bg-[#D14343]'}`}
                                disabled={deletingCategory}
                            >
                                {deletingCategory ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deleteCateringPackageTarget && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
                    onMouseDown={closeDeleteCateringPackage}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-[460px] shadow-xl overflow-hidden"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-[18px] font-bold text-[#111827]">Delete Catering Package</h2>
                            <button
                                type="button"
                                onClick={closeDeleteCateringPackage}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                disabled={deletingCateringPackage}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 bg-white">
                            {!!deleteCateringPackageErrorLines.length && (
                                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 space-y-1">
                                    {deleteCateringPackageErrorLines.map((line, idx) => (
                                        <div key={`${line}-${idx}`}>{line}</div>
                                    ))}
                                </div>
                            )}

                            <div className="text-[14px] text-[#374151]">
                                Are you sure you want to delete{' '}
                                <span className="font-medium text-[#111827]">{deleteCateringPackageTarget.name}</span>?
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteCateringPackage}
                                className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                                disabled={deletingCateringPackage}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDeleteCateringPackage()}
                                className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white transition-colors ${deletingCateringPackage ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#EF4444] hover:bg-[#D14343]'}`}
                                disabled={deletingCateringPackage}
                            >
                                {deletingCateringPackage ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deleteCateringLineItemTarget && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
                    onMouseDown={closeDeleteCateringLineItem}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-[460px] shadow-xl overflow-hidden"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-[18px] font-bold text-[#111827]">Remove package item</h2>
                            <button
                                type="button"
                                onClick={closeDeleteCateringLineItem}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                disabled={deletingCateringLineItem}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 bg-white">
                            {!!deleteCateringLineItemErrorLines.length && (
                                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 space-y-1">
                                    {deleteCateringLineItemErrorLines.map((line, idx) => (
                                        <div key={`${line}-${idx}`}>{line}</div>
                                    ))}
                                </div>
                            )}

                            <div className="text-[14px] text-[#374151]">
                                Remove{' '}
                                <span className="font-medium text-[#111827]">{deleteCateringLineItemTarget.dishName}</span>{' '}
                                from{' '}
                                <span className="font-medium text-[#111827]">{deleteCateringLineItemTarget.packageName}</span>
                                ? The package will be saved without this item.
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteCateringLineItem}
                                className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                                disabled={deletingCateringLineItem}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDeleteCateringLineItem()}
                                className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white transition-colors ${deletingCateringLineItem ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#EF4444] hover:bg-[#D14343]'}`}
                                disabled={deletingCateringLineItem}
                            >
                                {deletingCateringLineItem ? 'Saving…' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
