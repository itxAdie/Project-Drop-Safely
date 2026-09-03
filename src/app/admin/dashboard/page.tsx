"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Select } from "@/components/ui/Select";
import { KpiCards } from "@/components/admin/KpiCards";
import { SupplyGapChart } from "@/components/admin/SupplyGapChart";
import { pageTransition } from "@/lib/animations";

interface KpiData {
  growth: {
    totalStudents: number;
    newStudentsThisMonth: number;
    studentGrowthPercent: number;
    totalDrivers: number;
    newDriversThisMonth: number;
  };
  routes: {
    totalActive: number;
    totalCandidates: number;
    avgStudentsPerRoute: number;
    atRiskRoutes: number;
  };
  revenue: {
    totalThisMonth: number;
    platformFeesCollected: number;
    avgRevenuePerRoute: number;
    overduePayments: number;
  };
  operational: {
    avgDelayMinutes: number;
    onTimePercent: number;
    tripsToday: number;
    tripsThisMonth: number;
  };
  retention: {
    studentRetentionPercent: number;
    driverRetentionPercent: number;
  };
}

export default function AdminDashboardPage() {
  const [selectedCity, setSelectedCity] = useState("");

  // Fetch cities
  const { data: citiesData } = useSWR<{ data: Array<{ _id: string; name: string }> }>("/api/cities");

  // Fetch KPIs
  const kpiUrl = `/api/analytics/kpis?detailed=true${selectedCity ? `&city=${selectedCity}` : ""}`;
  const { data: kpiResponse, isLoading: kpiLoading } = useSWR<{ data: KpiData }>(kpiUrl, {
    refreshInterval: 60000,
  });

  const kpi = kpiResponse?.data;

  const cityOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Cities" }];
    if (citiesData?.data) {
      opts.push(...citiesData.data.map((c) => ({ value: c.name, label: c.name })));
    }
    return opts;
  }, [citiesData]);

  const groups = useMemo(() => {
    if (!kpi) {
      return [
        { title: "Growth", metrics: [] },
        { title: "Routes", metrics: [] },
        { title: "Revenue", metrics: [] },
        { title: "Operational", metrics: [] },
      ];
    }

    return [
      {
        title: "Growth",
        metrics: [
          { label: "Total Students", value: kpi.growth.totalStudents, icon: "🎓" },
          {
            label: "New Students (Month)",
            value: kpi.growth.newStudentsThisMonth,
            trend: kpi.growth.studentGrowthPercent >= 0 ? "up" as const : "down" as const,
            trendValue: `${kpi.growth.studentGrowthPercent >= 0 ? "+" : ""}${kpi.growth.studentGrowthPercent}%`,
            icon: "📈",
          },
          { label: "Total Drivers", value: kpi.growth.totalDrivers, icon: "🚐" },
          { label: "New Drivers (Month)", value: kpi.growth.newDriversThisMonth, icon: "🆕" },
        ],
      },
      {
        title: "Routes",
        metrics: [
          { label: "Active Routes", value: kpi.routes.totalActive, icon: "🗺️" },
          { label: "Pending Candidates", value: kpi.routes.totalCandidates, icon: "⏳" },
          { label: "Avg Students/Route", value: kpi.routes.avgStudentsPerRoute, icon: "👥" },
          {
            label: "At-Risk Routes",
            value: kpi.routes.atRiskRoutes,
            trend: kpi.routes.atRiskRoutes > 0 ? "down" as const : "flat" as const,
            trendValue: kpi.routes.atRiskRoutes > 0 ? `${kpi.routes.atRiskRoutes} at risk` : "All healthy",
            icon: "⚠️",
          },
        ],
      },
      {
        title: "Revenue",
        metrics: [
          {
            label: "Revenue (Month)",
            value: `Rs. ${kpi.revenue.totalThisMonth.toLocaleString()}`,
            icon: "💰",
          },
          {
            label: "Platform Fees",
            value: `Rs. ${kpi.revenue.platformFeesCollected.toLocaleString()}`,
            icon: "🏦",
          },
          {
            label: "Avg Revenue/Route",
            value: `Rs. ${kpi.revenue.avgRevenuePerRoute.toLocaleString()}`,
            icon: "📊",
          },
          {
            label: "Overdue Payments",
            value: kpi.revenue.overduePayments,
            trend: kpi.revenue.overduePayments > 0 ? "down" as const : "flat" as const,
            trendValue: kpi.revenue.overduePayments > 0 ? `${kpi.revenue.overduePayments} overdue` : "None",
            icon: "🔴",
          },
        ],
      },
      {
        title: "Operational",
        metrics: [
          {
            label: "Avg Delay",
            value: `${kpi.operational.avgDelayMinutes} min`,
            trend: kpi.operational.avgDelayMinutes <= 5 ? "up" as const : "down" as const,
            trendValue: kpi.operational.avgDelayMinutes <= 5 ? "On track" : "Needs attention",
            icon: "⏱️",
          },
          {
            label: "On-Time %",
            value: `${kpi.operational.onTimePercent}%`,
            trend: kpi.operational.onTimePercent >= 80 ? "up" as const : "down" as const,
            trendValue: kpi.operational.onTimePercent >= 80 ? "Good" : "Below target",
            icon: "✅",
          },
          { label: "Trips Today", value: kpi.operational.tripsToday, icon: "🚌" },
          { label: "Trips This Month", value: kpi.operational.tripsThisMonth, icon: "📅" },
        ],
      },
    ];
  }, [kpi]);

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>
        <Select
          options={cityOptions}
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          placeholder="All Cities"
          wrapperClassName="w-full sm:w-48"
        />
      </div>

      {/* KPI Cards */}
      <KpiCards groups={groups} isLoading={kpiLoading} />

      {/* Supply/Demand Chart + Heatmap Placeholder */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupplyGapChart data={[]} isLoading={kpiLoading} />
        {/* Demand Heatmap placeholder — maps team is building DemandHeatmap separately */}
        <div
          id="demand-heatmap-placeholder"
          className="rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex items-center justify-center min-h-[240px]"
        >
          <p className="text-gray-600 text-sm">Demand Heatmap (coming soon)</p>
        </div>
      </div>
    </motion.div>
  );
}
