import { TrackPageView } from "@/components/analytics/TrackPageView";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { Experience } from "@/components/sections/Experience";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { Goals } from "@/components/sections/Goals";
import { Method } from "@/components/sections/Method";
import { Philosophy } from "@/components/sections/Philosophy";
import { TrainingModes } from "@/components/sections/TrainingModes";
import { ValueProposition } from "@/components/sections/ValueProposition";

export default function Home() {
  return (
    <main>
      <TrackPageView />
      <Hero />
      <ValueProposition />
      <Goals />
      <TrainingModes />
      <Method />
      <Philosophy />
      <Experience />
      <FinalCTA />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
