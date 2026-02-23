import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { HeroSection } from "../components/hero";
import { RecentlyDestroyed } from "@/components/recently-destroyed";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex-col">
        <Navbar />
        <HeroSection />
        <RecentlyDestroyed />
      </main>
      <Footer />
    </div>
  );
}
