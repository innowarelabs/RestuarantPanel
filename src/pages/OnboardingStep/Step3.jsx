import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Edit2, Image, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Toggle from './Toggle';

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
    if (data.data === null && typeof data.message === 'string' && data.message.trim()) return true;
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
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.categories)) return data.data.categories;
    if (Array.isArray(data.categories)) return data.categories;
    return [];
};

const asCategoryIdString = (value) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
};

/** POST /step3/category success — id may be at root or under `data`. */
const extractCreatedCategoryIdFromResponse = (payload) => {
    if (!payload || typeof payload !== 'object') return '';
    const tryNode = (node) => {
        if (!node || typeof node !== 'object') return '';
        return asCategoryIdString(node.id) || asCategoryIdString(node.category_id);
    };
    return tryNode(payload) || tryNode(payload.data) || tryNode(payload.data?.data);
};

const extractMenuDishes = (data) => {
    if (!data || typeof data !== 'object') return [];
    const categories =
        Array.isArray(data.data?.data?.categories)
            ? data.data.data.categories
            : Array.isArray(data.data?.categories)
                ? data.data.categories
                : Array.isArray(data.categories)
                    ? data.categories
                    : [];
    if (!Array.isArray(categories)) return [];
    return categories.flatMap((category) => {
        if (!category || typeof category !== 'object') return [];
        const categoryName = typeof category.name === 'string' ? category.name : '';
        const categoryId =
            asCategoryIdString(category.id) || asCategoryIdString(category.category_id) || '';
        const dishes = Array.isArray(category.dishes) ? category.dishes : [];
        return dishes
            .map((dish) => {
                if (!dish || typeof dish !== 'object') return null;
                return { ...dish, __categoryName: categoryName, __categoryId: categoryId };
            })
            .filter(Boolean);
    });
};

const mapMenuDish = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = asCategoryIdString(raw.id);
    const name = typeof raw.name === 'string' ? raw.name : '';
    if (!id || !name) return null;
    const description = typeof raw.description === 'string' ? raw.description : '';
    const price = typeof raw.price === 'number' ? raw.price : typeof raw.price === 'string' ? Number(raw.price) : 0;
    const images = Array.isArray(raw.images) ? raw.images.map((img) => normalizeUrl(String(img))) : [];
    const imageUrl = images.find(Boolean) || '';
    const categoryName = typeof raw.__categoryName === 'string' ? raw.__categoryName : '';
    const categoryId = typeof raw.__categoryId === 'string' && raw.__categoryId ? raw.__categoryId : '';
    /** GET menu items expose `item_available`; POST body unchanged (`is_available`). */
    let isAvailable = true;
    if (typeof raw.item_available === 'boolean') {
        isAvailable = raw.item_available;
    } else if (raw.item_available === 1 || raw.item_available === '1') {
        isAvailable = true;
    } else if (raw.item_available === 0 || raw.item_available === '0') {
        isAvailable = false;
    } else if (typeof raw.is_available === 'boolean') {
        isAvailable = raw.is_available;
    } else if (typeof raw.isAvailable === 'boolean') {
        isAvailable = raw.isAvailable;
    }
    return {
        id,
        name,
        description,
        price: Number.isFinite(price) ? price : 0,
        imageUrl,
        categoryName,
        categoryId,
        isAvailable,
        rawDish: raw,
    };
};

/** GET categories may expose `is_visible` / `is_active`; keep `visible` on mapped objects for existing UI/state. */
const mapCategoryVisibility = (raw) => {
    if (!raw || typeof raw !== 'object') return true;
    if (typeof raw.is_visible === 'boolean') return raw.is_visible;
    if (raw.is_visible === 1 || raw.is_visible === '1') return true;
    if (raw.is_visible === 0 || raw.is_visible === '0') return false;
    if (typeof raw.is_active === 'boolean') return raw.is_active;
    if (raw.is_active === 1 || raw.is_active === '1') return true;
    if (raw.is_active === 0 || raw.is_active === '0') return false;
    if (typeof raw.visible === 'boolean') return raw.visible;
    if (typeof raw.status === 'boolean') return raw.status;
    if (raw.status === 1 || raw.status === '1') return true;
    if (raw.status === 0 || raw.status === '0') return false;
    return true;
};

const mapCategory = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const id =
        asCategoryIdString(raw.id) ||
        asCategoryIdString(raw.category_id) ||
        '';
    const name = typeof raw.name === 'string' ? raw.name : '';
    if (!id || !name) return null;
    const description = typeof raw.description === 'string' ? raw.description : '';
    const imageRaw =
        (typeof raw.image === 'string' && raw.image) ||
        (typeof raw.image_url === 'string' && raw.image_url) ||
        (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
        '';
    const imageUrl = imageRaw ? normalizeUrl(imageRaw) : '';
    const visible = mapCategoryVisibility(raw);
    const imageName = imageUrl ? imageUrl.split('/').pop() || '' : '';
    return { id, name, description, imageUrl, imageName, visible };
};

const isLikelyServerEntityId = (id) =>
    typeof id === 'string' && id.trim().length > 0 && !/^variant-\d+$/i.test(id) && !/^addon-\d+$/i.test(id);

