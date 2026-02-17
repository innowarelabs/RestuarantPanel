import React from 'react';
import { Award, Target, Star, MoreHorizontal } from 'lucide-react';

export default function CustomerInsights() {
    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] shadow-sm h-full flex flex-col">
            <h3 className="text-[18px] font-bold text-[#111827] mb-6">Customer Insights</h3>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F0FDFA] p-4 rounded-[8px] ">
                        <div className="flex items-center gap-2 text-[#2BB29C] mb-1">
                            <Award size={14} />
                            <span className="text-[12px]  uppercase">Loyalty Members</span>
                        </div>
                        <p className="text-[24px] font-bold text-[#111827]">320</p>
                    </div>
                    <div className="bg-[#F9FAFB] p-4 rounded-[8px] ">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Target size={14} />
                            <span className="text-[12px]  uppercase">New Loyalty</span>
                        </div>
                        <p className="text-[24px] font-bold text-[#111827]">140</p>
                    </div>
                </div>

                <div className="bg-[#F0FDFA] p-4 rounded-[8px]  relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[12px] text-[#2BB29C]  uppercase">Most redeemed reward</p>
                        <Star size={16} className="text-orange-400 fill-orange-400" />
                    </div>
                    <p className="text-[16px] font-bold text-[#111827]">Free Ice Cream</p>
                    <p className="text-[12px] text-gray-500 mt-1">Redeemed 87 times</p>
                </div>

                <div className="bg-[#F0FDFA] rounded-[8px] p-4  mt-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[12px] text-gray-400 font-medium">Avg Points Redeemed per Order</p>
                            <p className="text-[24px] font-bold text-[#111827]">42 points</p>
                        </div>
                        <MoreHorizontal className="text-gray-300" />
                    </div>
                </div>
            </div>
        </div>
    );
}
