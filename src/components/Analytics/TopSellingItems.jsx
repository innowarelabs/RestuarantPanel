import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ANALYTICS_NO_DATA } from './analyticsCopy';
import { fetchTopSellingItems, mapTopItemsToUiRows } from './topSellingItemsApi';

export default function TopSellingItems({ period: periodProp = '30d', onPeriodChange }) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [internalPeriod, setInternalPeriod] = useState('30d');
    const controlled = typeof onPeriodChange === 'function';
    const period = controlled ? periodProp : internalPeriod;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const setPeriod = (next) => {
        if (controlled) onPeriodChange(next);
        else setInternalPeriod(next);
    };

    const fetchTopItems = useCallback(async () => {
        setLoading(true);
        try {
            const items = await fetchTopSellingItems({ accessToken, user, period });
            setRows(mapTopItemsToUiRows(items));
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, user?.restaurant_id, period]);

    useEffect(() => {
        fetchTopItems();
    }, [fetchTopItems]);

    const toggleClass = (active) =>
        `px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
            active ? 'bg-white text-[#DD2F26] border-[#E5E7EB] shadow-sm' : 'bg-transparent text-gray-500 border-transparent'
        }`;

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] h-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <h3 className="analytics-section-title">Top Selling Items</h3>
                <div className="flex bg-[#F3F4F6] p-1 rounded-lg shrink-0 w-fit">
                    <button type="button" onClick={() => setPeriod('7d')} className={toggleClass(period === '7d')}>
                        Last 7 days
                    </button>
                    <button type="button" onClick={() => setPeriod('30d')} className={toggleClass(period === '30d')}>
                        Last 30 days
                    </button>
                </div>
            </div>

            {loading && <div className="py-12 text-center text-[13px] text-gray-500">Loading…</div>}

            {!loading && (!rows || rows.length === 0) && (
                <div className="py-12 text-center text-[13px] text-gray-500">{ANALYTICS_NO_DATA}</div>
            )}

            {!loading && rows && rows.length > 0 && (
                <div className="space-y-3">
                    {rows.map((item, index) => (
                        <div
                            key={item.id || `${item.name}-${index}`}
                            className="flex items-center gap-3 sm:gap-4 rounded-[12px] bg-[#F9FAFB] border border-[#F3F4F6] px-4 py-3 sm:px-5"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-[#111827] truncate">{item.name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[13px] font-bold text-[#111827] whitespace-nowrap">{item.orders} orders</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">{item.revenue}</p>
                            </div>
                            <div className="shrink-0 min-w-[44px] flex items-center justify-center rounded-[10px] bg-[#DD2F2626] px-2.5 py-2 sm:px-3">
                                <span className="text-[12px] sm:text-[13px] font-bold text-[#DD2F26]">{item.percentage}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
