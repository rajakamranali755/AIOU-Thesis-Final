import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Layers, BookOpen, ScanText, Library, FileDown,
} from "lucide-react";

/* Each slide is a stylised mock of a real workflow screen. */
const SLIDES = [
  {
    id: "template", icon: Layers, title: "1 · Choose a format",
    desc: "Pick from 14 institution-ready templates — preview updates instantly.",
    mock: (
      <div className="grid grid-cols-3 gap-2">
        {["HEC", "AIOU", "IEEE", "APA 7", "MLA 9", "Engg"].map((t, i) => (
          <div key={t} className={`rounded-lg border p-3 text-center ${i === 0 ? "border-primary bg-primary/5" : "border-border bg-muted"}`}>
            <div className="mx-auto mb-2 h-10 rounded bg-gradient-to-b from-foreground/10 to-transparent" />
            <span className="text-[11px] font-bold text-foreground">{t}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "write", icon: BookOpen, title: "2 · Write your chapters",
    desc: "Structured chapters, sections and subsections with live AI scoring.",
    mock: (
      <div className="space-y-2">
        <div className="h-3 w-1/3 rounded bg-foreground/70" />
        {[0.95, 0.8, 0.9, 0.7].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-muted-foreground/25" style={{ width: `${w * 100}%` }} />
        ))}
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-muted-foreground">AI 4% · Plagiarism 2%</span>
        </div>
      </div>
    ),
  },
  {
    id: "biblio", icon: ScanText, title: "3 · Auto-bibliography",
    desc: "Detects citations and fetches real sources with working links.",
    mock: (
      <div className="space-y-2">
        {["Esteva et al. (2017)", "Rahman (2020)", "Okafor & Mensah (2022)"].map((c) => (
          <div key={c} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-[11px] font-semibold text-foreground">{c}</span>
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">linked</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "search", icon: Library, title: "4 · Find &amp; download theses",
    desc: "Search the open-access index by topic, year and region.",
    mock: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <span className="text-[11px] text-muted-foreground">deep learning in healthcare</span>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2">
            <div className="h-2.5 w-2/3 rounded bg-muted-foreground/30" />
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">PDF</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "export", icon: FileDown, title: "5 · Export to Word",
    desc: "One click produces a clean, submission-ready .doc.",
    mock: (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-2">
        <div className="h-16 w-12 rounded-md border border-border bg-card shadow-md">
          <div className="h-1.5 w-full rounded-t-md bg-gradient-to-r from-primary to-accent" />
        </div>
        <span className="rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-[11px] font-bold text-primary-foreground">thesis.doc</span>
      </div>
    ),
  },
];

export default function FeatureCarousel() {
  const [index, setIndex] = useState(0);
  const viewportRef = useRef(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const update = () => setW(viewportRef.current?.offsetWidth || 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const go = (i) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));

  return (
    <section id="workflow" className="bg-primary/[0.04] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">The workflow</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Five steps, start to submission
          </h2>
          <p className="mt-3 text-muted-foreground">Drag the panel or use the controls to explore each stage.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-xl shadow-primary/5 sm:p-6">
          <div ref={viewportRef} className="overflow-hidden">
            <motion.div
              className="flex cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: -(SLIDES.length - 1) * w, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                const threshold = w * 0.2;
                if (info.offset.x < -threshold) go(index + 1);
                else if (info.offset.x > threshold) go(index - 1);
                else go(index);
              }}
              animate={{ x: -index * w }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              {SLIDES.map((s) => (
                <div key={s.id} style={{ width: w || "100%" }} className="shrink-0 px-1 sm:px-2">
                  <div className="grid items-center gap-6 rounded-2xl bg-gradient-to-br from-muted/60 to-card p-6 sm:grid-cols-2 sm:p-8">
                    <div>
                      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground" dangerouslySetInnerHTML={{ __html: s.title }} />
                      <p className="mt-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: s.desc }} />
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm pointer-events-none min-h-[160px]">
                      {s.mock}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => go(index - 1)} disabled={index === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-30"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}>
                  <motion.span
                    animate={{ width: i === index ? 28 : 8, opacity: i === index ? 1 : 0.4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`block h-2 rounded-full ${i === index ? "bg-gradient-to-r from-primary to-accent" : "bg-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={() => go(index + 1)} disabled={index === SLIDES.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-30"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
