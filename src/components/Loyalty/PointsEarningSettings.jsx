import React, { useState } from 'react';
import { Save } from 'lucide-react';

const PointsEarningSettings = () => {
    const [earningMethod, setEarningMethod] = useState('fixed');
    const [bonusEnabled, setBonusEnabled] = useState(true);
    const [minOrderEnabled, setMinOrderEnabled] = useState(true);
    const [expiryEnabled, setExpiryEnabled] = useState(true);

    return (
        <div className="bg-white rounded-[16px]  border border-[#E5E7EB] p-6 mb-8 -mt-3">
            <h2 className="text-[18px] font-[800] text-general-text mb-6">Points Earning Settings</h2>

            <div className="space-y-6">
                {/* Earning Method */}
                <div>
                    <label className="block text-sm font-medium text-[#0F1724] mb-3">Earning Method</label>
                    <div className="space-y-3">
                        <div
                            className={`flex items-center p-4 border rounded-[8px] bg-[#FFFFFF] cursor-pointer transition-colors ${earningMethod === 'per-dollar' ? 'border-primary bg-primary/5' : 'border-[#E5E7EB]'}`}
                            onClick={() => setEarningMethod('per-dollar')}
                        >
                            <input
                                type="radio"
                                checked={earningMethod === 'per-dollar'}
                                onChange={() => setEarningMethod('per-dollar')}
                                className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <div className="ml-3">
                                <p className="text-[14px] font-[500] text-general-text">Points per $1 spent</p>
                                <p className="text-[13px] text-[#6B7280]">Customers earn points based on order value</p>
                            </div>
                        </div>

                        <div
                            className={`flex flex-col bg-[#E6F7F4] p-4 border rounded-lg cursor-pointer transition-colors ${earningMethod === 'fixed' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                            onClick={() => setEarningMethod('fixed')}
                        >
                            <div className="flex items-center mb-3">
                                <input
                                    type="radio"
                                    checked={earningMethod === 'fixed'}
                                    onChange={() => setEarningMethod('fixed')}
                                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                                />
                                <div className="ml-3">
                                    <p className="text-[14px] font-[500] text-general-text">Fixed points per order</p>
                                    <p className="text-[13px] text-[#6B7280]">Every completed order earns the same points</p>
                                </div>
                            </div>
                            {earningMethod === 'fixed' && (
                                <div className="ml-7">
                                    <label className="block text-xs text-gray-600 mb-1">Points per completed order</label>
                                    <input
                                        type="number"
                                        defaultValue="50"
                                        className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <p className="mt-1 text-[10px] text-gray-400 font-medium">Every order = 50 points (regardless of value)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bonus Points */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div className=''>
                        <p className="text-[15px] font-medium text-general-text">Bonus Points on First Order</p>
                        <p className="text-[13px] text-[#6B7280]">Reward new customers with extra points on their first order</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ">
                        <input type="checkbox" checked={bonusEnabled} onChange={() => setBonusEnabled(!bonusEnabled)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                {bonusEnabled && (
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-[13px] text-[#374151] mb-1">Bonus points amount</label>
                        <input
                            type="number"
                            defaultValue="50"
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
                        <input type="checkbox" checked={minOrderEnabled} onChange={() => setMinOrderEnabled(!minOrderEnabled)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                {minOrderEnabled && (
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-xs text-gray-600 mb-1">Minimum amount ($)</label>
                        <input
                            type="number"
                            defaultValue="5"
                            className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                )}

                {/* Points Expiry */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                        <p className="text-[15px]font-medium text-general-text">Points Expiry</p>
                        <p className="text-[13px] text-[#6B7280]">Set an expiration period for loyalty points</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={expiryEnabled} onChange={() => setExpiryEnabled(!expiryEnabled)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                {expiryEnabled && (
                    <div className="bg-[#E6F7F4] p-4 rounded-[6px]">
                        <label className="block text-xs text-gray-600 mb-1">Expiry period</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option className='text-[12px]'>Doesn't expire</option>
                            <option className='text-[12px]'>6 Months</option>
                            <option className='text-[12px]'>12 Months</option>
                        </select>
                    </div>
                )}
            </div>

            <button className="mt-8 px-4 py-2 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 transition-colors flex items-center text-[14px]">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
            </button>
        </div>
    );
};

export default PointsEarningSettings;
