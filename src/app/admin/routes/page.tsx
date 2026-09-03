"use client";

import React, { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { pageTransition } from "@/lib/animations";

interface RouteRow {
  _id: string;
  name: string;
  city: string;
  status: string;
  totalStudents: number;
  minStudents: number;
  vans: Array<{ driverId?: string }>;
  timeSlots: string[];
  [key: string]: unknown;
}

export default function RoutesPage() {
  const router = useRouter();
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", "20");
  if (cityFilter) params.set("city", cityFilter);
  if (statusFilter) params.set("status", statusFilter);

  const { data, isLoading } = useSWR<{
    data: RouteRow[];
    pagination: { page: number; totalPages: number; totalItems: number };
  }>(`/api/routes?${params.toString()}`);

  const { data: citiesData } = useSWR<{ data: Array<{ _id: string; name: string }> }>("/api/cities");

  const cityOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Cities" }];
    if (citiesData?.data) {
      opts.push(...citiesData.data.map((c) => ({ value: c.name, label: c.name })));
    }
    return opts;
  }, [citiesData]);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "candidate", label: "Candidate" },
    { value: "archived", label: "Archived" },
  ];

  const columns: Column<RouteRow>[] = useMemo(
    () => [
      { header: "Route Name", accessor: "name", sortable: true },
      { header: "City", accessor: "city", sortable: true },
      {
        header: "Status",
        accessor: "status",
        render: (val, row) => {
          const s = val as string;
          const isAtRisk = row.totalStudents < row.minStudents && s === "active";
          const variant = s === "active" ? (isAtRisk ? "danger" : "success") : s === "inactive" ? "default" : "warning";
          return (
            <div className="flex items-center gap-2">
              <Badge variant={variant} size="sm" dot>{s}</Badge>
              {isAtRisk && <span className="text-[10px] text-red-400">at-risk</span>}
            </div>
          );
        },
      },
      {
        header: "Students",
        accessor: "totalStudents",
        render: (_, row) => (
          <span className={`text-sm ${row.totalStudents < row.minStudents ? "text-red-400" : "text-gray-300"}`}>
            {row.totalStudents} / {row.minStudents} min
          </span>
        ),
      },
      {
        header: "Vans",
        accessor: "vans",
        render: (val) => (
          <span className="text-sm text-gray-400">{Array.isArray(val) ? val.length : 0}</span>
        ),
      },
      {
        header: "Drivers",
        accessor: "vans",
        render: (val) => {
          const vans = val as Array<{ driverId?: string }>;
          const withDrivers = vans?.filter((v) => v.driverId).length || 0;
          return <span className="text-sm text-gray-400">{withDrivers}</span>;
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (row: RouteRow) => router.push(`/admin/routes/${row._id}`),
    [router],
  );

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Routes</h1>
          <p className="text-sm text-gray-500 mt-1">Active routes and route management</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/admin/routes/candidates")}
        >
          View Candidates
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          options={cityOptions}
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          wrapperClassName="w-full sm:w-40"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          wrapperClassName="w-full sm:w-36"
        />
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as (RouteRow & Record<string, unknown>)[]}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyMessage="No routes found"
      />

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-600">Page {data.pagination.page} of {data.pagination.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 disabled:opacity-30 hover:bg-white/[0.06] transition-colors">Previous</button>
            <button onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages} className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 disabled:opacity-30 hover:bg-white/[0.06] transition-colors">Next</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
