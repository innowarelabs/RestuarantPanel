import React from 'react';
import { CircleCheckBig } from 'lucide-react';

/**
 * API timeline: label + time per row; primary checkmarks; vertical line connects to next step.
 * @param {{ events: Array<{ id: string, label: string, time: string, isCancelled: boolean }> }} props
 */
export default function OrderApiTimelineList({ events }) {
    if (!Array.isArray(events) || !events.length) return null;

    return (
        <ol className="m-0 list-none p-0">
            {events.map((event, index) => {
                const isLast = index === events.length - 1;
                return (
                    <li key={event.id} className="flex items-start gap-3">
                        <div className="flex w-9 shrink-0 flex-col items-center">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                {event.isCancelled ? (
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-200 bg-red-50"
                                        aria-hidden
                                    />
                                ) : (
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary"
                                        aria-hidden
                                    >
                                        <CircleCheckBig size={18} strokeWidth={2.5} className="text-white" />
                                    </div>
                                )}
                            </div>
                            {!isLast && (
                                <div
                                    className="h-10 w-[2px] shrink-0 bg-primary"
                                    aria-hidden
                                />
                            )}
                        </div>
                        <div
                            className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}
                        >
                            <p
                                className={`font-sans text-[15px] font-medium leading-[22.5px] ${
                                    event.isCancelled ? 'text-red-600' : 'text-[#0F1724]'
                                }`}
                            >
                                {event.label}
                            </p>
                            {!!event.time && (
                                <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] text-[#6B7280]">
                                    {event.time}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
