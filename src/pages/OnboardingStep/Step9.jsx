import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Step9({ handlePrev, handleNext }) {
    const integrations = [
        { title: 'Uber Eats', desc: 'Sync orders and menu items automatically', icon: '🍔' },
        { title: 'Deliveroo', desc: 'Real-time order management and tracking', icon: '🛵' },
        { title: 'Just Eat', desc: "Connect to UK's top leading food delivery", icon: '🍕' },
        { title: 'Marketing', desc: 'Customer relationship management integration', icon: '📊' },
        { title: 'FoodHub', desc: 'Zero commission food delivery platform', icon: '🥘' },
        { title: 'POS System', desc: 'Connect your point of sale system', icon: '💳' },
    ];

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {integrations.map((item, idx) => (
                    <div key={idx} className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#E6F7F4] rounded-[8px] flex items-center justify-center text-[22px]">
                                        {item.icon}
                                    </div>
                                    <h4 className="text-[16px] font-[400] text-[#111111]">{item.title}</h4>
                                </div>
                                <span className="text-[12px] font-[400] text-[#64748B] bg-[#F3F4F6] px-2.5 py-2 rounded-[8px]">
                                    Not Connected
                                </span>
                            </div>
                            <p className="text-[14px] text-[#64748B] leading-[1.5]">
                                {item.desc}
                            </p>
                        </div>
                        <button className="w-full h-[45px] bg-[#24B99E] text-white rounded-[8px] font-[500] text-[16px] hover:bg-[#20a38b] transition-all">
                            Connect
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <button type="button" onClick={handleNext} className="text-[13px] text-[#6B7280] font-[400] hover:underline">
                    Skip for now
                </button>
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
