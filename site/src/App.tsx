import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from "motion/react"
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern"
import { Ripple } from "@/components/magicui/ripple"
import { BlurFade } from "@/components/magicui/blur-fade"
import { BorderBeam } from "@/components/magicui/border-beam"
import { Marquee } from "@/components/magicui/marquee"
import { NumberTicker } from "@/components/magicui/number-ticker"
import { cn } from "@/lib/utils"
import { faq } from "./faq"
import { focus, offers, projects, stats, statement, topics } from "./content"

const serif = "font-serif italic font-normal text-accent"
const eyebrow = "mb-7 flex items-center gap-3.5 text-[13px] uppercase tracking-[.16em] text-mute before:h-px before:w-7 before:bg-accent"
const pad = "px-[clamp(20px,4vw,64px)]"
const sectionCls = `${pad} pt-[clamp(80px,14vw,200px)]`

function Btn({ href, children, ghost, ...rest }: { href: string; children: React.ReactNode; ghost?: boolean } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      {...rest}
      className={cn(
        "group inline-flex min-h-11 items-center gap-4 rounded-full py-[18px] pl-[30px] pr-[18px] font-medium transition-transform duration-300 hover:-translate-y-0.5",
        ghost ? "border border-line text-fg" : "bg-accent text-bg",
      )}
    >
      <span>{children}</span>
      <b className={cn("grid size-[38px] place-items-center rounded-full font-normal transition-transform duration-500 group-hover:-rotate-45", ghost ? "bg-fg text-bg" : "bg-bg text-fg")}>→</b>
    </a>
  )
}

function SectionHead({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-[clamp(40px,6vw,88px)] grid gap-6">
      <BlurFade inView><p className={eyebrow}>{label}</p></BlurFade>
      <BlurFade inView delay={0.08}>
        <h2 className="max-w-[14ch] text-[clamp(40px,7vw,112px)] font-normal leading-[.98] tracking-[-.025em]">{children}</h2>
      </BlurFade>
      {sub && <BlurFade inView delay={0.16}><p className="max-w-[46ch] text-[clamp(17px,1.5vw,21px)] text-[#cfcac0]">{sub}</p></BlurFade>}
    </div>
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("")
  const links = [["strategie", "Strategie"], ["beratung", "Beratung"], ["projekte", "Projekte"], ["vita", "Vita"]]
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    addEventListener("keydown", esc)
    return () => removeEventListener("keydown", esc)
  }, [open])
  useEffect(() => {
    const on = () => {
      let cur = ""
      for (const [id] of links) {
        const r = document.getElementById(id)?.getBoundingClientRect()
        if (r && r.top < innerHeight * 0.4 && r.bottom > innerHeight * 0.4) cur = id
      }
      setActive(cur)
    }
    addEventListener("scroll", on, { passive: true })
    on()
    return () => removeEventListener("scroll", on)
  }, [])
  return (
    <header className={cn("fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-bg/70 py-4 backdrop-blur-md", pad)}>
      <a href="#top" aria-label="Quehenberger – Start" className="font-serif text-[34px] leading-none">Q<i className="not-italic text-accent">.</i></a>
      <button
        className="relative z-[2] size-12 rounded-full border border-line md:hidden"
        aria-expanded={open}
        aria-controls="nav"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        onClick={() => setOpen(!open)}
      >
        <span className={cn("absolute left-[15px] right-[15px] top-5 h-[1.5px] bg-fg transition-transform", open && "translate-y-[3.5px] rotate-45")} />
        <span className={cn("absolute left-[15px] right-[15px] top-[27px] h-[1.5px] bg-fg transition-transform", open && "-translate-y-[3.5px] -rotate-45")} />
      </button>
      <nav
        id="nav"
        aria-label="Hauptnavigation"
        className={cn(
          "fixed inset-0 z-[1] flex flex-col items-center justify-center gap-2.5 bg-bg font-serif text-[clamp(40px,12vw,64px)] leading-[1.1] transition-all duration-300",
          "md:static md:z-auto md:flex-row md:gap-8 md:bg-transparent md:font-sans md:text-[15px] md:opacity-100 md:visible",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        {links.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={() => setOpen(false)}
            className={cn("inline-flex min-h-11 items-center opacity-80 transition-opacity hover:opacity-100", active === id && "opacity-100 shadow-[0_1px_0_var(--color-accent)]")}>
            {label}
          </a>
        ))}
        <a href="#gespraech" onClick={() => setOpen(false)}
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line px-5 font-sans text-lg transition-colors hover:border-fg hover:bg-fg hover:text-bg md:mt-0 md:text-[15px]">
          Gespräch
        </a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className={cn("relative isolate flex min-h-svh flex-col justify-end gap-[clamp(28px,5vh,56px)] overflow-hidden pb-12 pt-[clamp(120px,18vh,180px)]", pad)}>
      <AnimatedGridPattern
        numSquares={24}
        maxOpacity={0.18}
        duration={4}
        className="fill-accent/20 stroke-fg/10 mask-[radial-gradient(900px_circle_at_75%_35%,white,transparent)] -z-10"
      />
      <BlurFade delay={0.05}><p className={eyebrow}>Strategieberatung · Salzburg</p></BlurFade>
      <h1 className="text-[clamp(56px,13.2vw,220px)] font-normal leading-[.98] tracking-[-.025em]">
        <BlurFade delay={0.15} duration={0.9} offset={40} blur="12px" direction="up"><span className="block">Strategien,</span></BlurFade>
        <BlurFade delay={0.3} duration={0.9} offset={40} blur="12px" direction="up"><span className="block">die <em className={serif}>wirken.</em></span></BlurFade>
      </h1>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <BlurFade delay={0.5}>
          <p className="max-w-[46ch] text-[clamp(17px,1.5vw,21px)] text-[#cfcac0]">
            Ich begleite Unternehmer bei Wachstum, Transformation und Investitionen – mit über 25 Jahren Erfahrung als CEO, Gründer und Investor.
          </p>
        </BlurFade>
        <BlurFade delay={0.6}><Btn href="#gespraech">Kostenfreies Strategiegespräch</Btn></BlurFade>
      </div>
      <div className="grid border-t border-line sm:grid-cols-3">
        {stats.map((s, i) => (
          <BlurFade key={s.l} delay={0.7 + i * 0.1} className="border-b border-line py-5 sm:border-b-0 sm:pr-6 sm:pt-7">
            <strong className="block font-serif text-[clamp(44px,6vw,92px)] font-normal leading-none tracking-[-.02em]">
              <NumberTicker value={s.v} /><span>+</span>
            </strong>
            <span className="mt-2 block max-w-[22ch] text-[15px] text-mute">{s.l}</span>
          </BlurFade>
        ))}
      </div>
    </section>
  )
}

