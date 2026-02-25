import { AlertCircle, ChevronRight, Image } from 'lucide-react';
import { useState } from 'react';
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

    const logoOk = !!formData.companyLogoUrl?.trim() || !!brandingFiles.companyLogo;
    const isValid =
        !!formData.fullName?.trim() &&
        !!formData.companyName?.trim() &&
        logoOk;

    const normalizeUrl = (value) => {
        if (typeof value !== 'string') return '';
        return value.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    };

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

    const extractRestaurantIdFromStep1 = (data) => {
        if (!data) return '';
        if (typeof data === 'string') {
            const text = data.trim();
            if (!text) return '';
            try {
                const parsed = JSON.parse(text);
                return extractRestaurantIdFromStep1(parsed);
            } catch {
                return '';
            }
        }

        if (data && typeof data === 'object') {
            if (data.data && typeof data.data === 'object') {
                if (typeof data.data.id === 'string') return data.data.id.trim();
                if (typeof data.data.restaurant_id === 'string') return data.data.restaurant_id.trim();
                if (typeof data.data.restaurantId === 'string') return data.data.restaurantId.trim();
            }
            if (typeof data.id === 'string') return data.id.trim();
            if (typeof data.restaurant_id === 'string') return data.restaurant_id.trim();
            if (typeof data.restaurantId === 'string') return data.restaurantId.trim();
        }

        return '';
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

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    owner_full_name: formData.fullName,
                    company_name: formData.companyName,
                    company_logo: companyLogoUrl,
                    goto: 'step2',
                }),
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
                const restaurantId = extractRestaurantIdFromStep1(data);
                if (restaurantId) {
                    setFormData((prev) => ({ ...prev, restaurantId }));
                }
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
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="onboarding-input"
                />
            </div>
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
