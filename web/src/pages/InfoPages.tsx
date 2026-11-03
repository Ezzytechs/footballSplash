import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  FileText,
  MessageSquare,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Navbar } from '../component/home/Navbar'
import { Footer } from '../component/home/Footer'
import { useTheme } from '../component/home/themedContext'
import {
  isContactFormConfigured,
  submitContactMessage,
} from '../lib/contact'

/* --------------------------------------------------------------- shell */

const LAST_UPDATED = 'November 2026'

interface PolicyLink {
  to: string
  label: string
  icon: LucideIcon
  blurb: string
}

const POLICY_LINKS: PolicyLink[] = [
  { to: '/privacy', label: 'Privacy Policy', icon: ShieldCheck, blurb: 'What we collect and why' },
  { to: '/terms', label: 'Terms of Service', icon: Scale, blurb: 'The rules of the pitch' },
  { to: '/editorial', label: 'Editorial Guidelines', icon: FileText, blurb: 'How we report and correct' },
  { to: '/contact', label: 'Contact Us', icon: MessageSquare, blurb: 'Reach the newsroom' },
]

interface InfoLayoutProps {
  kicker: string
  title: string
  intro: string
  children: ReactNode
}

function InfoLayout({ kicker, title, intro, children }: InfoLayoutProps) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const card = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const body = isDark ? 'text-zinc-300' : 'text-zinc-600'
  const divider = isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
  const sideLink = isDark
    ? 'text-zinc-300 hover:bg-zinc-800/70 hover:text-yellow-400'
    : 'text-zinc-700 hover:bg-zinc-100 hover:text-yellow-600'

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav
          aria-label="Breadcrumb"
          className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${muted}`}
        >
          <Link to="/" className="transition-colors hover:text-yellow-500">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className={heading}>{title}</span>
        </nav>

        <header className="mt-5">
          <span className="inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-500">
            {kicker}
          </span>
          <h1
            className={`mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight ${heading}`}
          >
            {title}
          </h1>
          <p className={`mt-3 max-w-3xl text-sm leading-relaxed ${body}`}>
            {intro}
          </p>
          <p className={`mt-2 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>
            Last updated {LAST_UPDATED}
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <article
            className={`lg:col-span-8 rounded-2xl border p-6 sm:p-8 space-y-7 ${card}`}
          >
            {children}
          </article>

          <aside className={`lg:col-span-4 rounded-2xl border p-5 ${card}`}>
            <h2 className={`text-xs font-black uppercase tracking-widest ${heading}`}>
              Site policies
            </h2>
            <ul className="mt-3 space-y-1">
              {POLICY_LINKS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${sideLink}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${muted}`} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={`mt-4 border-t pt-4 ${divider}`}>
              <p className={`text-[11px] leading-relaxed ${muted}`}>
                Questions about this page? Write to{' '}
                <a
                  href="mailto:legal@splashfootball.news"
                  className="font-bold text-yellow-500 hover:underline"
                >
                  legal@splashfootball.news
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  return (
    <section>
      <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        {title}
      </h2>
      <div
        className={`mt-2 space-y-2 text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}
      >
        {children}
      </div>
    </section>
  )
}

/* ------------------------------------------------------- privacy policy */

