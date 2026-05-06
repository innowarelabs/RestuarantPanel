import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Lock, Laptop, Smartphone } from 'lucide-react';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';

import ChangePasswordModal from './ChangePasswordModal';
import NotificationToggle from '../../../pages/OnboardingStep/NotificationToggle';
import OTPInput from '../../../elements/OTPInput';

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
    if (
        code.endsWith('_400') ||
        code.endsWith('_401') ||
        code.endsWith('_403') ||
        code.endsWith('_404') ||
        code.endsWith('_422') ||
        code.endsWith('_500')
    )
        return true;
    if (data.data === null && typeof data.message === 'string' && data.message.trim()) return true;
    return false;
};

/** HTTP 200 with logical error codes (e.g. AUTH_401) */
const isLogicalFailure = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const c = payload.code;
    if (typeof c !== 'string' || !c.trim()) return false;
    const u = c.trim().toUpperCase();
    if (u.startsWith('SUCCESS_')) return false;
    if (/_200$|_201$|_202$/u.test(u)) return false;
    return true;
};

const extractSessionsList = (payload) => {
    const p = extractPayload(payload);
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (Array.isArray(p.sessions)) return p.sessions;
    if (Array.isArray(p.items)) return p.items;
    if (Array.isArray(p.data)) return p.data;
    return [];
};

const formatRelativeTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : '—';
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 45) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 48) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const days = Math.floor(hr / 24);
    if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
    return d.toLocaleDateString();
};

const pickSessionIcon = (ua) => {
    const u = (typeof ua === 'string' ? ua : '').toLowerCase();
    if (/ipad|tablet/.test(u)) return Laptop;
    if (/mobile|iphone|android/.test(u)) return Smartphone;
    return Laptop;
};

const normalizeSessionRows = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((row, idx) => {
        const sessionId = row.session_id || row.id || row.uuid || row.sessionId;
        const ua = typeof row.user_agent === 'string' ? row.user_agent : '';
        const deviceName =
            row.device_name ||
            row.device_label ||
            row.client_description ||
            (ua ? `${ua.slice(0, 56)}${ua.length > 56 ? '…' : ''}` : null) ||
            `Session ${idx + 1}`;
        const browser =
            row.browser ||
            row.browser_name ||
            row.browser_version ||
            (ua.includes('Chrome')
                ? 'Chrome'
                : ua.includes('Firefox')
                  ? 'Firefox'
                  : ua.includes('Safari')
                    ? 'Safari'
                    : ua
                      ? 'Web'
                      : '—');
        const lastRaw = row.last_active_at || row.last_seen_at || row.updated_at || row.created_at;
        const location =
            row.location ||
            [row.city, row.region, row.country].filter(Boolean).join(', ') ||
            row.ip_address ||
            row.ip ||
            '—';
        return {
            sessionId: typeof sessionId === 'string' ? sessionId : sessionId != null ? String(sessionId) : '',
            deviceName,
            browser,
            lastActive: formatRelativeTime(lastRaw),
            location: typeof location === 'string' ? location : '—',
            userEmail: typeof row.user_email === 'string' ? row.user_email : '',
            userAgent: ua,
            icon: pickSessionIcon(ua),
        };
    });
};

const SecuritySettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [restaurantId, setRestaurantId] = useState('');
    const [loading2FA, setLoading2FA] = useState(true);
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [saving2FA, setSaving2FA] = useState(false);

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [setupOtp, setSetupOtp] = useState(['', '', '', '', '', '']);
    const [setupQrCodeUrl, setSetupQrCodeUrl] = useState(null);
    const [setupLoadingQR, setSetupLoadingQR] = useState(false);
    const [setupLoading, setSetupLoading] = useState(false);
    const [setupError, setSetupError] = useState('');

    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [sessionsError, setSessionsError] = useState(null);
    const [includeAllRestaurantUsers, setIncludeAllRestaurantUsers] = useState(false);
    const [sessionBusy, setSessionBusy] = useState(null); // 'all' | 'others' | 'tenant' | session id string

    const resolvedRestaurantId =
        (typeof restaurantId === 'string' && restaurantId.trim() ? restaurantId.trim() : '') ||
        (() => {
            try {
                return (localStorage.getItem('restaurant_id') || '').trim();
            } catch {
                return '';
            }
        })() ||
        getRestaurantIdFromUser(authUser);

    const buildSessionHeaders = useCallback(() => {
        const h = {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
        if (resolvedRestaurantId) {
            h['X-Restaurant-Id'] = resolvedRestaurantId;
        }
        return h;
    }, [accessToken, resolvedRestaurantId]);

    const parseJsonResponse = async (res) => {
        const ct = res.headers.get('content-type');
        if (ct?.includes('application/json')) {
            try {
                return await res.json();
            } catch {
                return null;
            }
        }
        const t = await res.text();
        if (!t.trim()) return null;
        try {
            return JSON.parse(t);
        } catch {
            return t;
        }
    };

    const fetchSessions = useCallback(async () => {
        if (!accessToken || !resolvedRestaurantId) return;
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) return;

        setLoadingSessions(true);
        setSessionsError(null);
        try {
            const params = new URLSearchParams();
            params.set('restaurant_id', resolvedRestaurantId);
            if (includeAllRestaurantUsers) {
                params.set('include_all_restaurant_users', 'true');
            }
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/sessions?${params.toString()}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: buildSessionHeaders(),
            });
            const data = await parseJsonResponse(res);

            if (!res.ok) {
                const msg =
                    typeof data === 'object' && data?.message
                        ? data.message
                        : typeof data === 'string' && data.trim()
                          ? data.trim()
                          : 'Could not load sessions';
                setSessions([]);
                setSessionsError(msg);
                return;
            }
            if (typeof data === 'object' && isLogicalFailure(data)) {
                setSessions([]);
                setSessionsError(typeof data.message === 'string' ? data.message : 'Could not load sessions');
                return;
            }

            const list = extractSessionsList(data);
            setSessions(normalizeSessionRows(list));
        } catch (e) {
            setSessions([]);
            setSessionsError(e?.message || 'Could not load sessions');
        } finally {
            setLoadingSessions(false);
        }
    }, [accessToken, resolvedRestaurantId, includeAllRestaurantUsers, buildSessionHeaders]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const toastSessionErr = (data, fallback) => {
        const msg =
            typeof data === 'object' && data?.message
                ? data.message
                : typeof data === 'string' && data.trim()
                  ? data.trim()
                  : fallback;
        toast.error(msg);
    };

    const handleLogoutAllDevices = async () => {
        if (!resolvedRestaurantId || !accessToken) {
            toast.error('Restaurant not found');
            return;
        }
        if (
            !window.confirm(
                'Log out from all devices? You will need to sign in again everywhere you use this account.',
            )
        ) {
            return;
        }
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        setSessionBusy('all');
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/sessions/all`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: buildSessionHeaders(),
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toastSessionErr(data, 'Could not log out from all devices');
                return;
            }
            toast.success('Logged out from all devices');
            await fetchSessions();
        } catch (e) {
            toast.error(e?.message || 'Could not log out from all devices');
        } finally {
            setSessionBusy(null);
        }
    };

    const handleRevokeOtherSessions = async () => {
        if (!resolvedRestaurantId || !accessToken) {
            toast.error('Restaurant not found');
            return;
        }
        if (
            !window.confirm(
                'Sign out other sessions and keep this browser signed in? Other devices will need to sign in again.',
            )
        ) {
            return;
        }
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        setSessionBusy('others');
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/sessions/revoke-others`;
            const res = await fetch(url, {
                method: 'POST',
                headers: buildSessionHeaders(),
                body: JSON.stringify({ keep_refresh_token: true }),
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toastSessionErr(data, 'Could not revoke other sessions');
                return;
            }
            toast.success('Other sessions signed out');
            await fetchSessions();
        } catch (e) {
            toast.error(e?.message || 'Could not revoke other sessions');
        } finally {
            setSessionBusy(null);
        }
    };

    const handleRevokeTenantStaff = async () => {
        if (!resolvedRestaurantId || !accessToken) {
            toast.error('Restaurant not found');
            return;
        }
        if (
            !window.confirm(
                'Sign out ALL restaurant staff on every device? This affects every team member.',
            )
        ) {
            return;
        }
        if (!window.confirm('Final confirmation: continue?')) {
            return;
        }
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        setSessionBusy('tenant');
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/sessions/revoke-tenant`;
            const res = await fetch(url, {
                method: 'POST',
                headers: buildSessionHeaders(),
                body: JSON.stringify({ confirm_logout_all_staff: true }),
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toastSessionErr(data, 'Could not sign out restaurant staff');
                return;
            }
            toast.success('All restaurant staff sessions ended');
            await fetchSessions();
        } catch (e) {
            toast.error(e?.message || 'Could not sign out restaurant staff');
        } finally {
            setSessionBusy(null);
        }
    };

    const handleRemoveSession = async (sessionId) => {
        if (!sessionId || !resolvedRestaurantId || !accessToken) return;
        if (!window.confirm('Remove this device session?')) return;

        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        setSessionBusy(sessionId);
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/sessions/${encodeURIComponent(sessionId)}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: buildSessionHeaders(),
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toastSessionErr(data, 'Could not remove session');
                return;
            }
            toast.success('Session removed');
            await fetchSessions();
        } catch (e) {
            toast.error(e?.message || 'Could not remove session');
        } finally {
            setSessionBusy(null);
        }
    };

    const getUserIdForAccountUpdate = useCallback(
        async (baseUrl) => {
            const fromState = typeof authUser?.id === 'string' ? authUser.id.trim() : '';
            if (fromState) return fromState;
            if (!accessToken) return '';
            const meUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/users/me`;
            const res = await fetch(meUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) return '';
            const payload = extractPayload(data);
            return typeof payload?.id === 'string' ? payload.id.trim() : '';
        },
        [accessToken, authUser]
    );

    const updateAccount2FAFlag = useCallback(
        async (baseUrl, enabled) => {
            const userId = await getUserIdForAccountUpdate(baseUrl);
            if (!userId) {
                toast.error('User ID not found for 2FA update');
                return false;
            }
            const patchUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/users/${userId}`;
            const res = await fetch(patchUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ is_2fa_enabled: !!enabled }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                toast.error(lines.length ? lines[0] : typeof data === 'string' && data.trim() ? data.trim() : 'Request failed');
                return false;
            }
            if (isErrorPayload(data)) {
                toast.error(typeof data.message === 'string' && data.message.trim() ? data.message.trim() : 'Request failed');
                return false;
            }
            return true;
        },
        [accessToken, getUserIdForAccountUpdate]
    );

    const open2FAModal = useCallback(
        async (baseUrl) => {
            const userId = typeof authUser?.id === 'string' && authUser.id.trim() ? authUser.id.trim() : '';
            setIs2FAModalOpen(true);
            setSetupError('');
            setSetupOtp(['', '', '', '', '', '']);
            setSetupQrCodeUrl(null);
            setSetupLoadingQR(true);
            try {
                const setupUrl = userId
                    ? `${baseUrl.replace(/\/$/, '')}/api/v1/2fa/setup/${userId}`
                    : `${baseUrl.replace(/\/$/, '')}/api/v1/2fa/setup`;
                const res = await fetch(setupUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                });
                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();
                if (!res.ok) {
                    const message =
                        typeof data === 'string' ? data : data?.message || data?.error || 'Failed to load QR code. Please try again.';
                    throw new Error(message);
                }
                const payload = extractPayload(data);
                const otpAuthUrl = payload?.qr_code_url || payload?.qrCodeUrl || payload?.qr_code;
                if (!otpAuthUrl) throw new Error('QR code URL not found in response');
                const dataUrl = await QRCodeLib.toDataURL(otpAuthUrl);
                setSetupQrCodeUrl(dataUrl);
            } catch (e) {
                setSetupError(e?.message || 'Failed to load QR code. Please try again.');
            } finally {
                setSetupLoadingQR(false);
            }
        },
        [accessToken, authUser]
    );

    const handle2FAVerify = useCallback(async () => {
        if (setupLoading) return;
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            setSetupError('VITE_BACKEND_URL is missing');
            return;
        }
        const userId = typeof authUser?.id === 'string' && authUser.id.trim() ? authUser.id.trim() : '';
        if (!userId) {
            setSetupError('User not found. Please login again.');
            return;
        }
        setSetupLoading(true);
        setSetupError('');
        try {
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/2fa/verify/${userId}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ totp_code: setupOtp.join('') }),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                const message = typeof data === 'string' ? data : data?.message || data?.error || 'Invalid Code';
                throw new Error(message);
            }
            setIs2faEnabled(true);
            setIs2FAModalOpen(false);
            toast.success('Two-factor authentication enabled');
        } catch (e) {
            setSetupError(e?.message || 'Invalid Code');
        } finally {
            setSetupLoading(false);
        }
    }, [accessToken, authUser, setupLoading, setupOtp]);

    useEffect(() => {
        if (!accessToken) {
            setLoading2FA(false);
            return;
        }

        const load = async () => {
            setLoading2FA(true);
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

                if (!resolvedId) return;

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

                if (!resDetail.ok) return;

                const r = extractPayload(rawDetail);
                if (!r || typeof r !== 'object') return;

                const owner2fa = r.owner && typeof r.owner === 'object' ? r.owner.is_2fa_enabled : undefined;
                if (typeof owner2fa === 'boolean') setIs2faEnabled(owner2fa);
                else {
                    const nb = normalizeBool(r.is_2fa_enabled);
                    if (typeof nb === 'boolean') setIs2faEnabled(nb);
                }
            } catch {
                /* ignore */
            } finally {
                setLoading2FA(false);
            }
        };

        load();
    }, [accessToken, authUser]);

    const persistRestaurant2FA = async (enabled) => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
        const rid = resolvedRestaurantId;
        if (!rid) {
            toast.error('Restaurant not found');
            return false;
        }
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(rid)}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ is_2fa_enabled: !!enabled }),
        });
        const contentType = res.headers.get('content-type');
        const data = contentType?.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok || isErrorPayload(data)) {
            const msg =
                typeof data === 'object' && data?.message
                    ? data.message
                    : typeof data === 'string' && data.trim()
                      ? data.trim()
                      : 'Could not update 2FA';
            toast.error(msg);
            return false;
        }
        return true;
    };

    const handle2faToggle = async () => {
        if (saving2FA || loading2FA) return;
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        const next = !is2faEnabled;

        setSaving2FA(true);
        try {
            const restaurantOk = await persistRestaurant2FA(next);
            if (!restaurantOk) return;

            const accountOk = await updateAccount2FAFlag(baseUrl, next);
            if (!accountOk) return;

            setIs2faEnabled(next);

            if (next) {
                await open2FAModal(baseUrl);
                toast.success('Scan the QR code to finish enabling 2FA');
            } else {
                toast.success('Two-factor authentication disabled');
            }
        } finally {
            setSaving2FA(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Security</h2>
                <p className="text-[#6B6B6B] text-[14px]">Manage your account security settings</p>
            </div>

            <div className="bg-white rounded-[16px] border border-[#00000033] p-5 space-y-4">
                <h3 className="mb-1 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Password Management
                </h3>
                <p className="text-[14px] text-[#6B6B6B]">Update your password regularly to keep your account secure</p>
                <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 border border-[#D1D5DB] rounded-[12px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm active:scale-95"
                >
                    <Lock className="w-4 h-4" />
                    Change Password
                </button>
            </div>

            <div className="bg-white rounded-[16px] border border-[#00000033] p-5 space-y-4">
                <h3 className="font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Two-Factor Authentication (2FA)
                </h3>
                {loading2FA ? (
                    <p className="text-[14px] text-[#6B7280]">Loading…</p>
                ) : (
                    <div className={saving2FA ? 'pointer-events-none opacity-60' : ''}>
                        <NotificationToggle
                            title="Enable two-factor authentication"
                            desc="Extra security for your account (optional)"
                            active={!!is2faEnabled}
                            onClick={() => void handle2faToggle()}
                        />
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[16px] border border-[#00000033] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                            Device Management
                        </h3>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                disabled={!!sessionBusy || loadingSessions || !resolvedRestaurantId}
                                onClick={() => void handleRevokeOtherSessions()}
                                className="w-full sm:w-auto px-4 py-2.5 border border-[#E5E7EB] text-[#374151] rounded-[8px] text-[13px] font-[500] hover:bg-gray-50 transition shadow-sm text-center active:scale-95 disabled:opacity-50"
                            >
                                {sessionBusy === 'others' ? 'Working…' : 'Keep this device, sign out others'}
                            </button>
                            <button
                                type="button"
                                disabled={!!sessionBusy || loadingSessions || !resolvedRestaurantId}
                                onClick={() => void handleLogoutAllDevices()}
                                className="w-full sm:w-auto px-6 py-2.5 border border-[#E02424] text-[#EF4444] rounded-[8px] text-[13px] font-[500] hover:bg-[#FEF2F2] transition shadow-sm text-center active:scale-95 disabled:opacity-50"
                            >
                                {sessionBusy === 'all' ? 'Working…' : 'Log out from all devices'}
                            </button>
                            <button
                                type="button"
                                disabled={!!sessionBusy || loadingSessions || !resolvedRestaurantId}
                                onClick={() => void handleRevokeTenantStaff()}
                                className="w-full sm:w-auto px-4 py-2.5 border border-[#991B1B] text-[#B91C1C] rounded-[8px] text-[13px] font-[500] hover:bg-red-50 transition shadow-sm text-center active:scale-95 disabled:opacity-50"
                            >
                                {sessionBusy === 'tenant' ? 'Working…' : 'Sign out all staff (restaurant)'}
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-[#4B5563]">
                        <input
                            type="checkbox"
                            checked={includeAllRestaurantUsers}
                            onChange={(e) => setIncludeAllRestaurantUsers(e.target.checked)}
                            disabled={loadingSessions || !!sessionBusy}
                            className="rounded border-gray-300 text-[#DD2F26] focus:ring-[#DD2F26]"
                        />
                        Show all restaurant staff devices (tenant-wide list)
                    </label>
                </div>

                {sessionsError && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-[13px] text-red-700 flex flex-wrap items-center justify-between gap-2">
                        <span>{sessionsError}</span>
                        <button type="button" className="underline hover:no-underline text-red-800" onClick={() => void fetchSessions()}>
                            Retry
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F7F8FA]">
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Device</th>
                                {includeAllRestaurantUsers ? (
                                    <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">
                                        User
                                    </th>
                                ) : null}
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Browser</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Last active</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Location</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-right text-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {loadingSessions ? (
                                <tr>
                                    <td colSpan={includeAllRestaurantUsers ? 6 : 5} className="px-6 py-10 text-center text-[14px] text-[#6B7280]">
                                        Loading sessions…
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={includeAllRestaurantUsers ? 6 : 5} className="px-6 py-10 text-center text-[14px] text-[#6B7280]">
                                        No sessions found.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((device, idx) => {
                                    const Icon = device.icon || Laptop;
                                    const sid = device.sessionId;
                                    const busyRow = sessionBusy === sid;
                                    return (
                                        <tr key={sid || `session-${idx}`} className="hover:bg-gray-50/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Icon className="w-4 h-4 shrink-0 text-[#9CA3AF]" />
                                                    <div className="min-w-0">
                                                        <span className="font-[400] text-[14px] text-[#1A1A1A] block truncate">{device.deviceName}</span>
                                                        {device.userEmail && !includeAllRestaurantUsers ? (
                                                            <span className="text-[12px] text-[#6B7280] truncate block">{device.userEmail}</span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            {includeAllRestaurantUsers ? (
                                                <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[13px] font-[400]">
                                                    {device.userEmail || '—'}
                                                </td>
                                            ) : null}
                                            <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[14px] font-[400]">{device.browser}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[14px] font-[400]">{device.lastActive}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[14px] font-[400] max-w-[200px] truncate" title={device.location}>
                                                {device.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    type="button"
                                                    disabled={!!sessionBusy || !sid}
                                                    onClick={() => void handleRemoveSession(sid)}
                                                    className="text-[13px] font-[400] text-[#EF4444] hover:underline disabled:opacity-50"
                                                >
                                                    {busyRow ? 'Removing…' : 'Remove'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                is2faEnabled={!!is2faEnabled}
            />

            {is2FAModalOpen
                ? createPortal(
                      <div
                          className="fixed inset-0 z-[200] flex min-h-[100dvh] min-h-screen w-full items-center justify-center bg-black/20 p-4"
                          onClick={() => {
                              if (setupLoading || setupLoadingQR) return;
                              setIs2FAModalOpen(false);
                          }}
                      >
                          <div
                              className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-white shadow-xl flex flex-col border border-black/10"
                              onClick={(e) => e.stopPropagation()}
                          >
                              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                                  <div>
                                      <h2 className="text-[20px] font-bold text-[#111827]">Set up two-factor authentication</h2>
                                      <p className="text-[13px] text-gray-500 mt-1">Scan the QR code and enter the 6-digit code.</p>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => {
                                          if (setupLoading || setupLoadingQR) return;
                                          setIs2FAModalOpen(false);
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                                  >
                                      ✕
                                  </button>
                              </div>
                              <div className="p-6 space-y-6">
                                  {setupError && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                          <p className="text-red-600 text-sm">{setupError}</p>
                                      </div>
                                  )}
                                  <div className="flex flex-col items-center gap-6">
                                      <div className="p-1 shadow-md bg-white rounded-2xl border border-gray-200">
                                          {setupLoadingQR ? (
                                              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                  <span className="text-gray-500 text-sm">Loading QR…</span>
                                              </div>
                                          ) : setupQrCodeUrl ? (
                                              <img src={setupQrCodeUrl} alt="2FA QR" className="w-48 h-48 rounded-2xl" />
                                          ) : (
                                              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                  <span className="text-red-500 text-sm text-center px-2">Could not load QR</span>
                                              </div>
                                          )}
                                      </div>
                                      <div className="w-full max-w-[420px]">
                                          <OTPInput otp={setupOtp} setOtp={setSetupOtp} onSubmit={handle2FAVerify} loading={setupLoading} error={setupError} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
};

export default SecuritySettings;
