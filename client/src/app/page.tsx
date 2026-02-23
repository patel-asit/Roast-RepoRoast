import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { HeroSection } from "../components/hero";
import { RecentlyDestroyed } from "@/components/recently-destroyed";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Navbar />
        <HeroSection />
        <RecentlyDestroyed />
      </main>
      <Footer />
    </div>
  );
}
