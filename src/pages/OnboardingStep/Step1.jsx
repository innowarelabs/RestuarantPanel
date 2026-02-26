import { AlertCircle, ChevronRight, Image } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

export default function Step1({
    formData,
    setFormData,
    brandingFiles,
    setBrandingFile,
    handleNext,
}) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const [submitting, setSubmitting] = useState(false);
    const [errorLines, setErrorLines] = useState([]);
    const initialStep1Ref = useRef(null);
    const prefilledRef = useRef(false);

    const normalizeUrl = (value) => {
        if (typeof value !== 'string') return '';
        return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    };

    useEffect(() => {
        if (!accessToken) return;

        const fetchStep1 = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step1`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();
                console.log('Onboarding Step1 GET response:', { ok: res.ok, status: res.status, data });

                const extractStep1Payload = (raw) => {
                    if (!raw) return null;
                    if (typeof raw === 'string') {
                        const text = raw.trim();
                        if (!text) return null;
                        try {
                            const parsed = JSON.parse(text);
                            return extractStep1Payload(parsed);
                        } catch {
                            return null;
                        }
                    }

                    if (typeof raw !== 'object') return null;
                    const nested = raw?.data?.data && typeof raw.data.data === 'object' ? raw.data.data : null;
                    const top = raw?.data && typeof raw.data === 'object' ? raw.data : null;
                    return nested || top || raw;
                };

                const step1 = extractStep1Payload(data);
                if (step1 && typeof step1 === 'object') {
                    const nextRestaurantId = typeof step1.id === 'string' ? step1.id.trim() : '';
                    const nextOwnerFullNameRaw = typeof step1.owner_full_name === 'string' ? step1.owner_full_name : null;
                    const nextOwnerPhoneRaw = typeof step1.owner_phone === 'string' ? step1.owner_phone : null;
                    const nextCompanyName = typeof step1.company_name === 'string' ? step1.company_name : '';
                    const nextEmail = typeof step1.email === 'string' ? step1.email : '';
                    const nextCompanyLogoUrl = normalizeUrl(step1.company_logo);

                    if (!prefilledRef.current) {
                        prefilledRef.current = true;
                        initialStep1Ref.current = {
                            companyName: nextCompanyName.trim(),
                            companyLogoUrl: nextCompanyLogoUrl,
                            ownerFullNameRaw: nextOwnerFullNameRaw,
                            ownerPhone: typeof nextOwnerPhoneRaw === 'string' ? nextOwnerPhoneRaw.trim() : '',
                        };
                    }

                    setFormData((prev) => ({
                        ...prev,
                        restaurantId: nextRestaurantId || prev.restaurantId,
                        fullName: typeof nextOwnerFullNameRaw === 'string' ? nextOwnerFullNameRaw : prev.fullName,
                        contact: typeof nextOwnerPhoneRaw === 'string' ? nextOwnerPhoneRaw : prev.contact,
                        companyName: nextCompanyName || prev.companyName,
                        email: nextEmail || prev.email,
                        companyLogoUrl: nextCompanyLogoUrl || prev.companyLogoUrl,
                    }));
                }
            } catch (e) {
                const message = typeof e?.message === 'string' ? e.message : 'Request failed';
                console.log('Onboarding Step1 GET error:', message);
            }
        };

        fetchStep1();
    }, [accessToken, setFormData]);

    const logoOk = !!formData.companyLogoUrl?.trim() || !!brandingFiles.companyLogo;
    const isValid =
        !!formData.companyName?.trim() &&
        !!formData.email?.trim() &&
        !!formData.contact?.trim() &&
        logoOk;

    const companyLogoPreviewUrl = brandingFiles.companyLogoPreviewUrl || normalizeUrl(formData.companyLogoUrl);

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

        if (!res.ok) {
            throw new Error('Logo upload failed');
        }

        if (!uploadedUrl) {
            throw new Error('Logo upload did not return a link');
        }

        return uploadedUrl;
    };

    const handleSubmitStep1 = async () => {
        if (!isValid || submitting) return;
        setSubmitting(true);
        setErrorLines([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error("VITE_BACKEND_URL is missing");

            const url = `${baseUrl.replace(/\/$/, "")}/api/v1/restaurants/onboarding/step1`;
            const companyLogoUrl =
                formData.companyLogoUrl?.trim() || (await uploadCompanyLogo(brandingFiles.companyLogo, baseUrl));

            if (!formData.companyLogoUrl?.trim()) {
                setFormData((prev) => ({ ...prev, companyLogoUrl }));
            }

            const baseline = initialStep1Ref.current || { companyName: '', companyLogoUrl: '', ownerFullNameRaw: null, ownerPhone: '' };
            const nextCompanyName = formData.companyName.trim();
            const nextCompanyLogoUrl = normalizeUrl(companyLogoUrl);
            const nextOwnerPhone = typeof formData.contact === 'string' ? formData.contact.trim() : '';

            const hasCompanyNameChanged = !baseline.companyName || nextCompanyName !== baseline.companyName;
            const hasLogoChanged = !baseline.companyLogoUrl || nextCompanyLogoUrl !== baseline.companyLogoUrl;
            const hasOwnerPhoneChanged = !baseline.ownerPhone || nextOwnerPhone !== baseline.ownerPhone;
            const hasUpdates = hasCompanyNameChanged || hasLogoChanged || hasOwnerPhoneChanged;

            if (!hasUpdates) {
                handleNext?.();
                return;
            }

            const ownerFullNameToSend =
                typeof baseline.ownerFullNameRaw === 'string'
                    ? baseline.ownerFullNameRaw
                    : typeof formData.fullName === 'string' && formData.fullName.trim()
                        ? formData.fullName.trim()
                        : null;

            const updates = {
                company_name: nextCompanyName,
                owner_full_name: ownerFullNameToSend,
                ...(hasLogoChanged ? { company_logo: nextCompanyLogoUrl } : {}),
                ...(hasOwnerPhoneChanged ? { owner_phone: nextOwnerPhone } : {}),
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
            console.log('Onboarding Step1 response:', { ok: res.ok, status: res.status, data });

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

            if (isErrorPayload(data)) {
                const message =
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : typeof data.code === 'string' && data.code.trim()
                            ? data.code.trim()
                            : 'Request failed';
                setErrorLines([message]);
                return;
            }

            if (res.ok) {
                handleNext?.();
            }
        } catch (e) {
            console.log('Onboarding Step1 error:', e);
            const message = typeof e?.message === 'string' ? e.message : 'Request failed';
            setErrorLines([message]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="space-y-6">
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Company Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    className="onboarding-input"
                />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Company Email <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    value={formData.email}
                    disabled
                    placeholder="Enter company email"
                    className="onboarding-input"
                />
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
            <div className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                    <label className="block text-[14px] font-[500] text-[#1A1A1A]">Company Logo <span className="text-red-500">*</span></label>
                    {brandingFiles.companyLogo && (
                        <span className="text-[11px] text-[#6B7280] font-[400] max-w-[190px] truncate">
                            {brandingFiles.companyLogo.name}
                        </span>
                    )}
                </div>
                <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                    <label htmlFor="companyLogoUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                        <Image size={18} />
                        {brandingFiles.companyLogo || companyLogoPreviewUrl ? 'Change logo' : 'Upload logo'}
                    </label>
                    <input
                        id="companyLogoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setBrandingFile('companyLogo', file);
                            setFormData((prev) => ({ ...prev, companyLogoUrl: '' }));
                        }}
                    />
                </div>
                {companyLogoPreviewUrl && (
                    <div className="flex items-center gap-4 pt-1">
                        <div className="w-[74px] h-[74px] rounded-[14px] overflow-hidden border border-[#E5E7EB] bg-white">
                            <img src={companyLogoPreviewUrl} alt="Company Logo Preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[12px] text-[#6B7280] font-[400]">Preview</span>
                    </div>
                )}
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
            <div className="pt-4 flex justify-end">
                <button
                    type="button"
                    disabled={!isValid || submitting}
                    onClick={handleSubmitStep1}
                    className="next-btn px-10"
                >
                    {submitting ? 'Saving...' : 'Next'} <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
