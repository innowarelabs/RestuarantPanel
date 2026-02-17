import React, { useState } from 'react';
import { Save, Users, Bike } from 'lucide-react';
import ManageDriversModal from './ManageDriversModal';

const DeliverySettings = () => {
    const [isManageDriversModalOpen, setIsManageDriversModalOpen] = useState(false);
    return (
        <div className="space-y-6 rounded-[12px]">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Delivery Settings</h2>
                <p className="text-[#6B6B6B] text-[14px]">Configure delivery zones, fees, and driver management</p>
            </div>

            {/* Delivery Configuration */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-4">Delivery Configuration</h3>

                <div className="space-y-8">
                    {/* Radius Slider */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#4B5563] mb-4">Delivery Radius: 5 km</label>
                        <div className="relative w-full h-2 bg-gray-200 rounded-full">
                            <div className="absolute left-0 top-0 h-full w-[33%] bg-[#E5E7EB] rounded-full"></div>
                            <div className="absolute left-[33%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-[#E5E7EB] rounded-full shadow-sm cursor-pointer"></div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[12px] text-[#9CA3AF]">1 km</span>
                            <span className="text-[12px] text-[#9CA3AF]">15 km</span>
                        </div>
                    </div>

                    {/* Delivery Fee */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#4B5563] mb-1">Delivery Fee</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[14px]">$</span>
                            <input
                                type="text"
                                defaultValue="3.50"
                                className="w-full pl-7 pr-4 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                            />
                        </div>
                    </div>

                    {/* Distance-based Fee */}
                    <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                        <div>
                            <p className="font-semibold text-[#1A1A1A]">Distance-Based Fee</p>
                            <p className="text-[13px] text-[#9CA3AF]">Charge additional fee per kilometer</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 focus:outline-none">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                    </div>

                    {/* Free Delivery Threshold */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#4B5563] mb-1">Free Delivery Threshold</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
                            <input
                                type="text"
                                defaultValue="20.00"
                                className="w-full pl-7 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                            />
                        </div>
                        <p className="text-[13px] text-[#9CA3AF] mt-1">Orders above this amount get free delivery</p>
                    </div>

                    {/* Delivery Method */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#4B5563] mb-1">Delivery Method</label>
                        <div className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg h-10 bg-white"></div>
                    </div>

                    {/* Manage Drivers */}
                    <button
                        onClick={() => setIsManageDriversModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#E8E8E8] rounded-[8px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition"
                    >
                        <Users className="w-4 h-4" />
                        Manage Drivers
                    </button>
                </div>

                <div className="mt-8 flex justify-end">
                    <button className="flex items-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#20a68d] transition">
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Pickup Settings */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-4">Pickup Settings</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-[500] text-[14px] text-[#1A1A1A]">Enable Pickup Orders</p>
                        <p className="text-[13px] text-[#9CA3AF]">Allow customers to collect orders from your restaurant</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#24B99E] focus:outline-none">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                </div>
            </div>
            <ManageDriversModal
                isOpen={isManageDriversModalOpen}
                onClose={() => setIsManageDriversModalOpen(false)}
            />
        </div>
    );
};

export default DeliverySettings;
