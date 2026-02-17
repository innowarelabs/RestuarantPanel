import React from 'react';
import { TrendingUp } from 'lucide-react';

const platforms = [
    { name: 'Uber Eats Orders', value: '85', change: '+18% vs last period', bg: 'bg-[#059669]', text: 'text-white' },
    { name: 'Deliveroo Orders', value: '42', change: '+5% vs last period', bg: 'bg-[#4F46E5]', text: 'text-white' },
    { name: 'Just Eat Orders', value: '33', change: '+11% vs last period', bg: 'bg-[#D97706]', text: 'text-white' },
];

export default function PlatformPerformance() {
    return (
        <div className="bg-white rounded-[12px] border border-[#00000033]  mb-6 overflow-hidden">
            <div className="p-6 border-b border-[#F3F4F6]">
                <h3 className="text-[18px] font-bold text-[#111827]">Platform Performance</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 -mt-5 gap-6">
                {platforms.map((p, index) => (
                    <div key={index} className={`${p.bg} ${p.text} p-6 h-[145px] rounded-[12px] shadow-sm hover:scale-[1.02] transition-transform`}>
                        <p className="text-[13px]  opacity-90 mb-1">{p.name}</p>
                        <h4 className="text-[32px] font-bold mb-4">{p.value}</h4>
                        <div className="flex items-center gap-2 text-[12px]  opacity-90">
                            <TrendingUp size={16} />
                            <span>{p.change}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
