import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { FileText, BarChart3, Quote, GraduationCap, ShieldCheck } from "lucide-react";

/**
 * Interactive3DArtifact
 * A premium, mouse-reactive floating "document" artifact built with layered
 * CSS 3D transforms (perspective + translateZ) and Framer Motion. It tilts
 * toward the cursor and lifts/fades on scroll for a parallax feel — no Three.js
 * dependency, so it stays lightweight and inherits the theme tokens.
 */
export default function Interactive3DArtifact() {
  const ref = useRef(null);

  // Pointer tilt (-0.5 … 0.5), smoothed with springs.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [20, -20]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-20, 20]);

  // Scroll parallax.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { mx.set(0); my.set(0); };

  const layer = (z) => ({ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" });

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ y: lift, opacity: fade, perspective: 1300 }}
      className="relative mx-auto w-full max-w-[440px] aspect-square select-none"
    >
      {/* Ambient glow */}
      <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        {/* Main document card */}
        <div
          style={layer(0)}
          className="lp-float absolute left-1/2 top-1/2 h-[70%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl shadow-primary/20"
        >
          <div className="h-2.5 w-full rounded-t-2xl bg-gradient-to-r from-primary to-accent" />
          <div className="space-y-2 p-4">
            <div className="mx-auto mt-1 h-2 w-3/4 rounded bg-foreground/80" />
            <div className="mx-auto h-1.5 w-1/2 rounded bg-muted-foreground/50" />
            <div className="mx-auto my-3 h-10 w-10 rounded-full border-2 border-primary/40" />
            <div className="space-y-1.5 pt-2">
              {[1, 0.9, 0.95, 0.7, 0.85, 0.6].map((w, i) => (
                <div key={i} className="h-1.5 rounded bg-muted-foreground/25" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Floating metrics card */}
        <div
          style={layer(70)}
          className="lp-float absolute left-[2%] top-[12%] w-[42%] rounded-xl border border-border bg-card p-3 shadow-xl shadow-accent/20"
        >
          <div className="mb-2 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground">Originality</span>
          </div>
          <div className="flex items-end gap-1.5">
            {[40, 65, 50, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary to-accent" style={{ height: h * 0.5 }} />
            ))}
          </div>
        </div>

        {/* Floating template badges */}
        <div style={layer(110)} className="lp-float absolute right-[0%] top-[20%] flex flex-col gap-2">
          {[
            { label: "HEC", icon: GraduationCap },
            { label: "APA 7", icon: FileText },
            { label: "IEEE", icon: ShieldCheck },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg">
              <b.icon className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-bold text-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Floating citation chip */}
        <div
          style={layer(130)}
          className="lp-float absolute bottom-[10%] left-[8%] flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-primary-foreground shadow-xl"
        >
          <Quote className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold">Auto-cited (2024)</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
