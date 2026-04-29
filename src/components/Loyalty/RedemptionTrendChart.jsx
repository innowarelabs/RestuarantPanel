import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatPeriodSubtitle = (startDate, endDate, periodDays) => {
    const parts = [];
    if (startDate && endDate) {
        parts.push(`${startDate} → ${endDate}`);
    }
    if (periodDays != null) {
        parts.push(`${periodDays} days`);
    }
    return parts.join(' · ') || 'Last period';
};

const RedemptionTrendChart = ({ trend, startDate, endDate, periodDays }) => {
    const chartData = useMemo(() => {
        if (!trend || !Array.isArray(trend.points)) return [];
        return trend.points.map((p) => ({
            date: p.label || p.date || '—',
            redemptions: Number(p.redemptions) || 0,
        }));
    }, [trend]);

    const { yMax, ticks } = useMemo(() => {
        const maxR = chartData.length ? Math.max(...chartData.map((d) => d.redemptions)) : 0;
        if (maxR <= 0) {
            return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
        }
        const ceil = Math.ceil(maxR * 1.1);
        const step = ceil <= 5 ? 1 : ceil <= 12 ? 2 : Math.ceil(ceil / 5);
        const top = Math.max(step, Math.ceil(ceil / step) * step);
        const t = [];
        for (let v = 0; v <= top; v += step) t.push(v);
        if (t[t.length - 1] < top) t.push(top);
        return { yMax: top, ticks: t };
    }, [chartData]);

    const chartTitle = 'Reward Redemption Trend (Last 30 Days)';

    if (chartData.length === 0) {
        return (
            <div className="mt-5 w-full">
                <h4 className="mb-2 text-[16px] font-semibold text-[#1F2937]">{chartTitle}</h4>
                <p className="mb-4 text-[13px] text-gray-500">{formatPeriodSubtitle(startDate, endDate, periodDays)}</p>
                <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#F9FAFB] text-[14px] text-gray-500">
                    No trend data for this period.
                </div>
            </div>
        );
    }

    return (
        <div className="mt-5 w-full">
            <h4 className="mb-2 text-[16px] font-semibold text-[#1F2937]">{chartTitle}</h4>
            <p className="mb-6 text-[13px] text-gray-500">{formatPeriodSubtitle(startDate, endDate, periodDays)}</p>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                            interval={chartData.length > 16 ? Math.floor(chartData.length / 7) : 0}
                            angle={-35}
                            textAnchor="end"
                            height={56}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            domain={[0, yMax]}
                            ticks={ticks}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            }}
                            itemStyle={{ color: '#DD2F26', fontWeight: 'bold' }}
                            formatter={(value) => [value, 'Redemptions']}
                        />
                        <Line
                            type="monotone"
                            dataKey="redemptions"
                            stroke="#DD2F26"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#DD2F26', strokeWidth: 1, stroke: '#fff' }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            isAnimationActive={chartData.length < 40}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RedemptionTrendChart;
