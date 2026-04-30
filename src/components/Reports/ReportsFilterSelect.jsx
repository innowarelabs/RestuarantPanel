import React, { useState, useEffect, useRef, useId } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * @param {string} [borderClassName] - Trigger border, default matches Sales Report (#00000033)
 * @param {string} [containerClassName] - Root wrapper: default caps width on large screens; use w-full for label-above layout
 */
export function ReportsFilterSelect({
    value,
    onValueChange,
    options,
    ariaLabel,
    leftAdornment,
    listboxId: listboxIdProp,
    borderClassName = 'border-[#00000033]',
    containerClassName = 'relative w-full min-w-0 lg:max-w-[231.43px]',
    /** Shorter height (h-10) to align with toolbar buttons; smaller text */
    compact = false,
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const idBase = useId();
    const listId = listboxIdProp || `reports-filter-list-${idBase.replace(/:/g, '')}`;
    const selected = options.find((o) => o.value === value);
    const displayLabel = selected?.label ?? '';

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc, true);
        return () => document.removeEventListener('mousedown', onDoc, true);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const baseTrigger = compact
        ? `box-border flex w-full h-10 min-h-0 items-center justify-between gap-1.5 bg-white ` +
          'py-2 pl-3 pr-3 text-left text-sm text-[#0F1724] ' +
          `rounded-[8px] border ${borderClassName} ` +
          'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
        : `box-border flex w-full h-12 min-h-[48px] items-center justify-between gap-2 bg-white ` +
          'py-1 pl-4 pr-4 text-left text-[14px] text-[#0F1724] ' +
          `rounded-lg border ${borderClassName} ` +
          'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

    return (
        <div ref={rootRef} className={containerClassName}>
            <button
                type="button"
                className={baseTrigger}
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => setOpen((v) => !v)}
            >
                <div
                    className={`flex min-w-0 flex-1 items-center gap-2 text-[#0F1724] ${compact ? 'text-sm' : 'text-[14px]'}`}
                >
                    {leftAdornment ? <span className="inline-flex shrink-0">{leftAdornment}</span> : null}
                    <span className="min-w-0 truncate font-normal">{displayLabel}</span>
                </div>
                {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} aria-hidden />
                ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} aria-hidden />
                )}
            </button>
            {open && (
                <ul
                    id={listId}
                    className="absolute top-full z-30 mt-1 w-full list-none overflow-hidden rounded-lg border border-[#00000033] bg-white py-1 shadow-md"
                    role="listbox"
                >
                    {options.map((o) => (
                        <li key={o.value} role="option" aria-selected={value === o.value}>
                            <button
                                type="button"
                                className={`w-full px-4 py-2.5 text-left text-[14px] text-[#0F1724] transition hover:bg-gray-50 ${
                                    value === o.value ? 'bg-gray-100 font-medium' : ''
                                }`}
                                onClick={() => {
                                    onValueChange(o.value);
                                    setOpen(false);
                                }}
                            >
                                {o.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
