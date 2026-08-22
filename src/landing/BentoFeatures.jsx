import { motion } from "framer-motion";
import {
  Layers, ScanText, ShieldCheck, Library, Users, Languages, FileDown, Image,
} from "lucide-react";

/**
 * BentoFeatures — asymmetrical grid of capability cards.
 * Each card tracks the pointer to project a subtle spotlight, and lifts on hover.
 */
function SpotlightCard({ className = "", children }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <motion.div
      onMouseMove={onMove}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx) var(--my), rgb(var(--primary) / 0.10), transparent 60%)" }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function Icon({ as: As }) {
  return (
    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/25">
      <As className="h-5 w-5" />
    </div>
  );
}

export default function BentoFeatures() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">Everything in one place</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          From blank page to defended thesis
        </h2>
        <p className="mt-4 text-muted-foreground">
          A toolkit that handles the formatting, the citations, and the busywork — so you can focus on the research.
        </p>
      </div>

      <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 md:grid-cols-3">
        {/* Wide hero card */}
        <SpotlightCard className="md:col-span-2 md:row-span-2 flex flex-col justify-between">
          <div>
            <Icon as={Layers} />
            <h3 className="text-2xl font-bold text-foreground">14 format-perfect templates</h3>
            <p className="mt-3 max-w-md text-muted-foreground">
              HEC, AIOU, UoG, NUST, Punjab, QAU and international styles — APA 7th,
              MLA 9th and IEEE. Margins, fonts, spacing and cover pages are correct
              by construction, with live preview and one-click Word export.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["HEC", "AIOU", "APA 7", "MLA 9", "IEEE", "Engineering", "Urdu RTL"].map((t) => (
              <span key={t} className="rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard>
          <Icon as={ScanText} />
          <h3 className="text-lg font-bold text-foreground">Automated bibliography</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Scans your chapters for in-text citations and fetches real sources with links.
          </p>
        </SpotlightCard>

        <SpotlightCard>
          <Icon as={Library} />
          <h3 className="text-lg font-bold text-foreground">Thesis search engine</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Find and download open-access theses and papers by topic, year and region.
          </p>
        </SpotlightCard>

        <SpotlightCard className="md:col-span-3">
          <Icon as={Users} />
          <h3 className="text-lg font-bold text-foreground">Scholar Hub</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A personal library, discussions and meeting scheduling for your research group.
          </p>
        </SpotlightCard>

        {/* Wide footer card */}
        <SpotlightCard className="md:col-span-3">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Icon as={Languages} />
              <h3 className="text-xl font-bold text-foreground">English &amp; Urdu, RTL-ready</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Full right-to-left support with Nastaliq typography, plus logo upload,
                figures and tables — everything a bound submission needs.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-bold text-foreground">
                <FileDown className="h-4 w-4 text-accent" /> Word export
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-bold text-foreground">
                <Image className="h-4 w-4 text-accent" /> Logo &amp; figures
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
