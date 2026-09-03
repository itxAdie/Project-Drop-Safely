"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface DateCalendarProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DateCalendar({ value, onChange, minDate, maxDate }: DateCalendarProps) {
  const today = new Date();
  const [view, setView] = useState(() => {
    const parsed = value ? new Date(`${value}T00:00:00`) : null;
    const base = parsed && !Number.isNaN(parsed.getTime()) ? parsed : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const todayStr = toDateStr(today);
  const year = view.year;
  const month = view.month;

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
  ];

  const goMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const isDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const goToday = () => {
    setView({ year: today.getFullYear(), month: today.getMonth() });
    onChange(todayStr);
  };

  const selectedParts = value ? value.split("-").map(Number) : null;

  return (
    <div className="select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          aria-label="Previous month"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-semibold text-gray-200">
          {MONTHS[month]} {year}
        </div>
        <button
          type="button"
          onClick={() => goMonth(1)}
          aria-label="Next month"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-medium text-gray-600">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const disabled = isDisabled(dateStr);
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs transition-colors",
                disabled
                  ? "cursor-not-allowed text-gray-700"
                  : "text-gray-300 hover:bg-white/[0.08] hover:text-white cursor-pointer",
                isToday && !isSelected && !disabled && "text-green-400",
                isSelected && "bg-green-500 text-white font-semibold shadow-[0_0_12px_rgba(34,197,94,0.4)]"
              )}
            >
              {dateStr.split("-")[2]}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <p className="text-[10px] text-gray-600">
          {value
            ? `Selected: ${MONTHS[selectedParts![1] - 1]} ${selectedParts![2]}, ${selectedParts![0]}`
            : "No date selected"}
        </p>
        <button
          type="button"
          onClick={goToday}
          className="text-[10px] font-medium text-green-500 hover:text-green-400 transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
}
