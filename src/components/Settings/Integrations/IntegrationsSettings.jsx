import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, CreditCard, Save } from 'lucide-react';
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
    if (code.endsWith('_400') || code.endsWith('_401') || code.endsWith('_403') || code.endsWith('_404') || code.endsWith('_422') || code.endsWith('_500'))
        return true;
    if (data.data === null && typeof data.message === 'string' && data.message.trim()) return true;
    return false;
};

const IntegrationsSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [restaurantId, setRestaurantId] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [doorDashConnected, setDoorDashConnected] = useState(false);
    const [posConnected, setPosConnected] = useState(false);
    const [doordash_info, setDoordash_info] = useState('');
    const [pos_key, setPos_key] = useState('');

    const [saving, setSaving] = useState(false);
    const [errorLines, setErrorLines] = useState([]);

    const formByKey = {
        doorDashConnected,
        posConnected,
        doordash_info,
        pos_key,
    };

    const setFormField = (fieldKey, value) => {
        if (fieldKey === 'doordash_info') setDoordash_info(value);
        else if (fieldKey === 'pos_key') setPos_key(value);
    };

    const toggleIntegration = (key) => {
        if (key === 'doorDashConnected') {
            const next = !doorDashConnected;
            setDoorDashConnected(next);
            if (!next) setDoordash_info('');
            return;
        }
        if (key === 'posConnected') {
            const next = !posConnected;
            setPosConnected(next);
            if (!next) setPos_key('');
        }
    };

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

                const dd = typeof r.doordash_info === 'string' ? r.doordash_info : '';
                const pk = typeof r.pos_key === 'string' ? r.pos_key : '';
                setDoordash_info(dd);
                setPos_key(pk);
                setDoorDashConnected(dd.trim() !== '');
                setPosConnected(pk.trim() !== '');
            } catch (e) {
                setLoadError(e?.message || 'Failed to load integrations');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [accessToken, authUser]);

    const handleSave = async () => {
        const clientErrors = [];
        if (doorDashConnected && !String(doordash_info ?? '').trim()) {
            clientErrors.push('DoorDash merchant id / notes is required when Door Dash is connected.');
        }
        if (posConnected && !String(pos_key ?? '').trim()) {
            clientErrors.push('Your POS key is required when POS System is connected.');
        }
        if (clientErrors.length) {
            setErrorLines(clientErrors);
            return;
        }

        if (!restaurantId || saving) return;

        const payloadDoordash = doorDashConnected ? String(doordash_info ?? '').trim() : '';
        const payloadPos = posConnected ? String(pos_key ?? '').trim() : '';

        setSaving(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step9`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    doordash_info: payloadDoordash,
                    pos_key: payloadPos,
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

            if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
                toast.success(data.message.trim());
            } else {
                toast.success('Integrations saved');
            }
        } catch (e) {
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Integrations</h2>
                <p className="text-[#6B6B6B] text-[14px]">Connect DoorDash and your POS system</p>
            </div>

            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                {loading && <p className="text-[14px] text-[#6B6B6B]">Loading…</p>}
                {!loading && loadError && (
                    <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
                )}

                {!loading && !loadError && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl sm:max-w-none">
                            {INTEGRATIONS.map((item) => {
                                const connected = !!formByKey[item.key];
                                const fieldValue = String(formByKey[item.fieldKey] ?? '');
                                const inputId = `integrations-${item.fieldKey}`;
                                return (
                                    <div
                                        key={item.key}
                                        className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 flex flex-col justify-between hover:border-[#DD2F26]/40 transition-all"
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
                                                        connected ? 'text-emerald-700 bg-emerald-50' : 'text-[#64748B] bg-[#F3F4F6]'
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
                                                        onChange={(e) => setFormField(item.fieldKey, e.target.value)}
                                                        placeholder={item.inputPlaceholder}
                                                        className="w-full h-11 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-[500] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#DD2F26]"
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleIntegration(item.key)}
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
                            <div className="mt-6 bg-[#F751511F] rounded-[12px] py-[10px] px-[12px] max-w-3xl">
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

                        <div className="mt-8 flex justify-start">
                            <button
                                type="button"
                                disabled={saving || !restaurantId}
                                onClick={handleSave}
                                className="flex items-center justify-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#C52820] transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving…' : 'Save integrations'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IntegrationsSettings;
