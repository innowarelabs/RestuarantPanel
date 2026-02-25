import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import Toggle from './Toggle';

export default function Step4({ formData, setFormData, handlePrev, handleNext }) {
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

    const restaurantId = formData.restaurantId?.trim();
    const minOrderText = formData.minOrder?.trim() || '';
    const minOrderValue = Number(minOrderText);
    const canProceed = !!minOrderText && Number.isFinite(minOrderValue);

    const handleSubmitStep4 = async () => {
        if (!canProceed || submitting) return;
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }

        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const orderCancelTimeout = Number(formData.timeLimit?.trim());
            const orderCancelTimeoutMins = Number.isFinite(orderCancelTimeout) ? Math.trunc(orderCancelTimeout) : 1;

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step4`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    auto_accept_orders: !!formData.autoAccept,
                    order_cancel_timeout_mins: orderCancelTimeoutMins,
                    minimum_order: minOrderValue,
                    allow_special_instructions: !!formData.allowInstructions,
                    cancellation_policy: formData.cancelPolicy?.trim() || '',
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
        <form className="space-y-7">
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Auto Accept Orders</p>
                    <p className="text-[12px] text-[#6B6B6B] mt-1">You will manually accept each order</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.autoAccept} onClick={() => setFormData({ ...formData, autoAccept: !formData.autoAccept })} />
                </div>
            </div>
            <div className="bg-[#E6F7F4] p-5 rounded-[8px] border border-[#E6F7F4] space-y-3">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Accept Order Time Limit (minutes)</label>
                <input type="text" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })} className="onboarding-input h-11" />
                <p className="text-[12px] text-[#6B7280]">Orders will be auto-cancelled if not accepted within this time</p>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Minimum Order Amount <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder='10.00'
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    className="onboarding-input"
                />
            </div>
            <div className="flex items-start sm:items-center justify-between py-2 gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Allow Special Instructions</p>
                    <p className="text-[12px] text-[#6B7280] mt-1">Customers can add special requests to their orders</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.allowInstructions} onClick={() => setFormData({ ...formData, allowInstructions: !formData.allowInstructions })} />
                </div>
            </div>

            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Cancellation Policy</label>
                <textarea
                    placeholder="e.g., Orders can be cancelled within 5 minutes of placement..."
                    value={formData.cancelPolicy}
                    onChange={(e) => setFormData({ ...formData, cancelPolicy: e.target.value })}
                    className="onboarding-textarea"
                />
            </div>
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
                    disabled={!canProceed || submitting}
                    onClick={handleSubmitStep4}
                    className={`next-btn px-10 ${!canProceed || submitting ? 'bg-[#E5E7EB] text-[#6B6B6B]' : 'bg-primary text-white'}`}
                >
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
