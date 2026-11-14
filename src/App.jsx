import { useEffect, useRef, useState } from "react";
import { motion, MotionConfig, useInView, animate } from "framer-motion";
import C from "./copy.js";

const L = C.links;
const wrap = "mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-10";
const ease = [0.2, 0.7, 0.2, 1];

/* ---------- small helpers ---------- */
const Html = ({ h, className = "", as: T = "span" }) => (
  <T className={className} dangerouslySetInnerHTML={{ __html: h }} />
);
const Lines = ({ lines, className = "" }) =>
  lines.map((l, i) => <Html key={i} h={l} className={"block " + className} />);

const Reveal = ({ children, delay = 0, className = "", y = 36 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.8, delay, ease }}
  >
    {children}
  </motion.div>
);

const Label = ({ children, className = "" }) => (
  <p className={"mb-5 text-[14px] font-bold uppercase tracking-[0.18em] text-gold " + className}>{children}</p>
);

const H2 = ({ lines, className = "" }) => (
  <h2 className={"text-[clamp(24px,4.4vw,58px)] font-extrabold leading-[1.25] tracking-[-0.03em] " + className}>
    <Lines lines={lines} />
  </h2>
);

function Counter({ to }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.8, ease, onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref} className="tabular-nums">{v.toLocaleString()}</span>;
}

function Marquee({ items, render, dur = 60, reverse = false }) {
  return (
    <div className="marquee-wrap overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
      <div className={`marquee flex w-max gap-5 pr-5 ${reverse ? "marquee-rev" : ""}`} style={{ "--dur": dur + "s" }}>
        {[...items, ...items].map((it, i) => render(it, i))}
      </div>
    </div>
  );
}

