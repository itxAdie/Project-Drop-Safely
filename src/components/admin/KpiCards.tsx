"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { stagger, fadeUp } from "@/lib/animations";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  icon?: string;
}

interface KpiGroup {
  title: string;
  metrics: KpiMetric[];
}

interface KpiCardsProps {
  groups: KpiGroup[];
  isLoading?: boolean;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp size={14} className="text-green-400" />;
  if (trend === "down") return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-gray-500" />;
}

function KpiCard({ metric }: { metric: KpiMetric }) {
  return (
    <Card variant="default" padding="sm" className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {metric.label}
          </p>
          <p className="text-2xl font-bold text-gray-100">{metric.value}</p>
        </div>
        {metric.icon && (
          <span className="text-xl opacity-50">{metric.icon}</span>
        )}
      </div>
      {metric.trend && metric.trendValue && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendIcon trend={metric.trend} />
          <span
            className={`text-xs font-medium ${
              metric.trend === "up"
                ? "text-green-400"
                : metric.trend === "down"
                  ? "text-red-400"
                  : "text-gray-500"
            }`}
          >
            {metric.trendValue}
          </span>
          <span className="text-xs text-gray-600">vs last month</span>
        </div>
      )}
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card variant="default" padding="sm">
      <Skeleton variant="text" width="60%" height={12} />
      <Skeleton variant="text" width="40%" height={28} className="mt-2" />
      <Skeleton variant="text" width="80%" height={12} className="mt-3" />
    </Card>
  );
}

export function KpiCards({ groups, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {groups.map((group, gi) => (
          <div key={gi}>
            <Skeleton variant="text" width="20%" height={18} className="mb-3" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <KpiCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {groups.map((group, gi) => (
        <div key={gi}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {group.title}
          </h3>
          <motion.div
            variants={stagger}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {group.metrics.map((metric, mi) => (
              <motion.div key={mi} variants={fadeUp}>
                <KpiCard metric={metric} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
