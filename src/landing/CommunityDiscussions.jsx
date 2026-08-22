import { useReducer, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Plus, LogIn } from "lucide-react";
import * as store from "../utils/scholarStore";

/**
 * CommunityDiscussions (landing)
 * Shows admin-approved discussions publicly. A signed-in scholar can add points
 * and propose new topics (which go to the admin for approval). Visitors who
 * aren't signed in are prompted to sign in.
 */
export default function CommunityDiscussions({ onLaunch = () => {} }) {
  const [, bump] = useReducer((n) => n + 1, 0);
  const [point, setPoint] = useState({});
  const [topic, setTopic] = useState("");
  const [proposed, setProposed] = useState(false);

  const user = store.getCurrentUser();
  const discussions = store.getApprovedDiscussions();

  const addPoint = (id) => {
    const t = (point[id] || "").trim();
    if (!t || !user) return;
    store.addDiscussionPoint(id, t, user);
    setPoint((p) => ({ ...p, [id]: "" }));
    bump();
  };
  const propose = () => {
    if (!topic.trim() || !user) return;
    store.proposeDiscussion({ topic }, user);
    setTopic("");
    setProposed(true);
    setTimeout(() => setProposed(false), 2500);
  };

  return (
    <section id="community" className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">Community</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Current topic discussions</h2>
        <p className="mt-3 text-muted-foreground">
          {user ? "Add your point to a thread, or propose a new topic for the admin to approve." : "Sign in to add your points or propose a discussion."}
        </p>
      </div>

      {/* Propose / sign-in */}
      <div className="mx-auto mb-8 max-w-2xl">
        {user ? (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground"><Plus className="h-4 w-4 text-accent" /> Propose a discussion</p>
            <div className="flex gap-2">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && propose()}
                placeholder="Your topic…" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              <button onClick={propose} className="rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-primary-foreground">Submit</button>
            </div>
            {proposed && <p className="mt-2 text-xs font-semibold text-accent">Submitted — it'll appear here once the admin approves it.</p>}
          </div>
        ) : (
          <button onClick={onLaunch} className="mx-auto flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">
            <LogIn className="h-4 w-4 text-accent" /> Sign in to join the discussion
          </button>
        )}
      </div>

      {/* Threads */}
      {discussions.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No discussions have been published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {discussions.map((d, i) => (
            <motion.div key={d.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 2) * 0.06 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{d.topic}</p>
                  <p className="text-[11px] text-muted-foreground">by {d.author} · {d.points.length} point{d.points.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              {d.body && <p className="mb-2 text-xs text-muted-foreground">{d.body}</p>}
              <div className="space-y-1.5">
                {d.points.slice(-4).map((pt) => (
                  <div key={pt.id} className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-foreground">
                    <span className="font-bold text-primary">{pt.author}:</span> {pt.text}
                  </div>
                ))}
              </div>
              {user && (
                <div className="mt-3 flex gap-2">
                  <input value={point[d.id] || ""} onChange={(e) => setPoint((p) => ({ ...p, [d.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addPoint(d.id)}
                    placeholder="Add your point…" className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                  <button onClick={() => addPoint(d.id)} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground"><Send className="h-3 w-3" /></button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
