import React from 'react';

export default function RevenueBreakdown() {
    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  h-full">
            <h3 className="text-[18px] font-bold text-[#111827] mb-6">Revenue Breakdown</h3>

            <div className="space-y-6">
                {/* Delivery vs Collection */}
                <div>
                    <div className="flex justify-between text-[12px] mb-2 font-medium">
                        <span className="text-gray-500">Delivery vs Collection</span>
                    </div>
                    <div className="w-full h-8 flex rounded-lg overflow-hidden border border-gray-100">
                        <div className="bg-[#2BB29C] h-full flex items-center justify-center text-white text-[11px] font-bold" style={{ width: '73%' }}>73%</div>
                        <div className="bg-[#E0E7FF] h-full flex items-center justify-center text-[#4338CA] text-[11px] font-bold" style={{ width: '27%' }}>27%</div>
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium">
                        <span>Delivery ($6,140)</span>
                        <span>Collection ($2,280)</span>
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <div className="flex justify-between text-[12px] mb-2 font-medium">
                        <span className="text-gray-500">Payment Method</span>
                    </div>
                    <div className="w-full h-8 flex rounded-lg overflow-hidden border border-gray-100">
                        <div className="bg-[#6366F1] h-full flex items-center justify-center text-white text-[11px] font-bold" style={{ width: '78%' }}>78%</div>
                        <div className="bg-[#F0FDFA] h-full flex items-center justify-center text-[#2BB29C] text-[11px] font-bold" style={{ width: '22%' }}>22%</div>
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium">
                        <span>Card ($6,560)</span>
                        <span>Cash ($1,860)</span>
                    </div>
                </div>

                {/* Platform Sources */}
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-[12px] text-gray-500 font-medium mb-4">Platform Sources</p>
                    <div className="space-y-3">
                        {[
                            { name: 'Direct App', value: '60%', color: 'bg-[#2BB29C]' },
                            { name: 'Uber Eats', value: '25%', color: 'bg-[#059669]' },
                            { name: 'Deliveroo', value: '10%', color: 'bg-[#4F46E5]' },
                            { name: 'Just Eat', value: '5%', color: 'bg-[#D97706]' },
                        ].map((source, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-[12px] text-gray-600 w-20">{source.name}</span>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${source.color}`} style={{ width: source.value }}></div>
                                </div>
                                <span className="text-[11px] font-bold text-[#111827] w-8 text-right">{source.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
