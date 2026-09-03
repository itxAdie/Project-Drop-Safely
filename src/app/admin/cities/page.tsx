"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition, stagger, fadeUp } from "@/lib/animations";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";

interface ZoneItem {
  _id: string;
  name: string;
  acPrice: number;
  nonAcPrice: number;
  commissionPercent: number;
  platformFee: number;
}

interface CityItem {
  _id: string;
  name: string;
  isActive: boolean;
  zones: ZoneItem[];
}

export default function CitiesPage() {
  const toast = useToast();
  const { token } = useAuth();
  const { data, isLoading } = useSWR<{ data: CityItem[] }>("/api/cities");

  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [showAddZone, setShowAddZone] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: "", acPrice: "", nonAcPrice: "", commissionPercent: "15", platformFee: "100" });
  const [toggling, setToggling] = useState<string | null>(null);

  const cities = data?.data || [];

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCityName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/cities");
      setShowAddCity(false);
      setNewCityName("");
      toast.success("City created");
    } catch {
      toast.error("Failed to create city");
    }
  };

  const handleToggleCity = async (cityId: string, isActive: boolean) => {
    setToggling(cityId);
    try {
      const res = await fetch(`/api/cities/${cityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/cities");
      toast.success(`City ${!isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update city");
    } finally {
      setToggling(null);
    }
  };

  const handleAddZone = async (cityId: string) => {
    if (!zoneForm.name.trim()) return;
    try {
      const res = await fetch(`/api/cities/${cityId}/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: zoneForm.name.trim(),
          acPrice: Number(zoneForm.acPrice),
          nonAcPrice: Number(zoneForm.nonAcPrice),
          commissionPercent: Number(zoneForm.commissionPercent),
          platformFee: Number(zoneForm.platformFee),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/cities");
      setShowAddZone(null);
      setZoneForm({ name: "", acPrice: "", nonAcPrice: "", commissionPercent: "15", platformFee: "100" });
      toast.success("Zone created");
    } catch {
      toast.error("Failed to create zone");
    }
  };

  const handleDeleteZone = async (cityId: string, zoneId: string) => {
    try {
      const res = await fetch(`/api/cities/${cityId}/zones?zoneId=${zoneId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      mutate("/api/cities");
      toast.success("Zone deleted");
    } catch {
      toast.error("Failed to delete zone");
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
          <h1 className="text-2xl font-bold text-gray-100">Cities & Zones</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cities and their zone pricing</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddCity(true)}>
          Add City
        </Button>
      </div>

      {/* City List */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
        {cities.map((city) => (
          <motion.div key={city._id} variants={fadeUp}>
            <Card variant="default" padding="sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedCity(expandedCity === city._id ? null : city._id)}
                  className="flex items-center gap-2 flex-1"
                >
                  {expandedCity === city._id ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                  <span className="text-sm font-semibold text-gray-200">{city.name}</span>
                  <Badge variant={city.isActive ? "success" : "default"} size="sm" dot>
                    {city.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-gray-600 ml-2">{city.zones?.length || 0} zones</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={toggling === city._id}
                  onClick={() => handleToggleCity(city._id, city.isActive)}
                >
                  {city.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>

              <AnimatePresence>
                {expandedCity === city._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2">
                      {city.zones?.map((zone) => (
                        <div key={zone._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                          <div>
                            <p className="text-sm font-medium text-gray-300">{zone.name}</p>
                            <p className="text-xs text-gray-500">
                              AC: Rs.{zone.acPrice} | Non-AC: Rs.{zone.nonAcPrice} | Commission: {zone.commissionPercent}% | Fee: Rs.{zone.platformFee}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteZone(city._id, zone._id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      {showAddZone === city._id ? (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Zone name" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
                            <Input placeholder="AC Price" type="number" value={zoneForm.acPrice} onChange={(e) => setZoneForm({ ...zoneForm, acPrice: e.target.value })} />
                            <Input placeholder="Non-AC Price" type="number" value={zoneForm.nonAcPrice} onChange={(e) => setZoneForm({ ...zoneForm, nonAcPrice: e.target.value })} />
                            <Input placeholder="Commission %" type="number" value={zoneForm.commissionPercent} onChange={(e) => setZoneForm({ ...zoneForm, commissionPercent: e.target.value })} />
                            <Input placeholder="Platform Fee" type="number" value={zoneForm.platformFee} onChange={(e) => setZoneForm({ ...zoneForm, platformFee: e.target.value })} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleAddZone(city._id)}>Save Zone</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAddZone(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setShowAddZone(city._id)} leftIcon={<Plus size={12} />}>
                          Add Zone
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Add City Modal */}
      <Modal isOpen={showAddCity} onClose={() => setShowAddCity(false)} title="Add New City" size="sm">
        <div className="space-y-4">
          <Input
            label="City Name"
            placeholder="e.g. Lahore"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAddCity(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddCity}>Create</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
