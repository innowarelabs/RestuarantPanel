import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

/** Backend may return HTTP 200 with { code: "AUTH_401", message: "..." } for logical failures */
const isLogicalApiFailure = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const c = payload.code;
    if (typeof c !== 'string' || !c.trim()) return false;
    const u = c.trim().toUpperCase();
    if (u.startsWith('SUCCESS_')) return false;
    if (/_200$|_201$|_202$/u.test(u)) return false;
    return true;
};

const ChangePasswordModal = ({ isOpen, onClose, is2faEnabled = false }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    /** null | 'verify' | 'password' */
    const [busyPhase, setBusyPhase] = useState(null);

    const busy = busyPhase !== null;

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTotpCode('');
            setBusyPhase(null);
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const postChangePassword = async (baseUrl, cur, next, confirm, totp) => {
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/change-password`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                current_password: cur,
                new_password: next,
                confirm_new_password: confirm,
                totp_code: typeof totp === 'string' ? totp : '',
            }),
        });

        const ct = res.headers.get('content-type');
        const data = ct?.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
            const msg =
                typeof data === 'object' && data?.message
                    ? data.message
                    : typeof data === 'object' && data?.detail
                      ? String(data.detail)
                      : typeof data === 'string' && data.trim()
                        ? data.trim()
                        : 'Could not change password';
            toast.error(msg);
            return;
        }

        if (typeof data === 'object' && isLogicalApiFailure(data)) {
            const msg =
                typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : 'Could not change password';
            toast.error(msg);
            return;
        }

        toast.success('Password updated');
        onClose();
    };

    const handleSubmit = async () => {
        if (!accessToken) {
            toast.error('You must be signed in to change your password');
            return;
        }
        const cur = currentPassword.trim();
        const next = newPassword;
        const confirm = confirmPassword;
        if (!cur) {
            toast.error('Enter your current password');
            return;
        }
        const nextTrimmed = next.trim();
        if (!nextTrimmed) {
            toast.error('Enter a new password');
            return;
        }
        if (nextTrimmed !== confirm.trim()) {
            toast.error('New password and confirmation do not match');
            return;
        }
        if (cur === nextTrimmed) {
            toast.error('New password must be different from your current password');
            return;
        }

        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }

        const code = typeof totpCode === 'string' ? totpCode.trim() : '';

        if (is2faEnabled) {
            if (!code || code.length < 6) {
                toast.error('Enter the 6-digit authenticator code');
                return;
            }
            const userId = typeof authUser?.id === 'string' && authUser.id.trim() ? authUser.id.trim() : '';
            if (!userId) {
                toast.error('User not found. Please sign in again.');
                return;
            }

            setBusyPhase('verify');
            try {
                const verifyUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/2fa/verify/${userId}`;
                const verifyRes = await fetch(verifyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                    body: JSON.stringify({ totp_code: code }),
                });
                const vct = verifyRes.headers.get('content-type');
                const vdata = vct?.includes('application/json') ? await verifyRes.json() : await verifyRes.text();

                if (!verifyRes.ok) {
                    const msg =
                        typeof vdata === 'object' && vdata?.message
                            ? vdata.message
                            : typeof vdata === 'string' && vdata.trim()
                              ? vdata.trim()
                              : typeof vdata === 'object' && vdata?.error
                                ? String(vdata.error)
                                : 'Invalid authenticator code';
                    toast.error(msg);
                    return;
                }
                if (
                    typeof vdata === 'object' &&
                    vdata?.code &&
                    String(vdata.code).toUpperCase().startsWith('ERROR_')
                ) {
                    toast.error(typeof vdata.message === 'string' ? vdata.message : 'Invalid authenticator code');
                    return;
                }

                setBusyPhase('password');
                await postChangePassword(baseUrl, cur, next, confirm, code);
            } catch (e) {
                toast.error(e?.message || 'Could not verify code');
            } finally {
                setBusyPhase(null);
            }
            return;
        }

        setBusyPhase('password');
        try {
            await postChangePassword(baseUrl, cur, next, confirm, '');
        } finally {
            setBusyPhase(null);
        }
    };

    const primaryLabel =
        busyPhase === 'verify' ? 'Verifying code…' : busyPhase === 'password' ? 'Updating password…' : 'Update Password';

    const modal = (
        <div
            className="fixed inset-0 z-[200] flex min-h-[100dvh] min-h-screen w-full items-center justify-center bg-black/20 p-4"
            onClick={() => !busy && onClose()}
        >
            <div
                className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[500px] overflow-y-auto rounded-2xl bg-white shadow-xl flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Change Password</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Update your account password to keep it secure.</p>
                    </div>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                autoComplete="current-password"
                                disabled={busy}
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400 shadow-sm disabled:bg-gray-50"
                            />
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#DD2F26] transition-colors disabled:opacity-50"
                            >
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">New Password</label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                disabled={busy}
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400 shadow-sm disabled:bg-gray-50"
                            />
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#DD2F26] transition-colors disabled:opacity-50"
                            >
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                disabled={busy}
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400 shadow-sm disabled:bg-gray-50"
                            />
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#DD2F26] transition-colors disabled:opacity-50"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {is2faEnabled ? (
                        <div className="space-y-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Authenticator code</label>
                            <p className="text-[12px] text-[#6B7280]">Enter your 6-digit code from the app. It is verified before your password is updated.</p>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, ''))}
                                placeholder="6-digit code"
                                disabled={busy}
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400 shadow-sm disabled:bg-gray-50"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shadow-inner">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSubmit()}
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#DD2F26] rounded-[8px] shadow-lg shadow-[#DD2F26]/20 hover:bg-[#C52820] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {busy ? primaryLabel : 'Update Password'}
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
};

export default ChangePasswordModal;
