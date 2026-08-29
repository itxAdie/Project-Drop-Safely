"use client";

import { motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const logoFiles = [
  "download (1).png",
  "download (2).png",
  "download (3).png",
  "download (4).png",
  "download (5).png",
  "download.png",
  "image.png",
  "PGC-logo.png",
  "okara.png",
];

export default function PartnersSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let id: number;
    const track = trackRef.current;
    if (!track) return;
    const speed = 0.6;

    const step = () => {
      const current = x.get();
      const half = -track.scrollWidth / 2;
      if (current <= half) {
        x.set(0);
      } else {
        x.set(current - speed);
      }
      id = requestAnimationFrame(step);
    };
    if (!paused) id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [x, paused]);

  return (
    <section
      id="our-partners"
      className="relative overflow-hidden bg-dark py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Our <span className="text-green-500">Partner</span> Institutions <span className="text-sm font-normal text-gray-500">(Coming Soon)</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 sm:text-base">
            We collaborate with leading universities and colleges across
            Lahore to provide safe, reliable transport for students.
          </p>
        </motion.div>
      </div>

      <div
        className="relative mt-16 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-dark to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-dark to-transparent" />

        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-6"
        >
          {[...logoFiles, ...logoFiles].map((file, i) => (
            <div
              key={`${file}-${i}`}
              className="flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3"
            >

              <Image
                width={250}
                height={250}
                src={`/logos/${file}`}
                alt="Partner logo"
                className="h-20 w-auto max-w-[200px] object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
