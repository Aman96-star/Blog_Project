import { useState, useEffect, useMemo, useRef } from "react";
import { Search, PenSquare, Menu, X, ArrowLeft, ChevronDown, Trash2 } from "lucide-react";

/* ---------------------------------------------------------
   THE DISPATCH — a small, working blog.
   Concept: posts are "dispatches" logged over time, like
   entries in a mailroom ledger. Signature element: the
   dotted "route line" that threads down the log, with a
   stamp-node marking every entry.
--------------------------------------------------------- */

const COLORS = {
  parchment: "#F1EAD6",
  paper: "#FBF7EC",
  ink: "#1C2321",
  inkSoft: "#4A524D",
  blue: "#2E4374",
  red: "#B23A2F",
  sage: "#5B7553",
  amber: "#8B5E3C",
};

const CATEGORIES = [
  { id: "field-notes", label: "Field Notes", color: COLORS.blue },
  { id: "craft", label: "Craft", color: COLORS.red },
  { id: "tech-log", label: "Tech Log", color: COLORS.sage },
  { id: "life", label: "Life", color: COLORS.amber },
];

const TAGS = ["packing", "revision", "legacy systems", "slow mornings", "editing", "migrations", "routines"];

const SEED_POSTS = [
  {
    id: "seed-1",
    entryNo: 1,
    category: "field-notes",
    title: "What Actually Fits in a Carry-On",
    excerpt:
      "After six trips this year I finally stopped packing for a version of myself that doesn't exist.",
    content: [
      "I used to pack for a hypothetical week — the one where I'd need hiking boots, a blazer, and a backup phone charger for the backup charger. This year I started packing for the trip I actually take, which mostly involves walking, one good coffee, and sitting somewhere for longer than planned.",
      "The carry-on now holds four shirts, one pair of shoes that work for everything, and a notebook that's seen more cities than most people I know. Everything else gets bought or borrowed if it turns out I really need it.",
      "Turns out the hypothetical version of me never shows up. She just makes the real trip heavier.",
    ],
    author: "M. Okafor",
    date: "2026-07-08",
    custom: false,
  },
  {
    id: "seed-2",
    entryNo: 2,
    category: "craft",
    title: "The Second Draft Is Where the Book Begins",
    excerpt: "The first draft is just you finding out what you were trying to say.",
    content: [
      "Nobody warns you that the first draft is basically a very long, very expensive note to yourself. Mine usually arrives with the wrong narrator, a subplot that goes nowhere, and one chapter that's secretly the whole point of the book, buried on page 140.",
      "The second draft is where I go back in with what I now know and build the thing on purpose. It's slower, less romantic, and it's the only part of the process that actually resembles writing.",
      "If you're stuck on a first draft, this is your permission to write it badly. The good version is waiting for you on the other side, not underneath.",
    ],
    author: "R. Castillo",
    date: "2026-07-15",
    custom: false,
  },
  {
    id: "seed-3",
    entryNo: 3,
    category: "tech-log",
    title: "Notes on a Slow Migration",
    excerpt: "We moved the billing service over three months instead of one weekend, and it was the right call.",
    content: [
      "The old billing service had eleven undocumented dependencies and a comment that just said 'do not touch, ask Priya' — Priya left the company four years ago. A rewrite felt inevitable, but a big-bang cutover felt like a good way to ruin a quarter.",
      "So we ran both systems in parallel, routed a slice of traffic at a time, and diffed the outputs nightly for three months. Slower, yes. But we caught two silent rounding bugs that had been quietly costing us money since 2023, and nobody got paged at 2 a.m.",
      "Boring migrations are a feature, not a failure of ambition.",
    ],
    author: "J. Whitfield",
    date: "2026-07-19",
    custom: false,
  },
  {
    id: "seed-4",
    entryNo: 4,
    category: "life",
    title: "Learning to Cook for One",
    excerpt: "It turns out most recipes are written for a household that isn't mine, and that's fine.",
    content: [
      "For a long time I treated cooking for one as a lesser version of cooking for other people — smaller portions of the same ambition. Lately I've started treating it as its own thing entirely, with its own rules.",
      "One good pan. One sharp knife. Repeat meals on purpose instead of by accident. And the freezer isn't a failure of planning, it's a second, quieter kitchen that's always ready.",
      "The food's gotten better since I stopped apologizing for the size of the table.",
    ],
    author: "P. Andrade",
    date: "2026-07-26",
    custom: false,
  },
  {
    id: "seed-5",
    entryNo: 5,
    category: "field-notes",
    title: "The Corner Store at 6 A.M.",
    excerpt: "Every neighborhood has one hour when it tells the truth about itself.",
    content: [
      "By 8 a.m. the corner store is doing coffee-and-commute business, all elbows and card taps. But at six it's just the owner restocking the cooler, one regular reading a paper he didn't buy yet, and a cat that clearly runs the place.",
      "I started going early on purpose, not for the coffee, but for the ten minutes where the neighborhood isn't performing for anyone. That's usually when you find out what a place is actually like.",
    ],
    author: "M. Okafor",
    date: "2026-07-31",
    custom: false,
  },
  {
    id: "seed-6",
    entryNo: 6,
    category: "tech-log",
    title: "Why We Finally Turned Off the Old Cron Job",
    excerpt: "It had been running nightly since 2019. Nobody remembered exactly why, so it took a month to turn off safely.",
    content: [
      "The job ran at 3:10 a.m., took eleven minutes, and as far as anyone could tell, did nothing anyone relied on. That description turned out to be wrong in one very specific way, which is why it took a month instead of an afternoon.",
      "It was quietly regenerating a cache that one internal dashboard, used by exactly one team, depended on without knowing it. We found that out by turning it off in staging first and watching, patiently, for something to complain.",
      "Nothing in production is ever really 'probably fine to remove.' It's either fine, or it's a cache with no owner. Find out which before you touch it.",
    ],
    author: "J. Whitfield",
    date: "2026-08-04",
    custom: false,
  },
];

function categoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function readMins(content) {
  const words = content.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function entryLabel(n) {
  return `No. ${String(n).padStart(3, "0")}`;
}

/* ---------------- Sub-components ---------------- */

function StampMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="15.5" stroke={COLORS.parchment} strokeWidth="1.5" strokeDasharray="2.5 3" />
      <path
        d="M10 20.5C10 20.5 12 14 17 14C22 14 24 20.5 24 20.5"
        stroke={COLORS.parchment}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="17" cy="11.5" r="1.6" fill={COLORS.parchment} />
    </svg>
  );
}

function CategoryDot({ color, size = 8 }) {
  return (
    <span
      style={{ width: size, height: size, background: color, borderRadius: "50%", display: "inline-block", flexShrink: 0 }}
    />
  );
}

function MegaMenu({ posts, onPick, onClose }) {
  const latest = posts.slice().sort((a, b) => b.entryNo - a.entryNo)[0];
  return (
    <div
      className="absolute left-0 right-0 top-full mt-0 z-50"
      style={{ background: COLORS.paper, borderTop: `1px solid ${COLORS.ink}22` }}
      onMouseLeave={onClose}
    >
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: COLORS.inkSoft }}>
            Sort by category
          </p>
          <ul className="space-y-3">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    onPick(c.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 font-display text-lg hover:underline"
                  style={{ color: COLORS.ink }}
                >
                  <CategoryDot color={c.color} size={9} />
                  {c.label}
                  <span className="font-mono text-xs ml-1" style={{ color: COLORS.inkSoft }}>
                    ({posts.filter((p) => p.category === c.id).length})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: COLORS.inkSoft }}>
            Popular tags
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <span
                key={t}
                className="font-mono text-xs px-2 py-1 rounded-full"
                style={{ border: `1px solid ${COLORS.ink}33`, color: COLORS.inkSoft }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {latest && (
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: COLORS.inkSoft }}>
              Most recent dispatch
            </p>
            <button
              onClick={() => {
                onPick("all", latest);
                onClose();
              }}
              className="text-left block rounded-lg p-4 w-full transition hover:-translate-y-0.5"
              style={{ background: COLORS.parchment, border: `1px solid ${COLORS.ink}22` }}
            >
              <span className="font-mono text-xs" style={{ color: categoryMeta(latest.category).color }}>
                {categoryMeta(latest.category).label} · {entryLabel(latest.entryNo)}
              </span>
              <p className="font-display text-lg leading-snug mt-1" style={{ color: COLORS.ink }}>
                {latest.title}
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LogEntry({ post, onOpen, isLast }) {
  const meta = categoryMeta(post.category);
  return (
    <div className="relative pl-16 pb-10">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[23px] top-8 bottom-0 w-[2px]"
          style={{
            backgroundImage: `linear-gradient(${COLORS.ink}33 50%, transparent 0%)`,
            backgroundSize: "2px 10px",
            backgroundRepeat: "repeat-y",
          }}
        />
      )}
      <span
        aria-hidden="true"
        className="absolute left-3 top-1 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: meta.color, boxShadow: `0 0 0 4px ${COLORS.parchment}` }}
      />
      <button
        onClick={() => onOpen(post)}
        className="text-left w-full rounded-xl p-5 md:p-6 transition hover:-translate-y-0.5 hover:shadow-md"
        style={{ background: COLORS.paper, border: `1px solid ${COLORS.ink}1a` }}
      >
        <div className="flex flex-wrap items-center gap-3 mb-2 font-mono text-xs" style={{ color: COLORS.inkSoft }}>
          <span className="inline-flex items-center gap-1.5" style={{ color: meta.color }}>
            <CategoryDot color={meta.color} />
            {meta.label}
          </span>
          <span>{entryLabel(post.entryNo)}</span>
          <span>·</span>
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{readMins(post.content)} min read</span>
          {post.custom && (
            <span className="px-1.5 py-0.5 rounded" style={{ background: `${COLORS.red}1a`, color: COLORS.red }}>
              your dispatch
            </span>
          )}
        </div>
        <h3 className="font-display text-2xl md:text-[26px] leading-snug mb-1.5" style={{ color: COLORS.ink }}>
          {post.title}
        </h3>
        <p className="text-[15px] leading-relaxed mb-2" style={{ color: COLORS.inkSoft }}>
          {post.excerpt}
        </p>
        <span className="font-mono text-xs" style={{ color: meta.color }}>
          Read dispatch →
        </span>
      </button>
    </div>
  );
}

