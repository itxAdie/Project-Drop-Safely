"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface CitySupplyData {
  city: string;
  waitingStudents: number;
  activeRoutes: number;
  activeDrivers: number;
}

interface SupplyGapChartProps {
  data: CitySupplyData[];
  isLoading?: boolean;
}

export function SupplyGapChart({ data, isLoading }: SupplyGapChartProps) {
  if (isLoading) {
    return <Skeleton variant="rect" height={240} />;
  }

  if (data.length === 0) {
    return (
      <Card variant="default" padding="md">
        <p className="text-center text-gray-500 text-sm py-8">No supply/demand data available</p>
      </Card>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.waitingStudents, d.activeRoutes * 10, d.activeDrivers * 5]),
    1,
  );

  return (
    <Card variant="default" padding="md">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Supply vs Demand by City
      </h3>

      <div className="space-y-4">
        {data.map((item) => {
          const demandHeight = Math.max((item.waitingStudents / maxValue) * 100, 4);
          const supplyHeight = Math.max((item.activeRoutes * 10 / maxValue) * 100, 4);
          const driverHeight = Math.max((item.activeDrivers * 5 / maxValue) * 100, 4);

          return (
            <div key={item.city} className="flex items-end gap-3">
              <span className="w-20 text-xs text-gray-500 text-right shrink-0 truncate">
                {item.city}
              </span>
              <div className="flex-1 flex items-end gap-2 h-24">
                {/* Demand bar (waiting students) */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-red-500/30 border border-red-500/20 transition-all duration-500"
                    style={{ height: `${demandHeight}%` }}
                  />
                  <span className="text-[10px] text-red-400">{item.waitingStudents}</span>
                </div>
                {/* Supply bar (routes × 10 scale) */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-green-500/30 border border-green-500/20 transition-all duration-500"
                    style={{ height: `${supplyHeight}%` }}
                  />
                  <span className="text-[10px] text-green-400">{item.activeRoutes}</span>
                </div>
                {/* Drivers bar (drivers × 5 scale) */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-blue-500/30 border border-blue-500/20 transition-all duration-500"
                    style={{ height: `${driverHeight}%` }}
                  />
                  <span className="text-[10px] text-blue-400">{item.activeDrivers}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-red-500/40" />
          <span className="text-[10px] text-gray-500">Demand (students)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-green-500/40" />
          <span className="text-[10px] text-gray-500">Supply (routes)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-blue-500/40" />
          <span className="text-[10px] text-gray-500">Drivers</span>
        </div>
      </div>
    </Card>
  );
}
