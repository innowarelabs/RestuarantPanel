import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import NotificationToggle from './NotificationToggle';

export default function Step7({ formData, setFormData, handlePrev, handleNext }) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const [submitting, setSubmitting] = useState(false);
    const [errorLines, setErrorLines] = useState([]);
    const enabledChannels = [formData.appNotify, formData.emailNotify, formData.smsNotify].filter(Boolean).length;

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

    const handleSubmitStep7 = async () => {
        const restaurantId = formData.restaurantId?.trim();
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step7`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    notify_enabled: enabledChannels > 0,
                    notify_app: !!formData.appNotify,
                    notify_email: !!formData.emailNotify,
                    notify_sms: !!formData.smsNotify,
                    alert_new_order: !!formData.newOrderAlert,
                    alert_rider_assign: !!formData.riderAlert,
                    alert_complaint: !!formData.complaintAlert,
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
        <div className="space-y-10">
            <div className="space-y-6">
                <h3 className="text-[15px] font-[400] text-[#111827]">General Notifications</h3>
                <div className="space-y-6">
                    <NotificationToggle
                        title="App Notifications"
                        desc="Receive push notifications in the app"
                        active={formData.appNotify}
                        onClick={() => setFormData({ ...formData, appNotify: !formData.appNotify })}
                    />
                    <NotificationToggle
                        title="Email Notifications"
                        desc="Receive notifications via email"
                        active={formData.emailNotify}
                        onClick={() => setFormData({ ...formData, emailNotify: !formData.emailNotify })}
                    />
                    <NotificationToggle
                        title="SMS Notifications"
                        desc="Receive text messages for critical updates"
                        active={formData.smsNotify}
                        onClick={() => setFormData({ ...formData, smsNotify: !formData.smsNotify })}
                    />
                </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-6">
                <h3 className="text-[16px] font-[500] text-[#111827]">Alert Preferences</h3>
                <div className="space-y-6">
                    <NotificationToggle
                        title="New Order Alert"
                        desc="Get notified when a new order is placed"
                        active={formData.newOrderAlert}
                        onClick={() => setFormData({ ...formData, newOrderAlert: !formData.newOrderAlert })}
                    />
                    <NotificationToggle
                        title="Rider Assigned Alert"
                        desc="Get notified when a delivery rider is assigned"
                        active={formData.riderAlert}
                        onClick={() => setFormData({ ...formData, riderAlert: !formData.riderAlert })}
                    />
                    <NotificationToggle
                        title="Complaint Received Alert"
                        desc="Get notified about customer complaints"
                        active={formData.complaintAlert}
                        onClick={() => setFormData({ ...formData, complaintAlert: !formData.complaintAlert })}
                    />
                </div>
            </div>

            <div className="bg-[#E6F7F4] p-5 rounded-[8px] mt-2">
                <p className="text-[13px] text-[#475569]">
                    You have {enabledChannels} notification {enabledChannels === 1 ? 'channel' : 'channels'} enabled
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
                <button type="button" onClick={handleSubmitStep7} disabled={submitting} className="next-btn bg-primary text-white px-10">
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
