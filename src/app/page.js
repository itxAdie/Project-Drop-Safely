"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import BenefitsSection from "@/components/BenefitsSection";
import EarlyAccessSection from "@/components/EarlyAccessSection";
import MissionSection from "@/components/MissionSection";
import SafetySection from "@/components/SafetySection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WaitlistSection from "@/components/WaitlistSection";
import FAQSection from "@/components/FAQSection";
import PartnersSection from "@/components/PartnersSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import WaitlistModal from "@/components/WaitlistModal";

export default function Home() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <>
      <HeroSection onWaitlistOpen={() => setWaitlistOpen(true)} />
      <ProblemsSection />
      <MissionSection />
      <BenefitsSection />
      <EarlyAccessSection onWaitlistOpen={() => setWaitlistOpen(true)} />
      {/* <SafetySection /> */}
      <HowItWorksSection />
      <PartnersSection />
      {/* <WaitlistSection onWaitlistOpen={() => setWaitlistOpen(true)} /> */}
      <FAQSection onWaitlistOpen={() => setWaitlistOpen(true)} />
      <FinalCTASection onWaitlistOpen={() => setWaitlistOpen(true)} />
      <Footer onWaitlistOpen={() => setWaitlistOpen(true)} />
      <WhatsAppButton />
      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
    </>
  );
}