function Topics() {
  return (
    <div className="border-y border-line bg-bg2 py-5" aria-hidden="true">
      <Marquee className="[--duration:38s] [--gap:2.25rem]">
        {topics.map((t) => (
          <div key={t} className="flex items-center gap-9 font-serif text-[clamp(32px,5vw,72px)] leading-none">
            <span>{t}</span><i className="text-[.5em] not-italic text-accent">✦</i>
          </div>
        ))}
      </Marquee>
    </div>
  )
}

function Focus() {
  return (
    <section id="strategie" className={sectionCls}>
      <SectionHead label="Schwerpunkte" sub="Strategische Beratung auf Basis von 25 Jahren Führungserfahrung in Strategie, Wachstum und Transformation.">
        Was Sie von mir <em className={serif}>erwarten</em> können
      </SectionHead>
      <ul>
        {focus.map((f) => (
          <li key={f.n}><BlurFade inView>
            <div className="group grid gap-3 border-t border-line py-9 transition-all duration-500 last:border-b hover:bg-gradient-to-r hover:from-accent/10 hover:to-transparent hover:pl-5 md:grid-cols-[90px_1fr_1.1fr] md:items-baseline md:gap-6">
              <span className="font-serif text-lg text-accent">{f.n}</span>
              <h3 className="text-[clamp(26px,3vw,44px)] font-normal leading-[.98] tracking-[-.025em]">{f.t}</h3>
              <p className="text-[#cfcac0]">{f.d}</p>
            </div>
          </BlurFade></li>
        ))}
      </ul>
    </section>
  )
}

