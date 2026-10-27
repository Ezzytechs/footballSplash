import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  Clock,
  Globe,
  MessageCircle,
  Shirt,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from './themedContext'

interface Article {
  id: string
  tag: string
  title: string
  excerpt: string
  time: string
  comments: number
  img: string
}

interface Category {
  id: string
  title: string
  kicker: string
  icon: LucideIcon
  accentText: string
  chip: string
  articles: Article[]
}

const IMG = {
  pitch:
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
  stadium:
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=600',
  ball: 'https://images.unsplash.com/photo-1560272564-66952055a4ab?auto=format&fit=crop&q=80&w=600',
  crowd:
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
  action:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
  night:
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=600',
}

const CATEGORIES: Category[] = [
  {
    id: 'premier-league',
    title: 'Premier League',
    kicker: 'England · Matchweek 10',
    icon: Shirt,
    accentText: 'text-fuchsia-500',
    chip: 'bg-fuchsia-600 text-white',
    articles: [
      {
        id: 'pl-1',
        tag: 'TITLE RACE',
        title: 'Arsenal Go Top After Statement Win Over Manchester City',
        excerpt:
          'A relentless second-half display at the Emirates lifts the Gunners to the summit of the Premier League table.',
        time: '40 min ago',
        comments: 87,
        img: IMG.stadium,
      },
      {
        id: 'pl-2',
        tag: 'TACTICS',
        title: "Arteta's New-look Midfield Triangle Is Winning Arsenal Games",
        excerpt:
          'How the double pivot and roaming number eight unlocked the most stubborn low blocks in the league.',
        time: '2 hours ago',
        comments: 45,
        img: IMG.ball,
      },
      {
        id: 'pl-3',
        tag: 'LIVERPOOL',
        title: 'Liverpool Edge Everton Merseyside Derby In Six-Point Shootout',
        excerpt:
          'A 78th-minute winner settles a tense Goodison Park encounter as the reds climb into the top four.',
        time: '5 hours ago',
        comments: 132,
        img: IMG.action,
      },
      {
        id: 'pl-4',
        tag: 'INJURIES',
        title: 'Saka Passed Fit For Weekend London Derby After Scan Results',
        excerpt:
          'Medical staff confident the winger will be available after only a minor knock in midweek action.',
        time: '6 hours ago',
        comments: 39,
        img: IMG.crowd,
      },
      {
        id: 'pl-5',
        tag: 'RANKINGS',
        title: 'Power Rankings: Who Is Leading The Race For Premier League Player Of The Season?',
        excerpt:
          'Our writers rank the ten outstanding performers of the campaign so far, with one obvious leader.',
        time: '8 hours ago',
        comments: 64,
        img: IMG.pitch,
      },
      {
        id: 'pl-6',
        tag: 'MANCHESTER UTD',
        title: 'United Youth Academy Duo Handed First Team Starts In Cup Clash',
        excerpt:
          'The manager rewards impressive form from the under-21s with a place in a much-changed lineup.',
        time: '10 hours ago',
        comments: 51,
        img: IMG.night,
      },
      {
        id: 'pl-7',
        tag: 'TRANSFERS',
        title: 'Chelsea Prepare January Move For Bundesliga Goal Machine',
        excerpt:
          'Scouts have tracked the striker all season and a preliminary bid is expected before the window opens.',
        time: '12 hours ago',
        comments: 73,
        img: IMG.ball,
      },
      {
        id: 'pl-8',
        tag: 'VAR',
        title: 'Refereeing Body Admits Incorrect Offside Call In Newcastle Defeat',
        excerpt:
          'The professional game match officials board releases a rare public statement acknowledging the error.',
        time: '14 hours ago',
        comments: 210,
        img: IMG.stadium,
      },
    ],
  },
  {
    id: 'champions-league',
    title: 'Champions League',
    kicker: 'Europe · League Phase MD5',
    icon: Trophy,
    accentText: 'text-emerald-500',
    chip: 'bg-emerald-500 text-black',
    articles: [
      {
        id: 'ucl-1',
        tag: 'MATCHDAY',
        title: 'Real Madrid Stage Late Comeback Against Bayern In Quarter Final Classic',
        excerpt:
          'Two goals in stoppage time complete a famous European night at the Bernabéu.',
        time: '1 hour ago',
        comments: 178,
        img: IMG.night,
      },
      {
        id: 'ucl-2',
        tag: 'DRAW',
        title: 'UCL Quarter Final Draw Confirmed: PSG To Face Inter Milan',
        excerpt:
          'The seeded ties are set after this afternoon’s ceremony in Nyon, with two blockbuster matchups.',
        time: '3 hours ago',
        comments: 96,
        img: IMG.crowd,
      },
      {
        id: 'ucl-3',
        tag: 'ANALYSIS',
        title: 'How Barcelona’s Teenage Midfielder Dominated The European Stage',
        excerpt:
          'A data-driven look at the passing networks that tore apart an elite press.',
        time: '5 hours ago',
        comments: 58,
        img: IMG.ball,
      },
      {
        id: 'ucl-4',
        tag: 'GOAL OF WEEK',
        excerpt:
          'A 30-yard dipping volley sends the away end into delirium and tops our weekly chart.',
        title: 'Bicycle Kick Stunner Named Champions League Goal Of The Week',
        time: '7 hours ago',
        comments: 142,
        img: IMG.action,
      },
      {
        id: 'ucl-5',
        tag: 'ENGLAND',
        title: 'Arsenal Clinch Top Seed Status With Game To Spare',
        excerpt:
          'Finishing in the top two of the league phase guarantees home advantage in the second leg.',
        time: '9 hours ago',
        comments: 47,
        img: IMG.pitch,
      },
      {
        id: 'ucl-6',
        tag: 'AWARDS',
        title: 'Goalkeeper’s Penalty Heroics Earns Player Of The Matchday Honour',
        excerpt:
          'Three saves from four spot kicks decide a tense last-16 tie in Germany.',
        time: '11 hours ago',
        comments: 66,
        img: IMG.stadium,
      },
      {
        id: 'ucl-7',
        tag: 'STATS',
        title: 'Record-Breaking Night: Fastest Hat Trick In Competition History',
        excerpt:
          'The striker needed just eleven minutes to complete his three-goal haul off the bench.',
        time: '13 hours ago',
        comments: 121,
        img: IMG.night,
      },
      {
        id: 'ucl-8',
        tag: 'FINANCE',
        title: 'Broadcast Revenue Deal Set To Reshape European Football’s Balance Of Power',
        excerpt:
          'Clubs agree an improved distribution model that rewards deep tournament runs more generously.',
        time: '16 hours ago',
        comments: 34,
        img: IMG.crowd,
      },
    ],
  },
  {
    id: 'transfers',
    title: 'Transfer Centre',
    kicker: 'Rumours · Done deals · Loans',
    icon: ArrowLeftRight,
    accentText: 'text-yellow-500',
    chip: 'bg-yellow-400 text-black',
    articles: [
      {
        id: 'tr-1',
        tag: 'BREAKING',
        title: 'Manchester City Agree Terms With 19-Year-Old Brazilian Phenom',
        excerpt:
          'Personal terms are settled on a five-year contract as the clubs negotiate the final fee.',
        time: '25 min ago',
        comments: 245,
        img: IMG.ball,
      },
      {
        id: 'tr-2',
        tag: 'RECORD BID',
        title: '$140M Bid Submitted For Bundesliga Midfield Dynamo',
        excerpt:
          'Premier League giants are ready to shatter their transfer record ahead of the January window.',
        time: '2 hours ago',
        comments: 189,
        img: IMG.action,
      },
      {
        id: 'tr-3',
        tag: 'DONE DEAL',
        title: 'Inter Milan Complete Signing Of Argentine Winger On Four-Year Deal',
        excerpt:
          'The Nerazzurri beat Serie A rivals to the signature of the 22-year-old wide man.',
        time: '4 hours ago',
        comments: 77,
        img: IMG.pitch,
      },
      {
        id: 'tr-4',
        tag: 'LOAN',
        title: 'Chelsea Send Wonderkid On Season-Long Loan To Championship Side',
        excerpt:
          'The teenager will gain first-team minutes in a promotion-chasing side until May.',
        time: '6 hours ago',
        comments: 41,
        img: IMG.stadium,
      },
      {
        id: 'tr-5',
        tag: 'AGENT NEWS',
        title: 'Striker Hints At Premier League Move In Cryptic Social Media Post',
        excerpt:
          'A deleted story has fuelled speculation about a possible exit in the new year.',
        time: '8 hours ago',
        comments: 156,
        img: IMG.night,
      },
      {
        id: 'tr-6',
        tag: 'SCOUTED',
        title: 'Five Teenagers On Europe’s Biggest Clubs’ January Shortlists',
        excerpt:
          'Recruitment departments agree on the names most likely to spark a bidding war.',
        time: '10 hours ago',
        comments: 62,
        img: IMG.crowd,
      },
      {
        id: 'tr-7',
        tag: 'EXIT',
        title: 'Veteran Captain Confirms He Will Leave Club At End Of Season',
        excerpt:
          'An emotional press conference confirmed the end of an eight-year spell at the club.',
        time: '12 hours ago',
        comments: 133,
        img: IMG.stadium,
      },
      {
        id: 'tr-8',
        tag: 'RUMOUR',
        title: 'Bayern Munich Join Race For Premier League Winger As Fees Rise',
        excerpt: 'The German champions move into pole position after fresh contact with intermediaries.',
        time: '15 hours ago',
        comments: 88,
        img: IMG.ball,
      },
    ],
  },
  {
    id: 'world-football',
    title: 'World Football',
    kicker: 'Serie A · La Liga · Bundesliga · More',
    icon: Globe,
    accentText: 'text-cyan-500',
    chip: 'bg-cyan-500 text-black',
    articles: [
      {
        id: 'wf-1',
        tag: 'SERIE A',
        title: 'Inter Milan Go Top After Five-Goal Thriller At San Siro',
        excerpt:
          'Lautaro Martínez scores two stunning volleys as Inter edge Napoli in a chaotic contest.',
        time: '1 hour ago',
        comments: 94,
        img: IMG.night,
      },
      {
        id: 'wf-2',
        tag: 'LA LIGA',
        title: 'Barcelona’s Young Guns Fire Them Clear At The Top Of La Liga',
        excerpt:
          'A 4-1 win extends the lead at the summit thanks to two assists from the academy graduate.',
        time: '3 hours ago',
        comments: 71,
        img: IMG.action,
      },
      {
        id: 'wf-3',
        tag: 'BUNDESLIGA',
        title: 'Bayern’s Striker Runs Riot With Four Goals In A Single Half',
        excerpt:
          'The Pole produces the most clinical display seen in Germany for a decade.',
        time: '5 hours ago',
        comments: 118,
        img: IMG.ball,
      },
      {
        id: 'wf-4',
        tag: 'LIGUE 1',
        title: 'Paris Saint-Germain’s Pressing Stats Are The Best In Europe',
        excerpt:
          'Numbers show the French side win the ball higher up the pitch than any other top-five league team.',
        time: '7 hours ago',
        comments: 43,
        img: IMG.pitch,
      },
      {
        id: 'wf-5',
        tag: 'INTERNATIONAL',
        title: 'World Cup Qualifying Draw Puts Champions On A Collision Course',
        excerpt:
          'The continent’s heavyweights are set for a deciding final matchday under the lights.',
        time: '9 hours ago',
        comments: 167,
        img: IMG.crowd,
      },
      {
        id: 'wf-6',
        tag: 'COPA',
        title: 'Argentina Name Squad For Crucial South American Qualifiers',
        excerpt:
          'Two uncapped players earn call-ups while several established stars return from injury.',
        time: '11 hours ago',
        comments: 82,
        img: IMG.stadium,
      },
      {
        id: 'wf-7',
        tag: 'AFCON',
        title: 'Hosts Unveil Four New Stadiums Ahead Of Continental Championship',
        excerpt: 'Organisers confirm all venues will be ready three months before the opening ceremony.',
        time: '13 hours ago',
        comments: 37,
        img: IMG.night,
      },
      {
        id: 'wf-8',
        tag: 'MARKET',
        title: 'Asian Transfer Market Booms As Clubs Break Spending Records',
        excerpt: 'Investment in playing squads has doubled over the last three seasons, new figures show.',
        time: '17 hours ago',
        comments: 29,
        img: IMG.action,
      },
    ],
  },
]

