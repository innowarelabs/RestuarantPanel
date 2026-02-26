import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Edit2, Image, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

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
        const dishes = Array.isArray(category.dishes) ? category.dishes : [];
        return dishes
            .map((dish) => {
                if (!dish || typeof dish !== 'object') return null;
                return { ...dish, __categoryName: categoryName };
            })
            .filter(Boolean);
    });
};

const mapMenuDish = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = typeof raw.id === 'string' ? raw.id : '';
    const name = typeof raw.name === 'string' ? raw.name : '';
    if (!id || !name) return null;
    const description = typeof raw.description === 'string' ? raw.description : '';
    const price = typeof raw.price === 'number' ? raw.price : typeof raw.price === 'string' ? Number(raw.price) : 0;
    const images = Array.isArray(raw.images) ? raw.images.map((img) => normalizeUrl(String(img))) : [];
    const imageUrl = images.find(Boolean) || '';
    const categoryName = typeof raw.__categoryName === 'string' ? raw.__categoryName : '';
    return {
        id,
        name,
        description,
        price: Number.isFinite(price) ? price : 0,
        imageUrl,
        categoryName,
    };
};

const mapCategory = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const id =
        typeof raw.id === 'string'
            ? raw.id
            : typeof raw.category_id === 'string'
                ? raw.category_id
                : '';
    const name = typeof raw.name === 'string' ? raw.name : '';
    if (!id || !name) return null;
    const description = typeof raw.description === 'string' ? raw.description : '';
    const imageUrl = typeof raw.image_url === 'string' ? normalizeUrl(raw.image_url) : typeof raw.imageUrl === 'string' ? normalizeUrl(raw.imageUrl) : '';
    const visible = typeof raw.visible === 'boolean' ? raw.visible : true;
    const imageName = imageUrl ? imageUrl.split('/').pop() || '' : '';
    return { id, name, description, imageUrl, imageName, visible };
};

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
    saveCategory,
    resetCategoryForm,
    startEditCategory,
    deleteCategory,
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

    const restaurantId = formData.restaurantId?.trim();
    const editingCategory = categories.find((c) => c.id === editingCategoryId) || null;
    const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
    const canSaveCategory = formData.categoryName.trim() && (editingCategoryId ? true : !!categoryImage);
    const canOpenAddItem = categories.length > 0;
    const priceText = itemForm.price?.trim() || '';
    const prepTimeText = itemForm.prepTimeMinutes?.trim() || '';
    const priceOk = !!priceText && Number.isFinite(Number(priceText));
    const prepOk = !!prepTimeText && Number.isFinite(Number(prepTimeText));
    const canSaveItem = !!itemForm.categoryId && !!itemForm.name.trim() && priceOk && prepOk;

    const canProceed = categories.length > 0;

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

    const handleCreateCategory = async () => {
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }

        if (editingCategoryId) {
            saveCategory();
            return;
        }

        if (!canSaveCategory || savingCategory) return;
        setSavingCategory(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

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

            resetCategoryForm();
            await fetchCategories();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to create category';
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

            const priceValue = Number(priceText);
            const prepMinutesValue = Number(prepTimeText);
            if (!Number.isFinite(priceValue)) {
                setErrorLines(['Price must be a number']);
                return;
            }
            if (!Number.isFinite(prepMinutesValue)) {
                setErrorLines(['Prep time must be a number']);
                return;
            }

            const images = [];
            if (itemImage) {
                const uploadedUrl = await uploadImage(itemImage, baseUrl);
                if (uploadedUrl) images.push(uploadedUrl);
            }

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step3/item`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    category_id: itemForm.categoryId,
                    name: itemForm.name.trim(),
                    images,
                    description: itemForm.description?.trim() || '',
                    price: priceValue,
                    prep_time_minutes: Math.trunc(prepMinutesValue),
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
                                : 'Failed to create item';
                    setErrorLines([message]);
                } else if (typeof data === 'string' && data.trim()) {
                    setErrorLines([data.trim()]);
                } else {
                    setErrorLines(['Failed to create item']);
                }
                return;
            }

            saveItem();
            void fetchMenuItems();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to create item';
            setErrorLines([message]);
        } finally {
            setSavingItem(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-[16px] font-[400] text-[#1A1A1A]">Add Menu Categories</h3>
                    {editingCategoryId && (
                        <button type="button" onClick={resetCategoryForm} className="text-[13px] text-[#6B7280] font-[500] hover:underline">
                            Cancel edit
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-end justify-between gap-3 mb-1.5">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Image</label>
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
                                id="categoryImageUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setCategoryImageFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {categoryImagePreviewUrl && (
                            <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white mt-2">
                                <img src={categoryImagePreviewUrl} alt="Category Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-1.5">Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Burgers, Pizzas, Drinks"
                            value={formData.categoryName}
                            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                            className="onboarding-input h-11"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-1.5">Description (optional)</label>
                        <input
                            type="text"
                            placeholder="Brief description of this category"
                            value={formData.categoryDesc}
                            onChange={(e) => setFormData({ ...formData, categoryDesc: e.target.value })}
                            className="onboarding-input h-11"
                        />
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

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[16px] text-[#1A1A1A]">Your Categories ({categories.length})</h3>
                </div>
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
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[14px] font-[600] text-[#1A1A1A] truncate">{category.name}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-[999px] ${category.visible ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                            {category.visible ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    {category.description ? (
                                        <p className="text-[12px] text-[#6B7280] mt-1">{category.description}</p>
                                    ) : null}
                                    {category.imageUrl ? (
                                        <div className="mt-2 w-[120px] h-[70px] rounded-[10px] overflow-hidden border border-[#E5E7EB] bg-white">
                                            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : null}
                                    {category.imageName ? (
                                        <p className="text-[11px] text-[#9CA3AF] mt-2 truncate">Image: {category.imageName}</p>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* <button type="button" onClick={() => startEditCategory(category)} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button> */}
                                    {/* <button type="button" onClick={() => deleteCategory(category.id)} className="p-2 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={16} className="text-[#EF4444]" />
                                    </button> */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-[400] text-[#1A1A1A]">Add Item</h3>
                    <button
                        type="button"
                        disabled={!canOpenAddItem}
                        onClick={() => setShowAddItemModal(true)}
                        className={`h-11 px-4 rounded-[10px] text-[14px] font-[500] flex items-center gap-2 ${canOpenAddItem ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#6B6B6B]'}`}
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
                {!canOpenAddItem && (
                    <p className="text-[12px] text-[#6B7280] mt-2">Add at least one category before adding items</p>
                )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[16px] text-[#1A1A1A]">Your Items ({loadingItems ? '...' : menuItems.length})</h3>
                </div>
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
                                <div key={item.id} className="p-4 bg-[#F6F8F9]/50 rounded-[12px] border border-[#E5E7EB]">
                                    <div className="flex items-start gap-4">
                                        <div className="w-[54px] h-[54px] rounded-[12px] bg-white border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Image size={18} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-[600] text-[#1A1A1A] truncate">{item.name}</p>
                                            <p className="text-[12px] text-[#6B7280] mt-1">{item.categoryName || '—'} • ${item.price}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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

            {showAddItemModal && (
                <div className="fixed inset-0 z-[120]">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeAddItemModal} />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-[900px] rounded-[24px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-[22px] font-bold text-[#1A1A1A]">
                                    {itemForm.categoryId ? `Add Item to ${categories.find((c) => c.id === itemForm.categoryId)?.name || 'Category'}` : 'Add Item'}
                                </h2>
                                <button onClick={closeAddItemModal} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-[14px] font-[600] text-[#1A1A1A]">Item Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Classic Cheeseburger"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[14px] font-[600] text-[#1A1A1A]">Price <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="12.99"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-[600] text-[#1A1A1A]">Category <span className="text-red-500">*</span></label>
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

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-[600] text-[#1A1A1A]">Item Image</label>
                                    <label
                                        htmlFor="itemImageUpload"
                                        className="w-full h-[240px] rounded-[16px] border-2 border-dashed border-[#E5E7EB] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                                    >
                                        {itemImagePreviewUrl ? (
                                            <img src={itemImagePreviewUrl} alt="Item preview" className="w-full h-full object-cover" />
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

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-[600] text-[#1A1A1A]">Description</label>
                                    <textarea
                                        placeholder="Describe your item..."
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="onboarding-textarea !h-[120px] !rounded-[12px] py-4 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                    <div className="space-y-2">
                                        <label className="block text-[14px] font-[600] text-[#1A1A1A]">Prep Time (minutes)</label>
                                        <input
                                            type="text"
                                            value={itemForm.prepTimeMinutes}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeAddItemModal}
                                    className="h-[52px] px-8 border border-gray-200 text-[#1A1A1A] font-[600] rounded-[12px] hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!canSaveItem || savingItem}
                                    onClick={handleCreateItem}
                                    className={`h-[52px] px-8 font-[600] rounded-[12px] transition-colors ${savingItem ? 'bg-[#E5E7EB] text-[#9CA3AF]' : canSaveItem ? 'bg-primary text-white hover:bg-[#1da88f]' : 'bg-[#E5E7EB] text-[#9CA3AF]'}`}
                                >
                                    {savingItem ? 'Saving...' : 'Save Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