const buildItemFormFromDish = (dish, fallbackCategoryId) => {
    if (!dish || typeof dish !== 'object') return null;
    const categoryId =
        (typeof dish.category_id === 'string' && dish.category_id.trim()) ||
        (typeof dish.categoryId === 'string' && dish.categoryId.trim()) ||
        (typeof fallbackCategoryId === 'string' ? fallbackCategoryId.trim() : '') ||
        '';
    const rawVariants = Array.isArray(dish.variants) ? dish.variants : [];
    const variants =
        rawVariants.length > 0
            ? rawVariants.map((v, idx) => ({
                id:
                    v?.id != null && isLikelyServerEntityId(String(v.id))
                        ? String(v.id)
                        : `variant-${idx + 1}`,
                name: typeof v?.name === 'string' ? v.name : '',
                price: v?.price === 0 || v?.price != null ? String(v.price) : '',
                sku: typeof v?.sku === 'string' ? v.sku : '',
            }))
            : [{ id: 'variant-1', name: '', price: '', sku: '' }];
    const rawAddons = Array.isArray(dish.addons) ? dish.addons : [];
    const addOns =
        rawAddons.length > 0
            ? rawAddons.map((a, idx) => ({
                id: a?.id != null && isLikelyServerEntityId(String(a.id)) ? String(a.id) : `addon-${idx + 1}`,
                name: typeof a?.name === 'string' ? a.name : '',
                price: a?.price === 0 || a?.price != null ? String(a.price) : '',
            }))
            : [{ id: 'addon-1', name: '', price: '' }];
    const rawTags = Array.isArray(dish.tags) ? dish.tags : [];
    const tags = rawTags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());

    return {
        categoryId,
        name: typeof dish.name === 'string' ? dish.name : '',
        price: dish.has_variants ? '' : dish.price === 0 || dish.price != null ? String(dish.price) : '',
        description: typeof dish.description === 'string' ? dish.description : '',
        prepTimeMinutes:
            dish.prep_time_minutes === 0 || dish.prep_time_minutes != null ? String(dish.prep_time_minutes) : '15',
        hasVariants: !!dish.has_variants,
        variants,
        trackInventory: !!dish.track_inventory,
        stockQuantity:
            dish.stock_quantity === 0 || dish.stock_quantity != null ? String(dish.stock_quantity) : '',
        lowStockAlert:
            dish.low_stock_alert === 0 || dish.low_stock_alert != null ? String(dish.low_stock_alert) : '10',
        addOns,
        tags,
        tagInput: '',
        isAvailable: dish.is_available !== false,
        catering: !!dish.catering,
        cateringMinimumOrder:
            dish.catering_minimum_order === 0 || dish.catering_minimum_order != null
                ? String(dish.catering_minimum_order)
                : '0',
    };
};

/** Sofia Pro 500 / 14px / 21px line-height / #374151 */
const STEP3_FIELD_LABEL = 'block font-sans text-[14px] font-medium leading-[21px] tracking-normal text-[#374151]';
const STEP3_LABEL_LEAD = 'font-sans text-[14px] font-medium leading-[21px] tracking-normal text-[#374151]';

