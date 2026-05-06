import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, Bell, Mail, MessageCircle, Save, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const SETTINGS_KEYS = [
    'notify_enabled',
    'notify_app',
    'notify_email',
    'notify_sms',
    'alert_new_order',
    'alert_rider_assign',
    'alert_complaint',
    'new_order_sound_notification',
];

const defaultSettings = () => ({
    notify_enabled: false,
    notify_app: false,
    notify_email: false,
    notify_sms: false,
    alert_new_order: true,
    alert_rider_assign: true,
    alert_complaint: true,
    new_order_sound_notification: true,
});

/** Channel toggles map 1:1 to API `notify_*` fields. */
const CHANNEL_ROWS = [
    {
        key: 'notify_enabled',
        name: 'Notifications',
        description: 'Master switch for notification delivery.',
        Icon: Bell,
    },
    {
        key: 'notify_email',
        name: 'Email',
        description: 'Send alerts to your registered email.',
        Icon: Mail,
    },
    {
        key: 'notify_sms',
        name: 'SMS',
        description: 'Send alerts by text message.',
        Icon: MessageCircle,
    },
    {
        key: 'notify_app',
        name: 'In-app',
        description: 'Show alerts inside the restaurant dashboard.',
        Icon: Smartphone,
    },
];

const ALERT_ROWS = [
    {
        key: 'alert_new_order',
        name: 'New orders',
        description: 'Alert when a new order is received.',
    },
    {
        key: 'alert_rider_assign',
        name: 'Rider assigned',
        description: 'Alert when a rider is assigned to an order.',
    },
    {
        key: 'alert_complaint',
        name: 'Complaints',
        description: 'Alert when a complaint or support issue needs attention.',
    },
    {
        key: 'new_order_sound_notification',
        name: 'New order sound',
        description: 'Play a sound in the dashboard for new orders.',
    },
];

const extractPayload = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const nested = raw?.data?.data && typeof raw.data.data === 'object' ? raw.data.data : null;
    const top = raw?.data && typeof raw.data === 'object' ? raw.data : null;
    return nested || top;
};

const normalizeBool = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes') return true;
        if (v === 'false' || v === '0' || v === 'no') return false;
    }
    return null;
};

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
    return normalized.endsWith('_200') || normalized.endsWith('_201') || normalized.endsWith('_202');
};

function pickSettingsFromPayload(payload) {
    const next = defaultSettings();
    if (!payload || typeof payload !== 'object') return next;
    for (const k of SETTINGS_KEYS) {
        if (!(k in payload)) continue;
        const nb = normalizeBool(payload[k]);
        if (nb !== null) next[k] = nb;
    }
    return next;
}

