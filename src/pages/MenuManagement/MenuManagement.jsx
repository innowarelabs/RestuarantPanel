import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Eye, MoreVertical, Edit2, Copy, Trash2, TrendingUp, X } from 'lucide-react';
import EditMenuItemModal from '../../components/MenuManagement/EditMenuItemModal';
import MenuPreviewModal from '../../components/MenuManagement/MenuPreviewModal';
import AddCategoryModal from '../../components/MenuManagement/AddCategoryModal';
import EditCategoryModal from '../../components/MenuManagement/EditCategoryModal';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';

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
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) return data.data.data;
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.categories)) return data.data.categories;
    if (Array.isArray(data.categories)) return data.categories;
    return [];
};

const formatMoney = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return `$${value.toFixed(2)}`;
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '$0.00';
};

const mapDishToMenuItem = (dish) => {
    if (!dish || typeof dish !== 'object') return null;
    const id = typeof dish.id === 'string' ? dish.id : typeof dish.id === 'number' ? String(dish.id) : '';
    const name = typeof dish.name === 'string' ? dish.name : '';
    if (!id || !name) return null;

    const images = Array.isArray(dish.images) ? dish.images : [];
    const firstImage = typeof images[0] === 'string' ? normalizeUrl(images[0]) : '';
    const price = formatMoney(dish.price);
    const prepTimeMinutes = typeof dish.prep_time_minutes === 'number' ? dish.prep_time_minutes : null;
    const prepTime = typeof prepTimeMinutes === 'number' ? `${prepTimeMinutes} min` : '';
    const numberOfOrders = typeof dish.number_of_orders === 'number' ? dish.number_of_orders : 0;
    const isAvailable = typeof dish.is_available === 'boolean' ? dish.is_available : true;

    return {
        id,
        name,
        sales: '',
        prepTime,
        price,
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
    const imageUrl = typeof raw.image_url === 'string' ? normalizeUrl(raw.image_url) : typeof raw.imageUrl === 'string' ? normalizeUrl(raw.imageUrl) : '';
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
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryMenu, setCategoryMenu] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesErrorLines, setCategoriesErrorLines] = useState([]);
    const [savingCategory, setSavingCategory] = useState(false);
    const [savingCategoryErrorLines, setSavingCategoryErrorLines] = useState([]);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(false);
    const [deleteCategoryErrorLines, setDeleteCategoryErrorLines] = useState([]);

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const openEditCategory = (category) => {
        if (!category) return;
        setSelectedCategory(category);
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
        if (!deleteCategoryTarget) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDeleteCategory();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeDeleteCategory, deleteCategoryTarget]);

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

    useEffect(() => {
        void fetchCategories();
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

    const handleAddCategory = async ({ name, description, imageFile }) => {
        if (!restaurantId) {
            setSavingCategoryErrorLines(['Restaurant not found. Please login again.']);
            return;
        }
        if (!name?.trim()) return;
        if (!imageFile) return;
        if (savingCategory) return;

        setSavingCategory(true);
        setSavingCategoryErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const imageUrl = await uploadImage(imageFile);
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
            await fetchCategories();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to create category';
            setSavingCategoryErrorLines([message]);
        } finally {
            setSavingCategory(false);
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
        const mapped = dishes.map(mapDishToMenuItem).filter(Boolean);
        return mapped;
    }, [activeCategoryData, categoriesLoading]);

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
                {/* Left Sidebar: Categories */}
                <div className="xl:col-span-4 bg-white rounded-[12px] p-5 border border-[#00000033] h-[475px]">
                    <h2 className="text-[18px] font-bold text-[#111827] mb-4">Categories</h2>

                    {/* Search */}
                    <div className="relative mb-4 ">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-9 pr-4 py-2 bg-[#F3F4F6] rounded-[8px] text-[14px] outline-none border border-transparent focus:border-[#2BB29C] transition-colors"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                        />
                    </div>

                    {/* Add Category Button */}
                    <button
                        onClick={() => {
                            setSavingCategoryErrorLines([]);
                            setIsAddCategoryModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 border border-[#2BB29C] text-[#2BB29C] bg-white hover:bg-[#F0FDFA] py-2.5 rounded-[8px] font-medium text-[14px] mb-6 transition-colors cursor-pointer"
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
                                        <div className="space-y-2">
                                            <div className="h-4 w-36 bg-gray-200 rounded" />
                                            <div className="h-3 w-20 bg-gray-100 rounded" />
                                        </div>
                                        <div className="h-4 w-4 bg-gray-200 rounded" />
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
                                        ? 'bg-[#E0F7F4] border-[#2BB29C]'
                                        : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div>
                                    <h3 className={`text-[16px] font-[400] flex items-center gap-2 ${activeCategory === cat.name ? 'text-[#111827]' : 'text-[#374151]'}`}>
                                        {cat.name}
                                    </h3>
                                    <p className="text-[12px] text-gray-500">{cat.count} items</p>
                                </div>

                                <div className="flex items-center gap-2 relative">
                                    {/* <Eye size={16} className={`cursor-pointer ${cat.visible ? 'text-[#2BB29C]' : 'text-gray-300'}`} /> */}
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
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-[12px] border border-[#00000033] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
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
                                        menuItems.map((item) => (
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
                                                <td className="px-6 py-4 text-[14px] font-[500] text-[#111827] whitespace-nowrap">{item.price}</td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-[500] text-[#111827]">{item.orders.current}</span>
                                                        <span className="text-[11px] text-[#9CA3AF]">{item.orders.total}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className={`w-[44px] h-[23px] rounded-full p-1 cursor-pointer transition-colors ${item.status ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}>
                                                        <div className={`w-[16px] h-[15px] bg-white rounded-full shadow-sm transform transition-transform ${item.status ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="text-[#2BB29C] hover:text-[#2BB29C]/80 bg-[#F0FDFA] p-2 rounded-md transition-colors cursor-pointer"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="text-[#6B7280] hover:text-[#374151] hover:bg-gray-100 p-2 rounded-md transition-colors cursor-pointer"><Copy size={16} /></button>
                                                        <button className="text-[#EF4444] hover:text-[#D14343] hover:bg-red-50 p-2 rounded-md transition-colors cursor-pointer"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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

            {/* Quick Analytics */}
            <div className="bg-white rounded-[12px] border border-[#00000033] p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-[#2BB29C] w-5 h-5" />
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
                                <TrendingUp className="text-[#2BB29C] w-3 h-3" />
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
                                <TrendingUp className="text-[#2BB29C] w-3 h-3" />
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
            </div>

            <div className="mt-6">
                <div className="bg-white rounded-[12px] border border-[#00000033] p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#F0FDFA] rounded-full flex items-center justify-center mb-4">
                        <Eye size={32} className="text-[#2BB29C]" />
                    </div>
                    <h3 className="text-[16px] font-[800] text-[#111827] mb-2">Live Preview</h3>
                    <p className="text-center text-[11px] text-[#6B7280] mb-6">See how your menu looks for your customers on the mobile app and web.</p>
                    <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="w-full bg-[#2BB29C] text-white text-[14px] font-[500] py-3.5 rounded-[12px] shadow-sm hover:bg-[#259D89] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Eye size={18} />
                        Preview Menu
                    </button>
                </div>
            </div>

            {/* Modals */}
            <EditMenuItemModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                item={selectedItem}
            />
            <MenuPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
            />
            {isAddCategoryModalOpen && (
                <AddCategoryModal
                    isOpen={true}
                    onClose={() => {
                        setIsAddCategoryModalOpen(false);
                        setSavingCategoryErrorLines([]);
                    }}
                    onSave={handleAddCategory}
                    saving={savingCategory}
                    errorLines={savingCategoryErrorLines}
                />
            )}
            <EditCategoryModal
                isOpen={isEditCategoryModalOpen}
                onClose={() => setIsEditCategoryModalOpen(false)}
                category={selectedCategory}
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
                            onClick={() => openEditCategory(openedCategory)}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Edit2 size={14} /> Edit
                        </button>
                        {/* <button
                            onClick={() => setCategoryMenu(null)}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Copy size={14} /> Duplicate
                        </button> */}
                        <button
                            onClick={() => openDeleteCategory(openedCategory)}
                            className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>,
                document.body
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
        </div>
    );
}
