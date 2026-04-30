import { AlertCircle, ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import Toggle from './Toggle';

/** Section titles: Points Earning Settings, Reward Catalog */
const STEP5_SECTION_TITLE = 'font-sans text-[16px] font-bold leading-[19.2px] tracking-normal text-[#0F1724]';
/** Field / control labels */
const STEP5_FIELD_LABEL = 'font-sans text-[14px] font-medium leading-[21px] tracking-normal text-[#374151]';
const STEP5_FIELD_LABEL_BLOCK = `block ${STEP5_FIELD_LABEL}`;

export default function Step5({
    formData,
    setFormData,
    setEditingReward,
    setShowAddRewardModal,
    onDeleteRewardClick,
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

    /** Treat missing/legacy state as ON (matches defaultFormData). Only explicit `false` turns bonus off. */
    const firstOrderBonusEnabled = formData.bonusFirstOrder !== false;

    const activeRewardsCount = Array.isArray(rewards) ? rewards.filter((r) => r && r.is_active).length : 0;

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
            const firstOrderOn = formData.bonusFirstOrder !== false;
            const bonusFirstOrderPointsValue = Number(firstOrderOn ? formData.bonusAmount?.trim() : 0);
            const minOrderToEarnPointsValue = Number(formData.minOrderLoyalty ? formData.minOrderAmount?.trim() : 0);
            const expiryDaysRaw = Number(formData.expiryPeriod?.trim());
            const pointsExpiryDaysValue = formData.pointsExpire ? (Number.isFinite(expiryDaysRaw) ? Math.trunc(expiryDaysRaw) : 365) : 0;

            // Guide: PUT /api/v1/rewards/loyalty
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/rewards/loyalty`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify({
                    points_per_dollar: Number.isFinite(pointsPerDollarValue) ? Math.trunc(pointsPerDollarValue) : 1,
                    first_order_bonus_points: Number.isFinite(bonusFirstOrderPointsValue) ? Math.trunc(bonusFirstOrderPointsValue) : 0,
                    min_order_to_earn_points: Number.isFinite(minOrderToEarnPointsValue) ? minOrderToEarnPointsValue : 0,
                    points_expiry_days: pointsExpiryDaysValue,
                    is_active: !!formData.loyaltyEnabled,
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

    const loyaltyOn = !!formData.loyaltyEnabled;

    return (
        <div className="space-y-10">
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className={STEP5_FIELD_LABEL_BLOCK}>Enable Loyalty Points</h3>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">Turn on to start rewarding customers with points</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.loyaltyEnabled} onClick={() => setFormData({ ...formData, loyaltyEnabled: !formData.loyaltyEnabled })} />
                </div>
            </div>

            <div className="space-y-5">
                <h3 className={STEP5_SECTION_TITLE}>Points Earning Settings</h3>

                <div className="space-y-2">
                    <label className={STEP5_FIELD_LABEL_BLOCK}>Points earned per $ spent</label>
                    <input
                        type="text"
                        value={formData.pointsPerDollar}
                        onChange={(e) => setFormData({ ...formData, pointsPerDollar: e.target.value })}
                        disabled={!loyaltyOn}
                        className="onboarding-input disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className={STEP5_FIELD_LABEL}>Give bonus points on first order?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Reward new customers with extra points</p>
                        </div>
                        <div className="shrink-0">
                            <Toggle
                                active={firstOrderBonusEnabled}
                                disabled={!loyaltyOn}
                                onClick={() =>
                                    setFormData({ ...formData, bonusFirstOrder: !firstOrderBonusEnabled })
                                }
                            />
                        </div>
                    </div>
                    {firstOrderBonusEnabled ? (
                        <div className="pl-4 border-l-[3px] border-primary space-y-2 pt-0.5">
                            <label className={STEP5_FIELD_LABEL_BLOCK}>Bonus points amount</label>
                            <input
                                type="text"
                                value={formData.bonusAmount}
                                onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                                disabled={!loyaltyOn}
                                className="onboarding-input disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className={STEP5_FIELD_LABEL}>Minimum order amount to earn points?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Set a minimum spend requirement</p>
                        </div>
                        <div className="shrink-0">
                            <Toggle
                                active={formData.minOrderLoyalty}
                                disabled={!loyaltyOn}
                                onClick={() => setFormData({ ...formData, minOrderLoyalty: !formData.minOrderLoyalty })}
                            />
                        </div>
                    </div>
                    {formData.minOrderLoyalty ? (
                        <div className="pl-4 border-l-[3px] border-primary space-y-2 pt-0.5">
                            <label className={STEP5_FIELD_LABEL_BLOCK}>Minimum amount ($)</label>
                            <input
                                type="text"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                disabled={!loyaltyOn}
                                className="onboarding-input disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className={STEP5_FIELD_LABEL}>Points expire?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Set an expiration period for points</p>
                        </div>
                        <div className="shrink-0">
                            <Toggle
                                active={formData.pointsExpire}
                                disabled={!loyaltyOn}
                                onClick={() => setFormData({ ...formData, pointsExpire: !formData.pointsExpire })}
                            />
                        </div>
                    </div>
                    {formData.pointsExpire ? (
                        <div className="pl-4 border-l-[3px] border-primary space-y-2 pt-0.5">
                            <label className={STEP5_FIELD_LABEL_BLOCK}>Expiry period</label>
                            <input
                                type="text"
                                placeholder="365"
                                value={formData.expiryPeriod}
                                onChange={(e) => setFormData({ ...formData, expiryPeriod: e.target.value })}
                                disabled={!loyaltyOn}
                                className="onboarding-input disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className={STEP5_SECTION_TITLE}>Reward Catalog</h3>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">Customers can redeem items with their points</p>
                    </div>
                    <button
                        type="button"
                        disabled={!loyaltyOn}
                        onClick={() => {
                            setEditingReward(null);
                            setShowAddRewardModal(true);
                        }}
                        className="h-10 w-full sm:w-auto px-4 bg-primary text-white rounded-[8px] text-[14px] font-[500] flex items-center justify-center gap-2 hover:bg-[#C52820] transition-colors shadow-sm disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:hover:bg-[#E5E7EB]"
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
                                        <h4 className="truncate font-sans text-[15px] font-semibold leading-[18px] tracking-normal text-[#0F1724]">{reward.reward_name}</h4>
                                        <p className="text-[13px] text-[#6B7280] truncate">{reward.description || '—'}</p>
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <span className="text-[12px] font-[500] text-primary bg-[#DD2F2626] px-2 py-0.5 rounded-[4px]">{reward.points_required} points</span>
                                            <span className={`text-[12px] font-[500] px-2 py-0.5 rounded-[4px] ${reward.is_active ? 'text-[#059669] bg-[#DD2F2633]' : 'text-gray-400 bg-gray-100'}`}>
                                                {reward.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        disabled={!loyaltyOn}
                                        onClick={() => {
                                            setEditingReward(reward);
                                            setShowAddRewardModal(true);
                                        }}
                                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:opacity-40"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!loyaltyOn}
                                        onClick={() => onDeleteRewardClick?.(reward)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-400 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:opacity-40"
                                        aria-label={`Delete reward ${reward.reward_name || ''}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-[12px] border border-primary bg-[#DD2F2626] p-5 space-y-3">
                <h4 className="text-[13px] font-[500] text-primary">Loyalty Program Summary</h4>
                <ul className="space-y-2">
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>Earn {formData.pointsPerDollar || '0'} points per $1 spent</span>
                    </li>
                    {firstOrderBonusEnabled && (
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
                        <span>
                            {activeRewardsCount} active reward{activeRewardsCount === 1 ? '' : 's'} available
                        </span>
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
