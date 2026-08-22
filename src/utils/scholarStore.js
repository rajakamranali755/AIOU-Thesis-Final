/**
 * scholarStore.js
 * Front-end auth + storage for the Scholar Hub, backed by localStorage.
 *
 * IMPORTANT: this is a client-side demo of the sign-up / approval / sign-in
 * flow. Passwords are only lightly hashed and everything lives in the browser,
 * so it is NOT secure and not shared across devices. For a real multi-scholar
 * platform, point these functions at a backend (the API surface is the same).
 */
const K = {
  users: "scholarhub:users",
  session: "scholarhub:session",
  threads: "scholarhub:threads",
};

const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return "h" + h.toString(36);
}

// Built-in administrator account (change these before any real deployment).
export const ADMIN = { email: "admin@hub.com", password: "admin123" };

// Pre-approved DEMO scholar so you can sign in immediately without waiting for
// approval. Remove this (and the seedDemo() call at the bottom) for production.
export const DEMO = { email: "scholar@hub.com", password: "scholar123" };

function seedDemo() {
  try {
    const users = getUsers();
    if (!users.some(u => u.email === DEMO.email)) {
      users.push({
        id: 1000000001, name: "Demo Scholar", email: DEMO.email,
        field: "Computer Science", institution: "Demo University", bio: "",
        pwd: hash(DEMO.password), status: "approved", createdAt: Date.now(),
      });
      saveUsers(users);
    }
  } catch { /* ignore (e.g. no localStorage) */ }
}

/* ── Users ── */
export function getUsers() { return read(K.users, []); }
export function saveUsers(u) { write(K.users, u); }

export function signUp({ name, email, password, field, institution }) {
  email = (email || "").trim().toLowerCase();
  if (!name?.trim() || !email || !password) return { error: "Name, email and password are required." };
  if (email === ADMIN.email) return { error: "That email is reserved." };
  const users = getUsers();
  if (users.some(u => u.email === email)) return { error: "An account with this email already exists." };
  users.push({
    id: Date.now(), name: name.trim(), email, field: field || "", institution: institution || "",
    bio: "", pwd: hash(password), status: "pending", createdAt: Date.now(),
  });
  saveUsers(users);
  return { ok: true };
}

export function signIn({ email, password }) {
  email = (email || "").trim().toLowerCase();
  if (email === ADMIN.email && password === ADMIN.password) {
    write(K.session, { admin: true });
    return { ok: true, admin: true };
  }
  const user = getUsers().find(u => u.email === email);
  if (!user || user.pwd !== hash(password)) return { error: "Incorrect email or password." };
  if (user.status === "pending")  return { error: "Your account is awaiting admin approval." };
  if (user.status === "rejected") return { error: "Your account request was declined by the admin." };
  write(K.session, { userId: user.id });
  return { ok: true, user };
}

export function signOut() { try { localStorage.removeItem(K.session); } catch { /* ignore */ } }

export function getSession() { return read(K.session, null); }
export function isAdmin() { return !!getSession()?.admin; }
export function getCurrentUser() {
  const s = getSession();
  if (!s?.userId) return null;
  return getUsers().find(u => u.id === s.userId) || null;
}
export function updateCurrentUser(patch) {
  const s = getSession();
  if (!s?.userId) return;
  saveUsers(getUsers().map(u => (u.id === s.userId ? { ...u, ...patch } : u)));
}
export function setUserStatus(id, status) {
  saveUsers(getUsers().map(u => (u.id === id ? { ...u, status } : u)));
}
export function removeUser(id) {
  saveUsers(getUsers().filter(u => u.id !== id));
  try {
    localStorage.removeItem(`scholarhub:library:${id}`);
    localStorage.removeItem(`scholarhub:meetings:${id}`);
  } catch { /* ignore */ }
}

/* ── Per-user library & meetings ── */
export function getLibrary(uid)  { return read(`scholarhub:library:${uid}`, []); }
export function saveLibrary(uid, items) { write(`scholarhub:library:${uid}`, items); }
export function getMeetings(uid) { return read(`scholarhub:meetings:${uid}`, []); }
export function saveMeetings(uid, m) { write(`scholarhub:meetings:${uid}`, m); }

/* ── Shared discussions (legacy threads kept for compatibility) ── */
export function getThreads() { return read(K.threads, []); }
export function saveThreads(t) { write(K.threads, t); }

/* ── Per-user saved projects (built/uploaded theses & articles) ── */
export function getProjects(uid) { return read(`scholarhub:projects:${uid}`, []); }
export function saveProjects(uid, list) { write(`scholarhub:projects:${uid}`, list); }
export function addProject(uid, project) {
  const list = getProjects(uid);
  list.unshift({ id: Date.now(), savedAt: Date.now(), ...project });
  saveProjects(uid, list);
  return list;
}
export function removeProject(uid, id) {
  const list = getProjects(uid).filter(p => p.id !== id);
  saveProjects(uid, list);
  return list;
}

/* ── Community discussions (admin-approved → shown on landing page) ── */
const DKEY = "scholarhub:discussions";
export function getDiscussions() { return read(DKEY, []); }
export function saveDiscussions(d) { write(DKEY, d); }
export function getApprovedDiscussions() { return getDiscussions().filter(d => d.status === "approved"); }
export function proposeDiscussion({ topic, body }, user) {
  const d = getDiscussions();
  d.unshift({ id: Date.now(), topic, body: body || "", author: user.name, authorId: user.id, status: "pending", createdAt: Date.now(), points: [] });
  saveDiscussions(d);
}
export function addDiscussionPoint(id, text, user) {
  saveDiscussions(getDiscussions().map(x =>
    x.id === id ? { ...x, points: [...x.points, { id: Date.now(), author: user.name, authorId: user.id, text, ts: Date.now() }] } : x));
}
export function setDiscussionStatus(id, status) {
  saveDiscussions(getDiscussions().map(x => (x.id === id ? { ...x, status } : x)));
}
export function removeDiscussion(id) { saveDiscussions(getDiscussions().filter(x => x.id !== id)); }

/* ── Group chats (admin-approved → shown only inside user panels) ── */
const GKEY = "scholarhub:groupchats";
export function getGroupChats() { return read(GKEY, []); }
export function saveGroupChats(g) { write(GKEY, g); }
export function proposeGroupChat({ topic }, user) {
  const g = getGroupChats();
  g.unshift({ id: Date.now(), topic, creator: user.name, creatorId: user.id, status: "pending", createdAt: Date.now(), messages: [] });
  saveGroupChats(g);
}
export function setGroupChatStatus(id, status) {
  saveGroupChats(getGroupChats().map(x => (x.id === id ? { ...x, status } : x)));
}
export function addGroupMessage(id, text, user) {
  saveGroupChats(getGroupChats().map(x =>
    x.id === id ? { ...x, messages: [...x.messages, { id: Date.now(), author: user.name, authorId: user.id, text, ts: Date.now() }] } : x));
}
export function removeGroupChat(id) { saveGroupChats(getGroupChats().filter(x => x.id !== id)); }

// Ensure the demo scholar exists on load.
seedDemo();
