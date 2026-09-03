"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { fadeUp, stagger } from "@/lib/animations";
import { CalendarOff, Plus, Trash2, Calendar } from "lucide-react";

interface DayOffsData {
  permanent: string[];
  sudden: { date: string; isPast: boolean }[];
}

interface StudentData {
  _id: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SchedulePage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: meData } = useSWR<{ data: StudentData | null }>("/api/students/me");
  const studentId = meData?.data?._id;

  const dayOffsKey = studentId ? `/api/students/${studentId}/day-offs` : null;
  const { data, isLoading } = useSWR<{ data: DayOffsData }>(dayOffsKey);

  // Min date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleAddDayOff = useCallback(async () => {
    if (!date || !studentId) return;
    setIsSubmitting(true);

    try {
      const token = JSON.parse(localStorage.getItem("ds_auth") || "{}").accessToken;
      const res = await fetch(`/api/students/${studentId}/day-offs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, reason: reason || undefined }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add day off");

      toast.success("Day off added successfully");
      mutate(dayOffsKey);
      setShowModal(false);
      setDate("");
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add day off");
    } finally {
      setIsSubmitting(false);
    }
  }, [date, reason, studentId, toast, dayOffsKey]);

  const handleRemoveDayOff = useCallback(async (dateStr: string) => {
    if (!studentId) return;

    try {
      const token = JSON.parse(localStorage.getItem("ds_auth") || "{}").accessToken;
      const res = await fetch(`/api/students/${studentId}/day-offs?date=${dateStr}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to remove day off");

      toast.success("Day off removed");
      mutate(dayOffsKey);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove day off");
    }
  }, [studentId, toast, dayOffsKey]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton variant="rect" height={120} />
        <Skeleton variant="rect" height={200} />
      </div>
    );
  }

  const dayOffs = data?.data;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Schedule</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your day-off schedule</p>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)} leftIcon={<Plus size={15} />}>
            Add Day Off
          </Button>
        </div>
      </motion.div>

      {/* Permanent weekly offs */}
      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-200">Permanent Weekly Offs</h2>
          </div>
          <p className="text-xs text-gray-600 mb-3">Set during registration (non-editable)</p>
          <div className="flex flex-wrap gap-2">
            {dayOffs?.permanent && dayOffs.permanent.length > 0 ? (
              dayOffs.permanent.map((day) => (
                <Badge key={day} variant="info" size="md">
                  {DAY_LABELS[day] || day}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-gray-600">No permanent off days set</p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Sudden day-offs */}
      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <CalendarOff size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-gray-200">Upcoming Sudden Day-Offs</h2>
          </div>

          {dayOffs?.sudden && dayOffs.sudden.length > 0 ? (
            <div className="space-y-2">
              {dayOffs.sudden.map((off) => (
                <div
                  key={off.date}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    off.isPast
                      ? "border-white/[0.04] bg-white/[0.01] opacity-50"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <p className="text-sm text-gray-300 font-medium">{formatDate(off.date)}</p>
                    {off.isPast && (
                      <Badge variant="default" size="sm">Past</Badge>
                    )}
                  </div>
                  {!off.isPast && (
                    <button
                      onClick={() => handleRemoveDayOff(off.date)}
                      className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label="Remove day off"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CalendarOff size={24} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-gray-600">No sudden day-offs scheduled</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Add day off modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Day Off"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDayOff} isLoading={isSubmitting}>
              Add Day Off
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="text"
            placeholder="YYYY-MM-DD"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <p className="text-[10px] text-gray-600">
            Must be tomorrow or later. Request before 9 PM the night before.
          </p>
          <Input
            label="Reason (optional)"
            placeholder="e.g. Medical appointment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Modal>
    </motion.div>
  );
}