export default function Step3({
    categories,
    setCategories,
    editingCategoryId,
    formData,
    setFormData,
    categoryImage,
    categoryImagePreviewUrl,
    setCategoryImageFile,
    CATEGORY_IMAGE_REQUIRED_PX,
    resetCategoryForm,
    startEditCategory,
    deleteCategory,
    setItemImageFromRemoteUrl,
    handlePrev,
    handleNext,
    showAddItemModal,
    setShowAddItemModal,
    closeAddItemModal,
    itemForm,
    setItemForm,
    itemImage,
    itemImagePreviewUrl,
    setItemImageFile,
    saveItem,
}) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [savingCategory, setSavingCategory] = useState(false);
    const [savingItem, setSavingItem] = useState(false);
    const [errorLines, setErrorLines] = useState([]);
    const [menuItemsErrorLines, setMenuItemsErrorLines] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState('');
    const [editingItemExistingImages, setEditingItemExistingImages] = useState([]);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
    const [deleteCategoryErrorLines, setDeleteCategoryErrorLines] = useState([]);
    const [deletingCategory, setDeletingCategory] = useState(false);
    const [deleteItemTarget, setDeleteItemTarget] = useState(null);
    const [deleteItemErrorLines, setDeleteItemErrorLines] = useState([]);
    const [deletingItem, setDeletingItem] = useState(false);

    const categoryImageInputRef = useRef(null);

    const restaurantId = formData.restaurantId?.trim();
    const editingCategory =
        categories.find((c) => String(c.id) === String(editingCategoryId ?? '')) || null;
    const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
    const canSaveCategory = formData.categoryName.trim() && (editingCategoryId ? true : !!categoryImage);
    const canOpenAddItem = categories.length > 0;
    const priceText = itemForm.price?.trim() || '';
    const prepTimeText = itemForm.prepTimeMinutes?.trim() || '';
    const hasVariants = !!itemForm.hasVariants;
    const variantsList = Array.isArray(itemForm.variants) ? itemForm.variants : [];
    const variantsValid = !hasVariants || variantsList.some((variant) => {
        const name = typeof variant?.name === 'string' ? variant.name.trim() : '';
        const price = Number(variant?.price);
        return name && Number.isFinite(price);
    });
    const priceOk = hasVariants ? true : !!priceText && Number.isFinite(Number(priceText));
    const prepOk = !!prepTimeText && Number.isFinite(Number(prepTimeText));
    const canSaveItem = !!itemForm.categoryId && !!itemForm.name.trim() && priceOk && prepOk && variantsValid;

    const canProceed = categories.length > 0;

    const closeItemModal = () => {
        setEditingItemId('');
        setEditingItemExistingImages([]);
        closeAddItemModal();
    };
    const uploadImage = async (file, baseUrl) => {
        if (!file) throw new Error('Image file is missing');
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

    const fetchCategories = useCallback(async () => {
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }
        setLoadingCategories(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/categories/${restaurantId}`;
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
                    setErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to load categories';
                    setErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setErrorLines([data.trim()]);
                } else {
                    setErrorLines(['Failed to load categories']);
                }
                return;
            }

            const list = extractCategoriesList(data).map(mapCategory).filter(Boolean);
            setCategories(list);
            setFormData((prev) => ({ ...prev, categoriesCount: list.length }));
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to load categories';
            setErrorLines([message]);
        } finally {
            setLoadingCategories(false);
        }
    }, [accessToken, restaurantId, setCategories, setFormData]);

    useEffect(() => {
        void fetchCategories();
    }, [fetchCategories]);

    const fetchMenuItems = useCallback(async () => {
        if (!restaurantId) return;
        setLoadingItems(true);
        setMenuItemsErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${restaurantId}/menu?limit=100`;
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
                setMenuItemsErrorLines(lines.length ? lines : ['Failed to load items']);
                return;
            }

            const list = extractMenuDishes(data).map(mapMenuDish).filter(Boolean);
            setMenuItems(list);
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to load items';
            setMenuItemsErrorLines([message]);
        } finally {
            setLoadingItems(false);
        }
    }, [accessToken, restaurantId]);

    useEffect(() => {
        void fetchMenuItems();
    }, [fetchMenuItems]);

    const closeDeleteCategory = useCallback(() => {
        if (deletingCategory) return;
        setDeleteCategoryTarget(null);
        setDeleteCategoryErrorLines([]);
    }, [deletingCategory]);

    const openDeleteCategory = (category) => {
        if (!category?.id) return;
        setDeleteCategoryErrorLines([]);
        setDeleteCategoryTarget(category);
    };

    const confirmDeleteCategory = async () => {
        if (!deleteCategoryTarget?.id || !restaurantId || deletingCategory) return;
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
            if (!res.ok || isErrorPayload(data)) {
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
            deleteCategory(deleteCategoryTarget.id);
            setDeleteCategoryTarget(null);
            await fetchCategories();
            await fetchMenuItems();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to delete category';
            setDeleteCategoryErrorLines([message]);
        } finally {
            setDeletingCategory(false);
        }
    };

    const closeDeleteItem = useCallback(() => {
        if (deletingItem) return;
        setDeleteItemTarget(null);
        setDeleteItemErrorLines([]);
    }, [deletingItem]);

    const openDeleteItem = (item) => {
        const id = item?.id ? String(item.id) : '';
        if (!id) return;
        setDeleteItemErrorLines([]);
        setDeleteItemTarget(item);
    };

    const confirmDeleteItem = async () => {
        const id = deleteItemTarget?.id ? String(deleteItemTarget.id) : '';
        if (!id || !restaurantId || deletingItem) return;
        setDeletingItem(true);
        setDeleteItemErrorLines([]);
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
            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setDeleteItemErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to delete item';
                    setDeleteItemErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setDeleteItemErrorLines([data.trim()]);
                } else {
                    setDeleteItemErrorLines(['Failed to delete item']);
                }
                return;
            }
            setDeleteItemTarget(null);
            await fetchMenuItems();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to delete item';
            setDeleteItemErrorLines([message]);
        } finally {
            setDeletingItem(false);
        }
    };

    useEffect(() => {
        if (!deleteCategoryTarget) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDeleteCategory();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeDeleteCategory, deleteCategoryTarget]);

    useEffect(() => {
        if (!deleteItemTarget) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDeleteItem();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeDeleteItem, deleteItemTarget]);

    const openEditItem = (row) => {
        const dish = row?.rawDish;
        if (!dish || !row?.id) return;
        const nextForm = buildItemFormFromDish(dish, row.categoryId);
        if (!nextForm) return;
        setItemForm(nextForm);
        setEditingItemId(String(row.id));
        const imgs = Array.isArray(dish.images) ? dish.images.map((u) => normalizeUrl(String(u))).filter(Boolean) : [];
        setEditingItemExistingImages(imgs);
        setItemImageFile(null);
        const primary = typeof row.imageUrl === 'string' && row.imageUrl.trim() ? row.imageUrl.trim() : imgs[0] || '';
        if (typeof setItemImageFromRemoteUrl === 'function') {
            setItemImageFromRemoteUrl(primary);
        }
        setShowAddItemModal(true);
    };

    const openNewItemModal = () => {
        setEditingItemId('');
        setEditingItemExistingImages([]);
        closeAddItemModal();
        setShowAddItemModal(true);
    };

    const handleCreateCategory = async () => {
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }

        if (!canSaveCategory || savingCategory) return;
        setSavingCategory(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            if (editingCategoryId) {
                let imageUrl = (editingCategory?.imageUrl || '').trim();
                if (categoryImage) {
                    imageUrl = await uploadImage(categoryImage, baseUrl);
                }
                if (!imageUrl && typeof categoryImagePreviewUrl === 'string') {
                    const prev = categoryImagePreviewUrl.trim();
                    if (prev && !prev.startsWith('blob:')) {
                        imageUrl = normalizeUrl(prev);
                    }
                }
                if (!imageUrl) {
                    setErrorLines(['Please keep or upload a category image.']);
                    return;
                }

                const categoryIdStr = String(editingCategoryId);
                const putUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/${encodeURIComponent(categoryIdStr)}`;
                const res = await fetch(putUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                    body: JSON.stringify({
                        restaurant_id: restaurantId,
                        name: formData.categoryName.trim(),
                        description: formData.categoryDesc?.trim() || '',
                        image_url: imageUrl,
                    }),
                });

                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();

                if (!res.ok || isErrorPayload(data)) {
                    const lines = toValidationErrorLines(data);
                    if (lines.length) {
                        setErrorLines(lines);
                    } else if (data && typeof data === 'object') {
                        const message =
                            typeof data.message === 'string'
                                ? data.message
                                : typeof data.error === 'string'
                                    ? data.error
                                    : 'Failed to update category';
                        setErrorLines([message]);
                    } else if (typeof data === 'string' && data.trim()) {
                        setErrorLines([data.trim()]);
                    } else {
                        setErrorLines(['Failed to update category']);
                    }
                    return;
                }

                const desiredActive = formData.categoryVisible !== false;
                const wasActive = editingCategory?.visible !== false;
                if (desiredActive !== wasActive) {
                    const toggleUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/category/${encodeURIComponent(categoryIdStr)}/toggle?is_active=${desiredActive ? 'true' : 'false'}`;
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
                            setErrorLines(['Category was updated, but visibility could not be saved.', ...lines]);
                        } else if (toggleData && typeof toggleData === 'object') {
                            const message =
                                typeof toggleData.message === 'string'
                                    ? toggleData.message
                                    : typeof toggleData.error === 'string'
                                        ? toggleData.error
                                        : 'Visibility update failed';
                            setErrorLines(['Category was updated, but visibility could not be saved.', message]);
                        } else if (typeof toggleData === 'string' && toggleData.trim()) {
                            setErrorLines(['Category was updated, but visibility could not be saved.', toggleData.trim()]);
                        } else {
                            setErrorLines(['Category was updated, but visibility could not be saved.']);
                        }
                    }
                }

                resetCategoryForm();
                await fetchCategories();
                await fetchMenuItems();
                return;
            }

            const imageUrl = await uploadImage(categoryImage, baseUrl);
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/category`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    name: formData.categoryName.trim(),
                    image_url: imageUrl,
                    description: formData.categoryDesc?.trim() || '',
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Failed to create category';
                    setErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setErrorLines([data.trim()]);
                } else {
                    setErrorLines(['Failed to create category']);
                }
                return;
            }

            const desiredActive = formData.categoryVisible !== false;
            const categoryId = extractCreatedCategoryIdFromResponse(data);
            if (categoryId) {
                const toggleUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/category/${encodeURIComponent(categoryId)}/toggle?is_active=${desiredActive ? 'true' : 'false'}`;
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
                        setErrorLines(['Category was created, but visibility could not be saved.', ...lines]);
                    } else if (toggleData && typeof toggleData === 'object') {
                        const message =
                            typeof toggleData.message === 'string'
                                ? toggleData.message
                                : typeof toggleData.error === 'string'
                                    ? toggleData.error
                                    : 'Visibility update failed';
                        setErrorLines(['Category was created, but visibility could not be saved.', message]);
                    } else if (typeof toggleData === 'string' && toggleData.trim()) {
                        setErrorLines(['Category was created, but visibility could not be saved.', toggleData.trim()]);
                    } else {
                        setErrorLines(['Category was created, but visibility could not be saved.']);
                    }
                }
            } else {
                setErrorLines([
                    'Category was created, but the response did not include an id — visibility was not updated. Please refresh.',
                ]);
            }

            resetCategoryForm();
            await fetchCategories();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to save category';
            setErrorLines([message]);
        } finally {
            setSavingCategory(false);
        }
    };

    const handleCreateItem = async () => {
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }
        if (!canSaveItem || savingItem) return;

        setSavingItem(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const priceValue = hasVariants ? 0 : Number(priceText);
            const prepMinutesValue = Number(prepTimeText);
            if (!hasVariants && !Number.isFinite(priceValue)) {
                setErrorLines(['Price must be a number']);
                return;
            }
            if (!Number.isFinite(prepMinutesValue)) {
                setErrorLines(['Prep time must be a number']);
                return;
            }
            const stockValue = Number(itemForm.stockQuantity);
            const lowStockValue = Number(itemForm.lowStockAlert);
            const cateringMinValue = Number(itemForm.cateringMinimumOrder);
            if (itemForm.trackInventory && itemForm.stockQuantity?.trim() && !Number.isFinite(stockValue)) {
                setErrorLines(['Stock quantity must be a number']);
                return;
            }
            if (itemForm.trackInventory && itemForm.lowStockAlert?.trim() && !Number.isFinite(lowStockValue)) {
                setErrorLines(['Low stock alert must be a number']);
                return;
            }
            if (itemForm.catering && itemForm.cateringMinimumOrder?.trim() && !Number.isFinite(cateringMinValue)) {
                setErrorLines(['Catering minimum order must be a number']);
                return;
            }
            const cleanedVariants = hasVariants
                ? variantsList
                    .map((variant) => {
                        const sid = variant.id;
                        const includeId = typeof sid === 'string' && isLikelyServerEntityId(sid);
                        return {
                            ...(includeId ? { id: sid } : {}),
                            name: variant.name?.trim() || '',
                            price: Number(variant.price),
                            sku: variant.sku?.trim() || '',
                        };
                    })
                    .filter((variant) => variant.name && Number.isFinite(variant.price))
                : [];
            if (hasVariants && cleanedVariants.length === 0) {
                setErrorLines(['At least one variant is required']);
                return;
            }
            const cleanedAddons = (Array.isArray(itemForm.addOns) ? itemForm.addOns : [])
                .map((addon) => {
                    const sid = addon.id;
                    const includeId = typeof sid === 'string' && isLikelyServerEntityId(sid);
                    return {
                        ...(includeId ? { id: sid } : {}),
                        name: addon.name?.trim() || '',
                        price: Number(addon.price),
                    };
                })
                .filter((addon) => addon.name && Number.isFinite(addon.price));

            const images = [];
            if (itemImage) {
                const uploadedUrl = await uploadImage(itemImage, baseUrl);
                if (uploadedUrl) images.push(uploadedUrl);
            } else if (editingItemId && Array.isArray(editingItemExistingImages) && editingItemExistingImages.length) {
                images.push(...editingItemExistingImages);
            }

            const body = {
                restaurant_id: restaurantId,
                category_id: itemForm.categoryId,
                name: itemForm.name.trim(),
                images,
                description: itemForm.description?.trim() || '',
                price: priceValue,
                tags: Array.isArray(itemForm.tags) ? itemForm.tags : [],
                prep_time_minutes: Math.trunc(prepMinutesValue),
                discounted_price: 0,
                has_variants: hasVariants,
                track_inventory: !!itemForm.trackInventory,
                stock_quantity: itemForm.trackInventory && Number.isFinite(stockValue) ? Math.trunc(stockValue) : 0,
                low_stock_alert: itemForm.trackInventory && Number.isFinite(lowStockValue) ? Math.trunc(lowStockValue) : 10,
                number_of_orders: 0,
                is_available: itemForm.isAvailable !== false,
                catering: !!itemForm.catering,
                catering_minimum_order: itemForm.catering && Number.isFinite(cateringMinValue) ? Math.trunc(cateringMinValue) : 0,
                is_best_seller: false,
                is_todays_deal: false,
                deal_starts_at: null,
                deal_ends_at: null,
                variants: cleanedVariants,
                addons: cleanedAddons,
            };

            const isEdit = !!editingItemId;
            const url = isEdit
                ? `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/item/${encodeURIComponent(editingItemId)}`
                : `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/item`;

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(body),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setErrorLines(lines);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : isEdit
                                    ? 'Failed to update item'
                                    : 'Failed to create item';
                    setErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setErrorLines([data.trim()]);
                } else {
                    setErrorLines([isEdit ? 'Failed to update item' : 'Failed to create item']);
                }
                return;
            }

            if (isEdit) {
                closeItemModal();
            } else {
                saveItem();
            }
            void fetchMenuItems();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to save item';
            setErrorLines([message]);
        } finally {
            setSavingItem(false);
        }
    };

    const addOnRows = Array.isArray(itemForm.addOns) && itemForm.addOns.length ? itemForm.addOns : [];
    const tagInputValue = itemForm.tagInput || '';
    const addTag = (value) => {
        const nextTag = value.trim();
        if (!nextTag) return;
        setItemForm((prev) => {
            const current = Array.isArray(prev.tags) ? prev.tags : [];
            if (current.some((t) => t.toLowerCase() === nextTag.toLowerCase())) {
                return { ...prev, tagInput: '' };
            }
            return { ...prev, tags: [...current, nextTag], tagInput: '' };
        });
    };
    const handleTagKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(tagInputValue);
        }
    };
    const removeTag = (tag) => {
        setItemForm((prev) => ({
            ...prev,
            tags: (Array.isArray(prev.tags) ? prev.tags : []).filter((t) => t !== tag),
        }));
    };
    const addAddOn = () => {
        setItemForm((prev) => ({
            ...prev,
            addOns: [...(Array.isArray(prev.addOns) ? prev.addOns : []), { id: `addon-${Date.now()}`, name: '', price: '' }],
        }));
    };
    const updateAddOn = (id, key, value) => {
        setItemForm((prev) => ({
            ...prev,
            addOns: (Array.isArray(prev.addOns) ? prev.addOns : []).map((addon) => (addon.id === id ? { ...addon, [key]: value } : addon)),
        }));
    };
    const removeAddOn = (id) => {
        setItemForm((prev) => {
            const next = (Array.isArray(prev.addOns) ? prev.addOns : []).filter((addon) => addon.id !== id);
            return { ...prev, addOns: next.length ? next : [{ id: `addon-${Date.now()}`, name: '', price: '' }] };
        });
    };
    const addVariant = () => {
        setItemForm((prev) => ({
            ...prev,
            variants: [...(Array.isArray(prev.variants) ? prev.variants : []), { id: `variant-${Date.now()}`, name: '', price: '', sku: '' }],
        }));
    };
    const updateVariant = (id, key, value) => {
        setItemForm((prev) => ({
            ...prev,
            variants: (Array.isArray(prev.variants) ? prev.variants : []).map((variant) => (variant.id === id ? { ...variant, [key]: value } : variant)),
        }));
    };
    const removeVariant = (id) => {
        setItemForm((prev) => {
            const next = (Array.isArray(prev.variants) ? prev.variants : []).filter((variant) => variant.id !== id);
            return { ...prev, variants: next.length ? next : [{ id: `variant-${Date.now()}`, name: '', price: '', sku: '' }] };
        });
    };

    return (
        <div className="space-y-8">
            <div className="">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#0F1724]">
                        Add Menu Categories
                    </h3>
                    {editingCategoryId && (
                        <button type="button" onClick={resetCategoryForm} className="text-[13px] text-[#6B7280] font-[500] hover:underline">
                            Cancel edit
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-end justify-between gap-3 mb-1.5">
                            <label className={STEP3_FIELD_LABEL}>Category Image</label>
                            <span className="text-[11px] text-[#6B7280] font-[400]">
                                Required: {CATEGORY_IMAGE_REQUIRED_PX.width}×{CATEGORY_IMAGE_REQUIRED_PX.height}px
                            </span>
                        </div>
                        <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                            <label htmlFor="categoryImageUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                <Image size={18} />
                                {categoryImage ? 'Change image' : 'Upload image'}
                            </label>
                            <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[220px] truncate">
                                {categoryImage?.name ?? editingCategory?.imageName ?? 'No file chosen'}
                            </span>
                            <input
                                ref={categoryImageInputRef}
                                id="categoryImageUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setCategoryImageFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {categoryImagePreviewUrl && (
                            <div className="relative w-[270px] mt-2">
                                <div className="w-full h-[195px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                    <img src={categoryImagePreviewUrl} alt="Category Preview" className="w-full h-full object-contain" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryImageFile(null);
                                        if (categoryImageInputRef.current) categoryImageInputRef.current.value = '';
                                    }}
                                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1724]/70 text-white shadow-sm transition-colors hover:bg-[#0F1724]/90"
                                    aria-label="Remove category image"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className={`${STEP3_FIELD_LABEL} mb-1.5`}>Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Burgers, Pizzas, Drinks"
                            value={formData.categoryName}
                            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                            className="onboarding-input h-11"
                        />
                    </div>
                    <div>
                        <label className={`${STEP3_FIELD_LABEL} mb-1.5`}>Category Description (optional)</label>
                        <input
                            type="text"
                            placeholder="Brief description of this category"
                            value={formData.categoryDesc}
                            onChange={(e) => setFormData({ ...formData, categoryDesc: e.target.value })}
                            className="onboarding-input h-11"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 pr-2">
                            <p className={STEP3_LABEL_LEAD}>Category Visibility</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">Show this category to customers</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span
                                className={`text-[12px] font-[600] min-w-[28px] text-right ${formData.categoryVisible !== false ? 'text-primary' : 'text-[#9CA3AF]'}`}
                            >
                                {formData.categoryVisible !== false ? 'ON' : 'OFF'}
                            </span>
                            <Toggle
                                active={formData.categoryVisible !== false}
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        categoryVisible: !(prev.categoryVisible !== false),
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={!canSaveCategory || savingCategory}
                        onClick={handleCreateCategory}
                        className={`w-full h-11 rounded-[8px] text-[16px] flex items-center justify-center gap-2 ${savingCategory ? 'bg-[#E5E7EB] text-[#6B6B6B]' : canSaveCategory ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#6B6B6B]'}`}
                    >
                        <Plus size={18} /> {savingCategory ? 'Saving...' : editingCategoryId ? 'Update Category' : 'Add Category'}
                    </button>
                </div>
            </div>

            <div className="">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#0F1724]">
                        Your Categories ({categories.length})
                    </h3>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                {loadingCategories ? (
                    <div className="py-6 text-center text-[#6B7280] text-[13px]">
                        Loading categories...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-10 text-center text-[#6B7280] text-[13px]">
                        No categories added yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-start justify-between gap-4 p-4 bg-[#F6F8F9]/50 rounded-[12px] border border-[#E5E7EB]">
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <div className="w-[54px] h-[54px] rounded-[12px] bg-white border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                                        {category.imageUrl ? (
                                            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image size={18} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-[14px] font-[600] text-[#1A1A1A] truncate">{category.name}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-[999px] ${category.visible ? 'bg-primary-bg text-primary' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                                {category.visible ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {category.description ? (
                                            <p className="text-[12px] text-[#6B7280] mt-1">{category.description}</p>
                                        ) : null}
                                        {category.imageName && !category.imageUrl ? (
                                            <p className="text-[11px] text-[#9CA3AF] mt-2 truncate">Image: {category.imageName}</p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => startEditCategory(category)}
                                        disabled={deletingCategory || savingCategory}
                                        className="p-2 rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                                        aria-label="Edit category"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openDeleteCategory(category)}
                                        disabled={deletingCategory || savingCategory}
                                        className="p-2 rounded-lg text-[#EF4444] transition-colors hover:bg-red-50 disabled:opacity-50"
                                        aria-label="Delete category"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>

            <div className="">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#0F1724]">Add Item</h3>
                    <button
                        type="button"
                        disabled={!canOpenAddItem}
                        onClick={openNewItemModal}
                        className={`h-11 px-4 rounded-[10px] text-[14px] font-[500] flex items-center gap-2 ${canOpenAddItem ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#6B6B6B]'}`}
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
                {!canOpenAddItem && (
                    <p className="text-[12px] text-[#6B7280] mt-2">Add at least one category before adding items</p>
                )}
            </div>

            <div className="">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#0F1724]">
                        Your Items ({loadingItems ? '...' : menuItems.length})
                    </h3>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                {loadingItems ? (
                    <div className="py-10 text-center text-[#6B7280] text-[13px]">
                        Loading items...
                    </div>
                ) : menuItems.length === 0 ? (
                    <div className="py-10 text-center text-[#6B7280] text-[13px]">
                        No items added yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {menuItems.map((item) => {
                            return (
                                <div key={item.id} className="flex items-start justify-between gap-3 p-4 bg-[#F6F8F9]/50 rounded-[12px] border border-[#E5E7EB]">
                                    <div className="flex min-w-0 flex-1 items-start gap-4">
                                        <div className="w-[54px] h-[54px] rounded-[12px] bg-white border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Image size={18} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-[14px] font-[600] text-[#1A1A1A] truncate">{item.name}</p>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-[999px] shrink-0 ${item.isAvailable ? 'bg-primary-bg text-primary' : 'bg-[#FEF2F2] text-[#EF4444]'}`}
                                                >
                                                    {item.isAvailable ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-[#6B7280] mt-1">{item.categoryName || '—'} • ${item.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditItem(item)}
                                            disabled={savingItem || deletingItem}
                                            className="p-2 rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                                            aria-label="Edit item"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteItem(item)}
                                            disabled={savingItem || deletingItem}
                                            className="p-2 rounded-lg text-[#EF4444] transition-colors hover:bg-red-50 disabled:opacity-50"
                                            aria-label="Delete item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                </div>
            </div>

            {!!menuItemsErrorLines.length && (
                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                        <div className="space-y-1">
                            {menuItemsErrorLines.map((line, idx) => (
                                <p key={idx} className="text-[12px] text-[#47464A] font-normal">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!!errorLines.length && (
                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                        <div className="space-y-1">
                            {errorLines.map((line, idx) => (
                                <p key={idx} className="text-[12px] text-[#47464A] font-normal">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    type="button"
                    disabled={!canProceed}
                    onClick={handleNext}
                    className="next-btn px-8"
                >
                    Next <ChevronRight size={18} />
                </button>
            </div>

            {showAddItemModal &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[120]">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeItemModal} aria-hidden />
                        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4">
                        <div className="bg-white w-full max-w-[900px] rounded-[24px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-[22px] font-bold text-[#1A1A1A]">
                                    {editingItemId
                                        ? 'Edit item'
                                        : itemForm.categoryId
                                            ? `Add Item to ${categories.find((c) => c.id === itemForm.categoryId)?.name || 'Category'}`
                                            : 'Add Item'}
                                </h2>
                                <button onClick={closeItemModal} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className={STEP3_FIELD_LABEL}>Item Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Classic Cheeseburger"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={STEP3_FIELD_LABEL}>
                                            Price {!itemForm.hasVariants && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="12.99"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                                            disabled={!!itemForm.hasVariants}
                                            className={`onboarding-input !h-[56px] !rounded-[12px] ${itemForm.hasVariants ? 'bg-[#F3F4F6] text-[#9CA3AF]' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className={STEP3_FIELD_LABEL}>Category <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={itemForm.categoryId}
                                                onChange={(e) => setItemForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                                className="onboarding-input !h-[56px] !rounded-[12px] appearance-none"
                                            >
                                                <option value="">Select category</option>
                                                {categoryOptions.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={STEP3_FIELD_LABEL}>Item Image</label>
                                    <label
                                        htmlFor="itemImageUpload"
                                        className="w-full h-[240px] rounded-[16px] border-2 border-dashed border-[#E5E7EB] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                                    >
                                        {itemImagePreviewUrl ? (
                                            <img src={itemImagePreviewUrl} alt="Item preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-[#6B7280] gap-3">
                                                <div className="w-[44px] h-[44px] rounded-[12px] bg-[#F6F8F9] flex items-center justify-center">
                                                    <Image size={22} className="text-[#6B7280]" />
                                                </div>
                                                <p className="text-[16px] font-[500]">Click to upload image</p>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        id="itemImageUpload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setItemImageFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-[#F6F8F9] rounded-[12px] p-4">
                                    <div>
                                        <h4 className={STEP3_LABEL_LEAD}>Has Variants?</h4>
                                        <p className="text-[12px] text-[#6B7280]">E.g., Small, Medium, Large</p>
                                    </div>
                                    <Toggle active={!!itemForm.hasVariants} onClick={() => setItemForm((prev) => ({ ...prev, hasVariants: !prev.hasVariants }))} />
                                </div>

                                {itemForm.hasVariants && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className={STEP3_FIELD_LABEL}>Variants <span className="text-red-500">*</span></label>
                                            <button
                                                type="button"
                                                onClick={addVariant}
                                                className="h-[36px] px-4 border border-primary text-primary rounded-[10px] text-[13px] font-[500] hover:bg-primary-bg transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Add variant
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {(Array.isArray(itemForm.variants) && itemForm.variants.length ? itemForm.variants : [{ id: 'variant-1', name: '', price: '', sku: '' }]).map((variant) => (
                                                <div key={variant.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_auto] gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Size name"
                                                        value={variant.name}
                                                        onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                                        className="onboarding-input !h-[48px] !rounded-[12px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Price"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                                                        className="onboarding-input !h-[48px] !rounded-[12px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="SKU"
                                                        value={variant.sku}
                                                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                                                        className="onboarding-input !h-[48px] !rounded-[12px]"
                                                    />
                                                    <button type="button" onClick={() => removeVariant(variant.id)} className="h-[44px] w-[44px] rounded-[10px] border border-[#F3DADA] text-[#EF4444] flex items-center justify-center hover:bg-[#FEECEC] transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className={STEP3_FIELD_LABEL}>Description</label>
                                    <textarea
                                        placeholder="Describe your item..."
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="onboarding-textarea !h-[120px] !rounded-[12px] py-4 resize-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className={STEP3_FIELD_LABEL}>Add-ons (Optional)</label>
                                        <button
                                            type="button"
                                            onClick={addAddOn}
                                            className="h-[36px] px-4 border border-primary text-primary rounded-[10px] text-[13px] font-[500] hover:bg-primary-bg transition-colors flex items-center gap-2"
                                        >
                                            <Plus size={14} /> Add Add-on
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(addOnRows.length ? addOnRows : [{ id: 'addon-1', name: '', price: '' }]).map((addon) => (
                                            <div key={addon.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Add-on name"
                                                    value={addon.name}
                                                    onChange={(e) => updateAddOn(addon.id, 'name', e.target.value)}
                                                    className="onboarding-input !h-[48px] !rounded-[12px]"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Price"
                                                    value={addon.price}
                                                    onChange={(e) => updateAddOn(addon.id, 'price', e.target.value)}
                                                    className="onboarding-input !h-[48px] !rounded-[12px]"
                                                />
                                                <button type="button" onClick={() => removeAddOn(addon.id)} className="h-[44px] w-[44px] rounded-[10px] border border-[#F3DADA] text-[#EF4444] flex items-center justify-center hover:bg-[#FEECEC] transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={STEP3_FIELD_LABEL}>Tags</label>
                                    <input
                                        type="text"
                                        placeholder="Type a tag and press Enter"
                                        value={tagInputValue}
                                        onChange={(e) => setItemForm((prev) => ({ ...prev, tagInput: e.target.value }))}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={() => addTag(tagInputValue)}
                                        className="onboarding-input !h-[56px] !rounded-[12px]"
                                    />
                                    {Array.isArray(itemForm.tags) && itemForm.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {itemForm.tags.map((tag) => (
                                                <div key={tag} className="flex items-center gap-2 px-4 h-[36px] rounded-full text-[13px] font-[500] border border-[#E5E7EB] text-[#374151] bg-white">
                                                    <span>{tag}</span>
                                                    <button type="button" onClick={() => removeTag(tag)} className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                    <div className="space-y-2">
                                        <label className={STEP3_FIELD_LABEL}>Prep Time (minutes)</label>
                                        <input
                                            type="text"
                                            value={itemForm.prepTimeMinutes}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={STEP3_FIELD_LABEL}>Availability</label>
                                        <div className="flex items-center gap-3 h-[56px]">
                                            <Toggle active={itemForm.isAvailable !== false} onClick={() => setItemForm((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))} />
                                            <span className={STEP3_LABEL_LEAD}>{itemForm.isAvailable !== false ? 'Available' : 'Unavailable'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-[#F6F8F9] rounded-[12px] p-4">
                                    <div>
                                        <h4 className={STEP3_LABEL_LEAD}>Track Inventory</h4>
                                        <p className="text-[12px] text-[#6B7280]">Monitor stock levels for this item</p>
                                    </div>
                                    <Toggle active={!!itemForm.trackInventory} onClick={() => setItemForm((prev) => ({ ...prev, trackInventory: !prev.trackInventory }))} />
                                </div>

                                {itemForm.trackInventory && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className={STEP3_FIELD_LABEL}>Stock Quantity</label>
                                            <input
                                                type="text"
                                                placeholder="100"
                                                value={itemForm.stockQuantity}
                                                onChange={(e) => setItemForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                                                className="onboarding-input !h-[56px] !rounded-[12px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={STEP3_FIELD_LABEL}>Low Stock Alert</label>
                                            <input
                                                type="text"
                                                placeholder="10"
                                                value={itemForm.lowStockAlert}
                                                onChange={(e) => setItemForm((prev) => ({ ...prev, lowStockAlert: e.target.value }))}
                                                className="onboarding-input !h-[56px] !rounded-[12px]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between bg-[#F6F8F9] rounded-[12px] p-4">
                                    <div>
                                        <h4 className={STEP3_LABEL_LEAD}>Catering</h4>
                                        <p className="text-[12px] text-[#6B7280]">Enable minimum order for catering</p>
                                    </div>
                                    <Toggle
                                        active={!!itemForm.catering}
                                        onClick={() =>
                                            setItemForm((prev) => ({
                                                ...prev,
                                                catering: !prev.catering,
                                                cateringMinimumOrder: !prev.catering ? prev.cateringMinimumOrder : '0',
                                            }))
                                        }
                                    />
                                </div>

                                {itemForm.catering && (
                                    <div className="space-y-2">
                                        <label className={STEP3_FIELD_LABEL}>Minimum Order</label>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={itemForm.cateringMinimumOrder}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, cateringMinimumOrder: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                )}

                            </div>

                            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeItemModal}
                                    className="h-[52px] px-8 border border-gray-200 text-[#1A1A1A] font-[600] rounded-[12px] hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!canSaveItem || savingItem}
                                    onClick={handleCreateItem}
                                    className={`h-[52px] px-8 font-[600] rounded-[12px] transition-colors ${savingItem ? 'bg-[#E5E7EB] text-[#9CA3AF]' : canSaveItem ? 'bg-primary text-white hover:bg-primary/90' : 'bg-[#E5E7EB] text-[#9CA3AF]'}`}
                                >
                                    {savingItem ? 'Saving...' : editingItemId ? 'Update Item' : 'Save Item'}
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>,
                    document.body,
                )}

            {deleteCategoryTarget &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[10000]">
                        <div className="absolute inset-0 bg-black/50" onMouseDown={closeDeleteCategory} aria-hidden />
                        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4 pointer-events-none">
                    <div
                        className="pointer-events-auto w-full max-w-[460px] overflow-hidden rounded-[16px] bg-white shadow-xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
                            <h2 className="text-[18px] font-bold text-[#111827]">Delete Category</h2>
                            <button
                                type="button"
                                onClick={closeDeleteCategory}
                                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                disabled={deletingCategory}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 bg-white p-6">
                            {!!deleteCategoryErrorLines.length && (
                                <div className="space-y-1 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                                    {deleteCategoryErrorLines.map((line, idx) => (
                                        <div key={`${line}-${idx}`}>{line}</div>
                                    ))}
                                </div>
                            )}
                            <div className="text-[14px] text-[#374151]">
                                Are you sure you want to delete{' '}
                                <span className="font-medium text-[#111827]">{deleteCategoryTarget.name}</span>?
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-5">
                            <button
                                type="button"
                                onClick={closeDeleteCategory}
                                className="rounded-[8px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[14px] font-medium text-[#374151] transition-colors hover:bg-gray-50"
                                disabled={deletingCategory}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDeleteCategory()}
                                className={`rounded-[8px] px-5 py-2.5 text-[14px] font-medium text-white transition-colors ${deletingCategory ? 'cursor-not-allowed bg-gray-300' : 'bg-[#EF4444] hover:bg-[#D14343]'}`}
                                disabled={deletingCategory}
                            >
                                {deletingCategory ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                        </div>
                    </div>,
                    document.body,
                )}

            {deleteItemTarget &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[10000]">
                        <div className="absolute inset-0 bg-black/50" onMouseDown={closeDeleteItem} aria-hidden />
                        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4 pointer-events-none">
                    <div
                        className="pointer-events-auto w-full max-w-[460px] overflow-hidden rounded-[16px] bg-white shadow-xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
                            <h2 className="text-[18px] font-bold text-[#111827]">Delete Item</h2>
                            <button
                                type="button"
                                onClick={closeDeleteItem}
                                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                disabled={deletingItem}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 bg-white p-6">
                            {!!deleteItemErrorLines.length && (
                                <div className="space-y-1 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                                    {deleteItemErrorLines.map((line, idx) => (
                                        <div key={`${line}-${idx}`}>{line}</div>
                                    ))}
                                </div>
                            )}
                            <div className="text-[14px] text-[#374151]">
                                Are you sure you want to delete{' '}
                                <span className="font-medium text-[#111827]">{deleteItemTarget.name}</span>?
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-5">
                            <button
                                type="button"
                                onClick={closeDeleteItem}
                                className="rounded-[8px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[14px] font-medium text-[#374151] transition-colors hover:bg-gray-50"
                                disabled={deletingItem}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDeleteItem()}
                                className={`rounded-[8px] px-5 py-2.5 text-[14px] font-medium text-white transition-colors ${deletingItem ? 'cursor-not-allowed bg-gray-300' : 'bg-[#EF4444] hover:bg-[#D14343]'}`}
                                disabled={deletingItem}
                            >
                                {deletingItem ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
