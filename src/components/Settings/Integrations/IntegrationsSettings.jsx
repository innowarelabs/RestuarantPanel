import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, Check, Circle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

/** Same list as onboarding Step9 */
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

const extractPayload = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string') {
        const text = raw.trim();
        if (!text) return null;
        try {
            return extractPayload(JSON.parse(text));
        } catch {
            return null;
        }
    }
    if (typeof raw !== 'object') return null;
    const nested = raw?.data?.data && typeof raw.data.data === 'object' ? raw.data.data : null;
    const top = raw?.data && typeof raw.data === 'object' ? raw.data : null;
    return nested || top || raw;
};

const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
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

/** Mask saved secret: fixed asterisks + last 4 chars (when longer than 4). */
function maskSecretTail4(plain) {
    const t = String(plain ?? '').trim();
    if (!t) return '';
    if (t.length <= 4) return '********';
    return `${'*'.repeat(8)}${t.slice(-4)}`;
}

function IntegrationsSkeleton() {
    return (
        <div className="space-y-10" role="status" aria-label="Loading integrations">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:max-w-none max-w-3xl">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="flex flex-col justify-between space-y-4 rounded-[12px] border border-[#E5E7EB] bg-white p-6"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-[8px] bg-[#E8E8E8]" />
                                    <div className="h-5 w-32 max-w-[60%] animate-pulse rounded bg-[#E8E8E8]" />
                                </div>
                                <div className="h-9 w-[88px] shrink-0 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
                            </div>
                            <div className="space-y-2 pt-1">
                                <div className="h-3 w-full animate-pulse rounded bg-[#F3F4F6]" />
                                <div className="h-3 w-[92%] animate-pulse rounded bg-[#F3F4F6]" />
                                <div className="h-3 w-[70%] animate-pulse rounded bg-[#F3F4F6]" />
                            </div>
                            <div className="h-[44px] w-full animate-pulse rounded-[8px] bg-[#E8E8E8]" />
                        </div>
                        <div className="h-[45px] w-full animate-pulse rounded-[8px] bg-[#E8E8E8]" />
                    </div>
                ))}
            </div>
            <div className="h-[45px] w-[min(100%,200px)] max-w-[200px] animate-pulse rounded-[8px] bg-[#E8E8E8]" />
        </div>
    );
}

const IntegrationsSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [restaurantId, setRestaurantId] = useState('');

    const [formData, setFormData] = useState({
        doorDashConnected: false,
        posConnected: false,
        doordash_info: '',
        pos_key: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [errorLines, setErrorLines] = useState([]);
    const [doorDashFieldFocused, setDoorDashFieldFocused] = useState(false);
    const [posFieldFocused, setPosFieldFocused] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

                const step1Url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step1`;
                const res1 = await fetch(step1Url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const ct1 = res1.headers.get('content-type');
                const raw1 = ct1?.includes('application/json') ? await res1.json() : await res1.text();
                const step1 = extractPayload(raw1);

                const resolvedId =
                    (step1 && typeof step1 === 'object' && typeof step1.id === 'string' ? step1.id.trim() : '') ||
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() ||
                    getRestaurantIdFromUser(authUser);

                if (!resolvedId) {
                    setLoadError('Restaurant not found. Sign in again or finish onboarding.');
                    return;
                }

                setRestaurantId(resolvedId);

                const detailUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(resolvedId)}`;
                const resDetail = await fetch(detailUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const ctDetail = resDetail.headers.get('content-type');
                const rawDetail = ctDetail?.includes('application/json') ? await resDetail.json() : await resDetail.text();

                if (!resDetail.ok) {
                    const msg =
                        typeof rawDetail === 'object' && rawDetail?.message
                            ? rawDetail.message
                            : typeof rawDetail === 'string'
                              ? rawDetail
                              : 'Failed to load restaurant';
                    setLoadError(msg);
                    return;
                }

                const r = extractPayload(rawDetail);
                if (!r || typeof r !== 'object') {
                    setLoadError('Invalid restaurant response');
                    return;
                }

                const ddInfo = typeof r.doordash_info === 'string' ? r.doordash_info : '';
                const pk = typeof r.pos_key === 'string' ? r.pos_key : '';
                const ddOn = normalizeBool(r.enable_doordash);

                setFormData({
                    doorDashConnected: String(ddInfo).trim() !== '' || ddOn === true,
                    posConnected: String(pk).trim() !== '',
                    doordash_info: ddInfo,
                    pos_key: pk,
                });
            } catch (e) {
                setLoadError(e?.message || 'Failed to load integrations');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [accessToken, authUser]);

    const toggleIntegration = (key, fieldKey) => {
        setFormData((prev) => {
            const nextConnected = !prev[key];
            if (!nextConnected) {
                return { ...prev, [key]: false, [fieldKey]: '' };
            }
            return { ...prev, [key]: true };
        });
    };

    const saveRestaurantIntegrations = async ({ enable_doordash, doordash_info, pos_key }) => {
        if (!restaurantId) {
            setErrorLines(['Restaurant not found. Sign in again or finish onboarding.']);
            return false;
        }
        if (submitting) return false;

        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(restaurantId)}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    enable_doordash: !!enable_doordash,
                    doordash_info: typeof doordash_info === 'string' ? doordash_info : '',
                    pos_key: typeof pos_key === 'string' ? pos_key : '',
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                setErrorLines(
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
                return false;
            }

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                setErrorLines([
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : data.code.trim() || 'Update failed',
                ]);
                return false;
            }

            const rawMsg =
                data && typeof data === 'object' && typeof data.message === 'string' ? data.message.trim() : '';
            toast.success(
                rawMsg ? `Integrations updated — ${rawMsg}` : 'Integrations updated successfully.',
            );
            return true;
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async () => {
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

        await saveRestaurantIntegrations({
            enable_doordash: formData.doorDashConnected,
            doordash_info,
            pos_key,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Integrations</h2>
                <p className="text-[#6B6B6B] text-[14px]">Connect DoorDash and POS, then save your integration credentials.</p>
            </div>

            {loading && <IntegrationsSkeleton />}
            {!loading && loadError && (
                <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
            )}

            {!loading && !loadError && (
                <div className="space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl sm:max-w-none">
                        {INTEGRATIONS.map((item) => {
                            const connected = !!formData[item.key];
                            const fieldValue = String(formData[item.fieldKey] ?? '');
                            const inputId = `settings-integrations-${item.fieldKey}`;
                            const hasStoredValue = connected && fieldValue.trim() !== '';
                            const isFocused =
                                item.fieldKey === 'doordash_info' ? doorDashFieldFocused : posFieldFocused;
                            const displayValue =
                                hasStoredValue && !isFocused ? maskSecretTail4(fieldValue) : fieldValue;
                            const setFocused =
                                item.fieldKey === 'doordash_info' ? setDoorDashFieldFocused : setPosFieldFocused;
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
                                                className={`inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2.5 py-2 font-sans text-[12px] font-medium not-italic leading-[18px] tracking-normal [leading-trim:none] ${
                                                    connected
                                                        ? 'bg-[#DD2F2626] text-primary'
                                                        : 'bg-[#F3F4F6] text-[#64748B]'
                                                }`}
                                            >
                                                {connected ? (
                                                    <>
                                                        <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden />
                                                        Connected
                                                    </>
                                                ) : (
                                                    <>
                                                        <Circle className="h-[13px] w-[13px] shrink-0 stroke-[2]" aria-hidden />
                                                        Not Connected
                                                    </>
                                                )}
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
                                                    value={displayValue}
                                                    readOnly={hasStoredValue && !isFocused}
                                                    onFocus={() => setFocused(true)}
                                                    onBlur={() => setFocused(false)}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, [item.fieldKey]: e.target.value }))
                                                    }
                                                    placeholder={item.inputPlaceholder}
                                                    autoComplete="off"
                                                    spellCheck={false}
                                                    className="w-full h-[44px] rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-[500] text-[#111827] outline-none transition read-only:cursor-default read-only:bg-[#F9FAFB] read-only:text-[#374151] focus:border-[#DD2F26] focus:ring-1 focus:ring-[#DD2F26]/20 sm:text-[14px]"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const wasConnected = !!formData[item.key];
                                            toggleIntegration(item.key, item.fieldKey);
                                            if (wasConnected) {
                                                if (item.fieldKey === 'doordash_info') setDoorDashFieldFocused(false);
                                                else setPosFieldFocused(false);
                                            }
                                        }}
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

                    <div className="flex justify-start max-w-3xl sm:max-w-none">
                        <button
                            type="button"
                            disabled={submitting || !restaurantId}
                            onClick={() => void handleSave()}
                            className="flex h-[45px] min-w-[160px] items-center justify-center gap-2 rounded-[8px] bg-[#DD2F26] px-6 text-[14px] font-[500] text-white transition hover:bg-[#C52820] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280] disabled:hover:bg-[#E5E7EB]"
                        >
                            {submitting ? 'Saving...' : 'Save Integrations'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrationsSettings;
