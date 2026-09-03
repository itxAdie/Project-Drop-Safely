"use client";

import React from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RouteClusterView } from "@/components/admin/RouteClusterView";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";
import { ArrowLeft } from "lucide-react";

export default function RouteCandidatesPage() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();

  const { data, isLoading } = useSWR<{ data: Array<{
    _id: string;
    city: string;
    institutes: string[];
    studentIds: string[];
    matchCount: number;
    timeSlot: string;
    departureTime: string;
    status: string;
    centroid?: { coordinates: [number, number] };
    createdAt: string;
  }> }>(`/api/routes/candidates?status=pending`);

  const candidates = data?.data || [];

  const handleApprove = async (candidateId: string, routeName: string) => {
    const res = await fetch(`/api/routes/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ candidateId, name: routeName }),
    });
    if (!res.ok) throw new Error("Failed");
    mutate((key: string) => typeof key === "string" && key.startsWith("/api/routes/candidates"), undefined, { revalidate: true });
  };

  const handleReject = async (candidateId: string) => {
    const res = await fetch(`/api/routes/candidates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ candidateId }),
    });
    if (!res.ok) throw new Error("Failed");
    mutate((key: string) => typeof key === "string" && key.startsWith("/api/routes/candidates"), undefined, { revalidate: true });
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/routes")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Routes
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Route Candidates</h1>
            <p className="text-sm text-gray-500 mt-1">Review and approve auto-generated route clusters</p>
          </div>
        </div>
      </div>

      <RouteClusterView
        candidates={candidates}
        isLoading={isLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </motion.div>
  );
}