function ReadingView({ post, onBack, onDelete }) {
  const meta = categoryMeta(post.category);
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-8 hover:underline"
        style={{ color: COLORS.inkSoft }}
      >
        <ArrowLeft size={14} /> Back to the log
      </button>
      <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-xs" style={{ color: COLORS.inkSoft }}>
        <span className="inline-flex items-center gap-1.5" style={{ color: meta.color }}>
          <CategoryDot color={meta.color} />
          {meta.label}
        </span>
        <span>{entryLabel(post.entryNo)}</span>
        <span>·</span>
        <span>{formatDate(post.date)}</span>
        <span>·</span>
        <span>{readMins(post.content)} min read</span>
      </div>
      <h1 className="font-display text-4xl md:text-5xl leading-[1.08] mb-4" style={{ color: COLORS.ink }}>
        {post.title}
      </h1>
      <p className="font-mono text-xs uppercase tracking-widest mb-10" style={{ color: COLORS.inkSoft }}>
        Filed by {post.author}
      </p>
      <div className="space-y-5">
        {post.content.map((para, i) => (
          <p key={i} className="text-[17px] leading-[1.8]" style={{ color: COLORS.ink }}>
            {para}
          </p>
        ))}
      </div>

      {post.custom && (
        <button
          onClick={() => onDelete(post.id)}
          className="inline-flex items-center gap-2 font-mono text-xs mt-12 px-3 py-2 rounded-md hover:opacity-80"
          style={{ color: COLORS.red, border: `1px solid ${COLORS.red}44` }}
        >
          <Trash2 size={13} /> Retract this dispatch
        </button>
      )}

      <div className="mt-14 pt-6 font-mono text-xs" style={{ color: `${COLORS.inkSoft}99`, borderTop: `1px dashed ${COLORS.ink}33` }}>
        — EOF —
      </div>
    </div>
  );
}

