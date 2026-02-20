import { ChevronLeft, ChevronRight } from 'lucide-react';

import Toggle from './Toggle';

export default function Step4({ formData, setFormData, handlePrev, handleNext }) {
    return (
        <form className="space-y-7">
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Auto Accept Orders</p>
                    <p className="text-[12px] text-[#6B6B6B] mt-1">You will manually accept each order</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.autoAccept} onClick={() => setFormData({ ...formData, autoAccept: !formData.autoAccept })} />
                </div>
            </div>
            <div className="bg-[#E6F7F4] p-5 rounded-[8px] border border-[#E6F7F4] space-y-3">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Accept Order Time Limit (minutes)</label>
                <input type="text" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })} className="onboarding-input h-11" />
                <p className="text-[12px] text-[#6B7280]">Orders will be auto-cancelled if not accepted within this time</p>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Minimum Order Amount <span className="text-red-500">*</span></label>
                <input type="text" value={formData.minOrder} className="onboarding-input" />
            </div>
            <div className="flex items-start sm:items-center justify-between py-2 gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Allow Special Instructions</p>
                    <p className="text-[12px] text-[#6B7280] mt-1">Customers can add special requests to their orders</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.allowInstructions} onClick={() => setFormData({ ...formData, allowInstructions: !formData.allowInstructions })} />
                </div>
            </div>

            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Cancellation Policy</label>
                <textarea
                    placeholder="e.g., Orders can be cancelled within 5 minutes of placement..."
                    className="onboarding-textarea"
                />
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={handleNext} className="text-[13px] text-[#6B7280] font-[400] hover:underline">Skip for now</button>
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