/* auto-scrolling row you can grab: mouse drag on PC, finger swipe on phones */
function DragMarquee({ items, render, speed = 0.45 }) {
  const ref = useRef(null);
  const st = useRef({ pos: 0, down: false, startX: 0, startPos: 0, moved: 0, hover: false, touch: false, touchTimer: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = st.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrapPos = () => {
      const half = el.scrollWidth / 2;
      if (half <= 0) return;
      if (s.pos >= half) s.pos -= half;
      if (s.pos < 1) s.pos += half;
    };
    let raf;
    const tick = () => {
      if (!s.touch) {
        if (!reduce && !s.down && !s.hover) s.pos += speed;
        wrapPos();
        el.scrollLeft = s.pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // phones: native swipe, keep our position in sync
    const onScroll = () => { if (s.touch) s.pos = el.scrollLeft; };
    const onTouchStart = () => { s.touch = true; clearTimeout(s.touchTimer); };
    const onTouchEnd = () => {
      clearTimeout(s.touchTimer);
      s.touchTimer = setTimeout(() => { s.pos = el.scrollLeft; wrapPos(); s.touch = false; }, 1600);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    // PC: mouse drag
    const onMove = (e) => {
      if (!s.down) return;
      const dx = e.clientX - s.startX;
      s.moved = Math.max(s.moved, Math.abs(dx));
      s.pos = s.startPos - dx;
      wrapPos();
      el.scrollLeft = s.pos;
    };
    const onUp = () => { s.down = false; el.classList.remove("cursor-grabbing"); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(s.touchTimer);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [speed]);

  const s = st.current;
  return (
    <div ref={ref}
      onMouseEnter={() => { s.hover = true; }}
      onMouseLeave={() => { s.hover = false; }}
      onMouseDown={(e) => { e.preventDefault(); s.down = true; s.moved = 0; s.startX = e.clientX; s.startPos = s.pos; ref.current.classList.add("cursor-grabbing"); }}
      onClickCapture={(e) => { if (s.moved > 6) { e.preventDefault(); e.stopPropagation(); } }}
      className="no-scrollbar cursor-grab overflow-x-auto select-none [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
      <div className="flex w-max gap-5 pr-5">
        {[...items, ...items].map((it, i) => render(it, i))}
      </div>
    </div>
  );
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[1em] w-[1em]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Arrow = () => <span aria-hidden="true">→</span>;

const btn = "inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-200 hover:-translate-y-0.5";
const btnGold = btn + " bg-gold text-ink hover:bg-gold-2 shadow-[0_10px_40px_-10px_rgba(255,197,61,.55)]";
const btnGhost = btn + " border border-white/25 text-white hover:border-gold hover:text-gold";
const btnSize = " h-14 px-7 text-[17px]";

/* ---------- header ---------- */
function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const items = [...C.nav, { label: C.navCta, href: "#contact" }];
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid || open ? "border-line bg-ink/85 backdrop-blur-xl" : "border-white/10 bg-transparent"
      }`}
    >
      <div className={wrap + " flex h-[72px] items-center justify-between"}>
        <a href="#top" className="group flex items-center gap-2.5 whitespace-nowrap sm:gap-3" aria-label={C.logo}>
          <img src={C.logoImg} alt="" width="40" height="40"
            className="h-9 w-9 shrink-0 rounded-full ring-1 ring-gold/40 transition-transform duration-500 group-hover:scale-105 sm:h-10 sm:w-10" />
          <span className="text-[15px] font-extrabold tracking-[-0.03em] text-white sm:text-[18px]"
            dangerouslySetInnerHTML={{ __html: C.logo.replace("마음을", '<span class="text-gold">마음을</span>') }} />
        </a>
        <nav className="hidden items-center gap-9 text-[15px] font-medium text-white/60 md:flex lg:gap-11">
          {C.nav.map((n) => (
            <a key={n.href} href={n.href} {...(n.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
              className="relative py-2 transition-colors hover:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100">
              {n.label}
            </a>
          ))}
          <a href="#contact" className="ml-2 rounded-full border border-white/20 px-5 py-2 text-[14px] font-semibold text-white transition hover:border-white hover:bg-white hover:text-ink">{C.navCta}</a>
        </nav>
        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <span className={`h-0.5 w-6 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-white transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="border-t border-line md:hidden">
          <div className={wrap + " flex flex-col py-2"}>
            {items.map((n) => (
              <a key={n.href + n.label} href={n.href} onClick={() => setOpen(false)} {...(n.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                 className="border-b border-line py-4 text-lg font-bold last:border-0">{n.label}</a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- 1. hero ---------- */
const TITLE_START = 0.25;   // 첫 줄 시작 (초)
const LINE_GAP = 0.38;      // 줄 사이 간격
const CHAR_GAP = 0.035;     // 글자 사이 간격
const SUB_START = 1.85;     // 환불 문장 시작

/* splits "<em>a</em> b" into segments, then words, then letters.
   Words stay unbreakable so Korean line wrapping still works on phones. */
function HeroLine({ html, start }) {
  const segs = [];
  html.split(/(<em>.*?<\/em>)/).forEach((p) => {
    if (!p) return;
    const m = p.match(/^<em>(.*)<\/em>$/);
    segs.push({ text: m ? m[1] : p, em: !!m });
  });
  let n = 0;
  return (
    <span className="block pb-1" aria-hidden="true">
      {segs.map((s, si) =>
        s.text.split(/(\s+)/).map((w, wi) => {
          if (!w) return null;
          if (/^\s+$/.test(w)) return <span key={si + "-" + wi}> </span>;
          return (
            <span key={si + "-" + wi} className={"inline-block whitespace-nowrap " + (s.em ? "text-gold" : "")}>
              {[...w].map((ch, ci) => {
                const d = start + n++ * CHAR_GAP;
                return (
                  <motion.span key={ci} className="inline-block"
                    initial={{ opacity: 0, y: "0.45em", filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: d, duration: 0.65, ease }}>
                    {ch}
                  </motion.span>
                );
              })}
            </span>
          );
        })
      )}
    </span>
  );
}

function Hero() {
  const H = C.hero;
  const fade = (d) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.7, ease } });
  return (
    <section id="top" className="grain relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(800px_600px_at_78%_50%,rgba(255,255,255,.045),transparent_62%),radial-gradient(700px_500px_at_8%_25%,rgba(40,110,170,.14),transparent_60%)]" />

      <div className={wrap + " relative z-10 grid min-h-[100svh] content-center items-center gap-6 pb-20 pt-[96px] sm:gap-14 sm:pb-24 sm:pt-[112px] lg:grid-cols-[1.2fr_0.8fr] lg:content-normal lg:gap-10"}>
        {/* text */}
        <div>
          <h1 aria-label={H.title.map((l) => l.replace(/<[^>]+>/g, "")).join(" ")}
            className="text-[clamp(29px,4.3vw,62px)] font-extrabold leading-[1.4] tracking-[-0.04em]">
            {H.title.map((l, i) => (
              <HeroLine key={i} html={l} start={TITLE_START + i * LINE_GAP} />
            ))}
          </h1>

          {/* gold rule draws in after the title lands */}
          <motion.span aria-hidden="true" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: SUB_START - 0.25, duration: 0.7, ease }}
            className="mt-9 block h-[3px] w-20 origin-left rounded-full bg-gold" />

          <div className="mt-7 text-[clamp(16px,1.6vw,22px)] leading-[1.7]">
            <motion.p initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: SUB_START, duration: 0.7, ease }} className="text-white/80">
              {H.sub[0]}
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: SUB_START + 0.45, duration: 0.7, ease }} className="font-bold text-white">
              {H.sub[1]}
              {/* refund words: red, fades in a beat later */}
              <motion.span initial={{ color: "#ffffff" }} animate={{ color: "#ff5c5c" }}
                transition={{ delay: SUB_START + 0.95, duration: 0.6 }}
                className="font-extrabold">{H.subMark}</motion.span>
            </motion.p>
          </div>
        </div>

        {/* photo card — lives in the same grid as the text, so it never drifts */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1, ease }}
          className="relative order-first mx-auto w-full max-w-[74vw] sm:max-w-[460px] lg:order-none lg:max-w-[540px] lg:justify-self-end">
          {/* warm glow behind the artwork */}
          <span className="absolute inset-[14%] rounded-full bg-gold/[0.10] blur-3xl" aria-hidden="true" />
          {/* mood artwork: its black edges dissolve into the page */}
          <div className="relative aspect-square [mask-image:radial-gradient(circle_closest-side_at_50%_48%,#000_91%,transparent_100%)]">
            <img src={H.art} alt="그 사람의 속마음을 들여다보는 장면" className="h-full w-full object-cover" />
          </div>

        </motion.div>
      </div>

    </section>
  );
}