function NotificationsSettingsSkeleton() {
    return (
        <div className="space-y-6" role="status" aria-label="Loading notification settings">
            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                <div className="mb-4 h-[22px] w-[200px] max-w-[70%] animate-pulse rounded bg-[#E8E8E8]" />
                <div className="space-y-4">
                    {CHANNEL_ROWS.map((row) => (
                        <div
                            key={row.key}
                            className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-[#E8E8E8]" />
                                <div className="space-y-2">
                                    <div className="h-4 w-[120px] animate-pulse rounded bg-[#E8E8E8]" />
                                    <div className="h-3 w-[min(100%,240px)] max-w-[85%] animate-pulse rounded bg-[#F3F4F6]" />
                                </div>
                            </div>
                            <div className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-[#E8E8E8]" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white">
                <div className="border-b border-[#E5E7EB] p-5">
                    <div className="h-[22px] w-[140px] animate-pulse rounded bg-[#E8E8E8]" />
                    <div className="mt-2 h-3 w-[min(100%,320px)] max-w-[90%] animate-pulse rounded bg-[#F3F4F6]" />
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                    {ALERT_ROWS.map((row) => (
                        <div key={row.key} className="flex items-center justify-between px-5 py-4">
                            <div className="space-y-2">
                                <div className="h-4 w-[100px] animate-pulse rounded bg-[#E8E8E8]" />
                                <div className="h-3 w-[min(100%,280px)] max-w-[85%] animate-pulse rounded bg-[#F3F4F6]" />
                            </div>
                            <div className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-[#E8E8E8]" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end border-t border-[#E5E7EB] bg-gray-50/50 p-5">
                    <div className="h-10 w-[140px] animate-pulse rounded-[8px] bg-[#E8E8E8]" />
                </div>
            </div>
        </div>
    );
}

const NotificationsSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [settings, setSettings] = useState(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [saveErrors, setSaveErrors] = useState([]);

    const loadSettings = useCallback(async (opts = {}) => {
        const silent = !!opts.silent;
        if (!accessToken) {
            if (!silent) setLoading(false);
            return;
        }
        if (!silent) {
            setLoading(true);
            setLoadError('');
        }
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/settings/notifications`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const contentType = res.headers.get('content-type');
            const raw = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const msg =
                    typeof raw === 'object' && raw?.message
                        ? raw.message
                        : typeof raw === 'string'
                          ? raw
                          : `Failed to load (${res.status})`;
                if (!silent) setLoadError(msg);
                return;
            }

            const payload = extractPayload(raw);
            if (!payload || typeof payload !== 'object') {
                if (!silent) setLoadError('Invalid notification settings response');
                return;
            }

            setSettings(pickSettingsFromPayload(payload));
        } catch (e) {
            if (!silent) setLoadError(e?.message || 'Failed to load notification settings');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const toggleKey = (key) => {
        setSettings((s) => ({ ...s, [key]: !s[key] }));
    };

    const handleSave = async () => {
        if (!accessToken) return;
        setSaving(true);
        setSaveErrors([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/settings/notifications`;
            const body = {
                notify_enabled: !!settings.notify_enabled,
                notify_app: !!settings.notify_app,
                notify_email: !!settings.notify_email,
                notify_sms: !!settings.notify_sms,
                alert_new_order: !!settings.alert_new_order,
                alert_rider_assign: !!settings.alert_rider_assign,
                alert_complaint: !!settings.alert_complaint,
                new_order_sound_notification: !!settings.new_order_sound_notification,
            };

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(body),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                setSaveErrors(
                    lines.length
                        ? lines
                        : [
                              typeof data === 'object' && data?.message
                                  ? data.message
                                  : typeof data === 'string' && data.trim()
                                    ? data.trim()
                                    : `Update failed (${res.status})`,
                          ],
                );
                return;
            }

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                setSaveErrors([
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : data.code.trim() || 'Update failed',
                ]);
                return;
            }

            const rawMsg =
                data && typeof data === 'object' && typeof data.message === 'string' ? data.message.trim() : '';
            toast.success(rawMsg || 'Notification settings saved');
            await loadSettings({ silent: true });
        } catch (e) {
            setSaveErrors([e?.message || 'Update failed']);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Notifications</h2>
                <p className="text-[#6B6B6B] text-[14px]">Manage notification channels and alerts for your restaurant.</p>
            </div>

            {loading && <NotificationsSettingsSkeleton />}
            {!loading && loadError && (
                <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
            )}

            {!loading && !loadError && (
                <>
                    <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                        <h3 className="mb-4 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                            Notification channels
                        </h3>
                        <div className="space-y-4">
                            {CHANNEL_ROWS.map((row) => {
                                const Icon = row.Icon;
                                const on = !!settings[row.key];
                                return (
                                    <div key={row.key} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-gray-50">
                                                <Icon className="h-5 w-5 text-[#9CA3AF]" />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-[500] text-[#1A1A1A]">{row.name}</p>
                                                <p className="text-[13px] text-[#9CA3AF]">{row.description}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleKey(row.key)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${on ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white">
                        <div className="border-b border-[#E5E7EB] p-5">
                            <h3 className="text-[18px] font-semibold text-[#1A1A1A]">Alerts & sounds</h3>
                            <p className="mt-1 text-[13px] text-[#6B7280]">Which events should trigger alerts in your dashboard.</p>
                        </div>
                        <div className="divide-y divide-[#E5E7EB]">
                            {ALERT_ROWS.map((row) => {
                                const on = !!settings[row.key];
                                return (
                                    <div key={row.key} className="flex items-center justify-between px-5 py-4">
                                        <div>
                                            <p className="text-[14px] font-[500] text-[#1A1A1A]">{row.name}</p>
                                            <p className="text-[13px] text-[#9CA3AF]">{row.description}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleKey(row.key)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${on ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {!!saveErrors.length && (
                            <div className="border-t border-[#E5E7EB] bg-[#F751511F] px-5 py-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={18} className="mt-[2px] shrink-0 text-[#EB5757]" />
                                    <div className="space-y-1">
                                        {saveErrors.map((line, idx) => (
                                            <p key={idx} className="text-[12px] text-[#47464A]">
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end border-t border-[#E5E7EB] bg-gray-50/50 p-5">
                            <button
                                type="button"
                                disabled={saving || !accessToken}
                                onClick={() => void handleSave()}
                                className="flex items-center gap-2 rounded-[8px] bg-[#DD2F26] px-6 py-2.5 text-[14px] font-[500] text-white transition hover:bg-[#C52820] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280]"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving…' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationsSettings;
