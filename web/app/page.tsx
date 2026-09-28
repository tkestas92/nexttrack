import { Finder } from "@/components/finder";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a href="#finder" className="skip-link">
        Skip to the finder
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <p className="font-display text-lg tracking-tight">NextTrack</p>
          <p className="hidden text-right text-sm text-muted sm:block">
            Sound first, then key and tempo
          </p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
        <Hero />
        <Finder />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
