import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    User, Eye, Check, MapPin, Menu, Settings, Gift,
    ChevronDown,
    CreditCard, Bell, MessageSquare, X, Image, AlertCircle, Link2,
} from 'lucide-react';

import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import Step8 from './Step8';
import Step9 from './Step9';
import Step10 from './Step10';
import toast from 'react-hot-toast';

import Toggle from './Toggle';
import { setOnboardingStep } from '../../redux/store';
import { mergeOpeningHours as mergeOpeningHoursRecord } from '../../utils/restaurantOperatingHours';

const steps = [
    { id: 1, name: 'Account Setup', icon: User },
    { id: 2, name: 'Operational Info', icon: MapPin },
    { id: 3, name: 'Menu Setup', icon: Menu },
    { id: 4, name: 'Order Settings', icon: Settings },
    { id: 5, name: 'Loyalty Program', icon: Gift },
    { id: 6, name: 'Bank Details', icon: CreditCard },
    { id: 7, name: 'Notifications Settings', icon: Bell },
    { id: 8, name: 'Support Setup', icon: MessageSquare },
    { id: 9, name: 'Integrations', icon: Link2 },
    { id: 10, name: 'Preview', icon: Eye },
];

const WEBSITE_HEADER_REQUIRED_PX = { width: 1440, height: 495 };
const WEBSITE_FOOTER_LEFT_REQUIRED_PX = { width: 648, height: 425 };
const WEBSITE_FOOTER_RIGHT_REQUIRED_PX = { width: 648, height: 425 };
const CATEGORY_IMAGE_REQUIRED_PX = { width: 270, height: 195 };

