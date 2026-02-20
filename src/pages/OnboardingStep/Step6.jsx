import { ChevronDown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

export default function Step6({ formData, setFormData, handlePrev, handleNext }) {
    return (
        <form className="space-y-6">
            <div className="bg-[#FEF3C7] p-5 rounded-[12px] border border-[#F59E0B] flex gap-3">
                <Lock size={18} className="text-[#92400E] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#92400E] leading-relaxed">
                    Your banking information is encrypted and stored securely. We never share your details with third parties.
                </p>
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Account Holder Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.accHolder}
                    onChange={(e) => setFormData({ ...formData, accHolder: e.target.value })}
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Bank Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="e.g., Chase Bank, Bank of America"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Account Number / IBAN <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="Enter your account number"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Routing Number</label>
                <input
                    type="text"
                    placeholder="9-digit routing number"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Payout Frequency <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select
                        className="onboarding-input appearance-none"
                        value={formData.payoutFreq}
                        onChange={(e) => setFormData({ ...formData, payoutFreq: e.target.value })}
                    >
                        <option value="">Select frequency...</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            <div className="bg-[#E6F7F4] p-5 rounded-[12px] mt-4">
                <p className="text-[13px] text-[#475569]">
                    <span className="font-[600]">Expected payout:</span> {formData.payoutFreq ? `${formData.payoutFreq} settlement` : 'Select frequency above'}
                </p>
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    className={`next-btn ${formData.payoutFreq ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'} px-10 transition-all`}
                >
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
