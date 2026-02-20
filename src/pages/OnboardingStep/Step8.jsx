import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Step8({ formData, setFormData, handlePrev, handleNext }) {
    return (
        <form className="space-y-6">
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Support Email <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@burgerhouse.com"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Contact Phone <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Auto-reply Message</label>
                <textarea
                    value={formData.autoReply}
                    onChange={(e) => setFormData({ ...formData, autoReply: e.target.value })}
                    placeholder="Message sent to customers when they contact you..."
                    className="onboarding-input h-[100px] py-3 resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Chat Greeting Message</label>
                <input
                    type="text"
                    value={formData.chatGreeting}
                    onChange={(e) => setFormData({ ...formData, chatGreeting: e.target.value })}
                    placeholder="First message customers see when they open chat..."
                    className="onboarding-input"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Chat Availability Hours (Optional)</label>
                <input
                    type="text"
                    value={formData.chatHours}
                    onChange={(e) => setFormData({ ...formData, chatHours: e.target.value })}
                    placeholder="9:00 AM - 10:00 PM"
                    className="onboarding-input"
                />
            </div>

            <div className="bg-[#E6F7F4] border border-[#24B99E]/30 p-5 rounded-[12px] mt-4 space-y-3">
                <h4 className="text-[13px] font-[600] text-primary">Preview: Auto-reply</h4>
                <div className="bg-white p-4 rounded-[8px] border border-[#24B99E]/10">
                    <p className="text-[14px] text-[#111827] leading-relaxed">
                        {formData.autoReply || 'Your auto-reply message will appear here...'}
                    </p>
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
