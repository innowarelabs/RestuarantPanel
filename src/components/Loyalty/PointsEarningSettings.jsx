import React, { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const accentPanelClass =
    'bg-[#DD2F2626] rounded-r-lg border-l-4 border-primary pl-4 pr-4 py-3';

const PointsEarningSettings = ({ loyaltySettings, onSettingsUpdate }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [saving, setSaving] = useState(false);
    const [earningMode, setEarningMode] = useState('fixed_per_order');
    const [localSettings, setLocalSettings] = useState({
        points_per_dollar: 0,
        fixed_points_per_order: 50,
        first_order_bonus_points: 0,
        min_order_to_earn_points: 0,
        points_expiry_days: 0,
        is_active: true
    });

    useEffect(() => {
        if (!loyaltySettings) return;
        setLocalSettings({
            points_per_dollar: loyaltySettings.points_per_dollar ?? 0,
            fixed_points_per_order: loyaltySettings.fixed_points_per_order ?? 50,
            first_order_bonus_points: loyaltySettings.first_order_bonus_points ?? 0,
            min_order_to_earn_points: loyaltySettings.min_order_to_earn_points ?? 0,
            points_expiry_days: loyaltySettings.points_expiry_days ?? 0,
            is_active: loyaltySettings.is_active !== false
        });
        if (loyaltySettings.earning_mode === 'per_dollar' || loyaltySettings.earning_mode === 'fixed_per_order') {
            setEarningMode(loyaltySettings.earning_mode);
        } else {
            setEarningMode((loyaltySettings.points_per_dollar ?? 0) > 0 ? 'per_dollar' : 'fixed_per_order');
        }
    }, [loyaltySettings]);

    const handleInputChange = useCallback((field, value) => {
        setLocalSettings((prev) => ({
            ...prev,
            [field]: field === 'is_active' ? value : Number(value)
        }));
    }, []);

    const buildPayload = useCallback(() => {
        const ppd = Number(localSettings.points_per_dollar) || 0;
        const fpo = Number(localSettings.fixed_points_per_order) || 0;
        return {
            ...localSettings,
            earning_mode: earningMode,
            points_per_dollar: earningMode === 'per_dollar' ? ppd : 0,
            fixed_points_per_order: earningMode === 'fixed_per_order' ? fpo : 0
        };
    }, [localSettings, earningMode]);

    const handleSave = async () => {
        setSaving(true);
        const payload = buildPayload();
        try {
            const restaurantId = (() => {
                const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
                let fromStorage = '';
                try {
                    fromStorage = localStorage.getItem('restaurant_id') || '';
                } catch {
                    fromStorage = '';
                }
                return (fromUser || fromStorage).trim();
            })();

            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/rewards/loyalty`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            console.log('Update Loyalty Settings Response:', data);
            if (data.code === 'SUCCESS_200') {
                toast.success('Loyalty settings updated successfully!');
                if (onSettingsUpdate) {
                    onSettingsUpdate(payload);
                }
            } else {
                toast.error('Failed to update loyalty settings');
            }
        } catch (error) {
            console.error('Error updating loyalty settings:', error);
            toast.error('Error updating loyalty settings');
        } finally {
            setSaving(false);
        }
    };

    const methodCard = (id, title, subtitle, body) => {
        const selected = earningMode === id;
        return (
            <button
                type="button"
                onClick={() => setEarningMode(id)}
                className={`w-full text-left rounded-lg border-2 p-4 transition-colors ${
                    selected ? 'bg-[#DD2F2626] border-primary' : 'bg-white border-[#E5E7EB] hover:border-gray-300'
                }`}
            >
                <div className="flex gap-3">
                    <div
                        className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-2 flex items-center justify-center ${
                            selected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                        }`}
                        aria-hidden
                    >
                        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-[#0F1724]">{title}</p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">{subtitle}</p>
                        {selected && body}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mb-8 -mt-3">
            <h2 className="mb-6 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                Points Earning Settings
            </h2>

            <div className="space-y-0">
                {/* Earning method */}
                <div>
                    <p className="text-[15px] font-semibold text-[#0F1724] mb-3">Earning Method</p>
                    <div className="space-y-3">
                        {methodCard(
                            'per_dollar',
                            'Points per $1 spent',
                            'Customers earn points based on order value',
                            <div className="mt-4">
                                <label className="block text-[13px] text-[#374151] mb-1">Points earned per dollar</label>
                                <input
                                    type="number"
                                    value={localSettings.points_per_dollar}
                                    onChange={(e) => handleInputChange('points_per_dollar', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full sm:max-w-md px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    min="0"
                                />
                            </div>
                        )}
                        {methodCard(
                            'fixed_per_order',
                            'Fixed points per order',
                            'Every completed order earns the same points',
                            <div className="mt-4">
                                <label className="block text-[13px] text-[#374151] mb-1">Points per completed order</label>
                                <input
                                    type="number"
                                    value={localSettings.fixed_points_per_order}
                                    onChange={(e) => handleInputChange('fixed_points_per_order', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full sm:max-w-md px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    min="0"
                                />
                                <p className="text-[12px] text-[#6B7280] mt-2">
                                    Every order = {Number(localSettings.fixed_points_per_order) || 0} points (regardless
                                    of value)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bonus — padding above separator (line) + line + content below */}
                <div className="pt-8">
                    <div className="border-t border-[#E5E7EB] pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[15px] font-medium text-general-text">Bonus Points on First Order</p>
                                <p className="text-[13px] text-[#6B7280]">Reward new customers with extra points on their first order</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={localSettings.first_order_bonus_points > 0}
                                    onChange={(e) => handleInputChange('first_order_bonus_points', e.target.checked ? 50 : 0)}
                                    className="sr-only peer"
                                />
                                <div className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20" />
                            </label>
                        </div>
                        {localSettings.first_order_bonus_points > 0 && (
                            <div className={`${accentPanelClass} mt-3`}>
                                <label className="mb-1 block text-[13px] text-[#374151]">Bonus points amount</label>
                                <input
                                    type="number"
                                    value={localSettings.first_order_bonus_points}
                                    onChange={(e) => handleInputChange('first_order_bonus_points', e.target.value)}
                                    className="w-full max-w-md rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6">
                    <div className="border-t border-[#E5E7EB] pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[15px] font-medium text-general-text">Minimum Order Requirement</p>
                                <p className="text-[13px] text-[#6B7280]">Set a minimum spend amount to earn points</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={localSettings.min_order_to_earn_points > 0}
                                    onChange={(e) => handleInputChange('min_order_to_earn_points', e.target.checked ? 5 : 0)}
                                    className="sr-only peer"
                                />
                                <div className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20" />
                            </label>
                        </div>
                        {localSettings.min_order_to_earn_points > 0 && (
                            <div className={`${accentPanelClass} mt-3`}>
                                <label className="mb-1 block text-[13px] text-[#374151]">Minimum amount ($)</label>
                                <input
                                    type="number"
                                    value={localSettings.min_order_to_earn_points}
                                    onChange={(e) => handleInputChange('min_order_to_earn_points', e.target.value)}
                                    step="0.01"
                                    className="w-full max-w-md rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6">
                    <div className="border-t border-[#E5E7EB] pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[15px] font-medium text-general-text">Points Expiry</p>
                                <p className="text-[13px] text-[#6B7280]">Set an expiration period for loyalty points</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={localSettings.points_expiry_days > 0}
                                    onChange={(e) => handleInputChange('points_expiry_days', e.target.checked ? 365 : 0)}
                                    className="sr-only peer"
                                />
                                <div className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20" />
                            </label>
                        </div>
                        {localSettings.points_expiry_days > 0 && (
                            <div className={`${accentPanelClass} mt-3`}>
                                <label className="mb-1 block text-[13px] text-[#374151]">Expiry period</label>
                                <input
                                    type="number"
                                    value={localSettings.points_expiry_days}
                                    onChange={(e) => handleInputChange('points_expiry_days', e.target.value)}
                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    min="0"
                                    placeholder="e.g. 365"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-8 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
};

export default PointsEarningSettings;