/* ---------- 1-1. proof numbers ---------- */
function EvidenceCard({ kind, img, onZoom, caption, sub }) {
  return (
    <figure className="flex flex-col">
      <button type="button" onClick={() => onZoom(img)}
        className="group relative block overflow-hidden rounded-2xl bg-white text-left shadow-[0_30px_80px_-24px_rgba(0,0,0,.85)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1">
        {kind === "kmong" ? (
          <span className="flex items-center justify-between border-b border-black/5 bg-[#f7f7f9] px-5 py-3">
            <span className="text-[13px] font-extrabold text-[#222]">크몽 · 서비스 후기</span>
            <span className="text-[13px] font-bold text-[#f5a623]">★★★★★ <span className="text-[#222]">5.0</span></span>
          </span>
        ) : (
          <span className="flex items-center gap-2 bg-[#eceef1] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-[#667]">cafe.naver.com · 상담후기 게시판</span>
          </span>
        )}
        <span className="relative block h-[clamp(320px,34vw,460px)] overflow-hidden">
          <img src={img} alt={caption} loading="lazy" className="w-full object-cover object-top transition duration-700 group-hover:scale-[1.02]" />
          <span className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-white via-white/80 to-transparent" />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/85 px-4 py-2 text-[13px] font-bold text-white">원본 크게 보기 ⤢</span>
        </span>
      </button>
      <figcaption className="mt-5 text-left">
        <p className="flex items-center gap-2 text-[17px] font-extrabold"><span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-[12px] text-ink">✓</span>{caption}</p>
        <p className="mt-1 pl-8 text-[15px] text-mute">{sub}</p>
      </figcaption>
    </figure>
  );
}

