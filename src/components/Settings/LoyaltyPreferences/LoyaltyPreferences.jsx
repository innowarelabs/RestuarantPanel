import React, { useState } from 'react';
import { Gift, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import AddRewardRuleModal from './AddRewardRuleModal';

const LoyaltyPreferences = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);

    const settings = [
        { name: 'Enable Loyalty Program', description: 'Allow customers to earn and redeem points', enabled: true },
        { name: 'Allow Reward Redemption at Checkout', description: 'Customers can redeem points during order placement', enabled: true },
        { name: 'Notify Customer When Points Earned', description: 'Send notification after points are credited', enabled: true },
        { name: 'Notify Customer When Reward Redeemed', description: 'Send confirmation when reward is used', enabled: true },
    ];

    const rewardRules = [
        { name: 'Free Ice Cream', requirement: 'Requires 120 Points', status: 'Active', points: '120' },
        { name: 'Free Coffee', requirement: 'Requires 80 Points', status: 'Active', points: '80' },
        { name: 'Free Dessert', requirement: 'Requires 150 Points', status: 'Inactive', points: '150' },
    ];

    const handleAddRule = () => {
        setSelectedRule(null);
        setIsModalOpen(true);
    };

    const handleEditRule = (rule) => {
        setSelectedRule({ ...rule, item: rule.name });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Loyalty Preferences</h2>
                <p className="text-[#6B6B6B] text-[14px]">Configure your loyalty program and reward rules</p>
            </div>

            {/* Loyalty Program Settings */}
            <div className="bg-white rounded-[16px] border border-[#00000033] p-5">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-4">Loyalty Program Settings</h3>
                <div className="space-y-4">
                    {settings.map((item, index) => (
                        <div key={index} className="flex items-start sm:items-center justify-between py-3 border-b border-[#E5E7EB] last:border-0 gap-4">
                            <div className="flex-1">
                                <p className="text-[14px] font-[600] text-[#1A1A1A]">{item.name}</p>
                                <p className="text-[13px] text-[#6B6B6B] mt-0.5">{item.description}</p>
                            </div>
                            <button
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${item.enabled ? 'bg-[#24B99E]' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[12px] font-[500] hover:bg-[#20a68d] transition shadow-lg shadow-[#24B99E]/20 active:scale-95">
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Reward Rules */}
            <div className="bg-white rounded-[16px] border border-[#00000033] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Reward Rules</h3>
                        <p className="text-[14px] text-[#6B6B6B]">Create rules for customers to redeem points.</p>
                    </div>
                    <button
                        onClick={handleAddRule}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#24B99E] text-white px-4 py-2.5 rounded-[12px] text-[14px] font-[500] hover:bg-[#20a68d] transition shadow-lg shadow-[#24B99E]/10 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Reward Rule
                    </button>
                </div>

                <div className="space-y-3">
                    {rewardRules.map((rule, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#E5E7EB] rounded-2xl hover:border-[#24B99E]/30 transition group gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-[#F0FDFA] rounded-xl shrink-0">
                                    <Gift className="w-5 h-5 text-[#24B99E]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-[600] text-[15px] text-[#1A1A1A] truncate">{rule.name}</p>
                                    <p className="text-[13px] text-[#6B6B6B] font-medium">{rule.requirement}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                <span className={`px-3 py-1.5 rounded-[8px] text-[11px] font-[600] uppercase tracking-wider ${rule.status === 'Active' ? 'bg-[#E6F7F4] text-[#24B99E]' : 'bg-gray-100 text-[#6B6B6B]'
                                    }`}>
                                    {rule.status}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEditRule(rule)}
                                        className="p-2 text-[#9CA3AF] hover:text-[#24B99E] transition hover:bg-gray-50 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-[#9CA3AF] hover:text-red-500 transition hover:bg-gray-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddRewardRuleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rule={selectedRule}
            />
        </div>
    );
};

export default LoyaltyPreferences;
