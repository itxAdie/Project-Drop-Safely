"use client";

import { useState } from "react";
import { TimePicker } from "@/components/ui/TimePicker";

export default function TempTimePicker() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/50 p-6">
        <p className="mb-1 text-center text-xs text-gray-500">a={a || "-"} | b={b || "-"}</p>
        <div className="grid grid-cols-2 gap-3">
          <TimePicker label="PickUp Time" value={a} onChange={setA} required />
          <TimePicker label="DropOff Time" value={b} onChange={setB} required />
        </div>
      </div>
    </div>
  );
}