const PREVIEW_COUNT = 5

function CategorySection({ category }: { category: Category }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const [expanded, setExpanded] = useState(false)

  const Icon = category.icon
  const visible = expanded
    ? category.articles
    : category.articles.slice(0, PREVIEW_COUNT)
  const remaining = category.articles.length - PREVIEW_COUNT

  const card = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const meta = isDark ? 'text-zinc-500' : 'text-zinc-500'
  const rowBorder = isDark ? 'border-zinc-800/70' : 'border-zinc-200/70'
  const kicker = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const btn = isDark
    ? 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
    : 'border-zinc-200 bg-white text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
  const viewAll = isDark
    ? 'text-zinc-500 hover:text-yellow-400'
    : 'text-zinc-400 hover:text-yellow-600'

  return (
    <section id={category.id} className="mb-10 scroll-mt-32 lg:scroll-mt-44">
      {/* Section heading */}
      <div
        className={`flex items-center justify-between gap-4 mb-4 pb-3 border-b ${rowBorder}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${category.chip}`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2
              className={`text-lg sm:text-xl font-extrabold uppercase tracking-tight leading-tight ${heading}`}
            >
              {category.title}
            </h2>
            <p className={`text-[11px] font-semibold truncate ${kicker}`}>
              {category.kicker}
            </p>
          </div>
        </div>
        <Link
          to={`/category/${category.id}`}
          className={`hidden sm:flex items-center gap-1 text-xs font-bold shrink-0 transition-colors ${viewAll}`}
        >
          VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Article list */}
      <div className={`rounded-2xl border ${card} px-4 sm:px-5 py-1`}>
        {visible.map((article, idx) => (
          <article
            key={article.id}
            className={`group grid grid-cols-[104px_1fr] sm:grid-cols-[180px_1fr] gap-3 sm:gap-5 py-4 ${
              idx === 0 ? '' : `border-t ${rowBorder}`
            }`}
          >
            <div className="relative h-16 sm:h-24 rounded-lg overflow-hidden shrink-0">
              <img
                src={article.img}
                alt={article.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span
                className={`absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${category.chip}`}
              >
                {article.tag}
              </span>
            </div>

            <div className="min-w-0 flex flex-col justify-between">
              <h3
                className={`text-[13px] sm:text-base font-bold leading-snug line-clamp-2 transition-colors group-hover:text-yellow-400 ${heading}`}
              >
                {article.title}
              </h3>
              <p
                className={`hidden sm:block text-xs mt-1 line-clamp-2 ${muted}`}
              >
                {article.excerpt}
              </p>
              <div
                className={`mt-2 flex items-center gap-3 sm:gap-4 text-[11px] font-medium ${meta}`}
              >
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {article.time}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {article.comments}
                </span>
                <span
                  className={`ml-auto hidden sm:flex items-center gap-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity ${category.accentText}`}
                >
                  READ <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Show more / less */}
      {remaining > 0 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className={`mt-3 w-full py-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${btn}`}
          aria-expanded={expanded}
        >
          {expanded
            ? 'SHOW LESS'
            : `SHOW MORE (${remaining} MORE STORIES)`}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </section>
  )
}

export function NewsCategories() {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2
          className={`text-lg sm:text-xl font-extrabold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          <span className="w-1.5 h-6 bg-yellow-400 rounded-full shrink-0" />
          BY CATEGORY
        </h2>
        <span
          className={`text-xs font-semibold shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          Updated 5 mins ago
        </span>
      </div>

      {CATEGORIES.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  )
}
