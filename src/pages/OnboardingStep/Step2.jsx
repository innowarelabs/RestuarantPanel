import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Toggle from './Toggle';

export default function Step2({
    formData,
    setFormData,
    brandingFiles,
    setBrandingFile,
    WEBSITE_HEADER_REQUIRED_PX,
    WEBSITE_FOOTER_LEFT_REQUIRED_PX,
    WEBSITE_FOOTER_RIGHT_REQUIRED_PX,
    handlePrev,
    handleNext,
}) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [submitting, setSubmitting] = useState(false);
    const [errorLines, setErrorLines] = useState([]);

    const normalizeUrl = (value) => {
        if (typeof value !== 'string') return '';
        return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    };

    const websiteHeaderPreviewUrl = brandingFiles.websiteHeaderPreviewUrl || normalizeUrl(formData.websiteHeaderUrl);
    const websiteFooterLeftPreviewUrl = brandingFiles.websiteFooterLeftPreviewUrl || normalizeUrl(formData.websiteFooterLeftUrl);
    const websiteFooterRightPreviewUrl = brandingFiles.websiteFooterRightPreviewUrl || normalizeUrl(formData.websiteFooterRightUrl);

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

    const getRestaurantId = (value) => {
        if (!value || typeof value !== 'object') return '';
        if (typeof value.restaurant_id === 'string') return value.restaurant_id;
        if (typeof value.restaurantId === 'string') return value.restaurantId;
        if (value.restaurant && typeof value.restaurant === 'object') {
            if (typeof value.restaurant.id === 'string') return value.restaurant.id;
            if (typeof value.restaurant.restaurant_id === 'string') return value.restaurant.restaurant_id;
        }
        if (typeof value.id === 'string') return value.id;
        return '';
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

    const openingHours = formData.openingHours || {};
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const openingHoursValid = requiredDays.every((day) => {
        const entry = openingHours[day] || {};
        return !!entry.open?.trim() && !!entry.close?.trim();
    });

    const headerOk = !!formData.websiteHeaderUrl?.trim() || !!brandingFiles.websiteHeader;
    const footerLeftOk = !!formData.websiteFooterLeftUrl?.trim() || !!brandingFiles.websiteFooterLeft;
    const footerRightOk = !!formData.websiteFooterRightUrl?.trim() || !!brandingFiles.websiteFooterRight;

    const restaurantIdFromStep1 = formData.restaurantId?.trim();
    const restaurantIdFromStorage = (() => {
        try {
            const value = localStorage.getItem('restaurant_id');
            return typeof value === 'string' ? value.trim() : '';
        } catch {
            return '';
        }
    })();
    const resolvedRestaurantId = restaurantIdFromStep1 || restaurantIdFromStorage || getRestaurantId(user);

    const isValid =
        !!resolvedRestaurantId &&
        !!formData.companyLocation?.trim() &&
        !!formData.stateRegion?.trim() &&
        !!formData.postalCode?.trim() &&
        headerOk &&
        footerLeftOk &&
        footerRightOk &&
        !!formData.contact?.trim() &&
        !!formData.address?.trim() &&
        !!formData.prepTime?.trim() &&
        openingHoursValid;

    useEffect(() => {
        const restaurantId = resolvedRestaurantId;
        if (!restaurantId) return;

        const loadMenuItems = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${restaurantId}/menu?limit=100`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                });
                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();
                console.log('Onboarding Step2 menu items response:', { ok: res.ok, status: res.status, data });
            } catch (e) {
                const message = typeof e?.message === 'string' ? e.message : 'Failed to load menu items';
                console.log('Onboarding Step2 menu items error:', message);
            }
        };

        loadMenuItems();
    }, [accessToken, resolvedRestaurantId]);

    const handleSubmitStep2 = async () => {
        if (!isValid || submitting) return;
        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const restaurantId = resolvedRestaurantId;
            if (!restaurantId) {
                setErrorLines(['Restaurant not found. Please complete Step 1 first.']);
                return;
            }

            if (!restaurantIdFromStep1) {
                setFormData((prev) => ({ ...prev, restaurantId }));
            }

            const headerUrl =
                formData.websiteHeaderUrl?.trim() || (await uploadImage(brandingFiles.websiteHeader, baseUrl));
            const footerLeftUrl =
                formData.websiteFooterLeftUrl?.trim() || (await uploadImage(brandingFiles.websiteFooterLeft, baseUrl));
            const footerRightUrl =
                formData.websiteFooterRightUrl?.trim() || (await uploadImage(brandingFiles.websiteFooterRight, baseUrl));

            setFormData((prev) => ({
                ...prev,
                websiteHeaderUrl: headerUrl,
                websiteFooterLeftUrl: footerLeftUrl,
                websiteFooterRightUrl: footerRightUrl,
            }));

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step2`;

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    street_address: formData.address,
                    city: formData.companyLocation,
                    state: formData.stateRegion || '',
                    postal_code: formData.postalCode || '',
                    country: formData.country || 'USA',
                    website_header_images: [headerUrl],
                    website_footer_images: [footerLeftUrl, footerRightUrl],
                    phone_number: formData.contact,
                    alternate_contact: formData.altPhone,
                    opening_hours: openingHours,
                    average_preparation_time: formData.prepTime,
                    enable_delivery: !!formData.enableDelivery,
                    enable_pickup: !!formData.enablePickup,
                    goto: 'step3',
                }),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();
            console.log('Onboarding Step2 response:', { ok: res.ok, status: res.status, data });
            if (!res.ok) {
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

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                const message =
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : data.code.trim() || 'Request failed';
                setErrorLines([message]);
                return;
            }
            handleNext?.();
        } catch (e) {
            console.log('Onboarding Step2 error:', e);
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="space-y-6">
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Company Location <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.companyLocation}
                    onChange={(e) => setFormData({ ...formData, companyLocation: e.target.value })}
                    placeholder="e.g., Lahore, Pakistan"
                    className="onboarding-input"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">State <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.stateRegion}
                        onChange={(e) => setFormData({ ...formData, stateRegion: e.target.value })}
                        placeholder="e.g., California"
                        className="onboarding-input"
                    />
                </div>
                <div>
                    <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Postal Code <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="e.g., 10001"
                        className="onboarding-input"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                    <label className="block text-[14px] font-[500] text-[#1A1A1A]">Website Header <span className="text-red-500">*</span></label>
                    <span className="text-[11px] text-[#6B7280] font-[400]">
                        Required: {WEBSITE_HEADER_REQUIRED_PX.width}×{WEBSITE_HEADER_REQUIRED_PX.height}px
                    </span>
                </div>
                <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                    <label htmlFor="websiteHeaderUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                        <Image size={18} />
                        {brandingFiles.websiteHeader || websiteHeaderPreviewUrl ? 'Change image' : 'Upload image'}
                    </label>
                    <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[180px] truncate">
                        {brandingFiles.websiteHeader?.name ?? 'No file chosen'}
                    </span>
                    <input
                        id="websiteHeaderUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setBrandingFile('websiteHeader', file);
                            setFormData((prev) => ({ ...prev, websiteHeaderUrl: '' }));
                        }}
                    />
                </div>
                {websiteHeaderPreviewUrl && (
                    <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                        <img src={websiteHeaderPreviewUrl} alt="Website Header Preview" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>
            <div className="space-y-3">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Website Footer <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                            <span className="text-[13px] font-[500] text-[#1A1A1A]">Footer Image 1</span>
                            <span className="text-[11px] text-[#6B7280] font-[400]">
                                {WEBSITE_FOOTER_LEFT_REQUIRED_PX.width}×{WEBSITE_FOOTER_LEFT_REQUIRED_PX.height}px
                            </span>
                        </div>
                        <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                            <label htmlFor="websiteFooterLeftUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                <Image size={18} />
                                {brandingFiles.websiteFooterLeft || websiteFooterLeftPreviewUrl ? 'Change image' : 'Upload image'}
                            </label>
                            <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[160px] truncate">
                                {brandingFiles.websiteFooterLeft?.name ?? 'No file chosen'}
                            </span>
                            <input
                                id="websiteFooterLeftUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setBrandingFile('websiteFooterLeft', file);
                                    setFormData((prev) => ({ ...prev, websiteFooterLeftUrl: '' }));
                                }}
                            />
                        </div>
                        {websiteFooterLeftPreviewUrl && (
                            <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                <img src={websiteFooterLeftPreviewUrl} alt="Website Footer Left Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                            <span className="text-[13px] font-[500] text-[#1A1A1A]">Footer Image 2</span>
                            <span className="text-[11px] text-[#6B7280] font-[400]">
                                {WEBSITE_FOOTER_RIGHT_REQUIRED_PX.width}×{WEBSITE_FOOTER_RIGHT_REQUIRED_PX.height}px
                            </span>
                        </div>
                        <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                            <label htmlFor="websiteFooterRightUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                <Image size={18} />
                                {brandingFiles.websiteFooterRight || websiteFooterRightPreviewUrl ? 'Change image' : 'Upload image'}
                            </label>
                            <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[160px] truncate">
                                {brandingFiles.websiteFooterRight?.name ?? 'No file chosen'}
                            </span>
                            <input
                                id="websiteFooterRightUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setBrandingFile('websiteFooterRight', file);
                                    setFormData((prev) => ({ ...prev, websiteFooterRightUrl: '' }));
                                }}
                            />
                        </div>
                        {websiteFooterRightPreviewUrl && (
                            <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                <img src={websiteFooterRightPreviewUrl} alt="Website Footer Right Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Restaurant Contact Number <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="onboarding-input"
                />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Alternate Phone</label>
                <input
                    type="text"
                    value={formData.altPhone}
                    onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                    placeholder="+1 (555) 987-6543"
                    className="onboarding-input"
                />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Address <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street, New York, NY 10001"
                    className="onboarding-input"
                />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-3">Opening Hours</label>
                <div className="space-y-3 bg-[#F9FAFB]/50 p-4 rounded-[8px] border border-[#E5E7EB]">
                    {[
                        { label: 'Monday', key: 'monday' },
                        { label: 'Tuesday', key: 'tuesday' },
                        { label: 'Wednesday', key: 'wednesday' },
                        { label: 'Thursday', key: 'thursday' },
                        { label: 'Friday', key: 'friday' },
                        { label: 'Saturday', key: 'saturday' },
                        { label: 'Sunday', key: 'sunday' },
                    ].map((day) => (
                        <div key={day.key} className="grid grid-cols-12 items-center gap-4">
                            <span className="col-span-6 text-[13px] text-[#1A1A1A] font-[500]">{day.label}</span>
                            <div className="col-span-6 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={openingHours?.[day.key]?.open || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            openingHours: {
                                                ...(prev.openingHours || {}),
                                                [day.key]: {
                                                    open: e.target.value,
                                                    close: prev.openingHours?.[day.key]?.close || '',
                                                },
                                            },
                                        }))
                                    }
                                    className="h-9 w-full bg-white border border-gray-200 rounded-lg px-2 text-[12px] text-center"
                                    placeholder="--:--"
                                />
                                <span className="text-gray-400">—</span>
                                <input
                                    type="text"
                                    value={openingHours?.[day.key]?.close || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            openingHours: {
                                                ...(prev.openingHours || {}),
                                                [day.key]: {
                                                    open: prev.openingHours?.[day.key]?.open || '',
                                                    close: e.target.value,
                                                },
                                            },
                                        }))
                                    }
                                    className="h-9 w-full bg-white border border-gray-200 rounded-lg px-2 text-[12px] text-center"
                                    placeholder="--:--"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Average Preparation Time <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select
                        value={formData.prepTime}
                        onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                        className="onboarding-input appearance-none"
                    >
                        <option>15 minutes</option>
                        <option>20-30 min</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-[500] text-[#1A1A1A]">Enable Delivery</span>
                    <Toggle active={formData.enableDelivery} onClick={() => setFormData({ ...formData, enableDelivery: !formData.enableDelivery })} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-[500] text-[#1A1A1A]">Enable Pickup</span>
                    <Toggle active={formData.enablePickup} onClick={() => setFormData({ ...formData, enablePickup: !formData.enablePickup })} />
                </div>
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
                <button
                    type="button"
                    disabled={!isValid || submitting}
                    onClick={handleSubmitStep2}
                    className="next-btn px-10"
                >
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
