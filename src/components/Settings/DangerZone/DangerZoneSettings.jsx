import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pause, XCircle, AlertTriangle } from 'lucide-react';
import { logout } from '../../../redux/store';
import PauseRestaurantModal from './PauseRestaurantModal';
import DeactivateAccountModal from './DeactivateAccountModal';
import DeleteAccountModal from './DeleteAccountModal';
import { extractPayload, fetchRestaurantSummary } from './dangerZoneApi';

const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
};

const DangerZoneSettings = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const accessToken = useSelector((state) => state.auth?.accessToken);
    const authUser = useSelector((state) => state.auth?.user);
    const restaurantNameFromStore = useSelector((state) => state.auth?.restaurantName);

    const [restaurantId, setRestaurantId] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);
    /** When true, checkout is paused for customers (`paused` === true → `is_open` false while status stays active). */
    const [orderingPaused, setOrderingPaused] = useState(false);
    const [exactRestaurantName, setExactRestaurantName] = useState('');

    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

    useEffect(() => {
        if (!accessToken) return;

        const resolveRestaurantId = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) return;

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

                if (resolvedId) setRestaurantId(resolvedId);
            } catch {
                const fallback =
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() || getRestaurantIdFromUser(authUser);
                if (fallback) setRestaurantId(fallback);
            }
        };

        resolveRestaurantId();
    }, [accessToken, authUser]);

    const refreshRestaurantSummary = useCallback(async () => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl || !accessToken || !resolvedRestaurantId) return;

        setLoadingSummary(true);
        try {
            const { ok, detail } = await fetchRestaurantSummary(baseUrl, resolvedRestaurantId, accessToken);
            if (!ok || !detail) {
                setOrderingPaused(false);
                setExactRestaurantName(
                    typeof restaurantNameFromStore === 'string' ? restaurantNameFromStore.trim() : ''
                );
                return;
            }
            const open =
                typeof detail.is_open === 'boolean'
                    ? detail.is_open
                    : typeof detail.isOpen === 'boolean'
                      ? detail.isOpen
                      : true;
            setOrderingPaused(!open);
            const nm =
                typeof detail.name === 'string'
                    ? detail.name
                    : typeof detail.legal_business_name === 'string'
                      ? detail.legal_business_name
                      : '';
            setExactRestaurantName(nm.trim() || (typeof restaurantNameFromStore === 'string' ? restaurantNameFromStore.trim() : ''));
        } catch {
            setOrderingPaused(false);
            setExactRestaurantName(
                typeof restaurantNameFromStore === 'string' ? restaurantNameFromStore.trim() : ''
            );
        } finally {
            setLoadingSummary(false);
        }
    }, [accessToken, resolvedRestaurantId, restaurantNameFromStore]);

    useEffect(() => {
        void refreshRestaurantSummary();
    }, [refreshRestaurantSummary]);

    const handlePauseFlowDone = useCallback(() => {
        void refreshRestaurantSummary();
    }, [refreshRestaurantSummary]);

    const handleDeactivateSuccess = useCallback(() => {
        toast.success('Account deactivated. You have been signed out.');
        dispatch(logout());
        navigate('/login', { replace: true });
    }, [dispatch, navigate]);

    const handlePermanentDeleteSuccess = useCallback(() => {
        toast.success('Restaurant permanently deleted.');
        dispatch(logout());
        navigate('/login', { replace: true });
    }, [dispatch, navigate]);

    const actionsDisabled = !accessToken || !resolvedRestaurantId || loadingSummary;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Danger Zone</h2>
                <p className="text-[#6B6B6B] text-[14px]">
                    Critical actions that affect your restaurant account and customer ordering.
                </p>
            </div>

            <div className="bg-[#FFF8F8] rounded-[12px] border border-[#E02424] overflow-hidden ">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                <Pause className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1A1A1A]">
                                {orderingPaused ? 'Resume Restaurant' : 'Pause Restaurant'}
                            </h3>
                        </div>
                        <p className="text-[#6B6B6B] text-[14px] max-w-xl">
                            {orderingPaused
                                ? 'Customer ordering is paused. Resume when you are ready to accept orders again.'
                                : 'Temporarily disable ordering for customers.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={actionsDisabled}
                        onClick={() => setIsPauseModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#F59E0B] text-white rounded-[8px] text-[13px] font-[500] hover:bg-[#D97706] transition-all shadow-lg shadow-orange-100 active:scale-95 text-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loadingSummary ? 'Loading…' : orderingPaused ? 'Resume Restaurant' : 'Pause Restaurant'}
                    </button>
                </div>

                <div className="mx-8 border-t border-[#F3F4F6]" />

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                <XCircle className="w-5 h-5 text-[#F97316]" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Deactivate Account</h3>
                        </div>
                        <p className="text-[#6B6B6B] text-[14px] max-w-xl">
                            Deactivate your restaurant&apos;s access to the system temporarily.
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={actionsDisabled}
                        onClick={() => setIsDeactivateModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#F97316] text-white rounded-[8px] text-[13px] font-[500] hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-100 active:scale-95 text-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Deactivate Account
                    </button>
                </div>

                <div className="mx-8 border-t border-[#F3F4F6]" />

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Delete Account Permanently</h3>
                        </div>
                        <p className="text-[#6B6B6B] text-[14px] max-w-xl">
                            This action cannot be undone. All restaurant data will be permanently deleted.
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={actionsDisabled}
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#EF4444] text-white rounded-[8px] text-[13px] font-[500] hover:bg-[#DC2626] transition-all shadow-lg shadow-red-100 active:scale-95 text-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Delete Restaurant
                    </button>
                </div>
            </div>

            <PauseRestaurantModal
                isOpen={isPauseModalOpen}
                onClose={() => setIsPauseModalOpen(false)}
                restaurantId={resolvedRestaurantId}
                accessToken={accessToken}
                orderingPaused={orderingPaused}
                onComplete={() => {
                    handlePauseFlowDone();
                    setIsPauseModalOpen(false);
                }}
            />

            <DeactivateAccountModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
                restaurantId={resolvedRestaurantId}
                accessToken={accessToken}
                onSuccess={handleDeactivateSuccess}
            />

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                restaurantId={resolvedRestaurantId}
                accessToken={accessToken}
                restaurantName={exactRestaurantName || restaurantNameFromStore || ''}
                onSuccess={handlePermanentDeleteSuccess}
            />
        </div>
    );
};

export default DangerZoneSettings;
