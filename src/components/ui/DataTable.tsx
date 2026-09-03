"use client";

import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./Skeleton";

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  className?: string;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data to display",
  pageSize = 10,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const handleSort = (accessor: string) => {
    if (sortKey === accessor) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(accessor);
      setSortDir("asc");
    }
    setPage(0);
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = getNestedValue(a, sortKey);
      const vb = getNestedValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSortClick = (col: Column<T>) => {
    if (!col.sortable) return;
    handleSort(col.accessor as string);
  };

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null;
    const active = sortKey === col.accessor;
    return (
      <span className="ml-1 inline-flex text-gray-600">
        {active ? (
          sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
        ) : (
          <ChevronsUpDown size={13} />
        )}
      </span>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.03]">
              {columns.map((col, i) => (
                <th
                  key={`${col.accessor as string}-${i}`}
                  onClick={() => handleSortClick(col)}
                  className={cn(
                    "px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap",
                    col.sortable && "cursor-pointer hover:text-gray-200 select-none",
                    col.className
                  )}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {columns.map((col, i) => (
                    <td key={`${col.accessor as string}-${i}`} className="px-5 py-4">
                      <Skeleton variant="text" width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-16 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
                      <ChevronsUpDown size={20} className="text-gray-600" />
                    </div>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors last:border-b-0",
                    onRowClick && "cursor-pointer hover:bg-white/[0.03]",
                    "hover:bg-white/[0.02]"
                  )}
                >
                  {columns.map((col, i) => {
                    const val = getNestedValue(row, col.accessor as string);
                    return (
                      <td
                        key={`${col.accessor as string}-${i}`}
                        className={cn("px-5 py-4 text-gray-300", col.className)}
                      >
                        {col.render
                          ? col.render(val, row, page * pageSize + rowIdx)
                          : (val as React.ReactNode) ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && sorted.length > pageSize && (
        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="text-gray-300 font-medium">
              {page * pageSize + 1}
            </span>{" "}
            –{" "}
            <span className="text-gray-300 font-medium">
              {Math.min((page + 1) * pageSize, sorted.length)}
            </span>{" "}
            of{" "}
            <span className="text-gray-300 font-medium">{sorted.length}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-white/[0.08] text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1)
              .map((i, idx, arr) => (
                <React.Fragment key={i}>
                  {idx > 0 && arr[idx - 1] !== i - 1 && (
                    <span className="px-1 text-gray-600 text-xs">…</span>
                  )}
                  <button
                    onClick={() => setPage(i)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                      page === i
                        ? "bg-green-500 text-white"
                        : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
                    )}
                  >
                    {i + 1}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg border border-white/[0.08] text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
