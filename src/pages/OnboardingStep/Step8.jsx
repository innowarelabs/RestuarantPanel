import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { isValidOpeningHourTime } from '../../utils/restaurantOperatingHours';

/** Field labels — match Step 5 / Step 7 */
const STEP8_FIELD_LABEL_BLOCK = 'block font-sans text-[14px] font-medium leading-[21px] tracking-normal text-[#374151]';
/** Preview card title */
const STEP8_SECTION_TITLE = 'font-sans text-[16px] font-bold leading-[19.2px] tracking-normal text-[#0F1724]';

/** Optional `start - end`; empty OK. Returns a specific message or null when valid. */
function getChatHoursFieldError(raw) {
    const s = typeof raw === 'string' ? raw.trim() : '';
    if (!s) return null;
    const parts = s.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 2) {
        return 'Use two times with a dash between (e.g. 9:00 AM - 10:00 PM).';
    }
    const [start, end] = parts;
    const startOk = isValidOpeningHourTime(start);
    const endOk = isValidOpeningHourTime(end);
    if (!startOk && !endOk) {
        return 'Invalid time. Use 1–12 with AM or PM (e.g. 9:00 AM), or 24-hour format (e.g. 14:00).';
    }
    if (!startOk) return 'Start time is not valid.';
    if (!endOk) return 'End time is not valid.';
    return null;
}

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

    const chatHoursFieldError = getChatHoursFieldError(formData.chatHours ?? '');
    const chatHoursValid = chatHoursFieldError === null;
    const chatHoursShowError = chatHoursFieldError !== null;

    const restaurantId = formData.restaurantId?.trim();
    const canSubmit =
        !!restaurantId &&
        !!formData.supportEmail?.trim() &&
        !!formData.supportPhone?.trim() &&
        !!formData.autoReply?.trim() &&
        !!formData.chatGreeting?.trim() &&
        chatHoursValid;

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
                <label className={STEP8_FIELD_LABEL_BLOCK}>
                    Support Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@burgerhouse.com"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className={STEP8_FIELD_LABEL_BLOCK}>
                    Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className={STEP8_FIELD_LABEL_BLOCK}>
                    Auto-reply Message <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={formData.autoReply}
                    onChange={(e) => setFormData({ ...formData, autoReply: e.target.value })}
                    placeholder="Message sent to customers when they contact you..."
                    className="onboarding-textarea h-[100px] py-3 resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className={STEP8_FIELD_LABEL_BLOCK}>
                    Chat Greeting Message <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.chatGreeting}
                    onChange={(e) => setFormData({ ...formData, chatGreeting: e.target.value })}
                    placeholder="First message customers see when they open chat..."
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className={STEP8_FIELD_LABEL_BLOCK}>Chat Availability Hours (Optional)</label>
                <input
                    type="text"
                    value={formData.chatHours}
                    onChange={(e) => setFormData({ ...formData, chatHours: e.target.value })}
                    placeholder="9:00 AM - 10:00 PM"
                    className={`onboarding-input ${chatHoursShowError ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : ''}`}
                />
                {chatHoursShowError && chatHoursFieldError ? (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2">
                        <AlertCircle size={16} className="text-[#EB5757] shrink-0 mt-0.5" aria-hidden />
                        <p className="text-[12px] text-[#47464A] leading-snug">{chatHoursFieldError}</p>
                    </div>
                ) : null}
            </div>

            <div className="bg-[#DD2F2626] border border-primary p-5 rounded-[12px] mt-4 space-y-3">
                <h4 className={STEP8_SECTION_TITLE}>Preview: Auto-reply</h4>
                <div className="bg-white p-4 rounded-[8px] border border-[#DD2F26]/10">
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
