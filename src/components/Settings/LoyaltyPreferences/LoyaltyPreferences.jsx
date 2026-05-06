import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Save, Plus, Gift, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import RewardModal from '../../Loyalty/RewardModal';
import DeleteRewardModal from '../../Loyalty/DeleteRewardModal';

const extractPayload = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string') {
        const text = raw.trim();
        if (!text) return null;
        try {
            return extractPayload(JSON.parse(text));
        } catch {
            return null;
        }
    }
    if (typeof raw !== 'object') return null;
    const nested = raw?.data?.data && typeof raw.data.data === 'object' ? raw.data.data : null;
    const top = raw?.data && typeof raw.data === 'object' ? raw.data : null;
    return nested || top || raw;
};

const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
};

/** Same idea as RewardCard / RewardModal: URL or data-URI counts as image */
const rewardVisualLooksLikeImageUrl = (v) => {
    if (typeof v !== 'string' || !v) return false;
    return v.startsWith('data:image/') || /^https?:\/\//i.test(v);
};

const LoyaltyPreferences = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [restaurantId, setRestaurantId] = useState('');

    const [rewards, setRewards] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [rewardsError, setRewardsError] = useState(null);

    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState(false);
    const [menuCategories, setMenuCategories] = useState([]);

    const [rewardTypes, setRewardTypes] = useState([]);
    const [loadingRewardTypes, setLoadingRewardTypes] = useState(false);
    const [rewardTypesError, setRewardTypesError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedReward, setSelectedReward] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [rewardToDelete, setRewardToDelete] = useState(null);

    const [loyaltyForm, setLoyaltyForm] = useState({
        points_per_dollar: 1,
        bonus_first_order_points: 0,
        min_order_to_earn_points: 0,
        points_expiry_days: 365,
    });

    const [settings, setSettings] = useState([
        {
            key: 'loyalty_program_enabled',
            name: 'Enable Loyalty Program',
            description: 'Allow customers to earn and redeem points',
            enabled: true,
        },
        {
            key: 'loyalty_redemption_at_checkout_enabled',
            name: 'Allow Reward Redemption at Checkout',
            description: 'Customers can redeem points during order placement',
            enabled: true,
        },
        {
            key: 'loyalty_notify_points_earned',
            name: 'Notify Customer When Points Earned',
            description: 'Send notification after points are credited',
            enabled: true,
        },
        {
            key: 'loyalty_notify_reward_redeemed',
            name: 'Notify Customer When Reward Redeemed',
            description: 'Send confirmation when reward is used',
            enabled: true,
        },
    ]);

    const [loadingStep5Settings, setLoadingStep5Settings] = useState(false);
    const [savingStep5Settings, setSavingStep5Settings] = useState(false);

    const resolvedRestaurantId =
        (typeof restaurantId === 'string' && restaurantId.trim() ? restaurantId.trim() : '') ||
        (() => {
            try {
                return (localStorage.getItem('restaurant_id') || '').trim();
            } catch {
                return '';
            }
        })() ||
        getRestaurantIdFromUser(authUser);

    const toggleSetting = (index) => {
        setSettings((prev) => prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)));
    };

    const applyLoyaltyFieldsFromResponse = useCallback((raw) => {
        const r = extractPayload(raw);
        if (!r || typeof r !== 'object') return;
        let src = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? r.data : r;
        if (!src || typeof src !== 'object') return;
        if (src.loyalty_settings && typeof src.loyalty_settings === 'object') {
            src = { ...src, ...src.loyalty_settings };
        }

        const num = (v, fallback) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : fallback;
        };

        const bonusRaw =
            src.bonus_first_order_points !== undefined ? src.bonus_first_order_points : src.first_order_bonus_points;

        setLoyaltyForm((prev) => ({
            points_per_dollar:
                src.points_per_dollar !== undefined ? num(src.points_per_dollar, prev.points_per_dollar) : prev.points_per_dollar,
            bonus_first_order_points:
                bonusRaw !== undefined ? num(bonusRaw, prev.bonus_first_order_points) : prev.bonus_first_order_points,
            min_order_to_earn_points:
                src.min_order_to_earn_points !== undefined
                    ? num(src.min_order_to_earn_points, prev.min_order_to_earn_points)
                    : prev.min_order_to_earn_points,
            points_expiry_days:
                src.points_expiry_days !== undefined ? num(src.points_expiry_days, prev.points_expiry_days) : prev.points_expiry_days,
        }));

        setSettings((prev) =>
            prev.map((item) => {
                const v = src[item.key];
                if (typeof v === 'boolean') return { ...item, enabled: v };
                return item;
            }),
        );
    }, []);

    useEffect(() => {
        if (!accessToken || !resolvedRestaurantId) return;

        let cancelled = false;
        const load = async () => {
            setLoadingStep5Settings(true);
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) return;
                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(resolvedRestaurantId)}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const ct = res.headers.get('content-type');
                const raw = ct?.includes('application/json') ? await res.json() : await res.text();
                if (!res.ok || cancelled) return;
                applyLoyaltyFieldsFromResponse(raw);
            } catch {
                /* keep defaults */
            } finally {
                if (!cancelled) setLoadingStep5Settings(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [accessToken, resolvedRestaurantId, applyLoyaltyFieldsFromResponse]);

    const handleSaveLoyaltyProgramSettings = async () => {
        if (!resolvedRestaurantId) {
            toast.error('Restaurant not found');
            return;
        }
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }

        const payload = {
            restaurant_id: resolvedRestaurantId,
            points_per_dollar: Math.max(0, Math.trunc(Number(loyaltyForm.points_per_dollar)) || 0),
            bonus_first_order_points: Math.max(0, Math.trunc(Number(loyaltyForm.bonus_first_order_points)) || 0),
            min_order_to_earn_points: Math.max(0, Number(loyaltyForm.min_order_to_earn_points) || 0),
            points_expiry_days: Math.max(0, Math.trunc(Number(loyaltyForm.points_expiry_days)) || 0),
            loyalty_program_enabled: !!settings[0]?.enabled,
            loyalty_redemption_at_checkout_enabled: !!settings[1]?.enabled,
            loyalty_notify_points_earned: !!settings[2]?.enabled,
            loyalty_notify_reward_redeemed: !!settings[3]?.enabled,
        };

        setSavingStep5Settings(true);
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step5/settings`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });
            const ct = res.headers.get('content-type');
            const raw = ct?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const msg =
                    typeof raw === 'object' && raw?.message
                        ? raw.message
                        : typeof raw === 'string' && raw.trim()
                          ? raw.trim()
                          : 'Failed to save loyalty settings';
                toast.error(msg);
                return;
            }

            const code = typeof raw === 'object' && raw?.code ? String(raw.code) : '';
            if (code && code.toUpperCase().startsWith('ERROR_')) {
                toast.error(typeof raw.message === 'string' ? raw.message : 'Failed to save loyalty settings');
                return;
            }

            toast.success('Loyalty program settings saved');
            if (typeof raw === 'object') applyLoyaltyFieldsFromResponse(raw);
        } catch (e) {
            toast.error(e?.message || 'Failed to save loyalty settings');
        } finally {
            setSavingStep5Settings(false);
        }
    };

    useEffect(() => {
        if (!accessToken) return;

        const resolveRestaurantId = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) return;

                const step1Url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step1`;
                const res1 = await fetch(step1Url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const ct1 = res1.headers.get('content-type');
                const raw1 = ct1?.includes('application/json') ? await res1.json() : await res1.text();
                const step1 = extractPayload(raw1);

                const resolvedId =
                    (step1 && typeof step1 === 'object' && typeof step1.id === 'string' ? step1.id.trim() : '') ||
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() ||
                    getRestaurantIdFromUser(authUser);

                if (resolvedId) setRestaurantId(resolvedId);
            } catch {
                const fallback =
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() || getRestaurantIdFromUser(authUser);
                if (fallback) setRestaurantId(fallback);
            }
        };

        resolveRestaurantId();
    }, [accessToken, authUser]);

    const fetchMenuItems = useCallback(async () => {
        if (!restaurantId) return;
        setLoadingMenuItems(true);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/categories/with-counts?restaurant_id=${encodeURIComponent(restaurantId)}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const data = await res.json();
            const categoriesList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            if (categoriesList.length) {
                const allItems = [];
                categoriesList.forEach((category) => {
                    if (Array.isArray(category.dishes)) {
                        category.dishes.forEach((dish) => {
                            if (dish && (dish.id || dish.uuid || dish._id) && dish.name) {
                                const dishId = dish.id || dish.uuid || dish._id || '';
                                allItems.push({
                                    id: dishId,
                                    name: dish.name || '',
                                    categoryName: category.name || '',
                                    category_id: category.id || category.category_id || '',
                                });
                            }
                        });
                    }
                });
                setMenuItems(allItems);
                setMenuCategories(categoriesList);
            } else {
                setMenuItems([]);
                setMenuCategories([]);
            }
        } catch {
            setMenuItems([]);
            setMenuCategories([]);
        } finally {
            setLoadingMenuItems(false);
        }
    }, [accessToken, restaurantId]);

    const fetchRewards = useCallback(async () => {
        if (!restaurantId) {
            setRewardsError('Restaurant ID not found');
            return;
        }
        setLoadingRewards(true);
        setRewardsError(null);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const trimmedBaseUrl = baseUrl.replace(/\/$/, '');
            const url = `${trimmedBaseUrl}/api/v1/rewards/catalog`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    'X-Restaurant-Id': restaurantId,
                },
            });
            const data = await res.json();
            const rawData = data?.data;
            const rewardsSource = Array.isArray(rawData?.catalog)
                ? rawData.catalog
                : Array.isArray(rawData?.rewards)
                  ? rawData.rewards
                  : Array.isArray(rawData)
                    ? rawData
                    : Array.isArray(data)
                      ? data
                      : [];

            if (data.code === 'SUCCESS_200' && Array.isArray(rewardsSource)) {
                const mappedRewards = rewardsSource
                    .map((reward) => {
                        const menuItemId =
                            reward.menu_item_id || reward.menuItemId || reward.menu_item?.id || '';
                        const menuItemName = reward.menu_item?.name || reward.menu_item_name || '';
                        const rawType = reward.reward_type || '';
                        const normalizedType = rawType === 'menu_item' ? 'free_item' : rawType;

                        return {
                            reward_id: reward.reward_id || reward.id || '',
                            reward_name: reward.reward_name || reward.name || reward.title || '',
                            menu_item_id: menuItemId,
                            linked_item: menuItemName,
                            description: reward.description || '',
                            reward_image: reward.reward_image || reward.image || '',
                            is_active: reward.is_active !== undefined ? reward.is_active : reward.status === 'Active',
                            points_required: reward.points_required || reward.points || 0,
                            reward_type: normalizedType,
                            reward_value: reward.reward_value ?? 0,
                            min_order_amount: reward.min_order_amount ?? null,
                            max_uses_per_user: reward.max_uses_per_user ?? null,
                            valid_until: reward.valid_until || null,
                        };
                    })
                    .filter((reward) => reward.reward_id && reward.reward_name);
                setRewards(mappedRewards);
                setRewardsError(null);
            } else {
                setRewardsError('Failed to fetch rewards');
            }
        } catch {
            setRewardsError('Error fetching rewards');
        } finally {
            setLoadingRewards(false);
        }
    }, [accessToken, restaurantId]);

    const addReward = useCallback(
        async (rewardData) => {
            if (!restaurantId) {
                toast.error('Restaurant ID not found');
                return false;
            }
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
                const trimmedBaseUrl = baseUrl.replace(/\/$/, '');

                const isUpdate = !!rewardData.reward_id;
                const url = isUpdate
                    ? `${trimmedBaseUrl}/api/v1/rewards/catalog/${rewardData.reward_id}`
                    : `${trimmedBaseUrl}/api/v1/rewards/catalog`;

                const payload = {
                    restaurant_id: restaurantId,
                    reward_name: rewardData.reward_name || rewardData.title || '',
                    title: rewardData.title || rewardData.reward_name || '',
                    menu_item_id: rewardData.menu_item_id || '',
                    description: rewardData.description || '',
                    reward_image: rewardData.reward_image || '',
                    points_required: Number(rewardData.points_required) || 0,
                    is_active: rewardData.is_active !== undefined ? rewardData.is_active : true,
                    valid_until: rewardData.valid_until || null,
                    reward_type: rewardData.reward_type || '',
                    reward_value: Number(rewardData.reward_value) || 0,
                };

                const res = await fetch(url, {
                    method: isUpdate ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        'X-Restaurant-Id': restaurantId,
                    },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.code === 'SUCCESS_201' || data.code === 'SUCCESS_200') {
                    toast.success(rewardData.reward_id ? 'Reward updated successfully' : 'Reward added successfully');
                    fetchRewards();
                    return true;
                }
                toast.error(data.message || 'Failed to save reward');
                return false;
            } catch {
                toast.error('Error saving reward');
                return false;
            }
        },
        [accessToken, restaurantId, fetchRewards],
    );

    const handleSaveReward = useCallback(
        async (rewardData) => {
            return addReward(rewardData);
        },
        [addReward],
    );

    const deleteReward = useCallback(
        async (rewardId) => {
            if (!rewardId) {
                toast.error('Reward ID not found');
                return false;
            }

            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
                const trimmedBaseUrl = baseUrl.replace(/\/$/, '');
                const url = `${trimmedBaseUrl}/api/v1/rewards/catalog/${rewardId}`;

                const res = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        'X-Restaurant-Id': restaurantId,
                    },
                });

                let data = {};
                try {
                    data = await res.json();
                } catch {
                    data = {};
                }

                if (res.ok && (data.code === 'SUCCESS_200' || !data.code)) {
                    toast.success('Reward deleted successfully');
                    fetchRewards();
                    return true;
                }
                toast.error(data.message || 'Failed to delete reward');
                return false;
            } catch {
                toast.error('Error deleting reward');
                return false;
            }
        },
        [accessToken, restaurantId, fetchRewards],
    );

    const fetchRewardTypes = useCallback(async () => {
        if (!restaurantId) {
            setRewardTypes([]);
            setRewardTypesError('Restaurant ID not found');
            return;
        }
        setLoadingRewardTypes(true);
        setRewardTypesError(null);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const trimmedBaseUrl = baseUrl.replace(/\/$/, '');
            const url = `${trimmedBaseUrl}/api/v1/rewards/catalog/types`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    'X-Restaurant-Id': restaurantId,
                },
            });
            const data = await res.json();

            const types = Array.isArray(data?.data?.types) ? data.data.types : Array.isArray(data?.types) ? data.types : [];

            if (res.ok && Array.isArray(types)) {
                setRewardTypes(types);
                setRewardTypesError(null);
            } else {
                setRewardTypes([]);
                setRewardTypesError(data?.message || 'Failed to load reward types');
            }
        } catch (e) {
            setRewardTypes([]);
            setRewardTypesError(e?.message || 'Error fetching reward types');
        } finally {
            setLoadingRewardTypes(false);
        }
    }, [accessToken, restaurantId]);

    useEffect(() => {
        if (!restaurantId || !accessToken) return;
        fetchRewards();
        fetchMenuItems();
        fetchRewardTypes();
    }, [restaurantId, accessToken, fetchRewards, fetchMenuItems, fetchRewardTypes]);

    const handleAddRule = () => {
        setModalMode('add');
        setSelectedReward(null);
        setIsModalOpen(true);
    };

    const handleEditRule = (rule) => {
        setModalMode('edit');
        setSelectedReward(rule);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (rule) => {
        setRewardToDelete(rule);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (rewardToDelete?.reward_id) {
            const success = await deleteReward(rewardToDelete.reward_id);
            if (success) {
                setRewardToDelete(null);
                setIsDeleteModalOpen(false);
            }
        }
    };

    const handleModalSave = async (formData) => {
        const success = await handleSaveReward({
            ...formData,
            ...(selectedReward?.reward_id ? { reward_id: selectedReward.reward_id } : {}),
        });
        if (success) setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Loyalty Preferences</h2>
                <p className="text-[#6B6B6B] text-[14px]">Configure your loyalty program and reward rules</p>
            </div>

            <div className="bg-white rounded-[16px] border border-[#00000033] p-5">
                <h3 className="mb-4 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Loyalty Program Settings
                </h3>
                {loadingStep5Settings ? (
                    <p className="text-[14px] text-[#6B7280] mb-4">Loading settings…</p>
                ) : null}
                <div className="space-y-4">
                    {settings.map((item, index) => (
                        <div
                            key={item.key}
                            className="flex items-start sm:items-center justify-between py-3 border-b border-[#E5E7EB] last:border-0 gap-4"
                        >
                            <div className="flex-1">
                                <p className="text-[14px] font-[600] text-[#1A1A1A]">{item.name}</p>
                                <p className="text-[13px] text-[#6B6B6B] mt-0.5">{item.description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleSetting(index)}
                                disabled={loadingStep5Settings || savingStep5Settings}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 disabled:opacity-50 ${item.enabled ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={() => void handleSaveLoyaltyProgramSettings()}
                        disabled={loadingStep5Settings || savingStep5Settings || !resolvedRestaurantId}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[12px] font-[500] hover:bg-[#C52820] transition shadow-lg shadow-[#DD2F26]/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Save className="w-4 h-4" />
                        {savingStep5Settings ? 'Saving…' : 'Save Settings'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[16px] border border-[#00000033] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h3 className="mb-1 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                            Reward Rules
                        </h3>
                        <p className="text-[14px] text-[#6B6B6B]">Create rules for customers to redeem points.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddRule}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#DD2F26] text-white px-4 py-2.5 rounded-[12px] text-[14px] font-[500] hover:bg-[#C52820] transition shadow-lg shadow-[#DD2F26]/10 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Reward Rule
                    </button>
                </div>

                {(rewardsError || rewardTypesError) && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">
                        {rewardsError && <div>{rewardsError}</div>}
                        {rewardTypesError && <div>{rewardTypesError}</div>}
                        <button
                            type="button"
                            onClick={() => {
                                fetchRewards();
                                fetchRewardTypes();
                            }}
                            className="mt-2 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loadingRewards ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[88px] rounded-2xl bg-gray-100 animate-pulse border border-[#E5E7EB]" />
                        ))}
                    </div>
                ) : rewards.length === 0 ? (
                    <div className="py-10 text-center text-[14px] text-[#6B6B6B] border border-dashed border-[#E5E7EB] rounded-2xl px-4">
                        No reward rules yet. Add one to let customers redeem points.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rewards.map((rule) => {
                            const pts = Number(rule.points_required) || 0;
                            const statusLabel = rule.is_active ? 'Active' : 'Inactive';
                            const displayVisual = rule.reward_image || rule.image || '';
                            return (
                                <div
                                    key={rule.reward_id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#E5E7EB] rounded-2xl hover:border-[#DD2F26]/30 transition group gap-4"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 shrink-0 bg-[#FEF2F2] rounded-xl overflow-hidden flex items-center justify-center text-[22px] leading-none">
                                            {rewardVisualLooksLikeImageUrl(displayVisual) ? (
                                                <img
                                                    src={displayVisual}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : displayVisual ? (
                                                <span className="select-none" aria-hidden>
                                                    {displayVisual}
                                                </span>
                                            ) : (
                                                <Gift className="w-5 h-5 text-[#DD2F26]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-[600] text-[15px] text-[#1A1A1A] truncate">{rule.reward_name}</p>
                                            <p className="text-[13px] text-[#6B6B6B] font-medium">Requires {pts} Points</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        <span
                                            className={`px-3 py-1.5 rounded-[8px] text-[11px] font-[600] uppercase tracking-wider ${
                                                statusLabel === 'Active'
                                                    ? 'bg-[#FEF2F2] text-[#DD2F26]'
                                                    : 'bg-gray-100 text-[#6B6B6B]'
                                            }`}
                                        >
                                            {statusLabel}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleEditRule(rule)}
                                                className="p-2 text-[#9CA3AF] hover:text-[#DD2F26] transition hover:bg-gray-50 rounded-lg"
                                                aria-label="Edit reward rule"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteClick(rule)}
                                                className="p-2 text-[#9CA3AF] hover:text-red-500 transition hover:bg-gray-50 rounded-lg"
                                                aria-label="Delete reward rule"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <RewardModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    reward={selectedReward}
                    mode={modalMode}
                    menuItems={menuItems}
                    categories={menuCategories}
                    loadingMenuItems={loadingMenuItems}
                    rewardTypes={rewardTypes}
                    loadingRewardTypes={loadingRewardTypes}
                    onSave={handleModalSave}
                />

                <DeleteRewardModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    rewardName={rewardToDelete?.reward_name || rewardToDelete?.name}
                />
            </div>
        </div>
    );
};

export default LoyaltyPreferences;
