import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

const EMPTY_HOURLY = Array.from({ length: 24 }, (_, hour) => ({
    time: `${hour}:00`,
    value: 0,
    hour,
}));

const BAR_WIDTH_PX = 55;

export default function PeakOrderingTimesChart({
    hourlyData = [],
    weekdayData = [],
    peakHourLabel = '—',
    slowHourLabel = '—',
    peakDayLabel = '—',
    slowDayLabel = '—',
    loading = false,
}) {
    const [view, setView] = useState('hourly');

    const barData = useMemo(() => {
        if (view === 'hourly') {
            if (Array.isArray(hourlyData) && hourlyData.length > 0) {
                return hourlyData.map((row) => ({
                    time: row.time || `${row.hour}:00`,
                    value: Number(row.value) || 0,
                    hour: row.hour,
                }));
            }
            return EMPTY_HOURLY;
        }
        if (Array.isArray(weekdayData) && weekdayData.length > 0) {
            return weekdayData.map((row) => ({
                time: row.name,
                value: Number(row.value) || 0,
            }));
        }
        return [];
    }, [view, hourlyData, weekdayData]);

    const noHourlySeries = !loading && (!Array.isArray(hourlyData) || hourlyData.length === 0);
    const noWeekdaySeries = !loading && (!Array.isArray(weekdayData) || weekdayData.length === 0);
    const showChartEmpty = (view === 'hourly' && noHourlySeries) || (view === 'daily' && noWeekdaySeries);

    const chartContentWidthPx = useMemo(() => {
        const n = barData.length || 1;
        return Math.max(n * BAR_WIDTH_PX + 80, 320);
    }, [barData.length]);

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] mb-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="analytics-section-title">Peak Ordering Times</h3>

                <div className="flex bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setView('hourly')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${view === 'hourly' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Hourly View
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('daily')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${view === 'daily' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Day of Week
                    </button>
                </div>
            </div>

            <div className="h-[250px] w-full mb-8 relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg">
                        <span className="text-[13px] text-gray-500">Loading…</span>
                    </div>
                )}
                {showChartEmpty ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-[#FAFAFA]">
                        <span className="text-[13px] text-gray-600">{ANALYTICS_NO_DATA}</span>
                    </div>
                ) : (
                    <div className="h-full w-full overflow-x-auto">
                        <div className="h-full w-full min-w-full" style={{ width: chartContentWidthPx }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#9CA3AF' }}
                                        interval={view === 'hourly' ? 2 : 0}
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                                    <Bar dataKey="value" fill="#DD2F26" radius={[4, 4, 0, 0]} barSize={BAR_WIDTH_PX} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-[12px] border border-[#00000033] bg-[#DD2F2626] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Clock size={20} className="shrink-0 text-[#DD2F26]" strokeWidth={2} />
                        <span className="text-[13px] font-medium leading-tight text-[#6B7280]">Busiest Hour</span>
                    </div>
                    <p className="text-[16px] font-bold leading-snug text-[#0F1724]">{peakHourLabel}</p>
                    {/* {slowHourLabel && slowHourLabel !== '—' && (
                        <p className="text-[12px] leading-snug text-[#6B7280]">Quiet hour: {slowHourLabel}</p>
                    )} */}
                </div>

                <div className="rounded-[12px] border border-[#00000033] bg-[#DD2F2626] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <TrendingUp size={20} className="shrink-0 text-[#DD2F26]" strokeWidth={2} />
                        <span className="text-[13px] font-medium leading-tight text-[#6B7280]">Busiest Day</span>
                    </div>
                    <p className="text-[16px] font-bold leading-snug text-[#0F1724]">{peakDayLabel}</p>
                </div>

                <div className="rounded-[12px] border border-[#00000033] bg-[#DD2F2626] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <TrendingDown size={20} className="shrink-0 text-[#DD2F26]" strokeWidth={2} />
                        <span className="text-[13px] font-medium leading-tight text-[#6B7280]">Slowest Day</span>
                    </div>
                    <p className="text-[16px] font-bold leading-snug text-[#0F1724]">{slowDayLabel}</p>
                </div>
            </div>
        </div>
    );
}
