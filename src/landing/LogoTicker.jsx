import { GraduationCap } from "lucide-react";

/* Affiliations / formats shown in a seamless infinite marquee. */
const ITEMS = [
  "HEC Pakistan", "AIOU Islamabad", "University of the Punjab", "NUST",
  "Quaid-i-Azam University", "COMSATS", "IIU", "APA 7th", "MLA 9th", "IEEE",
];

function Row() {
  return (
    <div className="lp-marquee flex shrink-0 items-center gap-10 pr-10">
      {ITEMS.map((t, i) => (
        <div key={i} className="flex items-center gap-2 whitespace-nowrap">
          <GraduationCap className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-sm font-bold text-muted-foreground/70">{t}</span>
        </div>
      ))}
    </div>
  );
}

export default function LogoTicker() {
  return (
    <section className="border-y border-border bg-background/30 backdrop-blur-sm py-8">
      <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Built around the standards researchers actually submit to
      </p>
      <div className="lp-marquee-group relative overflow-hidden">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max">
          {/* duplicated for a seamless -50% loop */}
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
