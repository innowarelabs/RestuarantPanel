import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

export default function Step8({ formData, setFormData, handlePrev, handleNext }) {
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
    const canSubmit =
        !!restaurantId &&
        !!formData.supportEmail?.trim() &&
        !!formData.supportPhone?.trim() &&
        !!formData.autoReply?.trim() &&
        !!formData.chatGreeting?.trim();

    const handleSubmitStep8 = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step8`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    support_email: formData.supportEmail.trim(),
                    contact_phone: formData.supportPhone.trim(),
                    auto_msg_reply: formData.autoReply.trim(),
                    chat_gathering_msg: formData.chatGreeting.trim(),
                    chat_availability: true,
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
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Support Email <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@burgerhouse.com"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Contact Phone <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Auto-reply Message <span className="text-red-500">*</span></label>
                <textarea
                    value={formData.autoReply}
                    onChange={(e) => setFormData({ ...formData, autoReply: e.target.value })}
                    placeholder="Message sent to customers when they contact you..."
                    className="onboarding-textarea h-[100px] py-3 resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Chat Greeting Message <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.chatGreeting}
                    onChange={(e) => setFormData({ ...formData, chatGreeting: e.target.value })}
                    placeholder="First message customers see when they open chat..."
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Chat Availability Hours (Optional)</label>
                <input
                    type="text"
                    value={formData.chatHours}
                    onChange={(e) => setFormData({ ...formData, chatHours: e.target.value })}
                    placeholder="9:00 AM - 10:00 PM"
                    className="onboarding-input"
                />
            </div>

            <div className="bg-[#E6F7F4] border border-[#24B99E]/30 p-5 rounded-[12px] mt-4 space-y-3">
                <h4 className="text-[13px] font-[600] text-primary">Preview: Auto-reply</h4>
                <div className="bg-white p-4 rounded-[8px] border border-[#24B99E]/10">
                    <p className="text-[14px] text-[#111827] leading-relaxed">
                        {formData.autoReply || 'Your auto-reply message will appear here...'}
                    </p>
                </div>
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
                    onClick={handleSubmitStep8}
                    className={`next-btn ${canSubmit && !submitting ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'} px-10`}
                >
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