export default function OnboardingStep() {
    const LS_FORM_DATA = 'onboardingFormData';
    const LS_CATEGORIES = 'onboardingCategories';
    const LS_ITEMS = 'onboardingItems';
    const LS_MAX_REACHED = 'onboardingMaxStepReached';
    const LS_CURRENT_STEP = 'onboardingCurrentStep';
    const FLOW_LAST_STEP = 10;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const onboardingStep = useSelector((state) => state.auth.onboardingStep);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const restaurantNameFromStore = useSelector((state) => state.auth.restaurantName);
    const nextCategoryIdRef = useRef(1);
    const nextItemIdRef = useRef(1);
    const rewardImageInputRef = useRef(null);

    const createCategoryId = () => `category-${nextCategoryIdRef.current++}`;
    const createItemId = () => `item-${nextItemIdRef.current++}`;
    const parseStepNumber = (value) => {
        if (typeof value !== 'string') return 1;
        const match = value.match(/^step(\d+)$/);
        if (!match) return 1;
        const n = Number(match[1]);
        if (!Number.isFinite(n)) return 1;
        return Math.min(10, Math.max(1, n));
    };

    const clampStepNumber = (value) => Math.min(10, Math.max(1, Number(value) || 1));

    const readJson = (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const readStepNumber = (key) => {
        try {
            const raw = localStorage.getItem(key);
            const n = Number(raw);
            if (!Number.isFinite(n)) return null;
            return clampStepNumber(n);
        } catch {
            return null;
        }
    };

    const initialCurrentStep = (() => {
        const fromRedux = parseStepNumber(onboardingStep);
        const fromStorage = readStepNumber(LS_CURRENT_STEP);
        return Math.min(FLOW_LAST_STEP, clampStepNumber(Math.max(fromRedux, fromStorage || 1)));
    })();

    const initialMaxReachedStep = (() => {
        const fromStorage = readStepNumber(LS_MAX_REACHED);
        return Math.min(FLOW_LAST_STEP, clampStepNumber(Math.max(initialCurrentStep, fromStorage || 1)));
    })();

    const [currentStep, setCurrentStep] = useState(initialCurrentStep);
    const [maxReachedStep, setMaxReachedStep] = useState(initialMaxReachedStep);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showAddRewardModal, setShowAddRewardModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [rewards, setRewards] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [rewardsErrorLines, setRewardsErrorLines] = useState([]);
    const emptyRewardForm = {
        rewardName: '',
        pointsRequired: '',
        menuItemId: '',
        description: '',
        rewardImage: '',
        isActive: true,
    };
    const [rewardForm, setRewardForm] = useState(emptyRewardForm);
    const [rewardImageFile, setRewardImageFile] = useState(null);
    const [rewardImagePreviewUrl, setRewardImagePreviewUrl] = useState('');
    const [savingReward, setSavingReward] = useState(false);
    const [rewardErrorLines, setRewardErrorLines] = useState([]);
    const [rewardPendingDelete, setRewardPendingDelete] = useState(null);
    const [deletingReward, setDeletingReward] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState(false);
    const [menuItemsErrorLines, setMenuItemsErrorLines] = useState([]);
    const [categoryImage, setCategoryImage] = useState(null);
    const [categoryImagePreviewUrl, setCategoryImagePreviewUrl] = useState('');
    const [categories, setCategories] = useState(() => {
        const saved = readJson(LS_CATEGORIES);
        return Array.isArray(saved) ? saved : [];
    });
    const [items, setItems] = useState(() => {
        const saved = readJson(LS_ITEMS);
        return Array.isArray(saved) ? saved : [];
    });
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [itemImage, setItemImage] = useState(null);
    const [itemImagePreviewUrl, setItemImagePreviewUrl] = useState('');
    const [itemForm, setItemForm] = useState({
        categoryId: '',
        name: '',
        price: '',
        description: '',
        prepTimeMinutes: '15',
        hasVariants: false,
        variants: [{ id: 'variant-1', name: '', price: '', sku: '' }],
        trackInventory: false,
        stockQuantity: '',
        lowStockAlert: '10',
        addOns: [{ id: 'addon-1', name: '', price: '' }],
        tags: [],
        tagInput: '',
        isAvailable: true,
        catering: false,
        cateringMinimumOrder: '0',
    });

    const [brandingFiles, setBrandingFiles] = useState({
        companyLogo: null,
        companyLogoPreviewUrl: '',
        websiteHeader: null,
        websiteHeaderPreviewUrl: '',
        websiteFooterLeft: null,
        websiteFooterLeftPreviewUrl: '',
        websiteFooterRight: null,
        websiteFooterRightPreviewUrl: '',
    });

    const setBrandingFile = (key, file) => {
        setBrandingFiles((prev) => {
            const previewKey = `${key}PreviewUrl`;
            const prevPreviewUrl = prev[previewKey];
            if (prevPreviewUrl) URL.revokeObjectURL(prevPreviewUrl);

            const nextPreviewUrl = file ? URL.createObjectURL(file) : '';
            return { ...prev, [key]: file, [previewKey]: nextPreviewUrl };
        });
    };

    const setCategoryImageFile = (file) => {
        if (categoryImagePreviewUrl && categoryImagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(categoryImagePreviewUrl);
        }
        setCategoryImage(file);
        if (file) {
            setCategoryImagePreviewUrl(URL.createObjectURL(file));
        } else if (editingCategoryId) {
            const cat = categories.find((c) => String(c.id) === String(editingCategoryId));
            const remote =
                cat && typeof cat.imageUrl === 'string' && cat.imageUrl.trim() ? cat.imageUrl.trim() : '';
            setCategoryImagePreviewUrl(remote);
        } else {
            setCategoryImagePreviewUrl('');
        }
    };

    const setItemImageFile = (file) => {
        if (itemImagePreviewUrl && itemImagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(itemImagePreviewUrl);
        }
        setItemImage(file);
        setItemImagePreviewUrl(file ? URL.createObjectURL(file) : '');
    };

    const setItemImageFromRemoteUrl = (remoteUrl) => {
        if (itemImagePreviewUrl && itemImagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(itemImagePreviewUrl);
        }
        setItemImage(null);
        setItemImagePreviewUrl(typeof remoteUrl === 'string' ? remoteUrl.trim() : '');
    };

    const setRewardImageUploadFile = (file) => {
        if (rewardImagePreviewUrl) URL.revokeObjectURL(rewardImagePreviewUrl);
        setRewardImageFile(file);
        setRewardImagePreviewUrl(file ? URL.createObjectURL(file) : '');
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
        if (typeof data !== 'object') return '';
        const direct = typeof data.url === 'string' ? data.url : '';
        const nested = typeof data.data?.url === 'string' ? data.data.url : '';
        const nested2 = typeof data.data?.data?.url === 'string' ? data.data.data.url : '';
        return normalizeUrl(direct || nested || nested2);
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

    const closeAddRewardModal = () => {
        setShowAddRewardModal(false);
        setEditingReward(null);
        setRewardErrorLines([]);
        setRewardForm(emptyRewardForm);
        setRewardImageUploadFile(null);
    };

    const resetCategoryForm = () => {
        if (categoryImagePreviewUrl && categoryImagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(categoryImagePreviewUrl);
        }
        setEditingCategoryId(null);
        setCategoryImage(null);
        setCategoryImagePreviewUrl('');
        setFormData((prev) => ({
            ...prev,
            categoryName: '',
            categoryDesc: '',
            categoryVisible: true,
        }));
    };

    const startEditCategory = (category) => {
        if (categoryImagePreviewUrl && categoryImagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(categoryImagePreviewUrl);
        }
        setEditingCategoryId(category.id);
        setCategoryImage(null);
        const remote =
            typeof category.imageUrl === 'string' && category.imageUrl.trim() ? category.imageUrl.trim() : '';
        setCategoryImagePreviewUrl(remote);
        setFormData((prev) => ({
            ...prev,
            categoryName: category.name,
            categoryDesc: category.description || '',
            categoryVisible: !!category.visible,
        }));
    };

    const deleteCategory = (categoryId) => {
        const idStr = String(categoryId);
        setCategories((prev) => prev.filter((c) => String(c.id) !== idStr));
        setItems((prev) => {
            const removedCount = prev.filter((i) => String(i.categoryId) === idStr).length;
            const next = prev.filter((i) => String(i.categoryId) !== idStr);
            if (removedCount) {
                setFormData((fd) => ({ ...fd, itemsCount: Math.max(0, fd.itemsCount - removedCount) }));
            }
            return next;
        });
        setFormData((prev) => ({ ...prev, categoriesCount: Math.max(0, prev.categoriesCount - 1) }));

        if (String(editingCategoryId) === idStr) resetCategoryForm();
    };

    const resetItemModal = () => {
        if (itemImagePreviewUrl && itemImagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(itemImagePreviewUrl);
        }
        setItemImage(null);
        setItemImagePreviewUrl('');
        setItemForm({
            categoryId: '',
            name: '',
            price: '',
            description: '',
            prepTimeMinutes: '15',
            hasVariants: false,
            variants: [{ id: 'variant-1', name: '', price: '', sku: '' }],
            trackInventory: false,
            stockQuantity: '',
            lowStockAlert: '10',
            addOns: [{ id: 'addon-1', name: '', price: '' }],
            tags: [],
            tagInput: '',
            isAvailable: true,
            catering: false,
            cateringMinimumOrder: '0',
        });
    };

    const closeAddItemModal = () => {
        setShowAddItemModal(false);
        resetItemModal();
    };

    const saveItem = () => {
        const trimmedName = itemForm.name.trim();
        const trimmedPrice = itemForm.price.trim();
        if (!trimmedName || !itemForm.categoryId) return;
        const hasVariants = !!itemForm.hasVariants;
        const variants = Array.isArray(itemForm.variants) ? itemForm.variants : [];
        const cleanedVariants = variants
            .map((variant) => ({
                name: variant.name?.trim() || '',
                price: Number(variant.price),
                sku: variant.sku?.trim() || '',
            }))
            .filter((variant) => variant.name && Number.isFinite(variant.price));

        if (!hasVariants && !trimmedPrice) return;

        const priceValue = hasVariants ? 0 : Number(trimmedPrice);
        if (!hasVariants && !Number.isFinite(priceValue)) return;

        const prepMinutesValue = Number(itemForm.prepTimeMinutes.trim());
        if (!Number.isFinite(prepMinutesValue)) return;

        const newItem = {
            id: createItemId(),
            categoryId: itemForm.categoryId,
            name: trimmedName,
            price: priceValue,
            description: itemForm.description.trim(),
            prepTimeMinutes: prepMinutesValue,
            hasVariants,
            variants: cleanedVariants,
            trackInventory: !!itemForm.trackInventory,
            stockQuantity: itemForm.stockQuantity,
            lowStockAlert: itemForm.lowStockAlert,
            numberOfOrders: 0,
            addOns: Array.isArray(itemForm.addOns) ? itemForm.addOns : [],
            tags: Array.isArray(itemForm.tags) ? itemForm.tags : [],
            isAvailable: itemForm.isAvailable !== false,
            catering: !!itemForm.catering,
            cateringMinimumOrder: itemForm.catering ? itemForm.cateringMinimumOrder : '0',
            imageName: itemImage?.name || '',
        };

        setItems((prev) => [newItem, ...prev]);
        setFormData((prev) => ({ ...prev, itemsCount: prev.itemsCount + 1 }));
        setShowAddItemModal(false);
        resetItemModal();
    };

    // Form States
    const defaultFormData = {
        // Step 1
        fullName: '',
        email: '',
        twoFactor: false,
        is_2fa_enabled: false,
        companyName: '',
        companyLogoUrl: '',
        restaurantId: '',
        // Step 2
        websiteHeaderUrl: '',
        websiteFooterLeftUrl: '',
        websiteFooterRightUrl: '',
        contact: '',
        altPhone: '',
        address: '',
        companyLocation: '',
        stateRegion: '',
        postalCode: '',
        country: 'USA',
        openingHours: {
            monday: { open: '', close: '', break_start: '', break_end: '' },
            tuesday: { open: '', close: '', break_start: '', break_end: '' },
            wednesday: { open: '', close: '', break_start: '', break_end: '' },
            thursday: { open: '', close: '', break_start: '', break_end: '' },
            friday: { open: '', close: '', break_start: '', break_end: '' },
            saturday: { open: '', close: '', break_start: '', break_end: '' },
            sunday: { open: '', close: '', break_start: '', break_end: '' },
        },
        prepTime: '15 minutes',
        enableDelivery: true,
        enablePickup: false,
        deliveryNotes: '',
        // Step 3
        categoryName: '',
        categoryDesc: '',
        categoryVisible: true,
        categoriesCount: 0,
        itemsCount: 0,
        // Step 4
        autoAccept: false,
        timeLimit: '5',
        minOrder: '',
        allowInstructions: true,
        cancelPolicy: '',
        newOrderSoundNotification: true,
        riderPickupInstructions: '',
        firstOrderDiscountEnabled: false,
        firstOrderDiscountValue: '10',
        promoCodes: [],
        // Step 5
        loyaltyEnabled: true,
        pointsPerDollar: '10',
        bonusFirstOrder: true,
        bonusAmount: '50',
        minOrderLoyalty: true,
        minOrderAmount: '5',
        pointsExpire: true,
        expiryPeriod: '',
        // Step 6
        accHolder: '',
        bankName: '',
        accNumber: '',
        routing: '',
        payoutFreq: '',
        // Step 7
        appNotify: true,
        emailNotify: true,
        smsNotify: false,
        newOrderAlert: true,
        riderAlert: true,
        complaintAlert: true,
        // Step 8
        supportEmail: '',
        supportPhone: '',
        autoReply: '',
        chatGreeting: '',
        chatHours: '',
        // Step 9 integrations (saved with onboarding draft)
        doorDashConnected: false,
        posConnected: false,
        doordash_info: '',
        pos_key: '',
    };

    const [formData, setFormData] = useState(() => {
        const saved = readJson(LS_FORM_DATA);
        if (!saved || typeof saved !== 'object') return defaultFormData;
        return {
            ...defaultFormData,
            ...saved,
            openingHours: mergeOpeningHoursRecord(saved.openingHours),
        };
    });

    useEffect(() => {
        const existing = formData.restaurantId?.trim();
        if (existing) return;

        const fromUser =
            user && typeof user === 'object'
                ? typeof user.restaurant_id === 'string'
                    ? user.restaurant_id
                    : typeof user.id === 'string'
                        ? user.id
                        : ''
                : '';

        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }

        const restaurantId = (fromUser || fromStorage).trim();
        if (!restaurantId) return;

        setFormData((prev) => ({ ...prev, restaurantId }));
    }, [formData.restaurantId, user]);

    const goToStep = (nextStep) => {
        const normalized = Math.min(FLOW_LAST_STEP, clampStepNumber(nextStep));
        setCurrentStep(normalized);
        setMaxReachedStep((prev) => Math.max(prev, normalized));
        dispatch(setOnboardingStep(`step${normalized}`));
    };

    const handleNext = () => goToStep(currentStep + 1);
    const handlePrev = () => goToStep(currentStep - 1);

    const handleCompleteSetup = () => {
        dispatch(setOnboardingStep('dashboard'));
        navigate('/admin-dashboard');
    };

    const renderLeftSection = () => {
        const stepIndex = Math.max(0, Math.min(steps.length, currentStep) - 1);
        const step = steps[stepIndex];
        const Icon = step.icon;

        let title = "Create Your Account";
        let desc = "Set up your login credentials to access your restaurant dashboard.";

        switch (currentStep) {
            case 2: title = "Restaurant Operational Information"; desc = "Add operational settings so customers know when you're open and how you operate."; break;
            case 3: title = "Set Up Your Menu"; desc = "Add categories and items so customers can place their orders."; break;
            case 4: title = "Order Handling Preferences"; desc = "Choose how new orders should be accepted and processed."; break;
            case 5: title = "Set Up Your Loyalty Program"; desc = "Reward loyal customers with points."; break;
            case 6: title = "Bank Information"; desc = "Add your payout details securely."; break;
            case 7: title = "Notification Preferences"; desc = "Choose how you want to be notified about important events."; break;
            case 8: title = "Support & Communication Setup"; desc = "Configure how you communicate with your customers."; break;
            case 9: title = "Integrations"; desc = "Connect delivery partners to sync orders and grow your reach."; break;
            case 10: title = "Review Your Information"; desc = "You can review or edit before completing setup."; break;
        }

        return (
            <div className="flex flex-col items-start space-y-6">
                <div className="w-[80px] h-[80px] bg-primary rounded-[12px] flex items-center justify-center text-white  shrink-0">
                    <Icon size={33} />
                </div>
                <div>
                    <p className="text-[#6B7280] text-[14px] font-[500] mb-1">Step {Math.min(currentStep, steps.length)} of {steps.length}</p>
                    <h1 className="font-sans text-[26px] font-bold leading-[31.2px] tracking-normal text-[#0F1724]">
                        {title}
                    </h1>
                    <p className="text-[#6B6B6B] text-[14px] mt-3 leading-relaxed max-w-[400px]">
                        {desc}
                    </p>
                </div>
            </div>
        );
    };

    useEffect(() => {
        try {
            localStorage.setItem(LS_FORM_DATA, JSON.stringify(formData));
        } catch {
            void 0;
        }
    }, [formData]);

    useEffect(() => {
        try {
            localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories));
        } catch {
            void 0;
        }
    }, [categories]);

    useEffect(() => {
        try {
            localStorage.setItem(LS_ITEMS, JSON.stringify(items));
        } catch {
            void 0;
        }
    }, [items]);

    useEffect(() => {
        try {
            localStorage.setItem(LS_MAX_REACHED, String(maxReachedStep));
        } catch {
            void 0;
        }
    }, [maxReachedStep]);

    useEffect(() => {
        try {
            localStorage.setItem(LS_CURRENT_STEP, String(currentStep));
        } catch {
            void 0;
        }
    }, [currentStep]);

    useEffect(() => {
        const parseSuffixInt = (value, prefix) => {
            if (typeof value !== 'string') return null;
            if (!value.startsWith(prefix)) return null;
            const n = Number(value.slice(prefix.length));
            return Number.isFinite(n) ? n : null;
        };

        const maxCategoryId = categories.reduce((acc, c) => {
            const n = parseSuffixInt(c?.id, 'category-');
            return n ? Math.max(acc, n) : acc;
        }, 0);

        const maxItemId = items.reduce((acc, i) => {
            const n = parseSuffixInt(i?.id, 'item-');
            return n ? Math.max(acc, n) : acc;
        }, 0);

        nextCategoryIdRef.current = Math.max(nextCategoryIdRef.current, maxCategoryId + 1);
        nextItemIdRef.current = Math.max(nextItemIdRef.current, maxItemId + 1);
    }, [categories, items]);

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

    const extractRewardsList = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data !== 'object') return [];
        if (Array.isArray(data.data)) return data.data;
        if (data.data && typeof data.data === 'object' && Array.isArray(data.data.catalog)) return data.data.catalog;
        if (data.data && typeof data.data === 'object' && data.data.data && typeof data.data.data === 'object' && Array.isArray(data.data.data.rewards)) {
            return data.data.data.rewards;
        }
        if (data.data && typeof data.data === 'object' && Array.isArray(data.data.rewards)) return data.data.rewards;
        if (Array.isArray(data.rewards)) return data.rewards;
        return [];
    };

    const extractMenuItemsList = (data) => {
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

    const mapReward = (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const rewardId =
            typeof raw.reward_id === 'string'
                ? raw.reward_id
                : typeof raw.id === 'string'
                    ? raw.id
                    : '';
        const rewardName =
            typeof raw.reward_name === 'string'
                ? raw.reward_name
                : typeof raw.title === 'string'
                    ? raw.title
                    : typeof raw.name === 'string'
                        ? raw.name
                        : '';
        if (!rewardId || !rewardName) return null;
        const menuItemId =
            typeof raw.menu_item_id === 'string'
                ? raw.menu_item_id
                : raw.menu_item && typeof raw.menu_item === 'object' && typeof raw.menu_item.id === 'string'
                    ? raw.menu_item.id
                    : typeof raw.menuItemId === 'string'
                        ? raw.menuItemId
                        : '';
        const description = typeof raw.description === 'string' ? raw.description : '';
        const rewardImage = typeof raw.reward_image === 'string' ? raw.reward_image.trim() : '';
        const isActive = typeof raw.is_active === 'boolean' ? raw.is_active : true;
        const pointsRequired =
            typeof raw.points_required === 'number'
                ? raw.points_required
                : typeof raw.points_required === 'string'
                    ? Number(raw.points_required)
                    : typeof raw.pointsRequired === 'number'
                        ? raw.pointsRequired
                        : 0;
        return {
            reward_id: rewardId,
            reward_name: rewardName,
            menu_item_id: menuItemId,
            description,
            reward_image: rewardImage,
            is_active: isActive,
            points_required: Number.isFinite(pointsRequired) ? pointsRequired : 0,
        };
    };

    const mapMenuItem = (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const id = typeof raw.id === 'string' ? raw.id : '';
        const name = typeof raw.name === 'string' ? raw.name : '';
        const categoryName = typeof raw.__categoryName === 'string' ? raw.__categoryName : '';
        if (!id || !name) return null;
        return { id, name, categoryName, raw };
    };

    const fetchRewards = useCallback(async (restaurantId) => {
        if (!restaurantId) return;
        setLoadingRewards(true);
        setRewardsErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            // Guide: GET /api/v1/rewards/catalog
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/rewards/catalog`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log('Onboarding Step5 rewards response:', { ok: res.ok, status: res.status, data });
            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                setRewardsErrorLines(lines.length ? lines : ['Failed to load rewards']);
                return;
            }

            const list = extractRewardsList(data).map(mapReward).filter(Boolean);
            setRewards(list);
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to load rewards';
            setRewardsErrorLines([message]);
        } finally {
            setLoadingRewards(false);
        }
    }, [accessToken]);

    const fetchMenuItems = useCallback(async (restaurantId) => {
        if (!restaurantId) return;
        setLoadingMenuItems(true);
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
            console.log('Onboarding Step5 menu items response:', { ok: res.ok, status: res.status, data });

            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                setMenuItemsErrorLines(lines.length ? lines : ['Failed to load menu items']);
                return;
            }

            const list = extractMenuItemsList(data).map(mapMenuItem).filter(Boolean);
            setMenuItems(list);
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to load menu items';
            setMenuItemsErrorLines([message]);
        } finally {
            setLoadingMenuItems(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (currentStep !== 5) return;
        const restaurantId = formData.restaurantId?.trim();
        if (!restaurantId) return;
        fetchRewards(restaurantId);
    }, [currentStep, fetchRewards, formData.restaurantId]);

    useEffect(() => {
        if (!showAddRewardModal) return;
        const restaurantId = formData.restaurantId?.trim();
        if (!restaurantId) return;
        if (menuItems.length) return;
        fetchMenuItems(restaurantId);
    }, [fetchMenuItems, formData.restaurantId, menuItems.length, showAddRewardModal]);

    useEffect(() => {
        if (!showAddRewardModal) return;
        setRewardErrorLines([]);
        setRewardImageFile(null);
        setRewardImagePreviewUrl('');
        if (editingReward) {
            setRewardForm({
                rewardName: editingReward.reward_name || '',
                pointsRequired: String(editingReward.points_required ?? ''),
                menuItemId: editingReward.menu_item_id || '',
                description: editingReward.description || '',
                rewardImage: editingReward.reward_image || '',
                isActive: typeof editingReward.is_active === 'boolean' ? editingReward.is_active : true,
            });
            return;
        }
        setRewardForm({
            rewardName: '',
            pointsRequired: '',
            menuItemId: '',
            description: '',
            rewardImage: '',
            isActive: true,
        });
    }, [editingReward, showAddRewardModal]);

    const handleSaveReward = async () => {
        const restaurantId = formData.restaurantId?.trim();
        if (!restaurantId) {
            setRewardErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }
        if (savingReward) return;

        const pointsText = rewardForm.pointsRequired.trim();
        const pointsValue = Number(pointsText);
        if (!rewardForm.rewardName.trim() || !rewardForm.menuItemId || !pointsText || !Number.isFinite(pointsValue)) {
            setRewardErrorLines(['Please fill required fields']);
            return;
        }

        setSavingReward(true);
        setRewardErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            // Guide: POST /api/v1/rewards/catalog, PUT /api/v1/rewards/catalog/{item_id}
            const trimmedBaseUrl = baseUrl.replace(/\/$/, '');
            const isUpdate = !!editingReward?.reward_id;
            const url = isUpdate
                ? `${trimmedBaseUrl}/api/v1/rewards/catalog/${editingReward.reward_id}`
                : `${trimmedBaseUrl}/api/v1/rewards/catalog`;
            const rewardImageUrl = rewardImageFile ? await uploadImage(rewardImageFile, baseUrl) : rewardForm.rewardImage.trim();
            const payload = {
                title: rewardForm.rewardName.trim(),
                reward_name: rewardForm.rewardName.trim(), // keep for backward compatibility
                menu_item_id: rewardForm.menuItemId,
                description: rewardForm.description.trim(),
                reward_image: rewardImageUrl,
                is_active: !!rewardForm.isActive,
                points_required: Math.trunc(pointsValue),
            };
            const res = await fetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setRewardErrorLines(lines);
                } else if (typeof data === 'string' && data.trim()) {
                    setRewardErrorLines([data.trim()]);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Request failed';
                    setRewardErrorLines([message]);
                } else {
                    setRewardErrorLines(['Request failed']);
                }
                return;
            }

            const successMsg =
                data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : isUpdate
                        ? 'Reward updated successfully'
                        : 'Reward added to catalog';
            toast.success(successMsg);

            await fetchRewards(restaurantId);
            closeAddRewardModal();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setRewardErrorLines([message]);
        } finally {
            setSavingReward(false);
        }
    };

    const closeDeleteRewardModal = () => {
        if (deletingReward) return;
        setRewardPendingDelete(null);
    };

    const handleConfirmDeleteReward = async () => {
        const itemId = rewardPendingDelete?.reward_id?.trim();
        const restaurantId = formData.restaurantId?.trim();
        if (!itemId || !restaurantId) {
            toast.error('Missing reward or restaurant');
            return;
        }
        if (deletingReward) return;

        setDeletingReward(true);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/rewards/catalog/${itemId}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });

            let data = null;
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                try {
                    const text = await res.text();
                    data = text ? JSON.parse(text) : null;
                } catch {
                    data = null;
                }
            } else {
                try {
                    const text = await res.text();
                    data = text?.trim() ? text : null;
                } catch {
                    data = null;
                }
            }

            console.log('Onboarding Step5 DELETE reward catalog response:', {
                url,
                status: res.status,
                ok: res.ok,
                data,
            });

            const payloadIsError = typeof data === 'object' && data !== null && isErrorPayload(data);
            if (!res.ok || payloadIsError) {
                const lines = typeof data === 'object' && data !== null ? toValidationErrorLines(data) : [];
                const msg =
                    lines[0] ||
                    (typeof data === 'object' && data !== null && typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : null) ||
                    (typeof data === 'string' && data.trim() ? data.trim() : null) ||
                    'Failed to delete reward';
                toast.error(msg);
                return;
            }

            const successMsg =
                typeof data === 'object' && data !== null && typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : 'Reward removed from catalog';
            toast.success(successMsg);

            await fetchRewards(restaurantId);
            setRewardPendingDelete(null);
            if (editingReward?.reward_id === itemId) {
                closeAddRewardModal();
            }
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Failed to delete reward';
            toast.error(message);
        } finally {
            setDeletingReward(false);
        }
    };

    const rewardPointsText = rewardForm.pointsRequired.trim();
    const canSaveReward =
        !!rewardForm.rewardName.trim() &&
        !!rewardForm.menuItemId &&
        !!rewardPointsText &&
        Number.isFinite(Number(rewardPointsText));

    const renderRightSection = () => {
        switch (currentStep) {
            case 1: return (
                <Step1
                    formData={formData}
                    setFormData={setFormData}
                    brandingFiles={brandingFiles}
                    setBrandingFile={setBrandingFile}
                    handleNext={handleNext}
                />
            );
            case 2: return (
                <Step2
                    formData={formData}
                    setFormData={setFormData}
                    brandingFiles={brandingFiles}
                    setBrandingFile={setBrandingFile}
                    WEBSITE_HEADER_REQUIRED_PX={WEBSITE_HEADER_REQUIRED_PX}
                    WEBSITE_FOOTER_LEFT_REQUIRED_PX={WEBSITE_FOOTER_LEFT_REQUIRED_PX}
                    WEBSITE_FOOTER_RIGHT_REQUIRED_PX={WEBSITE_FOOTER_RIGHT_REQUIRED_PX}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                />
            );
            case 3: return (
                <Step3
                    categories={categories}
                    setCategories={setCategories}
                    editingCategoryId={editingCategoryId}
                    formData={formData}
                    setFormData={setFormData}
                    categoryImage={categoryImage}
                    categoryImagePreviewUrl={categoryImagePreviewUrl}
                    setCategoryImageFile={setCategoryImageFile}
                    CATEGORY_IMAGE_REQUIRED_PX={CATEGORY_IMAGE_REQUIRED_PX}
                    resetCategoryForm={resetCategoryForm}
                    startEditCategory={startEditCategory}
                    deleteCategory={deleteCategory}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                    showAddItemModal={showAddItemModal}
                    setShowAddItemModal={setShowAddItemModal}
                    closeAddItemModal={closeAddItemModal}
                    itemForm={itemForm}
                    setItemForm={setItemForm}
                    itemImage={itemImage}
                    itemImagePreviewUrl={itemImagePreviewUrl}
                    setItemImageFile={setItemImageFile}
                    setItemImageFromRemoteUrl={setItemImageFromRemoteUrl}
                    saveItem={saveItem}
                />
            );
            case 4: return <Step4 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 5: return (
                <Step5
                    formData={formData}
                    setFormData={setFormData}
                    setEditingReward={setEditingReward}
                    setShowAddRewardModal={setShowAddRewardModal}
                    onDeleteRewardClick={setRewardPendingDelete}
                    rewards={rewards}
                    loadingRewards={loadingRewards}
                    rewardsErrorLines={rewardsErrorLines}
                    refreshRewards={fetchRewards}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                />
            );
            case 6: return <Step6 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 7: return <Step7 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 8: return <Step8 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 9: return (
                <Step9 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />
            );
            case 10: return <Step10 setShowPreviewModal={setShowPreviewModal} onComplete={handleCompleteSetup} handlePrev={handlePrev} />;
            default: return null;
        }
    };

    const headerRestaurantName = restaurantNameFromStore?.trim() || formData.companyName?.trim() || 'Restaurant';
    const headerInitials = headerRestaurantName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-avenir pb-20">
            <header className="h-[96px] bg-white border-b border-gray-400 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-[8px] flex items-center justify-center text-white  text-[16px]">R</div>
                    <span className="text-[18px] font-[600] text-[#1A1A1A]">Restaurant</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[14px] font-[500] text-[#0F1724] leading-tight">{headerRestaurantName}</p>
                        <p className="text-[12px] text-[#6B7280]">Restaurant Owner</p>
                    </div>
                    <div className="w-[44px] h-[44px] bg-primary rounded-full flex items-center justify-center text-white font-[600] text-[16px]">{headerInitials || 'R'}</div>
                </div>
            </header>

            <div className="w-full bg-white border-b border-gray-100 pt-8 pb-3 px-4 sticky top-[72px] z-40">
                <div className="max-w-[1240px] mx-auto overflow-x-auto scrollbar-hide">
                    <div className="flex items-start justify-between min-w-[1180px] px-4">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div
                                    className={`flex flex-col items-center flex-1 group ${step.id <= Math.min(steps.length, maxReachedStep) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    onClick={() => {
                                        if (step.id <= Math.min(steps.length, maxReachedStep)) goToStep(step.id);
                                    }}
                                >
                                    <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[15px] font-bold transition-all duration-300 border
                                        ${currentStep === step.id ? 'bg-primary text-white border-primary shadow-lg' : maxReachedStep > step.id ? 'bg-primary text-white border-primary' : 'bg-white text-[#9CA3AF] border-gray-200'}`}>
                                        {maxReachedStep > step.id ? <Check size={18} strokeWidth={3} /> : step.id}
                                    </div>
                                    <span className={`mt-3 text-[12px] font-[500] text-center w-24 leading-tight ${currentStep === step.id ? 'text-primary' : 'text-[#9CA3AF]'}`}>{step.name}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 h-[2px] bg-gray-300 mt-5 mx-2 min-w-[20px] relative">
                                        <div className={`absolute left-0 top-0 h-full bg-primary transition-all duration-500 ${maxReachedStep > index + 1 ? 'w-full' : 'w-0'}`} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <main className="flex-1 p-6 sm:p-12 sm:pt-14 overflow-y-auto">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    <div className="lg:col-span-4">{renderLeftSection()}</div>
                    <div className="lg:col-span-8 rounded-[21px] p-6 sm:p-10 border border-[#00000033]  bg-[#F6F8F9]">{renderRightSection()}</div>
                </div>
            </main>

            {showPreviewModal &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowPreviewModal(false)}
                            aria-hidden
                        />
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="preview-setup-title"
                            className="bg-white w-full max-w-[800px] max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] rounded-[32px] overflow-hidden shadow-2xl relative z-[1] border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-200 flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0">
                                <h2 id="preview-setup-title" className="text-[24px] font-bold text-[#1A1A1A]">
                                    Preview Your Setup
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowPreviewModal(false)}
                                    className="text-gray-500 hover:text-[#111827] p-2.5 min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                                    aria-label="Close preview"
                                >
                                    <X size={28} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="p-8 flex-1 min-h-0 overflow-y-auto space-y-10 custom-scrollbar">
                                <section>
                                    <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">A. Account</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-[14px]">
                                        <div>
                                            <p className="text-[#9CA3AF] font-[500] mb-1">Name</p>
                                            <p className="font-semibold text-[#111827]">{formData.fullName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#9CA3AF] font-[500] mb-1">Email</p>
                                            <p className="font-semibold text-[#111827]">{formData.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#9CA3AF] font-[500] mb-1">Two-Factor Auth</p>
                                            <p className="font-semibold text-[#111827]">
                                                {(typeof formData.is_2fa_enabled === 'boolean' ? formData.is_2fa_enabled : formData.twoFactor)
                                                    ? 'Enabled'
                                                    : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">B. Operational Info</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 text-[14px]">
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[#9CA3AF] font-[500] mb-1">Address</p>
                                                <p className="font-semibold text-[#111827]">{formData.address}</p>
                                            </div>
                                            <div>
                                                <p className="text-[#9CA3AF] font-[500] mb-1">Avg Prep Time</p>
                                                <p className="font-semibold text-[#111827]">{formData.prepTime}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[#9CA3AF] font-[500] mb-1">Phone</p>
                                                <p className="font-semibold text-[#111827]">{formData.contact}</p>
                                            </div>
                                            <div>
                                                <p className="text-[#9CA3AF] font-[500] mb-1">Services</p>
                                                <p className="font-semibold text-[#111827]">
                                                    {[formData.enableDelivery && 'Delivery', formData.enablePickup && 'Pickup'].filter(Boolean).join(', ') ||
                                                        '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">C. Menu</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-[14px]">
                                        <div>
                                            <p className="text-[#9CA3AF] font-[500] mb-1">Categories</p>
                                            <p className="font-semibold text-[#111827]">{formData.categoriesCount} categories</p>
                                        </div>
                                        <div>
                                            <p className="text-[#9CA3AF] font-[500] mb-1">Items per category</p>
                                            <p className="font-semibold text-[#111827]">{formData.itemsCount} items</p>
                                            <p className="text-[12px] text-[#9CA3AF] mt-1">(add items later)</p>
                                        </div>
                                    </div>
                                </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">D. Order Settings</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Auto-accept</p><p className="font-semibold text-[#111827]">{formData.autoAccept ? 'Yes' : 'No'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Time Limit</p><p className="font-semibold text-[#111827]">{formData.timeLimit} mins</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Min Order</p><p className="font-semibold text-[#111827]">${formData.minOrder}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Instructions</p><p className="font-semibold text-[#111827]">{formData.allowInstructions ? 'Allowed' : 'Not Allowed'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">E. Loyalty Program</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Status</p><p className="font-semibold text-[#111827]">{formData.loyaltyEnabled ? 'Enabled' : 'Disabled'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Points/$ spent</p><p className="font-semibold text-[#111827]">{formData.pointsPerDollar} points</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">First Order Bonus</p><p className="font-semibold text-[#111827]">{formData.bonusFirstOrder ? `${formData.bonusAmount} pts` : 'No'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Min Order for Pts</p><p className="font-semibold text-[#111827]">${formData.minOrderAmount || '0.00'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">F. Bank Information</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Holder Name</p><p className="font-semibold text-[#111827]">{formData.accHolder}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Account Number</p><p className="font-semibold text-[#111827]">{String(formData.accNumber ?? '').trim() || '—'}</p></div>
                                    <div className="col-span-2"><p className="text-[#9CA3AF] font-[500] mb-1">Payout Frequency</p><p className="font-semibold text-[#111827]">{String(formData.payoutFreq ?? '').trim() || '—'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">G. Notifications</h3>
                                <div className="space-y-5 text-[14px]">
                                    <div>
                                        <p className="text-[#9CA3AF] font-[500] mb-2">App / Email / SMS</p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.appNotify ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 font-sans text-[12px] font-medium text-primary">App</span>
                                            ) : null}
                                            {formData.emailNotify ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 font-sans text-[12px] font-medium text-primary">Email</span>
                                            ) : null}
                                            {formData.smsNotify ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 font-sans text-[12px] font-medium text-primary">SMS</span>
                                            ) : null}
                                            {!formData.appNotify && !formData.emailNotify && !formData.smsNotify ? (
                                                <span className="text-[13px] font-medium text-[#6B7280]">None</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[#9CA3AF] font-[500] mb-2">Special Alerts</p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.newOrderAlert ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 font-sans text-[12px] font-medium text-primary">New Order</span>
                                            ) : null}
                                            {formData.riderAlert ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 font-sans text-[12px] font-medium text-primary">Rider</span>
                                            ) : null}
                                            {formData.complaintAlert ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 font-sans text-[12px] font-medium text-primary">Complaints</span>
                                            ) : null}
                                            {!formData.newOrderAlert && !formData.riderAlert && !formData.complaintAlert ? (
                                                <span className="text-[13px] font-medium text-[#6B7280]">None</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">H. Support Setup</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Support Email</p><p className="font-semibold text-[#111827]">{formData.supportEmail}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Phone</p><p className="font-semibold text-[#111827]">{formData.supportPhone}</p></div>
                                    <div className="col-span-2"><p className="text-[#9CA3AF] font-[500] mb-1">Chat Hours</p><p className="font-semibold text-[#111827]">{formData.chatHours || 'Not specified'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">I. Integrations</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-[14px]">
                                    <div>
                                        <p className="text-[#9CA3AF] font-[500] mb-1">Door Dash</p>
                                        <p className="font-semibold text-[#111827]">
                                            {formData.doorDashConnected ? 'Connected' : 'Not connected'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#9CA3AF] font-[500] mb-1">POS System</p>
                                        <p className="font-semibold text-[#111827]">
                                            {formData.posConnected ? 'Connected' : 'Not connected'}
                                        </p>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <p className="text-[#9CA3AF] font-[500] mb-1">DoorDash merchant id / notes</p>
                                        <p className="font-semibold text-[#111827] break-words">
                                            {formData.doorDashConnected && String(formData.doordash_info ?? '').trim()
                                                ? String(formData.doordash_info).trim()
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <p className="text-[#9CA3AF] font-[500] mb-1">POS key</p>
                                        <p className="font-semibold text-[#111827] break-words font-mono text-[13px]">
                                            {formData.posConnected && String(formData.pos_key ?? '').trim()
                                                ? String(formData.pos_key).trim()
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="p-8 pt-4 shrink-0 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="w-full h-[56px] bg-[#DD2F26] text-white rounded-[16px] font-bold hover:bg-[#C52820] transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>,
                    document.body,
                )}

            {/* Add Reward Item Modal */}
            {showAddRewardModal && (
                <div className="fixed inset-0 z-[110]">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={closeAddRewardModal}
                        aria-hidden
                    />
                    <div className="absolute inset-0 overflow-y-auto overscroll-contain">
                        <div className="flex min-h-full items-center justify-center px-4 py-6 sm:py-10">
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="reward-item-modal-title"
                                className="relative w-full max-w-[560px] shrink-0 rounded-[24px] overflow-hidden bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                            >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 id="reward-item-modal-title" className="text-[18px] font-bold text-[#1A1A1A]">{editingReward ? 'Edit Reward Item' : 'Add Reward Item'}</h2>
                            <button onClick={closeAddRewardModal} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            {/* Reward Name */}
                            <div className="space-y-1">
                                <label className="block text-[13px] font-[500] text-[#1A1A1A]">Reward Name</label>
                                <input
                                    type="text"
                                    value={rewardForm.rewardName}
                                    onChange={(e) => setRewardForm((prev) => ({ ...prev, rewardName: e.target.value }))}
                                    placeholder="e.g., Free Ice Cream"
                                    className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px]"
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                {/* Points Required */}
                                <div className="space-y-1 w-full">
                                    <label className="block text-[13px] font-[500] text-[#1A1A1A]">Points Required</label>
                                    <input
                                        type="text"
                                        value={rewardForm.pointsRequired}
                                        onChange={(e) => setRewardForm((prev) => ({ ...prev, pointsRequired: e.target.value }))}
                                        placeholder="e.g., 175"
                                        className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px] w-full"
                                    />
                                </div>

                                {/* Choose Menu Item */}
                                <div className="space-y-1 w-full min-w-0">
                                    <label className="block text-[13px] font-[500] text-[#1A1A1A]">Choose Menu Item</label>
                                    <div className="relative">
                                        <select
                                            value={rewardForm.menuItemId}
                                            onChange={(e) => setRewardForm((prev) => ({ ...prev, menuItemId: e.target.value }))}
                                            disabled={loadingMenuItems}
                                            className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px] appearance-none w-full min-w-0"
                                        >
                                            <option value="">{loadingMenuItems ? 'Loading items...' : 'Select an item...'}</option>
                                            {menuItems.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.categoryName ? `${item.name} • ${item.categoryName}` : item.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="block text-[13px] font-[500] text-[#1A1A1A]">Description</label>
                                <textarea
                                    value={rewardForm.description}
                                    onChange={(e) => setRewardForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of the reward"
                                    className="onboarding-textarea !h-[70px] !rounded-[8px] !text-[13px] py-2 resize-none"
                                />
                            </div>

                            {/* Reward Image */}
                            <div className="space-y-1">
                                <label className="block text-[13px] font-[500] text-[#1A1A1A]">Reward Image (optional)</label>
                                <div className="flex gap-4">
                                    <div className="w-[56px] h-[56px] bg-[#F6F8F9] rounded-[10px] border border-gray-200 border-dashed flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                                        {(rewardImagePreviewUrl || rewardForm.rewardImage?.trim()) ? (
                                            <img src={rewardImagePreviewUrl || rewardForm.rewardImage.trim()} alt="Reward" className="w-full h-full object-cover" />
                                        ) : (
                                            <Image size={20} />
                                        )}
                                    </div>
                                    <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[56px] flex items-center px-4 justify-between">
                                        <label htmlFor="rewardImageUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                            <Image size={18} />
                                            {rewardImageFile || rewardImagePreviewUrl || rewardForm.rewardImage?.trim() ? 'Change image' : 'Upload image'}
                                        </label>
                                        <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[180px] truncate">
                                            {rewardImageFile?.name ?? 'No file chosen'}
                                        </span>
                                        <input
                                            id="rewardImageUpload"
                                            ref={rewardImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                setRewardImageUploadFile(file);
                                                if (file) setRewardForm((prev) => ({ ...prev, rewardImage: '' }));
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Make Active Toggle */}
                            <div className="flex items-center justify-between pt-1">
                                <div>
                                    <p className="text-[13px] font-[500] text-[#1A1A1A]">Make this reward active</p>
                                    <p className="text-[11px] text-[#6B7280]">Customers can immediately redeem this reward</p>
                                </div>
                                <Toggle active={rewardForm.isActive} onClick={() => setRewardForm((prev) => ({ ...prev, isActive: !prev.isActive }))} />
                            </div>
                        </div>

                        {!!rewardErrorLines.length && (
                            <div className="px-5 pb-3">
                                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                                        <div className="space-y-1">
                                            {rewardErrorLines.map((line, idx) => (
                                                <p key={idx} className="text-[12px] text-[#47464A] font-normal">
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!!menuItemsErrorLines.length && (
                            <div className="px-5 pb-3">
                                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                                        <div className="space-y-1">
                                            {menuItemsErrorLines.map((line, idx) => (
                                                <p key={idx} className="text-[12px] text-[#47464A] font-normal">
                                                    {line}
                                                </p>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => fetchMenuItems(formData.restaurantId?.trim())}
                                                className="text-[12px] text-primary font-[500] underline"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="p-5 pt-0 grid grid-cols-2 gap-3 mt-1">
                            <button
                                onClick={() => setShowAddRewardModal(false)}
                                className="h-[44px] border border-gray-200 text-[#1A1A1A] font-[500] rounded-[10px] hover:bg-gray-50 transition-colors text-[13px]"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!canSaveReward || savingReward}
                                onClick={handleSaveReward}
                                className={`h-[44px] font-[500] rounded-[10px] transition-colors text-[13px] ${(!canSaveReward || savingReward) ? 'bg-[#E5E7EB] text-[#6B6B6B]' : 'bg-primary text-white hover:bg-[#C52820]'}`}
                            >
                                {savingReward ? 'Saving...' : editingReward ? 'Update Reward' : 'Save Reward'}
                            </button>
                        </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {rewardPendingDelete && (
                <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={closeDeleteRewardModal}
                        aria-hidden
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-reward-title"
                        className="bg-white w-full max-w-[420px] rounded-[24px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 id="delete-reward-title" className="text-[18px] font-bold text-[#1A1A1A]">
                                Delete reward?
                            </h2>
                            <button
                                type="button"
                                onClick={closeDeleteRewardModal}
                                disabled={deletingReward}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="p-5 text-[14px] text-[#475569] leading-relaxed">
                            This removes{' '}
                            <span className="font-semibold text-[#0F1724]">
                                {rewardPendingDelete.reward_name || 'this reward'}
                            </span>{' '}
                            from your catalog. Customers will no longer be able to redeem it.
                        </div>
                        <div className="p-5 pt-0 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={deletingReward}
                                onClick={closeDeleteRewardModal}
                                className="h-[44px] border border-gray-200 text-[#1A1A1A] font-[500] rounded-[10px] hover:bg-gray-50 transition-colors text-[13px] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingReward}
                                onClick={handleConfirmDeleteReward}
                                className="h-[44px] font-[500] rounded-[10px] transition-colors text-[13px] bg-primary text-white hover:bg-[#C52820] disabled:opacity-50"
                            >
                                {deletingReward ? 'Deleting...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .onboarding-input { width: 100%; height: 52px; padding: 0 20px; background: white; border: 1px solid #E5E7EB; border-radius: 14px; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; }
                @media (min-width: 640px) { .onboarding-input { font-size: 15px; } }
                .onboarding-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(36, 185, 158, 0.05); }
                .onboarding-textarea { width: 100%; height: 100px; padding: 10px 20px; background: white; border: 1px solid #E5E7EB; border-radius: 14px; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; }
                @media (min-width: 640px) { .onboarding-textarea { font-size: 15px; } }
                .onboarding-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(36, 185, 158, 0.05); }
                .next-btn { height: 45px; min-width: 103px; padding: 0px 16px 0px 20px; font-weight: 500; font-size: 14px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; }
                .next-btn:disabled { background: #E5E7EB; color: #6B7280; cursor: not-allowed; }
                .next-btn:not(:disabled) { background: #DD2F26; color: white; cursor: pointer; }
                .prev-btn { height: 45px; min-width: 20px; padding: 0px 20px 0px 12px; background: white; border: 1px solid #E5E7EB; color: #6B6B6B; font-weight: 500; font-size: 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
            `}</style>
        </div>
    );
}
