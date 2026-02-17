import React, { useState } from 'react';
import { Save, Plus, Clock, AlertCircle } from 'lucide-react';
import AddKitchenDelayModal from './AddKitchenDelayModal';

const OrderSettings = () => {
    const [isAddDelayModalOpen, setIsAddDelayModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Order Settings</h2>
                <p className="text-[#6B6B6B] text-[14px]">Configure order rules and preferences</p>
            </div>

            {/* Order Rules */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-4">Order Rules</h3>
                <div className="space-y-6">
                    {/* Row 1 */}
                    <div className="flex items-center justify-between py-2 border-b border-[#E8E8E8]">
                        <div>
                            <p className="font-[500] text-[14px] text-[#1A1A1A]">Auto-Accept Orders</p>
                            <p className="text-[13px] text-[#9CA3AF]">Automatically accept incoming orders</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 focus:outline-none">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                        <div>
                            <p className="font-[500] text-[14px] text-[#1A1A1A]">Manual Accept Mode</p>
                            <p className="text-[13px] text-[#9CA3AF]">Review and manually accept each order</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#24B99E] focus:outline-none">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                    </div>

                    {/* Row 3 - Min/Max */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Minimum Order Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
                                <input
                                    type="text"
                                    defaultValue="5.00"
                                    className="w-full pl-7 pr-4 py-2  font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Maximum Order Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
                                <input
                                    type="text"
                                    defaultValue="150.00"
                                    className="w-full pl-7 pr-4 py-2 font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 4 - Prep Time */}
                    <div>
                        <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Default Preparation Time</label>
                        <input
                            type="text"
                            placeholder="e.g. 20 (minutes)"
                            className="w-full px-4 py-2 font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                        />
                    </div>

                    {/* Row 5 - Scheduled */}
                    <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                        <div>
                            <p className="font-[500] text-[14px] text-[#1A1A1A]">Allow Scheduled Orders</p>
                            <p className="text-[13px] text-[#9CA3AF]">Let customers schedule orders in advance</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#24B99E] focus:outline-none">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                    </div>

                    {/* Row 6 - Buffer */}
                    <div>
                        <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Scheduling Buffer</label>
                        <input
                            type="text"
                            placeholder="e.g. 15 (minutes)"
                            className="w-full px-4 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                        />
                    </div>

                    {/* Row 7 - Customization */}
                    <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                        <div>
                            <p className="font-[500] text-[14px] text-[#1A1A1A]">Allow Item Customization</p>
                            <p className="text-[13px] text-[#9CA3AF]">Enable special requests and modifications</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#24B99E] focus:outline-none">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                    </div>

                    {/* Row 8 - Out of stock */}
                    <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                        <div>
                            <p className="font-[500] text-[14px] text-[#1A1A1A]">Show Out-of-Stock Items</p>
                            <p className="text-[13px] text-[#9CA3AF]">Display unavailable items with grey overlay</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#24B99E] focus:outline-none">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#20a68d] transition shadow-lg shadow-[#24B99E]/20">
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Active Delay Card */}
            <div className="bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#24B99E] text-white">
                            Active Delay
                        </span>
                        <h3 className="text-[14px] font-[600] text-[#134E4A]">Current Delay: +5 minutes</h3>
                        <p className="text-sm text-[#115E59]">Applied on: 10 Dec 2025, 16:26</p>
                        <p className="text-sm text-[#115E59]">Status: Active</p>
                    </div>
                    <button className="w-full sm:w-auto px-4 py-2 border border-[#FECACA] text-[#EF4444] rounded-lg text-sm hover:bg-[#FEF2F2] transition text-center">
                        Remove Delay
                    </button>
                </div>
            </div>

            {/* Kitchen Delay */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-2">Kitchen Delay</h3>
                <p className="text-[#6B6B6B] text-[14px] mb-6">Temporarily increase preparation time due to high volume or kitchen constraints</p>
                <button
                    onClick={() => setIsAddDelayModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm"
                >
                    <Clock className="w-4 h-4" />
                    Add Delay
                </button>
            </div>

            <AddKitchenDelayModal
                isOpen={isAddDelayModalOpen}
                onClose={() => setIsAddDelayModalOpen(false)}
            />
        </div>
    );
};

export default OrderSettings;
