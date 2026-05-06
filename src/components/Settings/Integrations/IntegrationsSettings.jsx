import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CreditCard } from 'lucide-react';

const INTEGRATIONS = [
    {
        key: 'doorDashConnected',
        title: 'Door Dash',
        desc: 'Sync orders and menu with DoorDash so customers can order through the platform.',
        kind: 'emoji',
        emoji: '🚗',
    },
    {
        key: 'posConnected',
        title: 'POS System',
        desc: 'Connect your point of sale system',
        kind: 'pos',
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

const IntegrationsSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [doorDashConnected, setDoorDashConnected] = useState(false);
    const [posConnected, setPosConnected] = useState(false);

    const statusByKey = {
        doorDashConnected,
        posConnected,
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Integrations</h2>
                <p className="text-[#6B6B6B] text-[14px]">View integration status (read-only)</p>
            </div>

            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                {loading && <p className="text-[14px] text-[#6B6B6B]">Loading…</p>}
                {!loading && loadError && (
                    <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
                )}

                {!loading && !loadError && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl sm:max-w-none">
                        {INTEGRATIONS.map((item) => {
                            const connected = !!statusByKey[item.key];
                            return (
                                <div
                                    key={item.key}
                                    className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4 flex flex-col"
                                >
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntegrationsSettings;
