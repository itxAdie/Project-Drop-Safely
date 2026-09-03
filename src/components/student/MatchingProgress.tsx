"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { Users } from "lucide-react";

interface MatchingProgressData {
  matched: number;
  required: number;
}

interface Props {
  studentId: string;
  pollInterval?: number;
}

export function MatchingProgress({ studentId, pollInterval = 30000 }: Props) {
  const { data } = useSWR<{ data: MatchingProgressData }>(
    `/api/students/${studentId}/matching-progress`,
    { refreshInterval: pollInterval },
  );

  // We use a fallback fetch via the /api/students/me endpoint
  const { data: meData } = useSWR<{ data: { matchingProgress: MatchingProgressData } }>(
    "/api/students/me",
    { refreshInterval: pollInterval },
  );

  const progress = data?.data ?? meData?.data?.matchingProgress;
  const matched = progress?.matched ?? 0;
  const required = progress?.required ?? 7;
  const percentage = Math.min(100, Math.round((matched / required) * 100));

  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayCount(matched), 300);
    return () => clearTimeout(timer);
  }, [matched]);

  return (
    <Card padding="md" className="relative overflow-hidden">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-green-500/5 blur-2xl" />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10">
          <Users size={22} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-200">Route Matching</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Finding students in your area
          </p>
          <div className="mt-3">
            <ProgressBar progress={percentage} size="sm" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <motion.span
              key={displayCount}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-green-400 tabular-nums"
            >
              {displayCount}
            </motion.span>
            <span className="text-sm text-gray-500">of {required} students matched</span>
          </div>
          {matched < required && (
            <p className="mt-1 text-xs text-gray-600">
              {required - matched} more needed to activate your route
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