export function PrivacyPolicyPage() {
  return (
    <InfoLayout
      kicker="Legal"
      title="Privacy Policy"
      intro="This policy explains what SPLASH FOOTBALL collects when you read, comment or sign in, why we collect it, and the control you have over it."
    >
      <Section title="Information we collect">
        <p>
          Account details you give us — your name, email address and password
          (stored only as a hash) — plus the role assigned to your account.
        </p>
        <p>
          Reading activity: pages you open, stories you like or bookmark, and
          comments you post. This is linked to your account when you are signed
          in and kept anonymous otherwise.
        </p>
        <p>
          Technical data such as your browser type, approximate location derived
          from your IP address, and error reports used to keep the site online.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          To sign you in, publish and moderate comments, remember your reading
          preferences, measure which stories are read most, and fix problems.
        </p>
        <p>
          We do not sell personal data, and we do not use your email address for
          anything other than the newsletter you explicitly asked for.
        </p>
      </Section>

      <Section title="Cookies and local storage">
        <p>
          A short-lived access token is kept in your browser&apos;s local storage so
          you stay signed in between page loads. The refresh token is stored in
          a cookie the page script cannot read.
        </p>
        <p>
          Clearing your browser storage signs you out; nothing else about your
          account is affected.
        </p>
      </Section>

      <Section title="Sharing and processors">
        <p>
          We share data only with the service providers that run the site —
          hosting, email delivery and error monitoring — under contracts that
          limit their use of it to providing those services. We may disclose
          data where the law requires it.
        </p>
      </Section>

      <Section title="Retention and your rights">
        <p>
          Accounts and comments are kept while your account is active. Deleted
          comments are removed from public view immediately and purged from
          backups on the normal backup cycle.
        </p>
        <p>
          You can ask for a copy of your data, correct it, or have your account
          deleted by writing to{' '}
          <a
            href="mailto:privacy@splashfootball.news"
            className="font-bold text-yellow-500 hover:underline"
          >
            privacy@splashfootball.news
          </a>
          . We answer within 30 days.
        </p>
      </Section>

      <Section title="Children">
        <p>
          The site is not intended for children under 13, and we do not
          knowingly collect their personal data.
        </p>
      </Section>
    </InfoLayout>
  )
}

/* ------------------------------------------------------ terms of service */

export function TermsOfServicePage() {
  return (
    <InfoLayout
      kicker="Legal"
      title="Terms of Service"
      intro="These terms govern your use of SPLASH FOOTBALL. By reading, commenting or creating an account, you agree to them."
    >
      <Section title="Using the site">
        <p>
          You may read and share our stories for personal, non-commercial use.
          Do not scrape the site at volume, attempt to break its security, or
          republish our journalism as your own.
        </p>
      </Section>

      <Section title="Accounts">
        <p>
          You are responsible for keeping your password private and for activity
          under your account. One person, one account; do not share credentials.
        </p>
        <p>
          We may suspend accounts that break these terms or the editorial
          guidelines.
        </p>
      </Section>

      <Section title="Our content">
        <p>
          Articles, images, match graphics and the SPLASH FOOTBALL name are owned
          by us or licensed to us. Quoting a short extract with a link back is
          welcome; copying whole stories is not.
        </p>
      </Section>

      <Section title="Comments and community">
        <p>
          You keep ownership of what you post, and you grant us a licence to
          display, moderate and distribute it on the site.
        </p>
        <p>
          No abuse, harassment, hate speech, spam or unlawful content. Moderators
          may remove comments and, for repeat breaches, close accounts.
        </p>
      </Section>

      <Section title="Third-party links and advertising">
        <p>
          Links to other sites and sponsored placements are marked where
          relevant. We are not responsible for the content or privacy practices
          of third parties.
        </p>
      </Section>

      <Section title="Disclaimer and liability">
        <p>
          Match information, transfer reports and statistics are published in
          good faith but may change. Nothing here is betting, financial or legal
          advice.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect losses
          arising from your use of the site.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We update these terms from time to time and change the date at the top
          of this page. Continuing to use the site means you accept the current
          version.
        </p>
      </Section>
    </InfoLayout>
  )
}

/* -------------------------------------------------- editorial guidelines */

export function EditorialGuidelinesPage() {
  return (
    <InfoLayout
      kicker="Newsroom"
      title="Editorial Guidelines"
      intro="How the SPLASH FOOTBALL newsroom reports, verifies and corrects the stories we publish."
    >
      <Section title="Independence">
        <p>
          Editorial decisions are made by the newsroom, never by advertisers,
          clubs or sponsors. Commercial relationships are kept away from the
          reporting desk, and sponsored content is labelled clearly.
        </p>
      </Section>

      <Section title="Accuracy and sourcing">
        <p>
          Every story is checked against a primary source where one exists —
          club statements, competition records, press conferences or named
          reporters with direct knowledge.
        </p>
        <p>
          Transfer stories are labelled as speculation unless they are confirmed
          by the clubs involved. Anonymous sourcing is used only when the
          information cannot be obtained otherwise, and the reason is explained
          to readers.
        </p>
      </Section>

      <Section title="Opinion and analysis">
        <p>
          Analysis, ratings and columns are the view of the writer and are
          presented as such. They are held to the same standard of factual
          accuracy as news reporting.
        </p>
      </Section>

      <Section title="Corrections">
        <p>
          Mistakes are corrected promptly and visibly. Factual errors carry a
          correction note on the story; significant changes are noted at the
          bottom of the article with the time of the update.
        </p>
        <p>
          To report an error, email{' '}
          <a
            href="mailto:corrections@splashfootball.news"
            className="font-bold text-yellow-500 hover:underline"
          >
            corrections@splashfootball.news
          </a>{' '}
          with a link to the story.
        </p>
      </Section>

      <Section title="Images and media">
        <p>
          Photography and video are licensed or used with permission. Where a
          file picture is used it is captioned accordingly. Images are never
          manipulated beyond standard cropping and colour correction.
        </p>
      </Section>

      <Section title="Comments">
        <p>
          Readers are welcome to disagree. Comments are moderated against the
          community rules in our Terms of Service; we remove abuse, spam and
          anything unlawful.
        </p>
      </Section>
    </InfoLayout>
  )
}

