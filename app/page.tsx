import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import HorizontalScrollSection from '@/components/HorizontalScrollSection';
import Footer from '@/components/Footer';
import PricingSection from '@/components/PricingSection';
import PricingIntro from '@/components/PricingIntro';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <HorizontalScrollSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}