function Offers() {
  return (
    <section id="beratung" className={sectionCls}>
      <SectionHead label="Leistungen" sub="Verschiedene Formate, die sich Ihrer Ausgangssituation und Ihren Zielen anpassen.">
        Wie wir <em className={serif}>zusammenarbeiten</em>
      </SectionHead>
      <div className="grid gap-5 lg:grid-cols-3">
        {offers.map((o, i) => (
          <BlurFade key={o.tag} inView delay={i * 0.1} className="h-full">
            <article className={cn("relative flex h-full flex-col gap-5 overflow-hidden rounded-[28px] border border-line p-[clamp(24px,2.6vw,40px)] transition-[border-color,box-shadow] duration-500 hover:border-accent/60 hover:shadow-[0_30px_80px_-30px_rgba(255,90,54,.35)]", o.featured ? "bg-gradient-to-br from-[#1c1412] to-bg2" : "bg-bg2")}>
              {o.featured && <BorderBeam size={220} duration={8} colorFrom="#ff5a36" colorTo="#ffb199" />}
              <p className="text-xs uppercase tracking-[.16em] text-mute">{o.tag}</p>
              <h3 className="text-[clamp(34px,3.6vw,56px)] font-normal leading-[.98] tracking-[-.025em]">{o.a}<br /><em className={serif}>{o.b}</em></h3>
              <p className="text-[#cfcac0]">{o.lead}</p>
              <ul className="grid gap-2.5 text-[15.5px]">
                {o.items.map((it) => (
                  <li key={it} className="relative pl-6 before:absolute before:left-0 before:top-[.7em] before:h-px before:w-3 before:bg-accent">{it}</li>
                ))}
              </ul>
              <p className="mt-auto border-t border-line pt-5 font-serif text-[32px]">{o.price} <small className="ml-1.5 font-sans text-[13px] text-mute">{o.note}</small></p>
            </article>
          </BlurFade>
        ))}
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section id="projekte" className={sectionCls}>
      <SectionHead label="Projekte" sub="Einblicke in strategische Entwicklungen aus eigenen Unternehmen – mit konkreten Zahlen und messbaren Ergebnissen.">
        Operative Erfahrung <em className={serif}>in der Praxis</em>
      </SectionHead>
      {projects.map((p) => (
        <BlurFade key={p.n} inView>
          <article className="grid gap-[clamp(24px,5vw,80px)] border-t border-line py-11 last:border-b md:grid-cols-[1fr_1.4fr]">
            <header>
              <span className="font-serif text-lg text-accent">{p.n}</span>
              <h3 className="my-2.5 text-[clamp(40px,5.4vw,84px)] font-normal leading-[.98] tracking-[-.025em]">{p.name}</h3>
              <p className="text-[15px] text-mute">{p.kind}</p>
            </header>
            <div>
              <dl className="grid gap-[18px]">
                {p.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="mb-1 text-xs uppercase tracking-[.16em] text-accent">{k}</dt>
                    <dd className="text-[#d8d3c9]">{v}</dd>
                  </div>
                ))}
              </dl>
              <a href={p.href} target="_blank" rel="noopener" className="mt-6 inline-block border-b border-accent pb-[3px] transition-colors hover:text-accent">{p.cta} ↗</a>
            </div>
          </article>
        </BlurFade>
      ))}
    </section>
  )
}

function Word({ w, i, n, p }: { w: string; i: number; n: number; p: ReturnType<typeof useSpring> }) {
  const o = useTransform(p, [i / n, (i + 1) / n], [0.18, 1])
  return <motion.span style={{ opacity: o }}>{w} </motion.span>
}

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const words = useMemo(() => statement.split(/\s+/), [])
  return (
    <section id="vita" className={sectionCls}>
      <BlurFade inView><p className={eyebrow}>Hintergrund</p></BlurFade>
      <p ref={ref} className="font-serif text-[clamp(28px,4.6vw,72px)] leading-[1.1] tracking-[-.015em]">
        {words.map((w, i) => <Word key={i} w={w} i={i} n={words.length} p={p} />)}
      </p>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className={sectionCls}>
      <SectionHead label="FAQ" sub="Klarheit schafft Vertrauen – hier finden Sie Antworten auf die wichtigsten Fragen.">
        Häufige Fragen zur <em className={serif}>Zusammenarbeit</em>
      </SectionHead>
      <div className="max-w-[1000px]">
        {faq.map((f) => (
          <BlurFade key={f.q} inView>
            <details className="group border-t border-line last:border-b">
              <summary className="relative min-h-11 cursor-pointer list-none py-[26px] pr-14 text-[clamp(19px,2vw,26px)] tracking-[-.01em]">
                {f.q}
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[34px] font-light text-accent transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[70ch] pb-7 pr-14 text-[#cfcac0]">{f.a}</p>
            </details>
          </BlurFade>
        ))}
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section id="gespraech" className={cn("relative isolate grid gap-8 overflow-hidden py-[clamp(100px,16vw,240px)]", pad)}>
      <Ripple mainCircleSize={260} mainCircleOpacity={0.3} className="-z-10 mask-[radial-gradient(circle_at_80%_50%,white,transparent_70%)] [&>div]:border-accent/50 [&>div]:bg-accent/5" />
      <BlurFade inView><p className={eyebrow}>Nächster Schritt</p></BlurFade>
      <BlurFade inView delay={0.1}>
        <h2 className="text-[clamp(48px,10.5vw,180px)] font-normal leading-[.98] tracking-[-.025em]">Sprechen wir über <em className={serif}>Ihre Situation.</em></h2>
      </BlurFade>
      <BlurFade inView delay={0.2}>
        <p className="max-w-[46ch] text-[clamp(17px,1.5vw,21px)] text-[#cfcac0]">In einem ersten Gespräch finden wir heraus, ob und wie ich Sie unterstützen kann – kostenfrei, unverbindlich und auf Ihre Situation zugeschnitten.</p>
      </BlurFade>
      <BlurFade inView delay={0.3}>
        <div className="flex flex-wrap gap-3.5">
          <Btn href="mailto:team@quehenberger.io?subject=Strategiegespr%C3%A4ch">Kostenloses Gespräch vereinbaren</Btn>
          <Btn href="https://wa.me/436763843860" ghost target="_blank" rel="noopener">WhatsApp</Btn>
        </div>
      </BlurFade>
    </section>
  )
}

