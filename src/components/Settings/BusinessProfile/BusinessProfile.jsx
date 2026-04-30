import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, Image, Save, Upload } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

import { setRestaurantName } from '../../../redux/store';
import OTPInput from '../../../elements/OTPInput';
import NotificationToggle from '../../../pages/OnboardingStep/NotificationToggle';

const WEBSITE_HEADER_REQUIRED_PX = { width: 1440, height: 495 };
const WEBSITE_FOOTER_LEFT_REQUIRED_PX = { width: 604, height: 425 };
const WEBSITE_FOOTER_RIGHT_REQUIRED_PX = { width: 604, height: 425 };

const defaultOpeningHours = () => ({
    monday: { open: '', close: '' },
    tuesday: { open: '', close: '' },
    wednesday: { open: '', close: '' },
    thursday: { open: '', close: '' },
    friday: { open: '', close: '' },
    saturday: { open: '', close: '' },
    sunday: { open: '', close: '' },
});

const normalizeUrl = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
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
    if (code.startsWith('ERROR_')) return true;
    if (code.endsWith('_400') || code.endsWith('_401') || code.endsWith('_403') || code.endsWith('_404') || code.endsWith('_422') || code.endsWith('_500')) return true;
    if (data.data === null && typeof data.message === 'string' && data.message.trim()) return true;
    return false;
};

const isSuccessCode = (code) => {
    if (typeof code !== 'string') return true;
    const normalized = code.trim().toUpperCase();
    return normalized.endsWith('_200') || normalized.endsWith('_201');
};

const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
};

const mergeOpeningHours = (saved) => {
    const merged = defaultOpeningHours();
    const source = saved && typeof saved === 'object' ? saved : {};
    for (const key of Object.keys(merged)) {
        const day = source[key];
        if (day && typeof day === 'object') {
            merged[key] = {
                open: typeof day.open === 'string' ? day.open : merged[key].open,
                close: typeof day.close === 'string' ? day.close : merged[key].close,
            };
        }
    }
    return merged;
};

