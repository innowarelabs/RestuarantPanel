import { Check, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function Step10({ setShowPreviewModal, navigate, handlePrev }) {
    return (
        <div className="space-y-10">
            <div className="space-y-5">
                <p className="text-[15px] text-[#6B7280] leading-[1.6]">
                    Please review all the information you've provided. You can click on previous steps in the progress bar above to make changes, or click the button below to preview everything.
                </p>
                <button
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full h-[56px] bg-[#24B99E] text-white rounded-[8px] font-[500] text-[16px] flex items-center justify-center gap-2 hover:bg-[#20a38b] transition-all shadow-sm"
                >
                    <Eye size={20} /> Preview All Information
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    'Account Setup', 'Operational Info', 'Menu Setup', 'Order Settings',
                    'Loyalty Program', 'Bank Details', 'Notifications', 'Support Setup', 'Integrations'
                ].map((name, idx) => (
                    <div key={idx} className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                        <h4 className="text-[15px] font-[400] text-[#1A1A1A] mb-1.5">{name}</h4>
                        <p className="text-[13px] text-[#6B7280] flex items-center gap-1.5 font-[400]">
                            <Check size={14} className="text-[#24B99E]" strokeWidth={3} /> Completed
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-[#E6F7F4] border border-[#24B99E]/20 p-5 rounded-[8px]">
                <p className="text-[14px] text-[#111827]">
                    <span className="font-[600]">Ready to go!</span> Click "Complete Setup" below to finish and access your dashboard.
                </p>
            </div>

            <button
                type="button"
                className="sm:hidden mt-4 h-[52px] w-full bg-[#24B99E] text-white rounded-[10px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#20a38b] transition-all"
                onClick={() => navigate('/admin-dashboard')}
            >
                Complete Setup <ChevronRight size={18} />
            </button>

            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    type="button"
                    className="hidden sm:flex h-[52px] min-w-[180px] bg-[#24B99E] text-white rounded-[10px] font-bold text-[15px] items-center justify-center gap-2 hover:bg-[#20a38b] transition-all"
                    onClick={() => navigate('/admin-dashboard')}
                >
                    Complete Setup <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