function Footer() {
  const h = "mb-3.5 text-xs uppercase tracking-[.16em] text-mute"
  return (
    <footer className={cn("border-t border-line bg-bg2 pb-28 pt-16 md:pb-8", pad)}>
      <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="font-serif text-[clamp(28px,3vw,44px)] leading-[1.05]">MMag. Michael <em className={serif}>Quehenberger</em></p>
          <p className="mb-4 mt-2 text-accent">Unternehmer · Coach · Investor</p>
          <p className="max-w-[42ch] text-mute">Strategieberatung für Unternehmen und Projekte, die Zukunft gestalten – mit Fokus auf Innovation, Community und nachhaltigen Lösungen.</p>
        </div>
        <div className="grid content-start gap-2">
          <p className={h}>Kontakt</p>
          <p>Kaiser Karl Straße 2<br />5020 Salzburg</p>
          <a className="hover:text-accent" href="mailto:team@quehenberger.io">team@quehenberger.io</a>
          <p><a className="hover:text-accent" href="https://linkedin.com/in/michaelquehenberger" target="_blank" rel="noopener">LinkedIn ↗</a> · <a className="hover:text-accent" href="https://instagram.com/michael.quehenberger" target="_blank" rel="noopener">Instagram ↗</a></p>
        </div>
        <div className="grid content-start gap-2">
          <p className={h}>Rechtliches</p>
          <a className="hover:text-accent" href="#">Datenschutz</a>
          <a className="hover:text-accent" href="#">Impressum</a>
        </div>
      </div>
      <p className="mt-14 text-sm text-mute">© 2025 Michael Quehenberger. Alle Rechte vorbehalten.</p>
    </footer>
  )
}

export default function App() {
  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })
  const [showCta, setShowCta] = useState(false)
  useMotionValueEvent(scrollYProgress, "change", () => {
    const end = document.getElementById("gespraech")?.getBoundingClientRect().top ?? 0
    setShowCta(scrollY > innerHeight * 0.8 && end > innerHeight)
  })
  return (
    <>
      <a href="#top" className="fixed -top-16 left-4 z-[100] rounded-[10px] bg-fg px-4 py-3 text-bg transition-all focus:top-4">Zum Inhalt springen</a>
      <motion.div aria-hidden className="fixed left-0 top-0 z-[70] h-0.5 w-full origin-left bg-accent" style={{ scaleX: bar }} />
      <Nav />
      <main id="top" tabIndex={-1}>
        <Hero />
        <Topics />
        <Focus />
        <Offers />
        <Projects />
        <Statement />
        <Faq />
        <Cta />
      </main>
      <a href="#gespraech" className={cn("fixed inset-x-3 bottom-3 z-[45] rounded-full bg-accent p-4 text-center font-medium text-bg transition-transform duration-500 md:hidden", showCta ? "translate-y-0" : "translate-y-[140%]")}>
        Strategiegespräch vereinbaren →
      </a>
      <Footer />
    </>
  )
}