function ComposerModal({ form, setForm, onSubmit, onClose }) {
  const firstFieldRef = useRef(null);
  useEffect(() => {
    firstFieldRef.current?.focus();
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto" style={{ background: `${COLORS.ink}b3` }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-2xl p-6 md:p-8 my-8"
        style={{ background: COLORS.paper, border: `1px solid ${COLORS.ink}22` }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: COLORS.inkSoft }}>
              New dispatch
            </p>
            <h2 className="font-display text-2xl" style={{ color: COLORS.ink }}>
              File a new entry
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-md hover:opacity-70">
            <X size={20} color={COLORS.ink} />
          </button>
        </div>

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: COLORS.inkSoft }}>
            Title
          </span>
          <input
            ref={firstFieldRef}
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="What are you filing today?"
            className="w-full mt-1.5 font-display text-xl bg-transparent outline-none pb-2"
            style={{ color: COLORS.ink, borderBottom: `1px solid ${COLORS.ink}33` }}
          />
        </label>

        <div className="mb-4">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: COLORS.inkSoft }}>
            Category
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-full transition"
                style={{
                  border: `1px solid ${form.category === c.id ? c.color : COLORS.ink + "33"}`,
                  background: form.category === c.id ? `${c.color}1a` : "transparent",
                  color: form.category === c.id ? c.color : COLORS.inkSoft,
                }}
              >
                <CategoryDot color={c.color} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: COLORS.inkSoft }}>
            Your name (optional)
          </span>
          <input
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            placeholder="Filed by…"
            className="w-full mt-1.5 font-mono text-sm bg-transparent outline-none pb-2"
            style={{ color: COLORS.ink, borderBottom: `1px solid ${COLORS.ink}33` }}
          />
        </label>

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: COLORS.inkSoft }}>
            Excerpt (optional)
          </span>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            placeholder="One line for the log view — leave blank to auto-generate"
            rows={2}
            className="w-full mt-1.5 text-sm bg-transparent outline-none resize-none pb-2"
            style={{ color: COLORS.ink, borderBottom: `1px solid ${COLORS.ink}33` }}
          />
        </label>

        <label className="block mb-6">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: COLORS.inkSoft }}>
            Content
          </span>
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Write it out. Leave a blank line between paragraphs."
            rows={7}
            className="w-full mt-1.5 text-[15px] leading-relaxed bg-transparent outline-none resize-none pb-2"
            style={{ color: COLORS.ink, borderBottom: `1px solid ${COLORS.ink}33` }}
          />
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2.5 rounded-md hover:opacity-70"
            style={{ color: COLORS.inkSoft }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="font-mono text-xs uppercase tracking-widest px-5 py-2.5 rounded-md text-white transition hover:opacity-90"
            style={{ background: COLORS.red }}
          >
            Publish dispatch
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Main app ---------------- */

export default function DispatchBlog() {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0].id, author: "", excerpt: "", content: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("dispatch-posts-v1");
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (Array.isArray(saved) && saved.length) setPosts(saved);
        }
      } catch (e) {
        // no saved dispatches yet — keep the seed log
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("dispatch-posts-v1", JSON.stringify(posts));
      } catch (e) {
        console.error("Could not save dispatches", e);
      }
    })();
  }, [posts, loaded]);

  const filtered = useMemo(() => {
    return posts
      .filter((p) => activeCategory === "all" || p.category === activeCategory)
      .filter((p) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.entryNo - a.entryNo);
  }, [posts, activeCategory, query]);

  const featured = useMemo(() => posts.slice().sort((a, b) => b.entryNo - a.entryNo)[0], [posts]);

  function openPost(post) {
    setSelectedPost(post);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function submitPost(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    const nextEntryNo = Math.max(0, ...posts.map((p) => p.entryNo)) + 1;
    const newPost = {
      id: `custom-${Date.now()}`,
      entryNo: nextEntryNo,
      category: form.category,
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || form.content.trim().slice(0, 130) + "…",
      content: form.content.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
      author: form.author.trim() || "Anonymous",
      date: new Date().toISOString().slice(0, 10),
      custom: true,
    };
    setPosts((prev) => [newPost, ...prev]);
    setForm({ title: "", category: CATEGORIES[0].id, author: "", excerpt: "", content: "" });
    setComposerOpen(false);
    setToast("Dispatch published to the log.");
    setTimeout(() => setToast(null), 2600);
  }

  function deletePost(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelectedPost(null);
    setToast("Dispatch retracted.");
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.parchment, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        ::selection { background: ${COLORS.red}; color: ${COLORS.paper}; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 relative" style={{ background: COLORS.ink }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => {
                setSelectedPost(null);
                setActiveCategory("all");
              }}
              className="flex items-center gap-2.5"
            >
              <StampMark />
              <span className="font-mono text-sm tracking-[0.2em] uppercase" style={{ color: COLORS.parchment }}>
                The Dispatch
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1 h-full">
              <button
                onClick={() => {
                  setSelectedPost(null);
                  setActiveCategory("all");
                }}
                className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md hover:opacity-80"
                style={{ color: COLORS.parchment }}
              >
                The Log
              </button>
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md hover:opacity-80 inline-flex items-center gap-1"
                  style={{ color: COLORS.parchment }}
                  aria-expanded={dropdownOpen}
                >
                  Categories <ChevronDown size={13} />
                </button>
              </div>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center rounded-full px-3 py-1.5" style={{ background: `${COLORS.parchment}14` }}>
                <Search size={14} color={COLORS.parchment} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the log…"
                  className="bg-transparent outline-none font-mono text-xs ml-2 w-32 focus:w-44 transition-all"
                  style={{ color: COLORS.parchment }}
                />
              </div>
              <button
                onClick={() => setComposerOpen(true)}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md transition hover:opacity-90"
                style={{ background: COLORS.red, color: COLORS.paper }}
              >
                <PenSquare size={13} /> New dispatch
              </button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
              {menuOpen ? <X color={COLORS.parchment} /> : <Menu color={COLORS.parchment} />}
            </button>
          </div>
        </div>

        {dropdownOpen && (
          <MegaMenu
            posts={posts}
            onPick={(catId, post) => {
              if (post) {
                openPost(post);
              } else {
                setSelectedPost(null);
                setActiveCategory(catId);
              }
            }}
            onClose={() => setDropdownOpen(false)}
          />
        )}

        {menuOpen && (
          <div className="md:hidden px-4 pb-5 pt-1 space-y-4" style={{ background: COLORS.ink }}>
            <div className="flex items-center rounded-full px-3 py-2" style={{ background: `${COLORS.parchment}14` }}>
              <Search size={14} color={COLORS.parchment} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the log…"
                className="bg-transparent outline-none font-mono text-xs ml-2 flex-1"
                style={{ color: COLORS.parchment }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSelectedPost(null);
                  setMenuOpen(false);
                }}
                className="font-mono text-xs px-3 py-1.5 rounded-full"
                style={{ border: `1px solid ${COLORS.parchment}44`, color: COLORS.parchment }}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setSelectedPost(null);
                    setMenuOpen(false);
                  }}
                  className="font-mono text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                  style={{ border: `1px solid ${COLORS.parchment}44`, color: COLORS.parchment }}
                >
                  <CategoryDot color={c.color} />
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setComposerOpen(true);
                setMenuOpen(false);
              }}
              className="w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-md"
              style={{ background: COLORS.red, color: COLORS.paper }}
            >
              <PenSquare size={13} /> New dispatch
            </button>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main>
        {selectedPost ? (
          <ReadingView post={selectedPost} onBack={() => setSelectedPost(null)} onDelete={deletePost} />
        ) : (
          <>
            {/* HERO */}
            <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-10 grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8 items-start">
              <div className="md:col-span-3">
                <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: COLORS.inkSoft }}>
                  A running log, filed as it happens
                </p>
                <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-6" style={{ color: COLORS.ink }}>
                  Dispatches from wherever the day takes us.
                </h1>
                <p className="text-[17px] leading-relaxed max-w-md mb-6" style={{ color: COLORS.inkSoft }}>
                  A blog, if you want the plain definition, is just a page that gets new writing added to it
                  regularly — stories, notes, and the odd piece of advice, filed in order and kept for later.
                  This one is filed like a mailroom ledger. Every post is an entry, numbered and dated, dropped
                  into the log below.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => document.getElementById("the-log")?.scrollIntoView({ behavior: "smooth" })}
                    className="font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-md text-white transition hover:opacity-90"
                    style={{ background: COLORS.ink }}
                  >
                    Start reading
                  </button>
                  <button
                    onClick={() => setComposerOpen(true)}
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-md transition hover:opacity-80"
                    style={{ border: `1px solid ${COLORS.ink}44`, color: COLORS.ink }}
                  >
                    <PenSquare size={13} /> File a dispatch
                  </button>
                </div>
              </div>

              {featured && (
                <button
                  onClick={() => openPost(featured)}
                  className="md:col-span-2 text-left rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: COLORS.paper, border: `1px solid ${COLORS.ink}22` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: COLORS.inkSoft }}>
                      Today's postmark
                    </span>
                    <span
                      className="font-mono text-[11px] px-2 py-1 rounded-full"
                      style={{ border: `1px dashed ${COLORS.ink}55`, color: COLORS.inkSoft }}
                    >
                      {formatDate(featured.date)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs mb-2" style={{ color: categoryMeta(featured.category).color }}>
                    <CategoryDot color={categoryMeta(featured.category).color} />
                    {categoryMeta(featured.category).label} · {entryLabel(featured.entryNo)}
                  </span>
                  <h2 className="font-display text-2xl leading-snug mb-2" style={{ color: COLORS.ink }}>
                    {featured.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.inkSoft }}>
                    {featured.excerpt}
                  </p>
                </button>
              )}
            </section>

            {/* FILTERS */}
            <section className="max-w-6xl mx-auto px-4 md:px-6 pb-2">
              <div className="flex flex-wrap items-center gap-2 py-4" style={{ borderTop: `1px solid ${COLORS.ink}22`, borderBottom: `1px solid ${COLORS.ink}22` }}>
                <span className="font-mono text-xs uppercase tracking-widest mr-2" style={{ color: COLORS.inkSoft }}>
                  Filter
                </span>
                <button
                  onClick={() => setActiveCategory("all")}
                  className="font-mono text-xs px-3 py-1.5 rounded-full transition"
                  style={{
                    background: activeCategory === "all" ? COLORS.ink : "transparent",
                    color: activeCategory === "all" ? COLORS.paper : COLORS.inkSoft,
                    border: `1px solid ${COLORS.ink}33`,
                  }}
                >
                  All entries
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className="font-mono text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition"
                    style={{
                      background: activeCategory === c.id ? `${c.color}1f` : "transparent",
                      color: activeCategory === c.id ? c.color : COLORS.inkSoft,
                      border: `1px solid ${activeCategory === c.id ? c.color : COLORS.ink + "33"}`,
                    }}
                  >
                    <CategoryDot color={c.color} />
                    {c.label}
                  </button>
                ))}
              </div>
            </section>

            {/* LOG */}
            <section id="the-log" className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-20">
              {filtered.length === 0 ? (
                <div
                  className="rounded-2xl p-10 text-center"
                  style={{ border: `1px dashed ${COLORS.ink}44`, color: COLORS.inkSoft }}
                >
                  <p className="font-display text-xl mb-2" style={{ color: COLORS.ink }}>
                    Nothing filed under that search.
                  </p>
                  <p className="text-sm mb-5">Try another word, or clear the filter to see the full log.</p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setActiveCategory("all");
                    }}
                    className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md"
                    style={{ border: `1px solid ${COLORS.ink}44`, color: COLORS.ink }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filtered.map((post, i) => (
                  <LogEntry key={post.id} post={post} onOpen={openPost} isLast={i === filtered.length - 1} />
                ))
              )}
            </section>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-4" style={{ background: COLORS.ink }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <StampMark />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: COLORS.parchment }}>
              The Dispatch — filed since 2026
            </span>
          </div>
          <p className="font-mono text-xs" style={{ color: `${COLORS.parchment}88` }}>
            {posts.length} entries logged
          </p>
        </div>
      </footer>

      {composerOpen && (
        <ComposerModal form={form} setForm={setForm} onSubmit={submitPost} onClose={() => setComposerOpen(false)} />
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] font-mono text-xs px-4 py-2.5 rounded-full shadow-lg"
          style={{ background: COLORS.ink, color: COLORS.parchment }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
