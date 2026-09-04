"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

const EMPTY_FORM = { question: "", answer: "", order: "0" };

export default function AdminFaqsPage() {
  const toast = useToast();
  const { token } = useAuth();
  const { data, isLoading } = useSWR<{ data: FaqItem[] }>("/api/admin/faqs");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const faqs = [...(data?.data || [])].sort((a, b) => a.order - b.order);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (faq: FaqItem) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, order: String(faq.order) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.warning("Question and answer are required");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? "/api/faqs" : "/api/faqs", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...(isEdit ? { id: editing._id } : {}),
          question: form.question.trim(),
          answer: form.answer.trim(),
          order: Number(form.order) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/admin/faqs");
      setShowModal(false);
      toast.success(isEdit ? "FAQ updated" : "FAQ created");
    } catch {
      toast.error("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (faq: FaqItem) => {
    try {
      const res = await fetch("/api/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: faq._id, isActive: !faq.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/admin/faqs");
      toast.success(faq.isActive ? "FAQ hidden" : "FAQ published");
    } catch {
      toast.error("Failed to update FAQ");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/faqs?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/admin/faqs");
      toast.success("FAQ deleted");
    } catch {
      toast.error("Failed to delete FAQ");
    } finally {
      setDeleting(null);
    }
  };

  const move = async (index: number, dir: 1 | -1) => {
    const target = index + dir;
    if (target < 0 || target >= faqs.length) return;
    const a = faqs[index];
    const b = faqs[target];
    try {
      await Promise.all([
        fetch("/api/faqs", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: a._id, order: b.order }),
        }),
        fetch("/api/faqs", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: b._id, order: a.order }),
        }),
      ]);
      mutate("/api/admin/faqs");
    } catch {
      toast.error("Failed to reorder");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton variant="rect" height={120} count={3} />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">FAQs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the frequently asked questions shown on the landing page
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={openAdd}
        >
          Add FAQ
        </Button>
      </div>

      <div className="space-y-3">
        {faqs.length === 0 && (
          <Card variant="default" padding="lg">
            <p className="text-sm text-gray-500">No FAQs yet. Add your first one.</p>
          </Card>
        )}
        {faqs.map((faq, i) => (
          <Card key={faq._id} variant="default" padding="sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-200">{faq.question}</p>
                  <Badge variant={faq.isActive ? "success" : "default"} size="sm" dot>
                    {faq.isActive ? "Published" : "Hidden"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-400 line-clamp-2">
                  {faq.answer}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === faqs.length - 1}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => handleToggle(faq)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                  aria-label="Toggle publish"
                >
                  <span className="text-xs font-medium">{faq.isActive ? "Hide" : "Publish"}</span>
                </button>
                <button
                  onClick={() => openEdit(faq)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.04] hover:text-green-400"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(faq._id)}
                  disabled={deleting === faq._id}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.04] hover:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit FAQ" : "Add FAQ"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Question"
            placeholder="e.g. Is Drop Safely only for female students?"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            required
          />
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-400">Answer</p>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Write the answer..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-light placeholder:text-light/30 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <Input
            label="Order"
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={saving} onClick={handleSave}>
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
