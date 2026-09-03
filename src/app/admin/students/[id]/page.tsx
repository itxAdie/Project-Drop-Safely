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
import { ArrowLeft, Phone, MapPin, Calendar } from "lucide-react";

interface StudentDetail {
  _id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  pickupAddress: string;
  institute: string;
  city: string;
  classStartTime: string;
  classEndTime: string;
  status: string;
  paymentStatus: string;
  assignedRouteId?: { _id: string; name: string; city: string };
  permanentOffDays: string[];
  suddenOffDays: string[];
  createdAt: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const id = params.id as string;

  const { data, isLoading } = useSWR<{ data: StudentDetail }>(`/api/students/${id}`);
  const [toggling, setToggling] = useState(false);

  const student = data?.data;

  const handleToggleStatus = async () => {
    if (!student) return;
    setToggling(true);
    try {
      const newStatus = student.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate(`/api/students/${id}`);
      toast.success(`Student ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update student status");
    } finally {
      setToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={150} />
      </div>
    );
  }

  if (!student) {
    return <p className="text-gray-500 text-center py-12">Student not found</p>;
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
          Back to Students
        </button>
        <Button
          variant={student.status === "active" ? "outline" : "primary"}
          size="sm"
          isLoading={toggling}
          onClick={handleToggleStatus}
        >
          {student.status === "active" ? "Deactivate" : "Activate"} Student
        </Button>
      </div>

      {/* Profile Card */}
      <Card variant="elevated" padding="md" className="mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">
            🎓
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-100">{student.name}</h1>
              <Badge variant={student.status === "active" ? "success" : "default"} dot>
                {student.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Phone size={13} /> {student.phone}</span>
              {student.parentPhone && <span className="flex items-center gap-1.5"><Phone size={13} /> Parent: {student.parentPhone}</span>}
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {student.city}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/[0.04]">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Institute</p>
            <p className="text-sm text-gray-300">{student.institute}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Pickup Address</p>
            <p className="text-sm text-gray-300">{student.pickupAddress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Class Time</p>
            <p className="text-sm text-gray-300">{student.classStartTime} - {student.classEndTime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Payment Status</p>
            <Badge
              variant={student.paymentStatus === "verified" ? "success" : student.paymentStatus === "overdue" ? "danger" : "warning"}
              size="sm"
            >
              {student.paymentStatus}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Route Info */}
      {student.assignedRouteId && (
        <Card variant="default" padding="sm" className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Assigned Route</h3>
          <button
            onClick={() => router.push(`/admin/routes/${student.assignedRouteId?._id}`)}
            className="text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            {student.assignedRouteId.name} ({student.assignedRouteId.city})
          </button>
        </Card>
      )}

      {/* Off Days */}
      <Card variant="default" padding="sm" className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Off Days</h3>
        <div className="flex flex-wrap gap-2">
          {student.permanentOffDays.length > 0 ? (
            student.permanentOffDays.map((day) => (
              <Badge key={day} variant="default" size="sm">{day}</Badge>
            ))
          ) : (
            <span className="text-sm text-gray-600">No permanent off days</span>
          )}
        </div>
        {student.suddenOffDays.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-1">Sudden Off Days</p>
            <div className="flex flex-wrap gap-2">
              {student.suddenOffDays.map((day) => (
                <Badge key={day} variant="warning" size="sm">{day}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Registered */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Calendar size={12} />
        Registered: {new Date(student.createdAt).toLocaleDateString()}
      </div>
    </motion.div>
  );
}
