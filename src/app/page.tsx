"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import BenefitsSection from "@/components/BenefitsSection";
import EarlyAccessSection from "@/components/EarlyAccessSection";
import MissionSection from "@/components/MissionSection";
import SafetySection from "@/components/SafetySection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FAQSection from "@/components/FAQSection";
import PartnersSection from "@/components/PartnersSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import RegistrationModal from "@/components/RegistrationModal";

export default function Home() {
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <>
      <HeroSection onRegisterOpen={() => setRegisterOpen(true)} />
      <ProblemsSection />
      <MissionSection />
      <BenefitsSection />
      <EarlyAccessSection onRegisterOpen={() => setRegisterOpen(true)} />
      {/* <SafetySection /> */}
      <HowItWorksSection />
      <PartnersSection />
      {/* <WaitlistSection onRegisterOpen={() => setRegisterOpen(true)} /> */}
      <FAQSection onRegisterOpen={() => setRegisterOpen(true)} />
      <FinalCTASection onRegisterOpen={() => setRegisterOpen(true)} />
      <Footer onRegisterOpen={() => setRegisterOpen(true)} />
      <WhatsAppButton />
      <RegistrationModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </>
  );
}
