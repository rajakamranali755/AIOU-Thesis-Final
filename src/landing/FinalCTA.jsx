import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA({ onLaunch }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-accent px-6 py-16 text-center shadow-2xl shadow-primary/30 sm:px-12 sm:py-20"
      >
        {/* decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> No setup. Start in your browser.
          </div>
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-5xl">
            Your thesis deserves a tool this good.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/80">
            Format-perfect templates, automated references, and a research workspace —
            everything in one place, ready when you are.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onLaunch}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-background px-7 py-4 text-sm font-bold text-primary shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
            >
              Open the app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-7 py-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10 sm:w-auto"
            >
              Explore features
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
