import { ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';

import Toggle from './Toggle';

export default function Step5({
    formData,
    setFormData,
    setEditingReward,
    setShowAddRewardModal,
    handlePrev,
    handleNext,
}) {
    return (
        <div className="space-y-10">
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-[14px] font-[500] text-[#1A1A1A]">Enable Loyalty Points</h3>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">Turn on to start rewarding customers with points</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.loyaltyEnabled} onClick={() => setFormData({ ...formData, loyaltyEnabled: !formData.loyaltyEnabled })} />
                </div>
            </div>

            <div className="space-y-5">
                <h3 className="text-[16px] font-[800] text-[#1A1A1A]">Points Earning Settings</h3>

                <div className="space-y-2">
                    <label className="block text-[14px] font-[500] text-[#1A1A1A]">Points earned per $ spent</label>
                    <input
                        type="text"
                        value={formData.pointsPerDollar}
                        onChange={(e) => setFormData({ ...formData, pointsPerDollar: e.target.value })}
                        className="onboarding-input"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Give bonus points on first order?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Reward new customers with extra points</p>
                        </div>
                        <Toggle active={formData.bonusFirstOrder} onClick={() => setFormData({ ...formData, bonusFirstOrder: !formData.bonusFirstOrder })} />
                    </div>
                    {formData.bonusFirstOrder && (
                        <div className="pl-6 border-l-[3px] border-primary ml-1 space-y-3 animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Bonus points amount</label>
                            <input
                                type="text"
                                value={formData.bonusAmount}
                                onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                                className="onboarding-input"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Minimum order amount to earn points?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Set a minimum spend requirement</p>
                        </div>
                        <Toggle active={formData.minOrderLoyalty} onClick={() => setFormData({ ...formData, minOrderLoyalty: !formData.minOrderLoyalty })} />
                    </div>
                    {formData.minOrderLoyalty && (
                        <div className="pl-6 border-l-[3px] border-primary ml-1 space-y-3 animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Minimum amount ($)</label>
                            <input
                                type="text"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                className="onboarding-input"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Points expire?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Set an expiration period for points</p>
                        </div>
                        <Toggle active={formData.pointsExpire} onClick={() => setFormData({ ...formData, pointsExpire: !formData.pointsExpire })} />
                    </div>
                    {formData.pointsExpire && (
                        <div className="pl-6 border-l-[3px] border-primary ml-1 space-y-3 animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Expiry period</label>
                            <input
                                type="text"
                                placeholder="e.g., 6 months"
                                value={formData.expiryPeriod}
                                onChange={(e) => setFormData({ ...formData, expiryPeriod: e.target.value })}
                                className="onboarding-input"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[16px] font-[800] text-[#1A1A1A]">Reward Catalog</h3>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">Items customers can redeem with their points</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingReward(null);
                            setShowAddRewardModal(true);
                        }}
                        className="h-10 w-full sm:w-auto px-4 bg-primary text-white rounded-[8px] text-[14px] font-[500] flex items-center justify-center gap-2 hover:bg-[#20a38b] transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Reward Item
                    </button>
                </div>

                <div className="space-y-3">
                    {[
                        { name: 'Free Ice Cream', desc: 'Ice Cream Cone • Choose any flavour', points: 175, status: 'Active', icon: '🍦' },
                        { name: 'Free Soft Drink', desc: 'Soft Drink • Any size soft drink', points: 120, status: 'Active', icon: '🥤' },
                        { name: 'Free Fries', desc: 'French Fries • Regular portion', points: 150, status: 'Active', icon: '🍟' },
                        { name: 'Free Burger', desc: 'Cheeseburger • Classic cheeseburger', points: 400, status: 'Inactive', icon: '🍔' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-[8px] ">
                            <div className="flex items-center gap-4">
                                <div className="w-[64px] h-[64px] bg-[#F6F8F9] rounded-[12px] flex items-center justify-center text-[24px]">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[15px] font-[400] text-[#1A1A1A]">{item.name}</h4>
                                    <p className="text-[13px] text-[#6B7280]">{item.desc}</p>
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <span className="text-[12px] font-[500] text-primary bg-[#E6F7F4] px-2 py-0.5 rounded-[4px]">{item.points} points</span>
                                        <span className={`text-[12px] font-[500] px-2 py-0.5 rounded-[4px] ${item.status === 'Active' ? 'text-[#10B981] bg-[#ECFDF5]' : 'text-gray-400 bg-gray-100'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditingReward(item);
                                        setShowAddRewardModal(true);
                                    }}
                                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#E6F7F4] border border-[#24B99E] p-5 rounded-[12px] space-y-3">
                <h4 className="text-[13px] font-[500] text-primary">Loyalty Program Summary</h4>
                <ul className="space-y-2">
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>Earn {formData.pointsPerDollar || '0'} points per $1 spent</span>
                    </li>
                    {formData.bonusFirstOrder && (
                        <li className="text-[12px] text-[#475569] flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span>New customers get {formData.bonusAmount || '0'} bonus points on first order</span>
                        </li>
                    )}
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{formData.pointsExpire ? `Points expire after period` : 'Points never expire'}</span>
                    </li>
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>3 active rewards available</span>
                    </li>
                </ul>
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
