"use client";

import React from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { EarningsCard } from "@/components/driver/EarningsCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { stagger, fadeUp } from "@/lib/animations";

interface MonthlyHistoryRow {
  [key: string]: unknown;
  _id?: string;
  month: string;
  year: number;
  monthNum: number;
  tripCount: number;
  totalEarnings: number;
}

function formatPkr(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const columns: Column<MonthlyHistoryRow>[] = [
  {
    header: "Month",
    accessor: "month",
    sortable: true,
    render: (_v, row) => (
      <span className="text-gray-200 font-medium">
        {row.month} {row.year}
      </span>
    ),
  },
  {
    header: "Trips",
    accessor: "tripCount",
    sortable: true,
    render: (v) => (
      <span className="tabular-nums text-gray-300">{v as number}</span>
    ),
  },
  {
    header: "Earnings",
    accessor: "totalEarnings",
    sortable: true,
    render: (v) => (
      <span className="text-green-400 font-semibold tabular-nums">
        {formatPkr(v as number)}
      </span>
    ),
  },
];

export default function EarningsPage() {
  const { user, token } = useAuth();

  const { data: profileData } = useSWR<{
    driver: { _id: string };
  }>(token && user ? `/api/drivers/profile?userId=${user.id}` : null);

  const driverId = profileData?.driver?._id || "";

  const { data: earningsData, isLoading } = useSWR<{
    data: {
      totalEarnings: number;
      tripCount: number;
      monthlyHistory: MonthlyHistoryRow[];
    };
  }>(driverId ? `/api/drivers/${driverId}/earnings` : null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-6 space-y-6">
        <Skeleton variant="rect" height={150} />
        <Skeleton variant="rect" height={300} />
      </div>
    );
  }

  const earnings = earningsData?.data;
  const history = (earnings?.monthlyHistory || []).map((h, i) => ({
    ...h,
    _id: `${h.year}-${h.monthNum}-${i}`,
  }));

  return (
    <div className="mx-auto max-w-2xl py-2">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100 font-display">Earnings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monthly earnings from completed trips
          </p>
        </motion.div>

        {/* Current month card */}
        <motion.div variants={fadeUp} className="mb-8">
          <EarningsCard
            totalEarnings={earnings?.totalEarnings || 0}
            tripCount={earnings?.tripCount || 0}
          />
        </motion.div>

        {/* Monthly history table */}
        <motion.div variants={fadeUp}>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Monthly History</h2>
          <Card variant="default" padding="none">
            <div className="p-4">
              <DataTable<MonthlyHistoryRow>
                columns={columns}
                data={history}
                emptyMessage="No earnings history yet"
                pageSize={6}
              />
            </div>
          </Card>
          <p className="text-xs text-gray-600 mt-3 text-center">
            Gross earnings shown. No commission breakdown per platform policy.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
