import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ Icon, icon, title, value, change, growthValue }) => {
    const isPositive = growthValue != null && growthValue > 0;

    return (
        <div className="bg-white rounded-[12px] h-[166px] p-5 border border-[#00000033]  flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                {/* Icon Container - Teal Green color from image */}
                <div className="w-[40px] h-[40px] bg-[#2BB29C] rounded-[8px] flex items-center justify-center text-white">
                    {Icon ? (
                        <Icon size={20} strokeWidth={2} />
                    ) : icon ? (
                        <img src={icon} alt={title} className="w-[20px] h-[24px] brightness-0 invert" />
                    ) : null}
                </div>

                {/* Growth Indicator */}
                <div className="flex items-center gap-1.5">
                    {isPositive ? (
                        <TrendingUp size={16} className={`text-[#2BB29C]`} />
                    ) : (
                        <TrendingDown size={16} className={`text-[#EF4444]`} />
                    )}
                    <span className={`text-[12px]  ${isPositive ? 'text-[#2BB29C]' : 'text-[#EF4444]'}`}>
                        {change}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <p className="text-[#6B7280]  text-[12px]">{title}</p>
                <div className="flex flex-col">
                    <h2 className="text-[24px] font-bold text-[#1F2937] leading-tight">{value}</h2>
                    <p className="text-[#9CA3AF] text-[11px] mt-1 font-normal">vs last week</p>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
