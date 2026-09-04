"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { pageTransition } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Phone, Shield, FileText, ExternalLink } from "lucide-react";

interface DriverDetail {
  _id: string;
  name: string;
  phone: string;
  cnic: string;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleRegNumber: string;
  licenseUrl?: string;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  isApproved: boolean;
  status: string;
  city: string;
  assignedRouteIds: Array<{ _id: string; name: string }>;
  createdAt: string;
}

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const id = params.id as string;

  const { data, isLoading } = useSWR<{ driver: DriverDetail; routes: Array<{ _id: string; name: string }> }>(`/api/drivers/${id}`);
  const [actionLoading, setActionLoading] = useState(false);

  const driver = data?.driver;
  const routes = data?.routes || [];

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/drivers/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      mutate(`/api/drivers/${id}`);
      toast.success("Driver approved successfully");
    } catch {
      toast.error("Failed to approve driver");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/drivers/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "Rejected by admin" }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate(`/api/drivers/${id}`);
      toast.success("Driver rejected");
    } catch {
      toast.error("Failed to reject driver");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton variant="rect" height={200} />
      </div>
    );
  }

  if (!driver) {
    return <p className="text-gray-500 text-center py-12">Driver not found</p>;
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Drivers
        </button>
        {!driver.isApproved && driver.status === "pending" && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={handleApprove}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={actionLoading}
              onClick={handleReject}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card variant="elevated" padding="md" className="mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
            🚐
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-100">{driver.name}</h1>
              <Badge variant={driver.isApproved ? "success" : driver.status === "rejected" ? "danger" : "warning"} dot>
                {driver.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Phone size={13} /> {driver.phone}</span>
              <span className="flex items-center gap-1.5"><Shield size={13} /> CNIC: {driver.cnic}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/[0.04]">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Vehicle Type</p>
            <p className="text-sm text-gray-300 capitalize">{driver.vehicleType.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Capacity</p>
            <p className="text-sm text-gray-300">{driver.vehicleCapacity} seats</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Registration</p>
            <p className="text-sm text-gray-300">{driver.vehicleRegNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">City</p>
            <p className="text-sm text-gray-300">{driver.city}</p>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card variant="default" padding="sm" className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents</h3>
        <div className="space-y-2">
          {driver.licenseFrontUrl ? (
            <a
              href={driver.licenseFrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <FileText size={14} />
              License — Front
              <ExternalLink size={12} />
            </a>
          ) : (
            <p className="text-sm text-gray-600">No license front uploaded</p>
          )}
          {driver.licenseBackUrl ? (
            <a
              href={driver.licenseBackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <FileText size={14} />
              License — Back
              <ExternalLink size={12} />
            </a>
          ) : (
            <p className="text-sm text-gray-600">No license back uploaded</p>
          )}
          {driver.cnicFrontUrl ? (
            <a
              href={driver.cnicFrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <FileText size={14} />
              CNIC — Front
              <ExternalLink size={12} />
            </a>
          ) : (
            <p className="text-sm text-gray-600">No CNIC front uploaded</p>
          )}
          {driver.cnicBackUrl ? (
            <a
              href={driver.cnicBackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <FileText size={14} />
              CNIC — Back
              <ExternalLink size={12} />
            </a>
          ) : (
            <p className="text-sm text-gray-600">No CNIC back uploaded</p>
          )}
        </div>
      </Card>

      {/* Assigned Routes */}
      <Card variant="default" padding="sm" className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Assigned Routes</h3>
        {routes.length > 0 ? (
          <div className="space-y-2">
            {routes.map((route) => (
              <button
                key={route._id}
                onClick={() => router.push(`/admin/routes/${route._id}`)}
                className="block text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                {route.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No routes assigned</p>
        )}
      </Card>
    </motion.div>
  );
}
