import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import LoyaltyHeader from '../../components/Loyalty/LoyaltyHeader';
import PointsEarningSettings from '../../components/Loyalty/PointsEarningSettings';
import RewardCatalog from '../../components/Loyalty/RewardCatalog';
import LoyaltyInsights from '../../components/Loyalty/LoyaltyInsights';

const LoyaltyProgram = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    // Get restaurant_id from user or localStorage
    const getRestaurantId = () => {
        const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return (fromUser || fromStorage).trim();
    };

    const restaurantId = getRestaurantId();
    const [loyaltySettings, setLoyaltySettings] = useState({
        points_per_dollar: 0,
        first_order_bonus_points: 0,
        min_order_to_earn_points: 0,
        points_expiry_days: 0,
        is_active: true
    });

    // Rewards state
    const [rewards, setRewards] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [rewardsError, setRewardsError] = useState(null);

    // Menu items state
    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState(false);
    // Menu categories (with dishes)
    const [menuCategories, setMenuCategories] = useState([]);

    // Reward types (from /rewards/catalog/types)
    const [rewardTypes, setRewardTypes] = useState([]);
    const [loadingRewardTypes, setLoadingRewardTypes] = useState(false);
    const [rewardTypesError, setRewardTypesError] = useState(null);

    const fetchLoyaltyData = useCallback(async () => {
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/rewards/loyalty`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            console.log('GET /api/v1/rewards/loyalty response:', data);
            if (data.code === 'SUCCESS_200' && data.data) {
                setLoyaltySettings({
                    points_per_dollar: data.data.points_per_dollar ?? 0,
                    first_order_bonus_points: data.data.first_order_bonus_points ?? 0,
                    min_order_to_earn_points: data.data.min_order_to_earn_points ?? 0,
                    points_expiry_days: data.data.points_expiry_days ?? 0,
                    is_active: data.data.is_active === true
                });
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
        }
    }, [accessToken, restaurantId]);

    const fetchMenuItems = useCallback(async () => {
        if (!restaurantId) {
            return;
        }
        setLoadingMenuItems(true);
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
            const data = await res.json();
            console.log('Categories Data:', data);
            // Support responses like: [] or { data: [] }
            const categoriesList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            if (categoriesList.length) {
                // Flatten dishes from all categories
                const allItems = [];
                categoriesList.forEach(category => {
                    if (Array.isArray(category.dishes)) {
                        category.dishes.forEach(dish => {
                            if (dish && (dish.id || dish.uuid || dish._id) && dish.name) {
                                const dishId = dish.id || dish.uuid || dish._id || '';
                                allItems.push({
                                    id: dishId,
                                    name: dish.name || '',
                                    categoryName: category.name || '',
                                    category_id: category.id || category.category_id || ''
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
        } catch (error) {
            console.error('Error fetching menu items:', error);
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
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            console.log('Rewards Data:', data);
            // Support legacy responses and new catalog response { data: { catalog: [] } }
            const rawData = data?.data;
            const rewardsSource =
                Array.isArray(rawData?.catalog) ? rawData.catalog :
                Array.isArray(rawData?.rewards) ? rawData.rewards :
                Array.isArray(rawData) ? rawData :
                Array.isArray(data) ? data :
                [];

            if (data.code === 'SUCCESS_200' && Array.isArray(rewardsSource)) {
                const mappedRewards = rewardsSource.map(reward => {
                    // Normalize menu item info from nested object or legacy fields
                    const menuItemId =
                        reward.menu_item_id ||
                        reward.menuItemId ||
                        reward.menu_item?.id ||
                        '';
                    const menuItemName =
                        reward.menu_item?.name ||
                        reward.menu_item_name ||
                        '';

                    // Normalize type: old data may use "menu_item" instead of "free_item"
                    const rawType = reward.reward_type || '';
                    const normalizedType = rawType === 'menu_item' ? 'free_item' : rawType;

                    return {
                        reward_id: reward.reward_id || reward.id || '',
                        // API may return `title` for the reward label — map it to `reward_name` for the UI
                        reward_name: reward.reward_name || reward.name || reward.title || '',
                        menu_item_id: menuItemId,
                        // Linked item name for card display
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
                }).filter(reward => reward.reward_id && reward.reward_name);
                setRewards(mappedRewards);
                setRewardsError(null); // Clear any previous errors
            } else {
                setRewardsError('Failed to fetch rewards');
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
            setRewardsError('Error fetching rewards');
        } finally {
            setLoadingRewards(false);
        }
    }, [accessToken, restaurantId]);

    const addReward = useCallback(async (rewardData) => {
        if (!restaurantId) {
            toast.error('Restaurant ID not found');
            return false;
        }
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const trimmedBaseUrl = baseUrl.replace(/\/$/, '');

            // If reward_id is present, this is an update – use PUT /api/v1/rewards/catalog/{item_id}
            const isUpdate = !!rewardData.reward_id;
            const url = isUpdate
                ? `${trimmedBaseUrl}/api/v1/rewards/catalog/${rewardData.reward_id}`
                : `${trimmedBaseUrl}/api/v1/rewards/catalog`;

            const payload = {
                // Old API still expects restaurant_id & reward_name, keep them for backward compatibility
                restaurant_id: restaurantId,
                reward_name: rewardData.reward_name || rewardData.title || '',

                // New catalog API expects these fields
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
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.log('Add/Update Reward Response:', data);
            if (data.code === 'SUCCESS_201' || data.code === 'SUCCESS_200') {
                toast.success(rewardData.reward_id ? 'Reward updated successfully' : 'Reward added successfully');
                fetchRewards(); // Refresh rewards
                return true;
            } else {
                toast.error(data.message || 'Failed to save reward');
                return false;
            }
        } catch (error) {
            console.error('Error saving reward:', error);
            toast.error('Error saving reward');
            return false;
        }
    }, [accessToken, restaurantId, fetchRewards]);

    const handleSaveReward = useCallback(async (rewardData) => {
        return await addReward(rewardData);
    }, [addReward]);

    const deleteReward = useCallback(async (rewardId) => {
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
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
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
                fetchRewards(); // Refresh rewards list
                return true;
            } else {
                toast.error(data.message || 'Failed to delete reward');
                return false;
            }
        } catch (error) {
            console.error('Error deleting reward:', error);
            toast.error('Error deleting reward');
            return false;
        }
    }, [accessToken, restaurantId, fetchRewards]);

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
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            console.log('Reward catalog types:', data);

            const types = Array.isArray(data?.data?.types)
                ? data.data.types
                : Array.isArray(data?.types)
                    ? data.types
                    : [];

            if (res.ok && Array.isArray(types)) {
                setRewardTypes(types);
                setRewardTypesError(null);
            } else {
                setRewardTypes([]);
                setRewardTypesError(data?.message || 'Failed to load reward types');
            }
        } catch (error) {
            console.error('Error fetching reward catalog types:', error);
            setRewardTypes([]);
            setRewardTypesError(error?.message || 'Error fetching reward types');
        } finally {
            setLoadingRewardTypes(false);
        }
    }, [accessToken, restaurantId]);

    useEffect(() => {
        fetchLoyaltyData();
        fetchRewards();
        fetchMenuItems();
        fetchRewardTypes();
    }, [fetchLoyaltyData, fetchRewards, fetchMenuItems, fetchRewardTypes]);

    return (
        <div className="max-w-[1600px]  mx-auto pb-12 ">
            <LoyaltyHeader />

            <div className="grid grid-cols-1 gap-8">
                <PointsEarningSettings 
                    loyaltySettings={loyaltySettings} 
                    onSettingsUpdate={setLoyaltySettings}
                />
                <RewardCatalog 
                    rewards={rewards}
                    loading={loadingRewards}
                    error={rewardsError}
                    menuItems={menuItems}
                    categories={menuCategories}
                    loadingMenuItems={loadingMenuItems}
                    rewardTypes={rewardTypes}
                    loadingRewardTypes={loadingRewardTypes}
                    rewardTypesError={rewardTypesError}
                    onSaveReward={handleSaveReward}
                    onDeleteReward={deleteReward}
                    onRefreshRewards={fetchRewards}
                />
                <LoyaltyInsights />
            </div>
        </div>
    );
};

export default LoyaltyProgram;
