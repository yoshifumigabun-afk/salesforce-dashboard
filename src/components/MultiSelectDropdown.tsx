"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item<T> {
    value: T;
    label: string;
}

interface Props<T extends string | number> {
    /** Label shown in the button summary (e.g., "店舗" → "全店舗" / "3店舗選択") */
    label: string;
    items: Item<T>[];
    /** null = all selected (no filter applied) */
    selected: T[] | null;
    /** 全選択 – caller sets selected back to null */
    onSelectAll: () => void;
    /** 全解除 – caller sets selected to [] */
    onClearAll: () => void;
    /** Toggle a single item on/off */
    onToggle: (value: T) => void;
    /** Optional unit appended to count: e.g. "件" → "3件選択". Defaults to "件". */
    countUnit?: string;
}

export default function MultiSelectDropdown<T extends string | number>({
    label,
    items,
    selected,
    onSelectAll,
    onClearAll,
    onToggle,
    countUnit = '件',
}: Props<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isChecked = (val: T) =>
        selected === null || selected.includes(val);

    const summary =
        selected === null
            ? `全${label}`
            : selected.length === items.length
                ? `全${label}`
                : selected.length === 0
                    ? `${label}未選択`
                    : `${selected.length}${countUnit}選択`;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'flex items-center gap-2 bg-slate-900 border text-slate-200 text-sm rounded-lg px-4 py-2 outline-none transition-colors cursor-pointer font-medium min-w-[140px]',
                    open ? 'border-blue-500' : 'border-slate-800 hover:border-slate-700'
                )}
            >
                <span className="flex-1 text-left truncate">{summary}</span>
                <ChevronDown
                    className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')}
                />
            </button>

            {open && (
                <div className="absolute top-full mt-1 left-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl min-w-[200px] max-h-[320px] flex flex-col">
                    {/* Select All / Clear All buttons */}
                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-2 flex gap-2 shrink-0">
                        <button
                            onClick={onSelectAll}
                            className="flex-1 px-2 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                            全選択
                        </button>
                        <button
                            onClick={onClearAll}
                            className="flex-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                        >
                            全解除
                        </button>
                    </div>

                    {/* Items list */}
                    <div className="overflow-y-auto p-2 space-y-0.5">
                        {items.map(item => (
                            <label
                                key={String(item.value)}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-sm select-none"
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked(item.value)}
                                    onChange={() => onToggle(item.value)}
                                    className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                                />
                                <span className="text-slate-200">{item.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
