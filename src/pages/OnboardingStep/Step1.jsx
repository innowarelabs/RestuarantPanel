import { ChevronRight, Image } from 'lucide-react';

export default function Step1({
    formData,
    setFormData,
    brandingFiles,
    setBrandingFile,
    handleNext,
}) {
    return (
        <form className="space-y-6">
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Full Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Enter your full name" className="onboarding-input" />
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
                        {brandingFiles.companyLogo ? 'Change logo' : 'Upload logo'}
                    </label>
                    <input
                        id="companyLogoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setBrandingFile('companyLogo', e.target.files?.[0] ?? null)}
                    />
                </div>
                {brandingFiles.companyLogoPreviewUrl && (
                    <div className="flex items-center gap-4 pt-1">
                        <div className="w-[74px] h-[74px] rounded-[14px] overflow-hidden border border-[#E5E7EB] bg-white">
                            <img src={brandingFiles.companyLogoPreviewUrl} alt="Company Logo Preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[12px] text-[#6B7280] font-[400]">Preview</span>
                    </div>
                )}
            </div>
            <div className="pt-4 flex justify-end">
                <button type="button" onClick={handleNext} className="next-btn bg-[#E5E7EB] ">Next <ChevronRight size={18} /></button>
            </div>
        </form>
    );
}