function Proof({ onZoom }) {
  const P = C.proof, K = C.cafe;
  return (
    <section id="cafe" className="relative overflow-hidden bg-navy py-[clamp(79px,14vw,180px)]">
      <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_50%_20%,rgba(255,197,61,.09),transparent_70%)]" />
      <div className={wrap + " relative"}>
        <div className="text-center">
          <Reveal><H2 lines={P.title} /></Reveal>
          <div className="mx-auto mt-14 grid max-w-[760px] grid-cols-2 divide-x divide-white/15">
            {P.stats.map((s, i) => (
              <Reveal key={s.label} delay={0.15 + i * 0.1} className="px-4">
                <p className="text-[clamp(30px,7.4vw,104px)] font-extrabold leading-none tracking-[-0.045em] text-gold">
                  <Counter to={s.num} />{s.suffix}
                </p>
                <p className="mt-4 text-[clamp(15px,1.6vw,20px)] font-bold text-white/85">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-16 grid max-w-[1040px] gap-10 md:grid-cols-2 md:gap-8">
          <Reveal delay={0.1}>
            <EvidenceCard kind="kmong" img={C.cafe.kmong.img} onZoom={onZoom} caption={P.evidence[0].caption} sub={P.evidence[0].sub} />
          </Reveal>
          <Reveal delay={0.2}>
            <EvidenceCard kind="cafe" img={C.cafe.listImg} onZoom={onZoom} caption={P.evidence[1].caption} sub={P.evidence[1].sub} />
          </Reveal>
        </div>

        {/* cafe long-form reviews */}
        <div className="mx-auto mt-28 max-w-[1040px]">
          <Reveal className="text-center">
            <h3 className="text-[clamp(21px,3.2vw,40px)] font-extrabold leading-[1.3] tracking-[-0.03em]"><Lines lines={K.title} /></h3>
          </Reveal>
          <ul className="mx-auto mt-10 max-w-[860px] overflow-hidden rounded-2xl border border-line bg-ink/40">
            {K.items.map((c, i) => (
              <Reveal key={i} delay={i * 0.05} y={16}>
                <li className="border-b border-line last:border-b-0">
                  <a href={c.href} target="_blank" rel="noopener"
                    className="group flex h-[68px] items-center gap-4 px-5 transition hover:bg-white/[0.03] sm:gap-5 sm:px-7">
                    <span className="hidden shrink-0 rounded-full bg-gold/12 px-3 py-1 text-[12px] font-bold text-gold sm:inline">{c.tag}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-[-0.02em] sm:text-[18px]">{c.title}</span>
                    <span className="shrink-0 text-mute transition group-hover:translate-x-1 group-hover:text-gold"><Arrow /></span>
                  </a>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mx-auto mt-6 max-w-[860px]">
            <div className="flex flex-col items-center gap-7 rounded-2xl border border-dashed border-white/20 px-6 py-9 text-center sm:px-9">
              <p className="text-[clamp(17px,2.2vw,27px)] font-bold leading-[1.5]"><Lines lines={K.more} /></p>
              <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                <a href={L.cafeReviews} target="_blank" rel="noopener" className={btnGhost + " h-12 px-6 text-[16px]"}>{K.moreCta} <Arrow /></a>
                <a href={L.kmong} target="_blank" rel="noopener" className={btnGhost + " h-12 px-6 text-[16px]"}>{K.kmong.cta} <Arrow /></a>
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}

/* ---------- 1-2. reactions: kakao captures + view cards ---------- */
function Views({ onZoom }) {
  const V = C.views, K = C.kakao;
  return (
    <section id="kakao" className="py-[clamp(72px,12vw,160px)]">
      <div className={wrap + " text-center"}>
        <Reveal delay={0.05}>
          <p className="text-[clamp(16px,1.9vw,24px)] font-medium tracking-[0.02em] text-white/50">{V.title[0]}</p>
          <span className="mx-auto mt-6 block h-8 w-px bg-white/20" aria-hidden="true" />
          <h2 className="mt-6 text-[clamp(27px,5vw,66px)] font-extrabold leading-[1.2] tracking-[-0.04em]"
            dangerouslySetInnerHTML={{ __html: V.title[1] }} />
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-16">
        <DragMarquee items={K.items} render={(k, i) => (
          <button key={i} type="button" onClick={() => onZoom(k.img)}
            className="group w-[230px] shrink-0 overflow-hidden rounded-[22px] bg-panel text-left ring-1 ring-white/10 transition hover:-translate-y-1.5 sm:w-[270px]">
            <span className="block aspect-[9/13] overflow-hidden">
              <img src={k.img} alt={k.quote} loading="lazy" draggable={false} className="pointer-events-none h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
            </span>
          </button>
        )} />
      </Reveal>

    </section>
  );
}

/* ---------- 2. what I read ---------- */
/* radial map: "그 사람의 속마음" in the centre, the six readings around it */
function MindMap({ labels, active }) {
  const count = labels.length;
  const cx = 200, cy = 200, R = 150, inner = 74;
  const nodes = Array.from({ length: count }, (_, i) => {
    const a = (-90 + i * (360 / count)) * (Math.PI / 180);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), lx: cx + inner * Math.cos(a), ly: cy + inner * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full" role="img" aria-label="상대의 속마음을 둘러싼 여섯 가지 마음">
      <circle cx={cx} cy={cy} r="188" fill="none" stroke="rgba(255,255,255,.06)" />
      <g className="spin-slow">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,197,61,.28)" strokeDasharray="2 7" />
      </g>
      <circle cx={cx} cy={cy} r="112" fill="none" stroke="rgba(255,255,255,.05)" />

      {nodes.map((n, i) => (
        <line key={"l" + i} x1={n.lx} y1={n.ly} x2={n.x} y2={n.y}
          stroke={active === i ? "rgba(255,197,61,.8)" : "rgba(255,255,255,.1)"} strokeWidth={active === i ? 1.5 : 1}
          style={{ transition: "stroke .2s" }} />
      ))}

      <circle cx={cx} cy={cy} r={inner} fill="rgba(255,197,61,.06)" stroke="rgba(255,197,61,.35)" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13" fontWeight="600">그 사람의</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#fff" fontSize="23" fontWeight="800">속마음</text>

      {nodes.map((n, i) => {
        const on = active === i;
        return (
          <g key={"n" + i}>
            <circle cx={n.x} cy={n.y} r="40" fill="rgba(255,197,61,.16)" style={{ opacity: on ? 1 : 0, transition: "opacity .2s" }} />
            <circle cx={n.x} cy={n.y} r="31" fill={on ? "#ffc53d" : "#0f2233"} stroke={on ? "#ffc53d" : "rgba(255,255,255,.18)"}
              style={{ transition: "fill .2s, stroke .2s" }} />
            <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize={labels[i].length > 3 ? 11.5 : 13} fontWeight="800" letterSpacing="-0.3"
              fill={on ? "#05080f" : "rgba(255,255,255,.7)"} style={{ transition: "fill .2s" }}>
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Read() {
  const R = C.read;
  const [node, setNode] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNode((n) => (n + 1) % R.nodes.length), 700);
    return () => clearInterval(t);
  }, [R.nodes.length]);
  return (
    <section id="read" className="py-[clamp(72px,12vw,160px)]">
      <Reveal className={wrap}>
        <h2 className="whitespace-nowrap text-center text-[clamp(20px,4.6vw,62px)] font-extrabold leading-[1.25] tracking-[-0.035em]"
          dangerouslySetInnerHTML={{ __html: R.title }} />
        <span className="mx-auto mt-8 block h-[3px] w-14 rounded-full bg-gold" aria-hidden="true" />
      </Reveal>
      <div className={wrap + " mt-14 grid items-center gap-12 lg:mt-24 lg:grid-cols-[1fr_1.15fr] lg:gap-16"}>
        <div>
          <Reveal delay={0.15}>
            <div className="mx-auto w-full max-w-[340px] lg:max-w-[440px]">
              <MindMap labels={R.nodes} active={node} />
            </div>
          </Reveal>
        </div>
        <ol>
          {R.items.map((t, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <li className="group flex cursor-default items-baseline gap-6 border-b border-line py-5 first:border-t sm:gap-8 sm:py-6">
                <span className="w-10 shrink-0 text-[17px] font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[clamp(16px,1.6vw,23px)] font-medium tracking-[-0.02em] text-white/70 transition duration-300 group-hover:translate-x-2 group-hover:font-bold group-hover:text-white">{t}</span>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- 3. statement ---------- */
function Waste() {
  const W = C.waste;
  return (
    <section className="relative overflow-hidden bg-navy py-[clamp(94px,16vw,220px)] text-center">
      <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_60%,rgba(255,197,61,.07),transparent_70%)]" />
      <div className={wrap + " relative"}>
        <Reveal><p className="text-[clamp(17px,2vw,26px)] font-semibold text-mute">{W.small}</p></Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-[clamp(34px,7vw,100px)] font-extrabold leading-[1.15] tracking-[-0.04em]"><Lines lines={W.big} /></h2>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 4. refund ---------- */
function Refund() {
  const R = C.refund;
  return (
    <section id="refund" className="py-[clamp(72px,12vw,160px)]">
      <div className={wrap + " text-center"}>
        <Reveal>
          <div className="mb-9 flex flex-col items-center">
            <span className="pl-[0.4em] text-[clamp(15px,1.7vw,21px)] font-bold tracking-[0.4em] text-gold">{R.label}</span>
            <span className="mt-4 h-px w-10 bg-gold/70" aria-hidden="true" />
          </div>
          <H2 lines={R.title} />
        </Reveal>
        {/* two equal steps in soft boxes, joined by a thin line */}
        <Reveal className="mx-auto mt-14 max-w-[640px] sm:mt-16">
          {R.steps.map((st, i) => (
            <div key={st.n}>
              {i > 0 && (
                <div className="flex justify-center" aria-hidden="true">
                  <span className="h-10 w-px bg-linear-to-b from-white/15 to-gold/50 sm:h-12" />
                </div>
              )}
              <div className={"relative rounded-2xl border px-5 pb-8 pt-9 text-center sm:px-10 sm:pb-10 sm:pt-11 " +
                (i === R.steps.length - 1 ? "border-gold/25 bg-gold/[0.035]" : "border-white/10 bg-white/[0.025]")}>
                <span className={"absolute left-1/2 top-0 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-ink text-[11px] font-bold " +
                  (i === R.steps.length - 1 ? "border-gold/50 text-gold" : "border-white/20 text-white/70")}>{st.n}</span>
                {/* lighter two-level type so the steps read differently from the heavy H2 above */}
                <p className="text-[clamp(14px,1.5vw,17px)] font-medium tracking-[-0.01em] text-white/55"
                  dangerouslySetInnerHTML={{ __html: st.lines[0] }} />
                <p className="mt-2 text-[clamp(20px,2.6vw,28px)] font-semibold leading-[1.35] tracking-[-0.02em] text-white/90 [&_em]:font-bold"
                  dangerouslySetInnerHTML={{ __html: st.lines[1] }} />
                {st.note && <p className="mt-3 text-[12px] text-white/40 sm:text-[13px]">{st.note}</p>}
              </div>
            </div>
          ))}
        </Reveal>

        {/* the worry as a quiet question, then a calm answer */}
        <div className="mx-auto mt-20 max-w-[960px] sm:mt-32">
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease }}
            className="text-[clamp(16px,2vw,22px)] font-medium tracking-[-0.01em] text-white/55">{R.footer[0]}</motion.p>
          <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ delay: 0.6, duration: 0.8, ease }}
            className="mt-4 sm:mt-5 text-[clamp(26px,3.8vw,46px)] font-semibold leading-[1.3] tracking-[-0.025em] text-white/90"
            dangerouslySetInnerHTML={{ __html: R.footer[1] }} />
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. fields + stats ---------- */
function Fields() {
  const F = C.fields;
  return (
    <section className="bg-navy py-[clamp(72px,12vw,160px)]">
      <div className={wrap}>
        <Reveal><H2 lines={F.title} className="text-center" /></Reveal>
        <div className="mx-auto mt-10 grid max-w-[1000px] grid-cols-2 gap-2 sm:mt-12 sm:gap-3 lg:grid-cols-3">
          {F.items.map((f, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} y={14}>
              <div className="group flex h-full items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:gap-3 sm:px-5 transition hover:border-gold/40">
                <span className="mt-[3px] text-[12px] font-bold text-gold/80">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-extrabold tracking-tight sm:text-[17px]">{f.name}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-white/50 sm:text-[14px]">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal><p className="mt-6 text-center text-[13px] text-white/45 sm:text-[14px]">🔒 {F.note}</p></Reveal>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-line py-[clamp(50px,9vw,110px)]">
      <div className={wrap + " grid gap-10 text-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line"}>
        {C.stats.map((s) => (
          <Reveal key={s.label}>
            <p className="text-[clamp(42px,6.4vw,92px)] font-extrabold leading-none tracking-[-0.04em] text-gold"><Counter to={s.num} />{s.suffix}</p>
            <p className="mt-3 text-[clamp(15px,1.5vw,19px)] font-semibold text-mute">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 9. compare ---------- */
function Compare() {
  const P = C.compare;
  return (
    <section className="py-[clamp(72px,12vw,160px)]">
      <div className={wrap}>
        <Reveal className="text-center">
          <h2 className="text-[clamp(22px,4.4vw,58px)] font-extrabold leading-[1.25] tracking-[-0.03em] sm:whitespace-nowrap"
            dangerouslySetInnerHTML={{ __html: P.title.join(" ") }} />
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-[900px] gap-3 sm:mt-12 md:grid-cols-2 md:gap-4">
          <Reveal>
            <div className="h-full rounded-2xl border border-line bg-ink/50 px-5 py-5 sm:px-7 sm:py-6">
              <h3 className="border-b border-line pb-3 text-[15px] font-bold text-mute sm:text-[16px]">{P.othersName}</h3>
              <ul>{P.others.map((t) => (
                <li key={t} className="flex items-center gap-3 border-b border-line py-3 text-[clamp(14px,1.35vw,17px)] font-semibold text-mute last:border-0 last:pb-0">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-bad/15 text-[10px] font-extrabold text-bad">✕</span>{t}
                </li>))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-gold/50 bg-[linear-gradient(160deg,rgba(255,197,61,.13),rgba(15,34,51,.9)_55%)] px-5 py-5 shadow-[0_0_70px_-30px_rgba(255,197,61,.45)] sm:px-7 sm:py-6">
              <h3 className="flex items-center gap-2 border-b border-gold/25 pb-3 text-[15px] font-extrabold text-gold sm:text-[16px]">{P.mineName}</h3>
              <ul>{P.mine.map((t) => (
                <li key={t} className="flex items-center gap-3 border-b border-white/10 py-3 text-[clamp(14px,1.35vw,17px)] font-bold last:border-0 last:pb-0">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-[10px] font-extrabold text-ink">✓</span>{t}
                </li>))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- 10. versus ---------- */
function Versus() {
  const V = C.versus;
  return (
    <section className="bg-navy py-[clamp(72px,12vw,160px)]">
      <div className={wrap + " text-center"}>
        <Reveal><H2 lines={V.title} /></Reveal>
        {/* before -> after, three rows inside one frame */}
        <Reveal className="mx-auto mt-10 max-w-[860px] sm:mt-12">
          <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {V.pairs.map((p, i) => (
              <div key={i} className="grid items-center gap-1.5 px-5 py-5 text-center md:grid-cols-[1fr_auto_1fr] md:gap-6 md:px-8 md:py-6">
                <p className="text-[clamp(14px,1.5vw,18px)] font-medium text-white/45 md:text-right">{p[0]}</p>
                <span className="text-[15px] font-bold text-gold md:text-[18px]" aria-hidden="true"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></span>
                <p className="flex items-center justify-center gap-2 text-[clamp(15px,1.6vw,19px)] font-extrabold md:justify-start">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-[10px] font-black text-ink" aria-hidden="true">✓</span>{p[1]}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 11. profile ---------- */
function Profile() {
  const P = C.profile;
  return (
    <section id="profile" className="light bg-[#f3eee5] py-[clamp(72px,12vw,160px)] text-[#14131c]">
      <div className={wrap + " grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20"}>
        <Reveal>
          <div className="relative mx-auto max-w-[460px]">
            <span className="absolute -inset-3 rounded-[34px] border border-[#c49a3c]/50" aria-hidden="true" />
            <img src={P.photo} alt={P.name} className="relative aspect-[4/5] w-full rounded-[28px] object-cover object-top shadow-[0_40px_80px_-30px_rgba(20,19,28,.45)]" />
          </div>
        </Reveal>
        <div>
          <Reveal>
            <blockquote className="border-l-4 border-[#c49a3c] pl-5 text-[clamp(20px,2.4vw,30px)] font-extrabold leading-snug tracking-[-0.02em]">“{P.quote}”</blockquote>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-10 border-t border-black/10">
              {P.timeline.map((t) => (
                <li key={t.text} className="flex items-center gap-3 whitespace-nowrap border-b border-black/10 py-[15px] text-[clamp(12.5px,3.55vw,17px)] font-medium text-[#3d3a47] sm:gap-4 sm:py-[18px]">
                  <span className="h-[6px] w-[6px] shrink-0 rotate-45 bg-[#c49a3c]" aria-hidden="true" />
                  <span>
                    {t.text.split(t.hi).map((part, i, arr) => (
                      <span key={i}>{part}{i < arr.length - 1 && <b className="font-extrabold text-[#a8730f]">{t.hi}</b>}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-12 flex flex-col gap-2.5">
              {[{ href: L.mission, t: P.cta }, { href: L.damage, t: P.cta2 }].map((r) => (
                <a key={r.t} href={r.href} target="_blank" rel="noopener"
                  className="group flex h-[68px] items-center justify-between gap-4 rounded-2xl bg-[#14131c] pl-5 pr-3 text-white transition duration-300 hover:bg-black sm:pl-7">
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="hidden shrink-0 text-[12px] font-bold tracking-[0.18em] text-gold/80 sm:inline">읽어보기</span>
                    <span className="hidden h-4 w-px shrink-0 bg-white/15 sm:inline-block" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap text-[15px] font-bold tracking-[-0.02em] sm:text-[17px]">{r.t}</span>
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[16px] text-white/60 transition group-hover:bg-gold group-hover:text-ink" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- 12. refuse ---------- */
function Refuse() {
  const X = C.refuse;
  return (
    <section className="bg-black py-[clamp(72px,12vw,160px)] text-center">
      <div className={wrap}>
        <Reveal><p className="inline-block rounded-full border border-bad/40 px-5 py-2 text-[15px] font-extrabold tracking-[0.1em] text-bad">⚠ {X.label}</p></Reveal>
        <Reveal delay={0.05}><h2 className="mt-7 text-[clamp(34px,6.4vw,88px)] font-extrabold tracking-[-0.04em]">{X.title}</h2></Reveal>
        <Reveal delay={0.1}><p className="mt-6 text-[clamp(18px,2.3vw,29px)] font-bold leading-[1.5] text-white/85"><Lines lines={X.desc} /></p></Reveal>
        <Reveal delay={0.15}><p className="mt-12 text-mute">{X.sub}</p></Reveal>
        <ol className="mx-auto mt-7 flex max-w-[720px] flex-col gap-3 text-left">
          {X.items.map((t, i) => (
            <Reveal key={i} delay={0.15 + i * 0.07}>
              <li className="flex items-center gap-5 rounded-2xl border border-line bg-white/[0.02] px-6 py-5 text-[clamp(15px,1.7vw,20px)] font-bold">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bad/15 font-extrabold text-bad">{i + 1}</span>{t}
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- 13. contact ---------- */
function Contact() {
  const Z = C.final;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(C.kakaoId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  return (
    <section id="contact" className="relative overflow-hidden py-[clamp(79px,13vw,170px)] text-center">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_0%,rgba(255,197,61,.07),transparent_65%)]" />
      <div className={wrap + " relative"}>
        <Reveal><h2 className="text-[clamp(34px,6.4vw,88px)] font-extrabold leading-[1.15] tracking-[-0.04em]"><Lines lines={Z.title} /></h2></Reveal>
        <Reveal delay={0.15}>
          {/* two contact routes, framed by hairlines and split by a divider */}
          <div className="mx-auto mt-12 grid max-w-[760px] border-y border-white/10 sm:mt-16 sm:grid-cols-2">
            <div className="flex flex-col items-center px-4 py-9 sm:py-11">
              <a href={L.kakao} onClick={openKakao}
                className="group inline-flex h-[52px] items-center gap-3 rounded-full border border-gold/60 px-9 text-[15px] font-semibold tracking-[-0.01em] text-gold transition duration-300 hover:bg-gold hover:text-ink sm:h-14 sm:text-[16px]">
                {Z.cta}
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
              </a>
              <div className="mt-5 flex items-center gap-2.5 text-[13px] sm:text-[14px]">
                <span className="text-white/40">카카오톡 ID</span>
                <button type="button" onClick={copy} title="ID 복사"
                  className="group inline-flex items-center gap-1.5 font-semibold tracking-[0.02em] text-white/80 transition hover:text-white">
                  {C.kakaoId}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
                    className="text-white/35 transition group-hover:text-gold">
                    {copied ? <path d="M5 12l5 5L20 7" /> : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>}
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-t border-white/10 px-4 py-9 sm:border-l sm:border-t-0 sm:py-11">
              <a href={L.cafe} target="_blank" rel="noopener"
                className="group inline-flex items-center gap-3 text-[15px] text-white/55 transition hover:text-white sm:text-[16px]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#03c75a] text-[12px] font-black text-white" aria-hidden="true">N</span>
                <span className="flex flex-col items-start leading-snug">
                  <span className="text-[13px] text-white/45 sm:text-[14px]">{Z.cafeLead}</span>
                  <span className="font-bold text-white/85 underline decoration-white/25 underline-offset-[6px] transition group-hover:decoration-[#03c75a]">{Z.cafeMain}</span>
                </span>
                <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line pb-32 pt-12 text-sm text-white/40 md:pb-12">
      <div className={wrap + " flex flex-col gap-4"}>
        <p className="flex items-center gap-2 text-base font-bold text-white/60">{C.brand}</p>
        <p className="flex flex-col gap-1 leading-relaxed sm:flex-row sm:flex-wrap sm:gap-x-5">{C.footer.rows.map((r) => <span key={r}>{r}</span>)}</p>
        <p>{C.footer.copyright}</p>
      </div>
    </footer>
  );
}

/* floating consult button: appears after the hero, follows the scroll */
function FloatingCta() {
  // always visible: slides in shortly after the page opens and stays to the end
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <a href={L.kakao} onClick={openKakao} aria-label={C.mobileBar}
      className={`fixed bottom-4 right-4 z-40 flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-ink/85 pl-[5px] pr-3 text-[11px] font-semibold text-white/90 shadow-[0_12px_32px_-8px_rgba(0,0,0,.8)] backdrop-blur-xl transition duration-500 hover:border-white/30 hover:text-white sm:bottom-6 sm:right-6 sm:h-10 sm:pr-4 sm:text-[12px] ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}>
      <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-kakao text-[7px] font-black text-ink sm:h-[29px] sm:w-[29px] sm:text-[7.5px]" aria-hidden="true">TALK</span>
      {C.mobileBar}
    </a>
  );
}

/* Kakao consult: phones follow the friend-add link; PCs get a QR window instead */
const isDesktop = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 768;
function openKakao(e) {
  if (!isDesktop()) return; // phone: let the link open KakaoTalk
  e.preventDefault();
  window.dispatchEvent(new CustomEvent("open-kakao"));
}

function KakaoModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    const key = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("open-kakao", on);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("open-kakao", on); window.removeEventListener("keydown", key); };
  }, []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(C.kakaoId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-5 backdrop-blur-sm" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="카카오톡 상담 문의">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[380px] rounded-[28px] border border-white/10 bg-[#0d1726] p-8 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,.9)]">
        <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-3 text-3xl leading-none text-white/40 transition hover:text-white" aria-label="닫기">×</button>
        <p className="text-[13px] font-bold tracking-[0.2em] text-gold">카카오톡 상담</p>
        <p className="mt-3 text-[20px] font-extrabold tracking-tight">폰 카메라로 찍으면<br />바로 친구추가돼요</p>
        <img src={C.links.kakaoQr} alt="카카오톡 친구추가 QR 코드" className="mx-auto mt-6 w-[220px] rounded-2xl bg-white" />
        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="text-[13px] text-white/45">카카오톡 ID</span>
          <span className="text-[18px] font-extrabold">{C.kakaoId}</span>
          <button type="button" onClick={copy} className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-bold text-white/70 transition hover:border-white/40 hover:text-white">{copied ? "복사됨" : "복사"}</button>
        </div>
      </motion.div>
    </div>
  );
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-5" onClick={onClose} role="dialog" aria-modal="true">
      <img src={src} alt="" className="max-h-[92vh] max-w-[94vw] rounded-xl" />
      <button type="button" className="absolute right-5 top-4 text-4xl text-white" aria-label="닫기">×</button>
    </div>
  );
}

export default function App() {
  const [zoom, setZoom] = useState(null);
  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        <Hero />
        <Read />
        <Waste />
        <Refund />
        <Proof onZoom={setZoom} />
        <Views onZoom={setZoom} />
        <Fields />
        <Compare />
        <Versus />
        <Profile />
        <Refuse />
        <Contact />
      </main>
      <Footer />
      <FloatingCta />
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
      <KakaoModal />
    </MotionConfig>
  );
}