/* ------------------------------------------------------------- contact */

const inputClass = (isDark: boolean) =>
  `w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${
    isDark
      ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
      : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
  }`

type SendState = 'idle' | 'sending' | 'sent' | 'error'

function ContactForm() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('Editorial')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<SendState>('idle')
  const [error, setError] = useState('')

  const label = `mb-1.5 block text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`
  const busy = state === 'sending'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setState('sending')
    try {
      await submitContactMessage({ name, email, topic, message })
      setState('sent')
      setMessage('')
    } catch (err) {
      setState('error')
      setError(
        err instanceof Error ? err.message : 'Could not send your message.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="contact-name">
            Your name
          </label>
          <input
            id="contact-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Alex Morgan"
            className={inputClass(isDark)}
          />
        </div>
        <div>
          <label className={label} htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            className={inputClass(isDark)}
          />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="contact-topic">
          Topic
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={inputClass(isDark)}
        >
          <option>Editorial</option>
          <option>Corrections</option>
          <option>Advertising</option>
          <option>Privacy</option>
          <option>Something else</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us what you need…"
          className={`${inputClass(isDark)} resize-y`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !isContactFormConfigured}
          className="rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send message'}
        </button>
        {state === 'sent' && (
          <p className="text-[11px] font-semibold text-green-500">
            Message sent — thanks. The newsroom replies within two working days.
          </p>
        )}
        {state === 'error' && (
          <p className="text-[11px] font-semibold text-red-500">{error}</p>
        )}
        {!isContactFormConfigured && (
          <p className="text-[11px] font-semibold text-yellow-500">
            The form endpoint is not configured for this build.
          </p>
        )}
      </div>
    </form>
  )
}

export function ContactPage() {
  return (
    <InfoLayout
      kicker="Contact"
      title="Contact Us"
      intro="Pitches, corrections, partnerships or a problem with the site — here is who to write to, and the fastest way to reach them."
    >
      <Section title="Newsroom desks">
        <p>
          Editorial: stories, tips and press releases —{' '}
          <a
            href="mailto:desk@splashfootball.news"
            className="font-bold text-yellow-500 hover:underline"
          >
            desk@splashfootball.news
          </a>
        </p>
        <p>
          Corrections: factual errors in a published story —{' '}
          <a
            href="mailto:corrections@splashfootball.news"
            className="font-bold text-yellow-500 hover:underline"
          >
            corrections@splashfootball.news
          </a>
        </p>
        <p>
          Advertising and partnerships —{' '}
          <a
            href="mailto:ads@splashfootball.news"
            className="font-bold text-yellow-500 hover:underline"
          >
            ads@splashfootball.news
          </a>
        </p>
        <p>
          Privacy and data requests —{' '}
          <a
            href="mailto:privacy@splashfootball.news"
            className="font-bold text-yellow-500 hover:underline"
          >
            privacy@splashfootball.news
          </a>
        </p>
      </Section>

      <Section title="Send a message">
        <p>
          Messages are delivered straight to the newsroom inbox. We reply to
          every one within two working days.
        </p>
        <div className="pt-2">
          <ContactForm />
        </div>
      </Section>

      <Section title="Response times">
        <p>
          The newsroom reads every message. Corrections are handled the same day
          during the week; general enquiries usually get a reply within two
          working days.
        </p>
      </Section>
    </InfoLayout>
  )
}
