import { AlertCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const INTEGRATIONS = [
    {
        key: 'doorDashConnected',
        fieldKey: 'doordash_info',
        title: 'Door Dash',
        desc: 'Sync orders and menu with DoorDash so customers can order through the platform.',
        kind: 'emoji',
        emoji: '🚗',
        inputLabel: 'DoorDash merchant id / notes here*',
        inputPlaceholder: 'Enter merchant ID or notes',
    },
    {
        key: 'posConnected',
        fieldKey: 'pos_key',
        title: 'POS System',
        desc: 'Connect your point of sale system',
        kind: 'pos',
        inputLabel: 'Your POS key*',
        inputPlaceholder: 'Enter your POS key',
    },
];

export default function Step9({ formData, setFormData, handlePrev, handleNext }) {
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
        if (typeof data.code !== 'string') return false;
        const code = data.code.trim().toUpperCase();
        if (!code) return false;
        if (code.startsWith('SUCCESS_')) return false;
        if (code.startsWith('ERROR_')) return true;
        if (code.endsWith('_400') || code.endsWith('_401') || code.endsWith('_403') || code.endsWith('_404') || code.endsWith('_422') || code.endsWith('_500')) return true;
        if (data.data === null && typeof data.message === 'string' && data.message.trim()) return true;
        return false;
    };

    const restaurantId = formData.restaurantId?.trim();

    const toggleIntegration = (key, fieldKey) => {
        setFormData((prev) => {
            const nextConnected = !prev[key];
            if (!nextConnected) {
                return { ...prev, [key]: false, [fieldKey]: '' };
            }
            return { ...prev, [key]: true };
        });
    };

    const submitStep9 = async (doordash_info, pos_key) => {
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return false;
        }
        if (submitting) return false;

        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step9`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    doordash_info: typeof doordash_info === 'string' ? doordash_info : '',
                    pos_key: typeof pos_key === 'string' ? pos_key : '',
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
                return false;
            }

            if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
                toast.success(data.message.trim());
            }
            return true;
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextClick = async () => {
        const clientErrors = [];
        if (formData.doorDashConnected && !String(formData.doordash_info ?? '').trim()) {
            clientErrors.push('DoorDash merchant id / notes is required when Door Dash is connected.');
        }
        if (formData.posConnected && !String(formData.pos_key ?? '').trim()) {
            clientErrors.push('Your POS key is required when POS System is connected.');
        }
        if (clientErrors.length) {
            setErrorLines(clientErrors);
            return;
        }

        const doordash_info = formData.doorDashConnected ? String(formData.doordash_info ?? '').trim() : '';
        const pos_key = formData.posConnected ? String(formData.pos_key ?? '').trim() : '';

        const ok = await submitStep9(doordash_info, pos_key);
        if (ok) handleNext?.();
    };

    const handleSkip = async () => {
        const ok = await submitStep9('', '');
        if (!ok) return;
        setFormData((prev) => ({
            ...prev,
            doorDashConnected: false,
            posConnected: false,
            doordash_info: '',
            pos_key: '',
        }));
        handleNext?.();
    };

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl sm:max-w-none">
                {INTEGRATIONS.map((item) => {
                    const connected = !!formData[item.key];
                    const fieldValue = String(formData[item.fieldKey] ?? '');
                    const inputId = `step9-${item.fieldKey}`;
                    return (
                        <div
                            key={item.key}
                            className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 flex flex-col justify-between hover:border-primary/40 transition-all"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 shrink-0 bg-[#F3F4F6] rounded-[8px] flex items-center justify-center text-[22px]">
                                            {item.kind === 'emoji' ? (
                                                item.emoji
                                            ) : (
                                                <CreditCard className="w-6 h-6 text-amber-500" strokeWidth={1.75} />
                                            )}
                                        </div>
                                        <h4 className="text-[16px] font-[600] text-[#111111] truncate">{item.title}</h4>
                                    </div>
                                    <span
                                        className={`shrink-0 text-[12px] font-[500] px-2.5 py-2 rounded-[8px] ${
                                            connected
                                                ? 'text-emerald-700 bg-emerald-50'
                                                : 'text-[#64748B] bg-[#F3F4F6]'
                                        }`}
                                    >
                                        {connected ? 'Connected' : 'Not Connected'}
                                    </span>
                                </div>
                                <p className="text-[14px] text-[#64748B] leading-[1.5]">{item.desc}</p>
                                {connected ? (
                                    <div className="space-y-1 pt-1">
                                        <label htmlFor={inputId} className="block text-[13px] font-[500] text-[#1A1A1A]">
                                            {item.inputLabel}
                                        </label>
                                        <input
                                            id={inputId}
                                            type="text"
                                            value={fieldValue}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, [item.fieldKey]: e.target.value }))}
                                            placeholder={item.inputPlaceholder}
                                            className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px]"
                                        />
                                    </div>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleIntegration(item.key, item.fieldKey)}
                                className={`w-full h-[45px] rounded-[8px] font-[500] text-[16px] transition-all ${
                                    connected
                                        ? 'border border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F9FAFB]'
                                        : 'bg-[#DD2F26] text-white hover:bg-[#C52820]'
                                }`}
                            >
                                {connected ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {!!errorLines.length && (
                <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px] max-w-3xl">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-[#EB5757] mt-[2px] shrink-0" />
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

            <div className="pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10 w-full sm:w-auto justify-center">
                    <ChevronLeft size={18} /> Previous
                </button>
                <div className="flex items-center justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSkip}
                        className="h-[45px] text-[14px] font-[500] text-[#6B7280] hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                        Skip for now
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleNextClick}
                        className={`next-btn px-10 ${submitting ? 'bg-[#E5E7EB] text-[#6B6B6B]' : 'bg-primary text-white'}`}
                    >
                        {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
