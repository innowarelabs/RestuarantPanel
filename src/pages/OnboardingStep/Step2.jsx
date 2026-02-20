import { ChevronDown, ChevronLeft, ChevronRight, Image, MapPin } from 'lucide-react';

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
                        {brandingFiles.websiteHeader ? 'Change image' : 'Upload image'}
                    </label>
                    <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[180px] truncate">
                        {brandingFiles.websiteHeader?.name ?? 'No file chosen'}
                    </span>
                    <input
                        id="websiteHeaderUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setBrandingFile('websiteHeader', e.target.files?.[0] ?? null)}
                    />
                </div>
                {brandingFiles.websiteHeaderPreviewUrl && (
                    <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                        <img src={brandingFiles.websiteHeaderPreviewUrl} alt="Website Header Preview" className="w-full h-full object-cover" />
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
                                {brandingFiles.websiteFooterLeft ? 'Change image' : 'Upload image'}
                            </label>
                            <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[160px] truncate">
                                {brandingFiles.websiteFooterLeft?.name ?? 'No file chosen'}
                            </span>
                            <input
                                id="websiteFooterLeftUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setBrandingFile('websiteFooterLeft', e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {brandingFiles.websiteFooterLeftPreviewUrl && (
                            <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                <img src={brandingFiles.websiteFooterLeftPreviewUrl} alt="Website Footer Left Preview" className="w-full h-full object-cover" />
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
                                {brandingFiles.websiteFooterRight ? 'Change image' : 'Upload image'}
                            </label>
                            <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[160px] truncate">
                                {brandingFiles.websiteFooterRight?.name ?? 'No file chosen'}
                            </span>
                            <input
                                id="websiteFooterRightUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setBrandingFile('websiteFooterRight', e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {brandingFiles.websiteFooterRightPreviewUrl && (
                            <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white">
                                <img src={brandingFiles.websiteFooterRightPreviewUrl} alt="Website Footer Right Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Restaurant Contact Number <span className="text-red-500">*</span></label>
                <input type="text" placeholder="+1 (555) 123-4567" className="onboarding-input" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Alternate Phone</label>
                <input type="text" placeholder="+1 (555) 987-6543" className="onboarding-input" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Address <span className="text-red-500">*</span></label>
                <input type="text" placeholder="123 Main Street, New York, NY 10001" className="onboarding-input" />
            </div>
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Google Map Location</label>
                <div className="w-full h-40 bg-[#E5E7EB] rounded-[16px] flex flex-col items-center justify-center  border-gray-300 relative overflow-hidden">
                    <MapPin size={24} className="text-gray-400 mb-1" />
                    <p className="text-[11px] text-[#9CA3AF] absolute bottom-3">Drag the pin to set your exact location</p>
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-3">Opening Hours</label>
                <div className="space-y-3 bg-[#F9FAFB]/50 p-4 rounded-[8px] border border-[#E5E7EB]">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="grid grid-cols-12 items-center gap-4">
                            <span className="col-span-6 text-[13px] text-[#1A1A1A] font-[500]">{day}</span>
                            <div className="col-span-6 flex items-center gap-2">
                                <input type="text" className="h-9 w-full bg-white border border-gray-200 rounded-lg px-2 text-[12px] text-center" placeholder="--:--" />
                                <span className="text-gray-400">—</span>
                                <input type="text" className="h-9 w-full bg-white border border-gray-200 rounded-lg px-2 text-[12px] text-center" placeholder="--:--" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Average Preparation Time <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select className="onboarding-input appearance-none">
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
            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
