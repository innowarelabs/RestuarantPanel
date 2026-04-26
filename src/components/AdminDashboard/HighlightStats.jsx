import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import zingerImg from '../../assets/DashbordImage/zinger.jpg';
import loadedFriesImg from '../../assets/DashbordImage/loaded fries.jpg';

/** Week growth for Rising Star line — backend may send any of these */
function formatWeekGrowthLine(item) {
    if (!item || typeof item !== 'object') return null;
    const raw =
        item.growth_pct ??
        item.week_growth_pct ??
        item.pct_change ??
        item.pct_vs_last_week ??
        item.growth_percent;
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (Number.isNaN(n)) return null;
    const sign = n > 0 ? '+' : '';
    return `${sign}${n}% growth this week`;
}

const HighlightStats = ({ bestSeller, topSellers = [] }) => {
    const firstTopSeller = topSellers[0];
    const secondTopSeller = topSellers[1];

    const risingDescription = (item, emptyFallback) => {
        const growthLine = formatWeekGrowthLine(item);
        if (growthLine) return growthLine;
        const n = item?.orders_count;
        if (n != null && Number(n) > 0) return `${Number(n)} orders this week`;
        return emptyFallback;
    };

    const cardShell =
        'bg-white rounded-[12px] h-[104px] p-4 border border-[#00000033] flex items-center gap-4 min-h-0';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Best Seller Card */}
            <div className={cardShell}>
                <div className="w-[60px] h-[60px] rounded-[10px] bg-amber-50 flex-shrink-0 relative overflow-hidden">
                    <img
                        src={zingerImg}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" strokeWidth={2} />
                        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium leading-none">
                            BEST SELLER TODAY
                        </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#111827] leading-tight truncate">
                        {bestSeller?.name || 'No best seller yet'}
                    </h3>
                    <p className="text-[13px] font-normal text-[#6B7280] leading-snug truncate">
                        {bestSeller?.orders_count != null && Number(bestSeller.orders_count) > 0
                            ? `${Number(bestSeller.orders_count)} orders today`
                            : 'Once you start getting orders, your best seller will appear here.'}
                    </p>
                </div>
            </div>

            {/* Rising Star Card 1 */}
            <div className={`${cardShell} hover:shadow-sm transition-shadow`}>
                <div className="w-[60px] h-[60px] rounded-[10px] bg-stone-100 flex-shrink-0 relative overflow-hidden">
                    <img src={loadedFriesImg} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.25} />
                        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium leading-none">
                            RISING STAR
                        </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#111827] leading-tight truncate">
                        {firstTopSeller?.name || 'No item yet'}
                    </h3>
                    <p className="text-[13px] font-normal text-[#6B7280] leading-snug truncate">
                        {risingDescription(firstTopSeller, 'Your top-performing items will show here.')}
                    </p>
                </div>
            </div>

            {/* Rising Star Card 2 */}
            <div className={`${cardShell} hover:shadow-sm transition-shadow`}>
                <div className="w-[60px] h-[60px] rounded-[10px] bg-stone-100 flex-shrink-0 relative overflow-hidden">
                    <img src={loadedFriesImg} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.25} />
                        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium leading-none">
                            RISING STAR
                        </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#111827] leading-tight truncate">
                        {secondTopSeller?.name || 'Waiting for more data'}
                    </h3>
                    <p className="text-[13px] font-normal text-[#6B7280] leading-snug truncate">
                        {risingDescription(secondTopSeller, 'As your menu performs, more highlights will appear.')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HighlightStats;