const BusinessProfile = () => {
    const dispatch = useDispatch();
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [restaurantId, setRestaurantId] = useState('');

    const initialStep1Ref = useRef(null);
    const prefilledStep1Ref = useRef(false);

    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [companyLogoUrl, setCompanyLogoUrl] = useState('');
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [ownerFullNameRaw, setOwnerFullNameRaw] = useState(null);

    const [companyLocation, setCompanyLocation] = useState('');
    const [stateRegion, setStateRegion] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('USA');
    const [address, setAddress] = useState('');
    const [altPhone, setAltPhone] = useState('');
    const [websiteHeaderUrl, setWebsiteHeaderUrl] = useState('');
    const [websiteFooterLeftUrl, setWebsiteFooterLeftUrl] = useState('');
    const [websiteFooterRightUrl, setWebsiteFooterRightUrl] = useState('');
    const [openingHours, setOpeningHours] = useState(defaultOpeningHours);
    const [prepTime, setPrepTime] = useState('15 minutes');
    const [enableDelivery, setEnableDelivery] = useState(true);
    const [enablePickup, setEnablePickup] = useState(false);

    const [brandingFiles, setBrandingFiles] = useState({
        companyLogo: null,
        companyLogoPreviewUrl: '',
        websiteHeader: null,
        websiteHeaderPreviewUrl: '',
        websiteFooterLeft: null,
        websiteFooterLeftPreviewUrl: '',
        websiteFooterRight: null,
        websiteFooterRightPreviewUrl: '',
    });

    const setBrandingFile = (key, file) => {
        setBrandingFiles((prev) => {
            const previewKey = `${key}PreviewUrl`;
            const prevPreviewUrl = prev[previewKey];
            if (prevPreviewUrl) URL.revokeObjectURL(prevPreviewUrl);
            const nextPreviewUrl = file ? URL.createObjectURL(file) : '';
            return { ...prev, [key]: file, [previewKey]: nextPreviewUrl };
        });
    };

    const [savingIdentity, setSavingIdentity] = useState(false);
    const [savingOperational, setSavingOperational] = useState(false);
    const [identityErrors, setIdentityErrors] = useState([]);
    const [operationalErrors, setOperationalErrors] = useState([]);

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [setupOtp, setSetupOtp] = useState(['', '', '', '', '', '']);
    const [setupQrCodeUrl, setSetupQrCodeUrl] = useState(null);
    const [setupLoadingQR, setSetupLoadingQR] = useState(false);
    const [setupLoading, setSetupLoading] = useState(false);
    const [setupError, setSetupError] = useState('');

    const companyLogoPreviewUrl = brandingFiles.companyLogoPreviewUrl || normalizeUrl(companyLogoUrl);
    const websiteHeaderPreviewUrl = brandingFiles.websiteHeaderPreviewUrl || normalizeUrl(websiteHeaderUrl);
    const websiteFooterLeftPreviewUrl = brandingFiles.websiteFooterLeftPreviewUrl || normalizeUrl(websiteFooterLeftUrl);
    const websiteFooterRightPreviewUrl = brandingFiles.websiteFooterRightPreviewUrl || normalizeUrl(websiteFooterRightUrl);

    const resolvedRestaurantId = (() => {
        const fromStep = restaurantId?.trim();
        let fromStorage = '';
        try {
            fromStorage = (localStorage.getItem('restaurant_id') || '').trim();
        } catch {
            fromStorage = '';
        }
        return fromStep || fromStorage || getRestaurantIdFromUser(authUser);
    })();

    const logoOk = !!companyLogoUrl?.trim() || !!brandingFiles.companyLogo;
    const identityValid =
        !!companyName?.trim() && !!email?.trim() && !!contact?.trim() && logoOk;

    const headerOk = !!websiteHeaderUrl?.trim() || !!brandingFiles.websiteHeader;
    const footerLeftOk = !!websiteFooterLeftUrl?.trim() || !!brandingFiles.websiteFooterLeft;
    const footerRightOk = !!websiteFooterRightUrl?.trim() || !!brandingFiles.websiteFooterRight;

    /** Step 2 onboarding: address-only fields (matches Step2.jsx labels). */
    const addressFieldsValid =
        !!resolvedRestaurantId &&
        !!companyLocation?.trim() &&
        !!stateRegion?.trim() &&
        !!postalCode?.trim() &&
        !!address?.trim();

    /** Website images required for step 2 PUT; hours/prep/delivery flags stay in state from GET / defaults. */
    const brandingImagesValid = headerOk && footerLeftOk && footerRightOk;

    /** Full step 2 PUT (address + branding + hidden fields from API). */
    const step2PutValid = addressFieldsValid && brandingImagesValid;

    const extractUploadedLogoUrl = (data) => {
        if (!data) return '';
        if (typeof data === 'string') {
            const text = data.trim();
            if (!text) return '';
            try {
                const parsed = JSON.parse(text);
                return extractUploadedLogoUrl(parsed);
            } catch {
                return normalizeUrl(text);
            }
        }
        return normalizeUrl(data.url);
    };

    const extractUploadedImageUrl = (data) => {
        if (!data) return '';
        if (typeof data === 'string') {
            const text = data.trim();
            if (!text) return '';
            try {
                const parsed = JSON.parse(text);
                return extractUploadedImageUrl(parsed);
            } catch {
                return normalizeUrl(text);
            }
        }
        return normalizeUrl(data.url);
    };

    const uploadCompanyLogo = async (file, baseUrl) => {
        if (!file) throw new Error('Company logo is missing');
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/upload/logo`;
        const body = new FormData();
        body.append('file', file);
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body,
        });
        const contentType = res.headers.get('content-type');
        const data = contentType?.includes('application/json') ? await res.json() : await res.text();
        const uploadedUrl = extractUploadedLogoUrl(data);
        if (!res.ok) throw new Error('Logo upload failed');
        if (!uploadedUrl) throw new Error('Logo upload did not return a link');
        return uploadedUrl;
    };

    const uploadImage = async (file, baseUrl) => {
        if (!file) throw new Error('Image file is missing');
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/upload/image`;
        const body = new FormData();
        body.append('file', file);
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body,
        });
        const contentType = res.headers.get('content-type');
        const data = contentType?.includes('application/json') ? await res.json() : await res.text();
        const uploadedUrl = extractUploadedImageUrl(data);
        if (!res.ok) throw new Error('Image upload failed');
        if (!uploadedUrl) throw new Error('Image upload did not return a link');
        return uploadedUrl;
    };

    const applyStep2Payload = (step2) => {
        if (!step2 || typeof step2 !== 'object') return;
        if (typeof step2.street_address === 'string') setAddress(step2.street_address);
        if (typeof step2.city === 'string') setCompanyLocation(step2.city);
        if (typeof step2.state === 'string') setStateRegion(step2.state);
        if (typeof step2.postal_code === 'string') setPostalCode(step2.postal_code);
        if (typeof step2.country === 'string') setCountry(step2.country);
        if (typeof step2.alternate_contact === 'string') setAltPhone(step2.alternate_contact);
        if (typeof step2.average_preparation_time === 'string') setPrepTime(step2.average_preparation_time);
        if (normalizeBool(step2.enable_delivery) !== null) setEnableDelivery(!!normalizeBool(step2.enable_delivery));
        if (normalizeBool(step2.enable_pickup) !== null) setEnablePickup(!!normalizeBool(step2.enable_pickup));
        const hdr = step2.website_header_images;
        if (Array.isArray(hdr) && typeof hdr[0] === 'string') setWebsiteHeaderUrl(normalizeUrl(hdr[0]));
        const ftr = step2.website_footer_images;
        if (Array.isArray(ftr)) {
            if (typeof ftr[0] === 'string') setWebsiteFooterLeftUrl(normalizeUrl(ftr[0]));
            if (typeof ftr[1] === 'string') setWebsiteFooterRightUrl(normalizeUrl(ftr[1]));
        }
        if (step2.opening_hours && typeof step2.opening_hours === 'object') {
            setOpeningHours(mergeOpeningHours(step2.opening_hours));
        }
    };

    /** Maps GET /api/v1/restaurants/{id} `data` into Business Profile state only. */
    const applyRestaurantDetailPayload = (r) => {
        if (!r || typeof r !== 'object') return;

        if (typeof r.id === 'string' && r.id.trim()) setRestaurantId(r.id.trim());

        if (typeof r.name === 'string') setCompanyName(r.name);
        else if (typeof r.legal_business_name === 'string') setCompanyName(r.legal_business_name);

        if (typeof r.email === 'string') setEmail(r.email);
        if (typeof r.phone_number === 'string') setContact(r.phone_number);

        const logo = normalizeUrl(r.company_logo);
        if (logo) setCompanyLogoUrl(logo);

        if (typeof r.owner_full_name === 'string') setOwnerFullNameRaw(r.owner_full_name);
        else if (r.owner_full_name === null) setOwnerFullNameRaw(null);

        const owner2fa = r.owner && typeof r.owner === 'object' ? r.owner.is_2fa_enabled : undefined;
        if (typeof owner2fa === 'boolean') setIs2faEnabled(owner2fa);
        else {
            const nb = normalizeBool(r.is_2fa_enabled);
            if (typeof nb === 'boolean') setIs2faEnabled(nb);
        }

        if (typeof r.street_address === 'string') setAddress(r.street_address);
        if (typeof r.city === 'string') setCompanyLocation(r.city);
        if (typeof r.state === 'string') setStateRegion(r.state);
        if (typeof r.postal_code === 'string') setPostalCode(r.postal_code);
        if (typeof r.country === 'string') setCountry(r.country);

        if (typeof r.alternate_contact === 'string') setAltPhone(r.alternate_contact);
        else if (r.alternate_contact === null || r.alternate_contact === undefined) setAltPhone('');

        const hdr = r.website_header_images;
        if (Array.isArray(hdr) && typeof hdr[0] === 'string') setWebsiteHeaderUrl(normalizeUrl(hdr[0]));
        const ftr = r.website_footer_images;
        if (Array.isArray(ftr)) {
            if (typeof ftr[0] === 'string') setWebsiteFooterLeftUrl(normalizeUrl(ftr[0]));
            if (typeof ftr[1] === 'string') setWebsiteFooterRightUrl(normalizeUrl(ftr[1]));
        }

        if (typeof r.average_preparation_time === 'string') setPrepTime(r.average_preparation_time);
        if (normalizeBool(r.enable_delivery) !== null) setEnableDelivery(!!normalizeBool(r.enable_delivery));
        if (normalizeBool(r.enable_pickup) !== null) setEnablePickup(!!normalizeBool(r.enable_pickup));

        const bh = r.business_hours;
        if (typeof bh === 'string' && bh.trim()) {
            try {
                const parsed = JSON.parse(bh);
                if (parsed && typeof parsed === 'object') setOpeningHours(mergeOpeningHours(parsed));
            } catch {
                /* ignore invalid JSON */
            }
        } else if (bh && typeof bh === 'object') {
            setOpeningHours(mergeOpeningHours(bh));
        }

        if (r.opening_hours && typeof r.opening_hours === 'object') {
            setOpeningHours(mergeOpeningHours(r.opening_hours));
        }
    };

    useEffect(() => {
        if (!accessToken) {
            setLoadingProfile(false);
            return;
        }

        const load = async () => {
            setLoadingProfile(true);
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

                const resolvedRestaurantIdForDetail =
                    (step1 && typeof step1 === 'object' && typeof step1.id === 'string' ? step1.id.trim() : '') ||
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() ||
                    getRestaurantIdFromUser(authUser);

                let populatedFromRestaurant = false;

                if (resolvedRestaurantIdForDetail) {
                    const restaurantDetailUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(resolvedRestaurantIdForDetail)}`;
                    const resDetail = await fetch(restaurantDetailUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    const ctDetail = resDetail.headers.get('content-type');
                    const rawDetail = ctDetail?.includes('application/json') ? await resDetail.json() : await resDetail.text();
                    const detail = extractPayload(rawDetail);

                    if (
                        resDetail.ok &&
                        detail &&
                        typeof detail === 'object' &&
                        typeof detail.id === 'string'
                    ) {
                        applyRestaurantDetailPayload(detail);

                        const nextCompanyName =
                            typeof detail.name === 'string'
                                ? detail.name.trim()
                                : typeof detail.legal_business_name === 'string'
                                  ? detail.legal_business_name.trim()
                                  : '';
                        const nextLogo = normalizeUrl(detail.company_logo);
                        const nextPhone =
                            typeof detail.phone_number === 'string' ? detail.phone_number.trim() : '';
                        const nextOwnerFn =
                            typeof detail.owner_full_name === 'string' ? detail.owner_full_name : null;
                        const owner2fa =
                            detail.owner && typeof detail.owner === 'object'
                                ? detail.owner.is_2fa_enabled
                                : undefined;
                        const next2fa =
                            typeof owner2fa === 'boolean'
                                ? owner2fa
                                : normalizeBool(detail.is_2fa_enabled);

                        prefilledStep1Ref.current = true;
                        initialStep1Ref.current = {
                            companyName: nextCompanyName,
                            companyLogoUrl: nextLogo,
                            ownerFullNameRaw: nextOwnerFn,
                            ownerPhone: nextPhone,
                            is2faEnabled: typeof next2fa === 'boolean' ? next2fa : null,
                        };

                        if (nextCompanyName) dispatch(setRestaurantName(nextCompanyName));
                        populatedFromRestaurant = true;
                    }
                }

                if (!populatedFromRestaurant && step1 && typeof step1 === 'object') {
                    const nextRestaurantId = typeof step1.id === 'string' ? step1.id.trim() : '';
                    const nextOwnerFullNameRaw = typeof step1.owner_full_name === 'string' ? step1.owner_full_name : null;
                    const nextOwnerPhoneRaw = typeof step1.owner_phone === 'string' ? step1.owner_phone : null;
                    const nextCompanyName = typeof step1.company_name === 'string' ? step1.company_name : '';
                    const nextEmail = typeof step1.email === 'string' ? step1.email : '';
                    const nextCompanyLogoUrl = normalizeUrl(step1.company_logo);
                    const next2FAEnabled = normalizeBool(step1.is_2fa_enabled);

                    setRestaurantId(nextRestaurantId);
                    setOwnerFullNameRaw(nextOwnerFullNameRaw);
                    setCompanyName(nextCompanyName);
                    setEmail(nextEmail);
                    setContact(typeof nextOwnerPhoneRaw === 'string' ? nextOwnerPhoneRaw : '');
                    setCompanyLogoUrl(nextCompanyLogoUrl);
                    if (typeof next2FAEnabled === 'boolean') setIs2faEnabled(next2FAEnabled);

                    if (!prefilledStep1Ref.current) {
                        prefilledStep1Ref.current = true;
                        initialStep1Ref.current = {
                            companyName: nextCompanyName.trim(),
                            companyLogoUrl: nextCompanyLogoUrl,
                            ownerFullNameRaw: nextOwnerFullNameRaw,
                            ownerPhone: typeof nextOwnerPhoneRaw === 'string' ? nextOwnerPhoneRaw.trim() : '',
                            is2faEnabled: typeof next2FAEnabled === 'boolean' ? next2FAEnabled : null,
                        };
                    }

                    if (nextCompanyName?.trim()) {
                        dispatch(setRestaurantName(nextCompanyName));
                    }
                }

                if (!populatedFromRestaurant) {
                    const step2Url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step2`;
                    const res2 = await fetch(step2Url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        },
                    });
                    if (res2.ok) {
                        const ct2 = res2.headers.get('content-type');
                        const raw2 = ct2?.includes('application/json') ? await res2.json() : await res2.text();
                        const step2 = extractPayload(raw2);
                        applyStep2Payload(step2);
                    }
                }
            } catch (e) {
                console.error('Business profile load failed:', e);
                toast.error(typeof e?.message === 'string' ? e.message : 'Failed to load profile');
            } finally {
                setLoadingProfile(false);
            }
        };

        load();
    }, [accessToken, dispatch, authUser]);

    const getUserIdForAccountUpdate = async (baseUrl) => {
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
    };

    const updateAccount2FAFlag = async (baseUrl, enabled) => {
        const userId = await getUserIdForAccountUpdate(baseUrl);
        if (!userId) {
            setIdentityErrors(['User ID not found for 2FA update']);
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
            setIdentityErrors(lines.length ? lines : [typeof data === 'string' && data.trim() ? data.trim() : 'Request failed']);
            return false;
        }
        if (isErrorPayload(data)) {
            setIdentityErrors([
                typeof data.message === 'string' && data.message.trim()
                    ? data.message.trim()
                    : typeof data.code === 'string'
                      ? data.code.trim()
                      : 'Request failed',
            ]);
            return false;
        }
        return true;
    };

    const open2FAModal = async (baseUrl) => {
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
            const dataUrl = await QRCode.toDataURL(otpAuthUrl);
            setSetupQrCodeUrl(dataUrl);
        } catch (e) {
            setSetupError(e?.message || 'Failed to load QR code. Please try again.');
        } finally {
            setSetupLoadingQR(false);
        }
    };

    const handle2FAVerify = async () => {
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
    };

    const handleSaveIdentity = async () => {
        if (!identityValid || savingIdentity) return;
        setSavingIdentity(true);
        setIdentityErrors([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step1`;
            const nextLogoUrl = companyLogoUrl?.trim() || (await uploadCompanyLogo(brandingFiles.companyLogo, baseUrl));
            if (!companyLogoUrl?.trim()) setCompanyLogoUrl(nextLogoUrl);

            const baseline = initialStep1Ref.current || {
                companyName: '',
                companyLogoUrl: '',
                ownerFullNameRaw: null,
                ownerPhone: '',
                is2faEnabled: null,
            };
            const nextCompanyName = companyName.trim();
            const nextCompanyLogoUrl = normalizeUrl(nextLogoUrl);
            const nextOwnerPhone = contact.trim();
            const next2FAEnabled = !!is2faEnabled;

            const hasCompanyNameChanged = !baseline.companyName || nextCompanyName !== baseline.companyName;
            const hasLogoChanged = !baseline.companyLogoUrl || nextCompanyLogoUrl !== baseline.companyLogoUrl;
            const hasOwnerPhoneChanged = !baseline.ownerPhone || nextOwnerPhone !== baseline.ownerPhone;
            const baseline2fa = typeof baseline.is2faEnabled === 'boolean' ? baseline.is2faEnabled : null;
            const has2faChanged = baseline2fa === null ? true : next2FAEnabled !== baseline2fa;
            const hasUpdates = hasCompanyNameChanged || hasLogoChanged || hasOwnerPhoneChanged || has2faChanged;

            if (!hasUpdates) {
                toast.success('No identity changes to save');
                return;
            }

            const ownerFullNameToSend =
                typeof baseline.ownerFullNameRaw === 'string'
                    ? baseline.ownerFullNameRaw
                    : typeof ownerFullNameRaw === 'string' && ownerFullNameRaw.trim()
                      ? ownerFullNameRaw.trim()
                      : null;

            const updates = {
                company_name: nextCompanyName,
                owner_full_name: ownerFullNameToSend,
                ...(hasLogoChanged ? { company_logo: nextCompanyLogoUrl } : {}),
                ...(hasOwnerPhoneChanged ? { owner_phone: nextOwnerPhone } : {}),
                ...(has2faChanged ? { is_2fa_enabled: next2FAEnabled } : {}),
            };

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(updates),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                setIdentityErrors(
                    lines.length
                        ? lines
                        : [
                              typeof data === 'object' && data?.message
                                  ? data.message
                                  : typeof data === 'string' && data.trim()
                                    ? data.trim()
                                    : 'Request failed',
                          ],
                );
                return;
            }

            if (isErrorPayload(data)) {
                setIdentityErrors([
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : typeof data.code === 'string'
                          ? data.code.trim()
                          : 'Request failed',
                ]);
                return;
            }

            const updated = await updateAccount2FAFlag(baseUrl, next2FAEnabled);
            if (!updated) return;

            initialStep1Ref.current = {
                companyName: nextCompanyName,
                companyLogoUrl: nextCompanyLogoUrl,
                ownerFullNameRaw,
                ownerPhone: nextOwnerPhone,
                is2faEnabled: next2FAEnabled,
            };

            dispatch(setRestaurantName(nextCompanyName));

            if (has2faChanged && next2FAEnabled) {
                await open2FAModal(baseUrl);
                toast.success('Scan the QR code to finish enabling 2FA');
                return;
            }

            toast.success('Business identity saved');
        } catch (e) {
            setIdentityErrors([e?.message || 'Request failed']);
        } finally {
            setSavingIdentity(false);
        }
    };

    const submitStep2Put = async (successToast) => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

        const rid = resolvedRestaurantId;
        if (!rid) {
            setOperationalErrors(['Restaurant not found. Complete onboarding step 1 first.']);
            return false;
        }

        const headerUrl =
            websiteHeaderUrl?.trim() || (await uploadImage(brandingFiles.websiteHeader, baseUrl));
        const footerLeftUrl =
            websiteFooterLeftUrl?.trim() || (await uploadImage(brandingFiles.websiteFooterLeft, baseUrl));
        const footerRightUrl =
            websiteFooterRightUrl?.trim() || (await uploadImage(brandingFiles.websiteFooterRight, baseUrl));

        setWebsiteHeaderUrl(headerUrl);
        setWebsiteFooterLeftUrl(footerLeftUrl);
        setWebsiteFooterRightUrl(footerRightUrl);

        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step2`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
                restaurant_id: rid,
                street_address: address,
                city: companyLocation,
                state: stateRegion || '',
                postal_code: postalCode || '',
                country: country || 'USA',
                website_header_images: [headerUrl],
                website_footer_images: [footerLeftUrl, footerRightUrl],
                alternate_contact: altPhone,
                opening_hours: openingHours,
                average_preparation_time: prepTime,
                enable_delivery: !!enableDelivery,
                enable_pickup: !!enablePickup,
                goto: 'step3',
            }),
        });

        const contentType = res.headers.get('content-type');
        const data = contentType?.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
            const lines = toValidationErrorLines(data);
            setOperationalErrors(
                lines.length
                    ? lines
                    : [
                          typeof data === 'object' && data?.message
                              ? data.message
                              : typeof data === 'string' && data.trim()
                                ? data.trim()
                                : 'Request failed',
                      ],
            );
            return false;
        }

        if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
            setOperationalErrors([
                typeof data.message === 'string' && data.message.trim() ? data.message.trim() : data.code.trim() || 'Request failed',
            ]);
            return false;
        }

        toast.success(successToast);
        return true;
    };

    const handleSaveOperational = async () => {
        if (!step2PutValid || savingOperational) return;
        setSavingOperational(true);
        setOperationalErrors([]);
        try {
            await submitStep2Put('Website & operations saved');
        } catch (e) {
            setOperationalErrors([e?.message || 'Request failed']);
        } finally {
            setSavingOperational(false);
        }
    };

    const handleSaveAddress = async () => {
        if (!step2PutValid || savingOperational) return;
        setSavingOperational(true);
        setOperationalErrors([]);
        try {
            await submitStep2Put('Business address saved');
        } catch (e) {
            setOperationalErrors([e?.message || 'Request failed']);
        } finally {
            setSavingOperational(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center py-24 bg-white rounded-xl border border-[#E8E8E8]">
                <p className="text-[#6B6B6B] text-[14px]">Loading business profile…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Business Profile</h2>
                <p className="text-[#6B6B6B] text-[14px]">
                    Restaurant identity (step 1), then website and operations (step 2). Address fields are in the Business Address card below.
                </p>
            </div>

            {/* Step 1 — identity */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5 pb-4">
                <h3 className="mb-4 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Restaurant identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                                Company name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => {
                                    setCompanyName(e.target.value);
                                    dispatch(setRestaurantName(e.target.value));
                                }}
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                                Company email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-2 bg-gray-50 text-[14px] border border-[#E5E7EB] rounded-[8px] text-[#6B7280]"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                                Restaurant contact number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                            />
                        </div>
                        <NotificationToggle
                            title="Enable two-factor authentication"
                            desc="Extra security for your account (optional)"
                            active={!!is2faEnabled}
                            onClick={() => setIs2faEnabled((prev) => !prev)}
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                            Company logo <span className="text-red-500">*</span>
                        </label>
                        <div className="border border-[#E8E8E8] rounded-[12px] p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50">
                            {companyLogoPreviewUrl ? (
                                <div className="w-[120px] h-[120px] rounded-[14px] overflow-hidden border border-[#E5E7EB] bg-white">
                                    <img src={companyLogoPreviewUrl} alt="Logo" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-lg">
                                    <Upload className="w-6 h-6 text-[#9CA3AF]" />
                                </div>
                            )}
                            <label className="cursor-pointer px-4 py-1 text-[14px] font-medium text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition">
                                {brandingFiles.companyLogo || companyLogoPreviewUrl ? 'Replace logo' : 'Upload logo'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setBrandingFile('companyLogo', file);
                                        setCompanyLogoUrl('');
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {!!identityErrors.length && (
                    <div className="mt-4 bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                            <div className="space-y-1">
                                {identityErrors.map((line, idx) => (
                                    <p key={idx} className="text-[12px] text-[#47464A]">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        disabled={!identityValid || savingIdentity}
                        onClick={handleSaveIdentity}
                        className="flex items-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#C52820] transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {savingIdentity ? 'Saving…' : 'Save identity'}
                    </button>
                </div>

                <div className="mt-10 pt-8 border-t border-[#E8E8E8]">
                    <h3 className="mb-4 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                        Website &amp; operations
                    </h3>
                    <p className="text-[13px] text-[#6B7280] mb-6">
                        Onboarding step 2 fields except address (use the Business Address card for location).
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Alternate phone</label>
                            <input
                                type="text"
                                value={altPhone}
                                onChange={(e) => setAltPhone(e.target.value)}
                                placeholder="+1 (555) 987-6543"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                            />
                        </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex items-end justify-between gap-3">
                            <label className="block text-[14px] font-medium text-[#4B5563]">
                                Website header <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[11px] text-[#6B7280]">
                                {WEBSITE_HEADER_REQUIRED_PX.width}×{WEBSITE_HEADER_REQUIRED_PX.height}px
                            </span>
                        </div>
                        <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                            <label htmlFor="bpWebsiteHeader" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                <Image size={18} />
                                {brandingFiles.websiteHeader || websiteHeaderPreviewUrl ? 'Change image' : 'Upload image'}
                            </label>
                            <input
                                id="bpWebsiteHeader"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setBrandingFile('websiteHeader', file);
                                    setWebsiteHeaderUrl('');
                                }}
                            />
                        </div>
                        {websiteHeaderPreviewUrl && (
                            <div className="w-full rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                <img
                                    src={websiteHeaderPreviewUrl}
                                    alt="Header"
                                    className="w-full h-auto block"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-[14px] font-medium text-[#4B5563]">
                            Website footer <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-end justify-between gap-3">
                                    <span className="text-[13px] font-medium text-[#4B5563]">Footer image 1</span>
                                    <span className="text-[11px] text-[#6B7280]">
                                        {WEBSITE_FOOTER_LEFT_REQUIRED_PX.width}×{WEBSITE_FOOTER_LEFT_REQUIRED_PX.height}px
                                    </span>
                                </div>
                                <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                                    <label htmlFor="bpFooterLeft" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                        <Image size={18} />
                                        {brandingFiles.websiteFooterLeft || websiteFooterLeftPreviewUrl ? 'Change' : 'Upload'}
                                    </label>
                                    <input
                                        id="bpFooterLeft"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            setBrandingFile('websiteFooterLeft', file);
                                            setWebsiteFooterLeftUrl('');
                                        }}
                                    />
                                </div>
                                {websiteFooterLeftPreviewUrl && (
                                    <div className="w-full rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                        <img
                                            src={websiteFooterLeftPreviewUrl}
                                            alt="Footer 1"
                                            className="w-full h-auto block"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-end justify-between gap-3">
                                    <span className="text-[13px] font-medium text-[#4B5563]">Footer image 2</span>
                                    <span className="text-[11px] text-[#6B7280]">
                                        {WEBSITE_FOOTER_RIGHT_REQUIRED_PX.width}×{WEBSITE_FOOTER_RIGHT_REQUIRED_PX.height}px
                                    </span>
                                </div>
                                <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                                    <label htmlFor="bpFooterRight" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                        <Image size={18} />
                                        {brandingFiles.websiteFooterRight || websiteFooterRightPreviewUrl ? 'Change' : 'Upload'}
                                    </label>
                                    <input
                                        id="bpFooterRight"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            setBrandingFile('websiteFooterRight', file);
                                            setWebsiteFooterRightUrl('');
                                        }}
                                    />
                                </div>
                                {websiteFooterRightPreviewUrl && (
                                    <div className="w-full rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                        <img
                                            src={websiteFooterRightPreviewUrl}
                                            alt="Footer 2"
                                            className="w-full h-auto block"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {!!operationalErrors.length && (
                    <div className="mt-4 bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                            <div className="space-y-1">
                                {operationalErrors.map((line, idx) => (
                                    <p key={idx} className="text-[12px] text-[#47464A]">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        disabled={!step2PutValid || savingOperational}
                        onClick={handleSaveOperational}
                        className="flex items-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] hover:bg-[#C52820] transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {savingOperational ? 'Saving…' : 'Save website & operations'}
                    </button>
                </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] px-6 pt-6 pb-4">
                <h3 className="mb-2 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Business Address
                </h3>
                <p className="text-[13px] text-[#6B7280] mb-6">
                    Onboarding step 2 location fields only. Updates use the same step 2 API together with your website and operations data above.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                            Company Location <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={companyLocation}
                            onChange={(e) => setCompanyLocation(e.target.value)}
                            placeholder="e.g., Lahore, Pakistan"
                            className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                                State <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={stateRegion}
                                onChange={(e) => setStateRegion(e.target.value)}
                                placeholder="e.g., California"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                                Postal Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                placeholder="e.g., 10001"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[14px] font-medium text-[#4B5563] mb-1">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="123 Main Street, New York, NY 10001"
                            className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        disabled={!step2PutValid || savingOperational}
                        onClick={handleSaveAddress}
                        className="flex items-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] hover:bg-[#C52820] transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {savingOperational ? 'Saving…' : 'Save address'}
                    </button>
                </div>
            </div>

            {is2FAModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20"
                    onClick={() => {
                        if (setupLoading || setupLoadingQR) return;
                        setIs2FAModalOpen(false);
                    }}
                >
                    <div
                        className="relative bg-white w-full max-w-[680px] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-black/10"
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
                </div>
            )}
        </div>
    );
};

export default BusinessProfile;
