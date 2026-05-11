import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const emptyPromo = () => ({
    code: '',
    discount_type: 'percentage',
    discount_value: '10',
    is_active: true,
    min_order_amount: '0',
});

/**
 * @param {Array<object>} rows
 */
export function buildPromoCodesPayload(rows) {
    const normalizedPromos = [];
    const seen = new Set();
    for (const row of rows || []) {
        const code = String(row.code || '').trim().toUpperCase();
        const hasExtra =
            String(row.discount_value ?? '').trim() !== '' ||
            String(row.min_order_amount ?? '').trim() !== '' ||
            row.discount_type === 'flat';

        if (!code && !hasExtra) continue;
        if (!code) {
            throw new Error('Each promo row must have a code (or clear unused rows).');
        }

        if (seen.has(code)) {
            throw new Error(`Duplicate promo code: ${code}`);
        }
        seen.add(code);

        const dt = row.discount_type === 'flat' ? 'flat' : 'percentage';
        const dv = Number(row.discount_value);
        const mo =
            row.min_order_amount === '' || row.min_order_amount == null
                ? 0
                : Number(row.min_order_amount);
        if (!Number.isFinite(dv) || dv < 0) {
            throw new Error(`Invalid discount value for ${code}`);
        }
        if (!Number.isFinite(mo) || mo < 0) {
            throw new Error(`Invalid minimum order for ${code}`);
        }

        normalizedPromos.push({
            code,
            discount_type: dt,
            discount_value: dv,
            is_active: row.is_active !== false,
            min_order_amount: mo,
        });
    }
    return normalizedPromos;
}

/**
 * First-order discount + promo codes editor (Order Settings & onboarding Step 4).
 */
export default function PromotionsSection({
    firstOrderDiscountEnabled,
    onFirstOrderDiscountEnabledChange,
    firstOrderDiscountValue,
    onFirstOrderDiscountValueChange,
    promoCodes,
    onPromoCodesChange,
}) {
    const updatePromo = (index, patch) => {
        const next = promoCodes.map((row, i) => (i === index ? { ...row, ...patch } : row));
        onPromoCodesChange(next);
    };

    const removePromo = (index) => {
        onPromoCodesChange(promoCodes.filter((_, i) => i !== index));
    };

    const addPromo = () => {
        onPromoCodesChange([...promoCodes, emptyPromo()]);
    };

    return (
        <div className="mt-8 space-y-6 border-t border-[#E8E8E8] pt-8">
            <div>
                <h3 className="mb-1 font-sans text-[18px] font-bold leading-[21.6px] text-[#0F1724]">
                    Promotions
                </h3>
                <p className="text-[13px] text-[#6B7280]">
                    First-order discount and checkout promo codes (saved with order settings).
                </p>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                <div>
                    <p className="font-[500] text-[14px] text-[#1A1A1A]">First-order discount</p>
                    <p className="text-[13px] text-[#9CA3AF]">
                        Value ≤ 100 = % off subtotal; &gt; 100 = flat $ amount (see API doc).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onFirstOrderDiscountEnabledChange(!firstOrderDiscountEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors ${firstOrderDiscountEnabled ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${firstOrderDiscountEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
            </div>

            {firstOrderDiscountEnabled && (
                <div>
                    <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">
                        First-order discount value
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={firstOrderDiscountValue}
                        onChange={(e) => onFirstOrderDiscountValueChange(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DD2F26]"
                        placeholder="e.g. 10 for 10%"
                    />
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-[500] text-[14px] text-[#1A1A1A]">Promo codes</p>
                        <p className="text-[13px] text-[#9CA3AF]">Codes are case-insensitive for customers.</p>
                    </div>
                    <button
                        type="button"
                        onClick={addPromo}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[13px] font-[500] text-[#1A1A1A] hover:bg-gray-50"
                    >
                        <Plus className="w-4 h-4" />
                        Add code
                    </button>
                </div>

                {promoCodes.length === 0 ? (
                    <p className="text-[13px] text-[#9CA3AF]">No promo codes yet.</p>
                ) : (
                    <div className="space-y-4">
                        {promoCodes.map((row, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-[#E5E7EB] p-4 space-y-3 bg-[#FAFAFA]"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-[12px] font-[600] text-[#6B7280]">Promo {index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removePromo(index)}
                                        className="p-1 text-[#EF4444] hover:bg-red-50 rounded"
                                        aria-label="Remove promo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[12px] text-[#6B7280] mb-1">Code</label>
                                        <input
                                            type="text"
                                            value={row.code}
                                            onChange={(e) => updatePromo(index, { code: e.target.value })}
                                            className="w-full px-3 py-2 text-[14px] border border-[#E5E7EB] rounded-lg uppercase"
                                            placeholder="WELCOME10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] text-[#6B7280] mb-1">Type</label>
                                        <select
                                            value={row.discount_type}
                                            onChange={(e) => updatePromo(index, { discount_type: e.target.value })}
                                            className="w-full px-3 py-2 text-[14px] border border-[#E5E7EB] rounded-lg bg-white"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="flat">Flat ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[12px] text-[#6B7280] mb-1">
                                            Discount value
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={row.discount_value}
                                            onChange={(e) => updatePromo(index, { discount_value: e.target.value })}
                                            className="w-full px-3 py-2 text-[14px] border border-[#E5E7EB] rounded-lg"
                                            placeholder={row.discount_type === 'percentage' ? '10' : '5'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] text-[#6B7280] mb-1">
                                            Min. order ($)
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={row.min_order_amount}
                                            onChange={(e) =>
                                                updatePromo(index, { min_order_amount: e.target.value })
                                            }
                                            className="w-full px-3 py-2 text-[14px] border border-[#E5E7EB] rounded-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!row.is_active}
                                        onChange={(e) => updatePromo(index, { is_active: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    Active
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export { emptyPromo };
