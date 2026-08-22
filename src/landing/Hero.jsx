import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Star } from "lucide-react";
import Interactive3DArtifact from "./Interactive3DArtifact";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" } }),
};

export default function Hero({ onLaunch }) {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgb(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground)) 1px, transparent 1px)", backgroundSize: "44px 44px" }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-6">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            HEC · APA · MLA · IEEE — built for researchers
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Write your thesis the{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">right way</span>,
            the first time.
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg"
          >
            A complete academic writing suite — format-perfect templates, automated
            bibliographies with real source links, AI &amp; plagiarism scoring, a
            thesis search engine, and a collaboration hub for scholars.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <button
              onClick={onLaunch}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 sm:w-auto"
            >
              Start writing free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#workflow"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-accent" />
              See how it works
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground lg:justify-start"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
              ))}
            </div>
            <span>Trusted by researchers across <strong className="text-foreground">14 thesis formats</strong></span>
          </motion.div>
        </div>

        {/* 3D artifact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          <Interactive3DArtifact />
        </motion.div>
      </div>
    </section>
  );
}
