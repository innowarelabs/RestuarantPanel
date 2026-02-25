import { AlertCircle, ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import Toggle from './Toggle';

export default function Step5({
    formData,
    setFormData,
    setEditingReward,
    setShowAddRewardModal,
    rewards,
    loadingRewards,
    rewardsErrorLines,
    refreshRewards,
    handlePrev,
    handleNext,
}) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const [submitting, setSubmitting] = useState(false);
    const [errorLines, setErrorLines] = useState([]);

    const toValidationErrorLines = (data) => {
        if (!data || typeof data !== 'object') return [];
        if (!Array.isArray(data.detail)) return [];
        return data.detail
            .map((item) => {
                if (!item || typeof item !== 'object') return '';
                const loc = Array.isArray(item.loc) ? item.loc : [];
                const field = typeof loc.at(-1) === 'string' ? loc.at(-1) : '';
                const msg = typeof item.msg === 'string' ? item.msg : '';
                const label = field ? `${field}: ` : '';
                return `${label}${msg}`.trim();
            })
            .filter(Boolean);
    };

    const isSuccessCode = (code) => {
        if (typeof code !== 'string') return true;
        const normalized = code.trim().toUpperCase();
        return normalized.endsWith('_200') || normalized.endsWith('_201');
    };

    const handleSubmitStep5 = async () => {
        const restaurantId = formData.restaurantId?.trim();
        if (submitting) return;
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }

        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const pointsPerDollarValue = Number(formData.pointsPerDollar?.trim());
            const bonusFirstOrderPointsValue = Number(formData.bonusFirstOrder ? formData.bonusAmount?.trim() : 0);
            const minOrderToEarnPointsValue = Number(formData.minOrderLoyalty ? formData.minOrderAmount?.trim() : 0);
            const expiryDaysRaw = Number(formData.expiryPeriod?.trim());
            const pointsExpiryDaysValue = formData.pointsExpire ? (Number.isFinite(expiryDaysRaw) ? Math.trunc(expiryDaysRaw) : 365) : 0;

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step5/settings`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    points_per_dollar: Number.isFinite(pointsPerDollarValue) ? Math.trunc(pointsPerDollarValue) : 1,
                    bonus_first_order_points: Number.isFinite(bonusFirstOrderPointsValue) ? Math.trunc(bonusFirstOrderPointsValue) : 0,
                    min_order_to_earn_points: Number.isFinite(minOrderToEarnPointsValue) ? minOrderToEarnPointsValue : 0,
                    points_expiry_days: pointsExpiryDaysValue,
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                if (lines.length) {
                    setErrorLines(lines);
                } else if (typeof data === 'string' && data.trim()) {
                    setErrorLines([data.trim()]);
                } else if (data && typeof data === 'object') {
                    const message =
                        typeof data.message === 'string'
                            ? data.message
                            : typeof data.error === 'string'
                                ? data.error
                                : 'Request failed';
                    setErrorLines([message]);
                } else {
                    setErrorLines(['Request failed']);
                }
                return;
            }

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                const message =
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : data.code.trim() || 'Request failed';
                setErrorLines([message]);
                return;
            }

            handleNext?.();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
        } finally {
            setSubmitting(false);
        }
    };

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
                                placeholder="365"
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
                    {loadingRewards ? (
                        <div className="py-8 text-center text-[#6B7280] text-[13px]">
                            Loading rewards...
                        </div>
                    ) : rewards.length === 0 ? (
                        <div className="py-8 text-center text-[#6B7280] text-[13px]">
                            No rewards added yet
                        </div>
                    ) : (
                        rewards.map((reward) => (
                            <div key={reward.reward_id} className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-[8px]">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-[64px] h-[64px] bg-[#F6F8F9] rounded-[12px] overflow-hidden border border-[#E5E7EB] shrink-0">
                                        {reward.reward_image ? (
                                            <img src={reward.reward_image} alt={reward.reward_name} className="w-full h-full object-cover" />
                                        ) : null}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h4 className="text-[15px] font-[400] text-[#1A1A1A] truncate">{reward.reward_name}</h4>
                                        <p className="text-[13px] text-[#6B7280] truncate">{reward.description || '—'}</p>
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <span className="text-[12px] font-[500] text-primary bg-[#E6F7F4] px-2 py-0.5 rounded-[4px]">{reward.points_required} points</span>
                                            <span className={`text-[12px] font-[500] px-2 py-0.5 rounded-[4px] ${reward.is_active ? 'text-[#10B981] bg-[#ECFDF5]' : 'text-gray-400 bg-gray-100'}`}>
                                                {reward.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingReward(reward);
                                            setShowAddRewardModal(true);
                                        }}
                                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button type="button" className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
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

            {!!rewardsErrorLines?.length && (
                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                        <div className="space-y-1">
                            {rewardsErrorLines.map((line, idx) => (
                                <p key={idx} className="text-[12px] text-[#47464A] font-normal">
                                    {line}
                                </p>
                            ))}
                            <button
                                type="button"
                                onClick={() => refreshRewards?.(formData.restaurantId?.trim())}
                                className="text-[12px] text-primary font-[500] underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!!errorLines.length && (
                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                        <div className="space-y-1">
                            {errorLines.map((line, idx) => (
                                <p key={idx} className="text-[12px] text-[#47464A] font-normal">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitStep5}
                    className={`next-btn px-10 ${submitting ? 'bg-[#E5E7EB] text-[#6B6B6B]' : 'bg-primary text-white'}`}
                >
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
