import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
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

const isSuccessCode = (code) => {
    if (typeof code !== 'string') return true;
    const normalized = code.trim().toUpperCase();
    return normalized.endsWith('_200') || normalized.endsWith('_201');
};

const formatMinimumOrderInput = (raw) => {
    if (raw === null || raw === undefined || raw === '') return '';
    const n = Number(raw);
    if (!Number.isFinite(n)) return '';
    if (Number.isInteger(n)) return String(n);
    return String(n);
};

const OrderSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [restaurantId, setRestaurantId] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [switches, setSwitches] = useState({
        autoAccept: false,
        scheduledOrders: true,
        itemCustomization: true,
        showOutOfStock: true,
    });

    const [minOrderAmount, setMinOrderAmount] = useState('5.00');
    const [maxOrderAmount, setMaxOrderAmount] = useState('150.00');
    const [defaultPrepTime, setDefaultPrepTime] = useState('');
    const [schedulingBuffer, setSchedulingBuffer] = useState('');

    /** Step4 fields not shown on this page — preserved load → save */
    const [timeLimitMins, setTimeLimitMins] = useState('5');
    const [cancelPolicy, setCancelPolicy] = useState('');
    const [newOrderSoundNotification, setNewOrderSoundNotification] = useState(true);
    const [riderPickupInstructions, setRiderPickupInstructions] = useState('');

    const [saving, setSaving] = useState(false);
    const [saveErrors, setSaveErrors] = useState([]);

    const toggle = (key) => setSwitches((s) => ({ ...s, [key]: !s[key] }));

    const flipAutoAccept = () => setSwitches((s) => ({ ...s, autoAccept: !s.autoAccept }));

    const minOrderText = minOrderAmount.trim();
    const minOrderValue = Number(minOrderText);
    const canSave = !!minOrderText && Number.isFinite(minOrderValue);

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

                const autoNb = normalizeBool(r.auto_accept_orders);
                const allowNb = normalizeBool(r.allow_special_instructions);
                const schedNb = normalizeBool(r.allow_scheduled_orders);
                const oosNb = normalizeBool(r.show_out_of_stock_items);

                setSwitches((prev) => ({
                    ...prev,
                    autoAccept: autoNb !== null ? autoNb : prev.autoAccept,
                    itemCustomization: allowNb !== null ? allowNb : prev.itemCustomization,
                    scheduledOrders: schedNb !== null ? schedNb : prev.scheduledOrders,
                    showOutOfStock: oosNb !== null ? oosNb : prev.showOutOfStock,
                }));

                if (typeof r.order_cancel_timeout_mins === 'number' && Number.isFinite(r.order_cancel_timeout_mins)) {
                    setTimeLimitMins(String(Math.trunc(r.order_cancel_timeout_mins)));
                } else if (typeof r.order_cancel_timeout_mins === 'string' && r.order_cancel_timeout_mins.trim()) {
                    const t = Number(r.order_cancel_timeout_mins.trim());
                    if (Number.isFinite(t)) setTimeLimitMins(String(Math.trunc(t)));
                }

                const minFmt = formatMinimumOrderInput(r.minimum_order);
                if (minFmt !== '') setMinOrderAmount(minFmt);

                if (typeof r.cancellation_policy === 'string') setCancelPolicy(r.cancellation_policy);
                else if (r.cancellation_policy === null || r.cancellation_policy === undefined) setCancelPolicy('');

                const soundNb = normalizeBool(r.new_order_sound_notification);
                if (soundNb !== null) setNewOrderSoundNotification(soundNb);

                if (typeof r.rider_pickup_instructions === 'string') setRiderPickupInstructions(r.rider_pickup_instructions);
                else if (r.rider_pickup_instructions === null || r.rider_pickup_instructions === undefined)
                    setRiderPickupInstructions('');

                if (typeof r.average_preparation_time === 'string' && r.average_preparation_time.trim()) {
                    setDefaultPrepTime(r.average_preparation_time.trim());
                }

                const maxRaw = r.maximum_order ?? r.max_order_amount ?? r.max_order;
                const maxFmt = formatMinimumOrderInput(maxRaw);
                if (maxFmt !== '') setMaxOrderAmount(maxFmt);

                const buf =
                    r.scheduling_buffer_minutes ??
                    r.scheduling_buffer_mins ??
                    r.order_scheduling_buffer_mins;
                if (buf !== null && buf !== undefined && String(buf).trim() !== '') {
                    const bn = Number(buf);
                    if (Number.isFinite(bn)) setSchedulingBuffer(String(Math.trunc(bn)));
                }
            } catch (e) {
                setLoadError(e?.message || 'Failed to load order settings');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [accessToken, authUser]);

    const handleSave = async () => {
        if (!canSave || saving || !restaurantId) return;
        setSaving(true);
        setSaveErrors([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const orderCancelTimeout = Number(timeLimitMins.trim());
            const orderCancelTimeoutMins = Number.isFinite(orderCancelTimeout) ? Math.trunc(orderCancelTimeout) : 1;

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step4`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    auto_accept_orders: !!switches.autoAccept,
                    order_cancel_timeout_mins: orderCancelTimeoutMins,
                    minimum_order: minOrderValue,
                    allow_special_instructions: !!switches.itemCustomization,
                    cancellation_policy: cancelPolicy.trim(),
                    new_order_sound_notification: !!newOrderSoundNotification,
                    rider_pickup_instructions: riderPickupInstructions.trim(),
                }),
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
                                    : 'Update failed',
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

            toast.success('Order settings saved');
        } catch (e) {
            setSaveErrors([e?.message || 'Update failed']);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Order Settings</h2>
                <p className="text-[#6B6B6B] text-[14px]">Configure order rules and preferences</p>
            </div>

            {/* Order Rules */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="mb-4 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Order Rules
                </h3>

                {loading && <p className="text-[14px] text-[#6B6B6B]">Loading…</p>}
                {!loading && loadError && (
                    <div className="mb-4 rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
                )}

                {!loading && !loadError && (
                    <>
                        <div className="space-y-6">
                            {/* Row 1 */}
                            <div className="flex items-center justify-between py-2 border-b border-[#E8E8E8]">
                                <div>
                                    <p className="font-[500] text-[14px] text-[#1A1A1A]">Auto-Accept Orders</p>
                                    <p className="text-[13px] text-[#9CA3AF]">Automatically accept incoming orders</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={flipAutoAccept}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors ${switches.autoAccept ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${switches.autoAccept ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            {/* Row 2 */}
                            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                                <div>
                                    <p className="font-[500] text-[14px] text-[#1A1A1A]">Manual Accept Mode</p>
                                    <p className="text-[13px] text-[#9CA3AF]">Review and manually accept each order</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={flipAutoAccept}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors ${!switches.autoAccept ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!switches.autoAccept ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            {/* Row 3 - Min/Max */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Minimum Order Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
                                        <input
                                            type="text"
                                            value={minOrderAmount}
                                            onChange={(e) => setMinOrderAmount(e.target.value)}
                                            className="w-full pl-7 pr-4 py-2  font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DD2F26]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Maximum Order Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
                                        <input
                                            type="text"
                                            value={maxOrderAmount}
                                            onChange={(e) => setMaxOrderAmount(e.target.value)}
                                            className="w-full pl-7 pr-4 py-2 font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DD2F26]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 4 - Prep Time */}
                            <div>
                                <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Default Preparation Time</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 20 (minutes)"
                                    value={defaultPrepTime}
                                    onChange={(e) => setDefaultPrepTime(e.target.value)}
                                    className="w-full px-4 py-2 font-[500] text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DD2F26]"
                                />
                            </div>

                            {/* Row 5 - Scheduled */}
                            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                                <div>
                                    <p className="font-[500] text-[14px] text-[#1A1A1A]">Allow Scheduled Orders</p>
                                    <p className="text-[13px] text-[#9CA3AF]">Let customers schedule orders in advance</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle('scheduledOrders')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors ${switches.scheduledOrders ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${switches.scheduledOrders ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            {/* Row 6 - Buffer */}
                            <div>
                                <label className="block font-[500] text-[14px] text-[#4B5563] mb-1">Scheduling Buffer</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 15 (minutes)"
                                    value={schedulingBuffer}
                                    onChange={(e) => setSchedulingBuffer(e.target.value)}
                                    className="w-full px-4 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DD2F26]"
                                />
                            </div>

                            {/* Row 7 - Customization */}
                            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                                <div>
                                    <p className="font-[500] text-[14px] text-[#1A1A1A]">Allow Item Customization</p>
                                    <p className="text-[13px] text-[#9CA3AF]">Enable special requests and modifications</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle('itemCustomization')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors ${switches.itemCustomization ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${switches.itemCustomization ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            {/* Row 8 - Out of stock */}
                            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                                <div>
                                    <p className="font-[500] text-[14px] text-[#1A1A1A]">Show Out-of-Stock Items</p>
                                    <p className="text-[13px] text-[#9CA3AF]">Display unavailable items with grey overlay</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle('showOutOfStock')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors ${switches.showOutOfStock ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${switches.showOutOfStock ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        {!!saveErrors.length && (
                            <div className="mt-4 bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
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

                        <div className="mt-8 flex justify-start">
                            <button
                                type="button"
                                disabled={!canSave || saving || !restaurantId}
                                onClick={handleSave}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#C52820] transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving…' : 'Save Settings'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Active Delay Card — commented out
            <div className="rounded-xl border border-[#DD2F26] bg-[#DD2F2633] p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DD2F26] text-white">
                            Active Delay
                        </span>
                        <h3 className="text-[14px] font-[600] text-[#134E4A]">Current Delay: +5 minutes</h3>
                        <p className="text-sm text-[#115E59]">Applied on: 10 Dec 2025, 16:26</p>
                        <p className="text-sm text-[#115E59]">Status: Active</p>
                    </div>
                    <button type="button" className="w-full sm:w-auto px-4 py-2 border border-[#FECACA] text-[#EF4444] rounded-lg text-sm hover:bg-[#FEF2F2] transition text-center">
                        Remove Delay
                    </button>
                </div>
            </div>
            */}

            {/* Kitchen Delay — commented out
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-2">Kitchen Delay</h3>
                <p className="text-[#6B6B6B] text-[14px] mb-6">Temporarily increase preparation time due to high volume or kitchen constraints</p>
                <button
                    type="button"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-[8px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm"
                >
                    Add Delay
                </button>
            </div>
            */}
        </div>
    );
};

export default OrderSettings;
