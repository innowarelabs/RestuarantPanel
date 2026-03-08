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
                },
            });
            const data = await res.json();
            console.log('Loyalty Program Data:', data);
            if (data.code === 'SUCCESS_200' && data.data) {
                setLoyaltySettings({
                    points_per_dollar: data.data.points_per_dollar || 0,
                    first_order_bonus_points: data.data.first_order_bonus_points || 0,
                    min_order_to_earn_points: data.data.min_order_to_earn_points || 0,
                    points_expiry_days: data.data.points_expiry_days || 0,
                    is_active: data.data.is_active || true
                });
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
        }
    }, [accessToken]);

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
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step5/rewards/${restaurantId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            const data = await res.json();
            console.log('Rewards Data:', data);
            if (data.code === 'SUCCESS_200' && data.data && Array.isArray(data.data.rewards)) {
                // Map the data to match the expected format
                const mappedRewards = data.data.rewards.map(reward => ({
                    reward_id: reward.reward_id || reward.id || '',
                    // API returns `title` for the reward label — map it to `reward_name` for the UI
                    reward_name: reward.reward_name || reward.name || reward.title || '',
                    menu_item_id: reward.menu_item_id || reward.menuItemId || '',
                    description: reward.description || '',
                    reward_image: reward.reward_image || reward.image || '',
                    is_active: reward.is_active !== undefined ? reward.is_active : reward.status === 'Active',
                    points_required: reward.points_required || reward.points || 0,
                })).filter(reward => reward.reward_id && reward.reward_name);
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
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step5/reward`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    reward_name: rewardData.reward_name || '',
                    menu_item_id: rewardData.menu_item_id || '',
                    description: rewardData.description || '',
                    reward_image: rewardData.reward_image || '',
                    is_active: rewardData.is_active !== undefined ? rewardData.is_active : true,
                    points_required: Number(rewardData.points_required) || 0,
                    ...(rewardData.reward_id ? { reward_id: rewardData.reward_id } : {}), // For updates
                }),
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

    const deleteReward = useCallback(async () => {
        // Note: Delete functionality is not implemented in the Step5 API
        toast.error('Delete functionality is not available in the current API');
        return false;
    }, []);

    useEffect(() => {
        fetchLoyaltyData();
        fetchRewards();
        fetchMenuItems();
    }, [fetchLoyaltyData, fetchRewards, fetchMenuItems]);

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
