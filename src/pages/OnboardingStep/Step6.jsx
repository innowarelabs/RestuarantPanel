import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

export default function Step6({ formData, setFormData, handlePrev, handleNext }) {
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

    const isErrorPayload = (data) => {
        if (!data || typeof data !== 'object') return false;
        const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
        if (!code) return false;
        return code.includes('ERROR') || code.endsWith('_400') || code.endsWith('_401') || code.endsWith('_403') || code.endsWith('_404') || code.endsWith('_500');
    };

    const restaurantId = formData.restaurantId?.trim();
    const rawPayoutFreq = typeof formData.payoutFreq === 'string' ? formData.payoutFreq.trim() : '';
    const normalizedPayoutFreq = rawPayoutFreq && ['daily', 'weekly', 'monthly'].includes(rawPayoutFreq.toLowerCase()) ? rawPayoutFreq.toLowerCase() : rawPayoutFreq;
    const canSubmit =
        !!restaurantId &&
        !!formData.accHolder?.trim() &&
        !!formData.bankName?.trim() &&
        !!formData.accNumber?.trim() &&
        !!normalizedPayoutFreq;

    const handleSubmitStep6 = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step6`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    bank_account_holder_name: formData.accHolder.trim(),
                    bank_name: formData.bankName.trim(),
                    bank_account_number: formData.accNumber.trim(),
                    bank_routing_number: formData.routing?.trim() || '',
                    payout_frequency: normalizedPayoutFreq,
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok || isErrorPayload(data)) {
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

            handleNext();
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="space-y-6">
            <div className="bg-[#FEF3C7] p-5 rounded-[12px] border border-[#F59E0B] flex gap-3">
                <Lock size={18} className="text-[#92400E] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#92400E] leading-relaxed">
                    Your banking information is encrypted and stored securely. We never share your details with third parties.
                </p>
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Account Holder Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.accHolder || ''}
                    onChange={(e) => setFormData({ ...formData, accHolder: e.target.value })}
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Bank Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="e.g., Chase Bank, Bank of America"
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Account Number / IBAN <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="Enter your account number"
                    value={formData.accNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accNumber: e.target.value })}
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Routing Number</label>
                <input
                    type="text"
                    placeholder="9-digit routing number"
                    value={formData.routing || ''}
                    onChange={(e) => setFormData({ ...formData, routing: e.target.value })}
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Payout Frequency <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select
                        className="onboarding-input appearance-none"
                        value={normalizedPayoutFreq}
                        onChange={(e) => setFormData({ ...formData, payoutFreq: e.target.value })}
                    >
                        <option value="">Select frequency...</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            <div className="bg-[#E6F7F4] p-5 rounded-[12px] mt-4">
                <p className="text-[13px] text-[#475569]">
                    <span className="font-[600]">Expected payout:</span> {normalizedPayoutFreq ? `${normalizedPayoutFreq} settlement` : 'Select frequency above'}
                </p>
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
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmitStep6}
                    className={`next-btn ${canSubmit && !submitting ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'} px-10 transition-all`}
                >
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
