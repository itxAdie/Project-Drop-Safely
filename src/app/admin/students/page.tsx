"use client";

import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { pageTransition } from "@/lib/animations";
import { Search } from "lucide-react";

interface StudentRow {
  _id: string;
  name: string;
  phone: string;
  city: string;
  institute: string;
  status: string;
  paymentStatus: string;
  assignedRouteId?: string;
  [key: string]: unknown;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const paymentStatusOptions = [
  { value: "", label: "All Payments" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "overdue", label: "Overdue" },
  { value: "rejected", label: "Rejected" },
];

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", "20");
  if (search) params.set("search", search);
  if (cityFilter) params.set("city", cityFilter);
  if (statusFilter) params.set("status", statusFilter);
  if (paymentFilter) params.set("paymentStatus", paymentFilter);

  const { data, isLoading } = useSWR<{
    data: StudentRow[];
    pagination: { page: number; totalPages: number; totalItems: number };
  }>(`/api/students?${params.toString()}`);

  const { data: citiesData } = useSWR<{ data: Array<{ _id: string; name: string }> }>("/api/cities");

  const cityOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Cities" }];
    if (citiesData?.data) {
      opts.push(...citiesData.data.map((c) => ({ value: c.name, label: c.name })));
    }
    return opts;
  }, [citiesData]);

  const columns: Column<StudentRow>[] = useMemo(
    () => [
      { header: "Name", accessor: "name", sortable: true },
      { header: "Phone", accessor: "phone" },
      { header: "City", accessor: "city", sortable: true },
      { header: "Institute", accessor: "institute" },
      {
        header: "Status",
        accessor: "status",
        render: (val) => {
          const s = val as string;
          const variant = s === "active" ? "success" : s === "suspended" ? "danger" : s === "pending" ? "warning" : "default";
          return <Badge variant={variant} size="sm" dot>{s}</Badge>;
        },
      },
      {
        header: "Payment",
        accessor: "paymentStatus",
        render: (val) => {
          const s = val as string;
          const variant = s === "verified" ? "success" : s === "overdue" ? "danger" : s === "submitted" ? "info" : "warning";
          return <Badge variant={variant} size="sm">{s}</Badge>;
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (row: StudentRow) => router.push(`/admin/students/${row._id}`),
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Students</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all registered students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          leftIcon={<Search size={16} />}
          wrapperClassName="flex-1"
        />
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
        <Select
          options={paymentStatusOptions}
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          wrapperClassName="w-full sm:w-40"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={(data?.data || []) as (StudentRow & Record<string, unknown>)[]}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyMessage="No students found"
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-600">
            Showing {((data.pagination.page - 1) * 20) + 1}-{Math.min(data.pagination.page * 20, data.pagination.totalItems)} of {data.pagination.totalItems}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
