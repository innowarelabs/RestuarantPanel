import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const PointsEarningSettings = ({ loyaltySettings, onSettingsUpdate }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const [saving, setSaving] = useState(false);
    const [localSettings, setLocalSettings] = useState({
        points_per_dollar: 0,
        first_order_bonus_points: 0,
        min_order_to_earn_points: 0,
        points_expiry_days: 0,
        is_active: true
    });

    useEffect(() => {
        if (loyaltySettings) {
            setLocalSettings(loyaltySettings);
        }
    }, [loyaltySettings]);

    const handleInputChange = (field, value) => {
        setLocalSettings(prev => ({
            ...prev,
            [field]: field === 'is_active' ? value : Number(value)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/rewards/loyalty`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(localSettings)
            });
            const data = await res.json();
            console.log('Update Loyalty Settings Response:', data);
            if (data.code === 'SUCCESS_200') {
                toast.success('Loyalty settings updated successfully!');
                if (onSettingsUpdate) {
                    onSettingsUpdate(localSettings);
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

    return (
        <div className="bg-white rounded-[16px]  border border-[#E5E7EB] p-6 mb-8 -mt-3">
            <h2 className="text-[18px] font-[800] text-general-text mb-6">Points Earning Settings</h2>

            <div className="space-y-6">
                {/* Points per Dollar */}
                <div>
                    <label className="block text-sm font-medium text-[#0F1724] mb-3">Points per $1 spent</label>
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-[13px] text-[#374151] mb-1">Points earned per dollar</label>
                        <input
                            type="number"
                            value={localSettings.points_per_dollar}
                            onChange={(e) => handleInputChange('points_per_dollar', e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            min="0"
                        />
                    </div>
                </div>

                {/* Bonus Points */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div className=''>
                        <p className="text-[15px] font-medium text-general-text">Bonus Points on First Order</p>
                        <p className="text-[13px] text-[#6B7280]">Reward new customers with extra points on their first order</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ">
                        <input 
                            type="checkbox" 
                            checked={localSettings.first_order_bonus_points > 0} 
                            onChange={(e) => handleInputChange('first_order_bonus_points', e.target.checked ? 50 : 0)} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                {localSettings.first_order_bonus_points > 0 && (
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-[13px] text-[#374151] mb-1">Bonus points amount</label>
                        <input
                            type="number"
                            value={localSettings.first_order_bonus_points}
                            onChange={(e) => handleInputChange('first_order_bonus_points', e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                )}

                {/* Minimum Order */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                        <p className="text-[15px] font-medium text-general-text">Minimum Order Requirement</p>
                        <p className="text-[13px] text-[#6B7280]">Set a minimum spend amount to earn points</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={localSettings.min_order_to_earn_points > 0} 
                            onChange={(e) => handleInputChange('min_order_to_earn_points', e.target.checked ? 5 : 0)} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                {localSettings.min_order_to_earn_points > 0 && (
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-xs text-gray-600 mb-1">Minimum amount ($)</label>
                        <input
                            type="number"
                            value={localSettings.min_order_to_earn_points}
                            onChange={(e) => handleInputChange('min_order_to_earn_points', e.target.value)}
                            step="0.01"
                            className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                )}

                {/* Points Expiry */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                        <p className="text-[15px] font-medium text-general-text">Points Expiry</p>
                        <p className="text-[13px] text-[#6B7280]">Set an expiration period for loyalty points</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={localSettings.points_expiry_days > 0} 
                            onChange={(e) => handleInputChange('points_expiry_days', e.target.checked ? 365 : 0)} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                {localSettings.points_expiry_days > 0 && (
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-xs text-gray-600 mb-1">Expiry period (days)</label>
                        <input
                            type="number"
                            value={localSettings.points_expiry_days}
                            onChange={(e) => handleInputChange('points_expiry_days', e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            min="0"
                        />
                    </div>
                )}

                {/* Program Active Status */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                        <p className="text-[15px] font-medium text-general-text">Loyalty Program Status</p>
                        <p className="text-[13px] text-[#6B7280]">Enable or disable the loyalty program</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={localSettings.is_active} 
                            onChange={(e) => handleInputChange('is_active', e.target.checked)} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                className="mt-8 px-4 py-2 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 transition-colors flex items-center text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
};

export default PointsEarningSettings;
