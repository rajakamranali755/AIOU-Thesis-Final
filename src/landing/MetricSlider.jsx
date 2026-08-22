import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Quote, CheckCircle2, TrendingUp } from "lucide-react";

/**
 * MetricSlider
 * Dragging the range updates the derived metrics and the comparison chart in
 * real time, making the project's value tangible.
 */
export default function MetricSlider() {
  const [pages, setPages] = useState(120);

  // Derived metrics (illustrative model).
  const citations   = Math.round(pages * 1.2);
  const suiteHours  = +(pages * 0.05).toFixed(1);
  const manualHours = +(pages * 0.35).toFixed(1);
  const saved       = +(manualHours - suiteHours).toFixed(1);
  const maxHours    = Math.max(manualHours, 1);

  const stats = [
    { icon: Clock,       label: "Hours saved",       value: `${saved}h`, sub: "vs. manual formatting" },
    { icon: Quote,       label: "Citations auto-linked", value: citations, sub: "from your chapters" },
    { icon: CheckCircle2,label: "Format compliance", value: "100%", sub: "by construction" },
  ];

  return (
    <section id="impact" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Controls */}
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">See the impact</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How much time would you get back?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Drag to set the length of your thesis and watch the savings update live.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-muted-foreground">Thesis length</span>
              <span className="text-2xl font-extrabold text-foreground">
                {pages} <span className="text-sm font-bold text-muted-foreground">pages</span>
              </span>
            </div>
            <input
              type="range" min={20} max={300} step={5} value={pages}
              onChange={(e) => setPages(+e.target.value)}
              className="lp-range w-full"
              style={{
                background: `linear-gradient(90deg, rgb(var(--primary)) ${((pages - 20) / 280) * 100}%, rgb(var(--muted)) ${((pages - 20) / 280) * 100}%)`,
              }}
            />
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>20</span><span>300</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-muted/50 p-3 text-center">
                  <s.icon className="mx-auto mb-1.5 h-4 w-4 text-accent" />
                  <p className="text-lg font-extrabold leading-none text-foreground">{s.value}</p>
                  <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live chart */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/50 to-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Time to format &amp; cite</span>
          </div>

          <div className="space-y-5">
            {[
              { label: "Doing it manually", hours: manualHours, cls: "from-muted-foreground/60 to-muted-foreground/40", text: "text-muted-foreground" },
              { label: "With the Suite",    hours: suiteHours,  cls: "from-primary to-accent", text: "text-foreground" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`text-sm font-bold ${row.text}`}>{row.label}</span>
                  <span className={`text-sm font-extrabold ${row.text}`}>{row.hours}h</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${row.cls}`}
                    animate={{ width: `${(row.hours / maxHours) * 100}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary to-accent p-5 text-center text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">You save</p>
            <motion.p
              key={saved}
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-4xl font-extrabold"
            >
              {saved} hours
            </motion.p>
            <p className="text-xs opacity-80">on a {pages}-page thesis</p>
          </div>
        </div>
      </div>
    </section>
  );
}
