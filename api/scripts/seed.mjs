/**
 * Local dev seed for the SportNews API.
 *
 *   node scripts/seed.mjs          # no-op if articles already exist
 *   node scripts/seed.mjs --force  # wipe seeded articles/comments first
 *
 * Creates the categories, tags, authors, published articles, comments,
 * replies and likes that the web app's post / tag pages render.
 * Nothing here touches data outside the tables it owns.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const force = process.argv.includes('--force')

const IMG = {
  stadium:
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1400',
  pitch:
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1400',
  ball: 'https://images.unsplash.com/photo-1560272564-66952055a4ab?auto=format&fit=crop&q=80&w=1400',
  crowd:
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1400',
  action:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1400',
  night:
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=1400',
}

const CATEGORIES = [
  { name: 'Premier League', slug: 'premier-league' },
  { name: 'Champions League', slug: 'champions-league' },
  { name: 'Transfers', slug: 'transfers' },
  { name: 'World Football', slug: 'world-football' },
]

const TAGS = [
  'premier-league',
  'champions-league',
  'transfers',
  'tactics',
  'arsenal',
  'liverpool',
  'man-city',
  'real-madrid',
  'barcelona',
  'serie-a',
  'la-liga',
  'injury',
  'rankings',
  'golden-boot',
]

const AUTHORS = [
  { name: 'Melanie Byrd', email: 'melanie@splash.test', role: 'EDITOR' },
  { name: 'David Connors', email: 'david@splash.test', role: 'AUTHOR' },
  { name: 'Elena Rostova', email: 'elena@splash.test', role: 'AUTHOR' },
  { name: 'Alexandre Silva', email: 'alexandre@splash.test', role: 'AUTHOR' },
]

// The account used to verify signed-in flows (like / bookmark / comment).
const DEMO = { name: 'Demo Reader', email: 'reader@splash.test', role: 'READER' }

// Reader accounts used only to give like counts believable numbers.
const FANS = Array.from({ length: 14 }, (_, index) => ({
  name: `Fan ${String(index + 1).padStart(2, '0')}`,
  email: `fan${String(index + 1).padStart(2, '0')}@splash.test`,
  role: 'READER',
}))

const paragraphs = (topic) => [
  `${topic} dominated the discussion in the press box, and the numbers back up what the eye could see: the decisive phase lasted barely a quarter of an hour but reshaped the table.`,
  `Coaching staffs had spent the week preparing for exactly this scenario, yet the execution still surprised everyone inside the stadium.`,
  `What follows is a section-by-section breakdown of how it unfolded, the decisions that mattered and what it means for the weeks ahead.`,
]

/** @type {Array<{slug:string,title:string,excerpt:string,cover:string,category:string,tags:string[],author:string,views:number,hoursAgo:number,sections:Array<{h:string,p:string[]}>}>} */
const ARTICLES = [
  {
    slug: 'arsenal-go-top-after-statement-win-over-manchester-city',
    title: 'Arsenal Go Top After Statement Win Over Manchester City',
    excerpt:
      'A relentless second-half display at the Emirates lifts the Gunners to the summit of the Premier League table.',
    cover: IMG.stadium,
    category: 'premier-league',
    tags: ['premier-league', 'arsenal', 'tactics'],
    author: 'melanie@splash.test',
    views: 18432,
    hoursAgo: 6,
    sections: [
      { h: 'A second half of pure intent', p: paragraphs('The turning point arrived seven minutes after the restart') },
      { h: 'The press that broke City', p: paragraphs('Arsenal squeezed the first pass and forced a succession of loose clearances') },
      { h: 'What it means for the title race', p: paragraphs('Three points clear, with a fixture list that now looks kinder') },
      { h: 'Manager reaction', p: paragraphs('The dressing room stayed calm, but the message afterwards was unmistakable') },
    ],
  },
  {
    slug: 'artetas-midfield-triangle-is-winning-arsenal-games',
    title: "Arteta's New-look Midfield Triangle Is Winning Arsenal Games",
    excerpt:
      'How the double pivot and a roaming number eight unlocked the most stubborn low blocks in the league.',
    cover: IMG.ball,
    category: 'premier-league',
    tags: ['premier-league', 'arsenal', 'tactics'],
    author: 'alexandre@splash.test',
    views: 9210,
    hoursAgo: 20,
    sections: [
      { h: 'The shape, in one diagram', p: paragraphs('The triangle inverts in possession and flattens out of it') },
      { h: 'Why the number eight matters', p: paragraphs('His positioning between the lines has produced the highest progressive carry rate in the division') },
      { h: 'Defensive trade-offs', p: paragraphs('The freedom granted comes at a cost that opponents are still learning to punish') },
    ],
  },
  {
    slug: 'how-3-4-2-1-formations-are-dominating-european-football',
    title: 'Tactical Breakdown: How 3-4-2-1 Formations Are Dominating European Football',
    excerpt:
      'Wing-backs, box midfields and the rare luxury of a back three — the shape that half the continent has copied.',
    cover: IMG.pitch,
    category: 'premier-league',
    tags: ['premier-league', 'tactics'],
    author: 'alexandre@splash.test',
    views: 7745,
    hoursAgo: 28,
    sections: [
      { h: 'From novelty to default', p: paragraphs('Two seasons ago it was a curveball; this winter it is a template') },
      { h: 'The box midfield advantage', p: paragraphs('Four central players against a pair creates overloads that cannot be solved by man-marking alone') },
      { h: 'How to beat it', p: paragraphs('Overloads wide of the wing-back and a runner attacking the blind side of the centre-backs') },
    ],
  },
  {
    slug: 'liverpool-edge-everton-merseyside-derby',
    title: 'Liverpool Edge Everton Merseyside Derby In Six-Point Shootout',
    excerpt:
      'A 78th-minute winner settles a tense Goodison Park encounter as the Reds climb into the top four.',
    cover: IMG.crowd,
    category: 'premier-league',
    tags: ['premier-league', 'liverpool'],
    author: 'david@splash.test',
    views: 14087,
    hoursAgo: 34,
    sections: [
      { h: 'A derby decided by margins', p: paragraphs('Few chances, many fouls and one moment of quality') },
      { h: 'The winner', p: paragraphs('A first-time finish from the edge of the box silenced the home end') },
      { h: 'Where both sides stand', p: paragraphs('Liverpool move into the top four; Everton remain pinned to the bottom third') },
    ],
  },
  {
    slug: 'saka-passed-fit-for-weekend-london-derby',
    title: 'Saka Passed Fit For Weekend London Derby After Scan Results',
    excerpt:
      'Medical staff are confident the winger will be available after only a minor knock in midweek action.',
    cover: IMG.action,
    category: 'premier-league',
    tags: ['premier-league', 'arsenal', 'injury'],
    author: 'melanie@splash.test',
    views: 6602,
    hoursAgo: 40,
    sections: [
      { h: 'The scan', p: paragraphs('Imaging showed no structural damage, only soft-tissue swelling') },
      { h: 'How the staff will manage him', p: paragraphs('A reduced load in training and a likely 60-minute appearance') },
      { h: 'Who else is available', p: paragraphs('Two midfielders return from suspension while the defence remains unchanged') },
    ],
  },
  {
    slug: 'power-rankings-player-of-the-season-race',
    title: "Power Rankings: Who Is Leading The Race For Player Of The Season?",
    excerpt:
      'Our writers rank the ten outstanding performers of the campaign so far, with one obvious leader.',
    cover: IMG.night,
    category: 'premier-league',
    tags: ['premier-league', 'rankings'],
    author: 'elena@splash.test',
    views: 11344,
    hoursAgo: 52,
    sections: [
      { h: '1–3: the contenders', p: paragraphs('The leading trio separates itself with end product and availability') },
      { h: '4–7: the dark horses', p: paragraphs('Form over six weeks has dragged two names into the conversation') },
      { h: 'Why the top pick stays put', p: paragraphs('Consistency across big games remains the tie-breaker our panel keeps returning to') },
    ],
  },
  {
    slug: 'against-all-odds-mbappe-real-madrid-late-el-clasico',
    title: 'AGAINST ALL ODDS: MBAPPÉ & REAL MADRID STRIKE LATE TO CLAIM EL CLÁSICO THRILLER',
    excerpt:
      'In an unforgettable clash at the Bernabéu, Real Madrid mounted a sensational second-half comeback with two goals in stoppage time.',
    cover: IMG.crowd,
    category: 'world-football',
    tags: ['real-madrid', 'la-liga', 'rankings'],
    author: 'melanie@splash.test',
    views: 41880,
    hoursAgo: 5,
    sections: [
      { h: 'Two goals in stoppage time', p: paragraphs('The Bernabéu had already emptied mentally when the equaliser arrived') },
      { h: 'The comeback, minute by minute', p: paragraphs('A back four became a back three and the wing-backs finally found room') },
      { h: 'What the winners take from it', p: paragraphs('Momentum, belief and a away trip that now looks far less daunting') },
    ],
  },
  {
    slug: 'tactical-analysis-arsenal-high-press-dismantled-favorites',
    title: 'Tactical Analysis: How Arsenal’s High Press Dismantled the Title Favorites',
    excerpt:
      'A deep dive into Mikel Arteta’s pressing scheme that disrupted build-up play and secured three crucial points.',
    cover: IMG.pitch,
    category: 'premier-league',
    tags: ['premier-league', 'arsenal', 'tactics'],
    author: 'alexandre@splash.test',
    views: 12008,
    hoursAgo: 26,
    sections: [
      { h: 'Trigger points', p: paragraphs('The first press was aimed at the goalkeeper’s first touch') },
      { h: 'Cutting the passing lanes', p: paragraphs('Two midfielders screened the pivot while the wide forwards tucked in') },
      { h: 'The cost of pressing this high', p: paragraphs('One ball over the top and the back line is running toward its own goal') },
    ],
  },
  {
    slug: 'ballon-dor-power-rankings-new-leader-emerges',
    title: "Ballon d'Or Power Rankings: New Leader Emerges After Spectacular Champions League Matchday",
    excerpt:
      'One extraordinary European night has reordered our standings, with a defender breaking into the top three for the first time.',
    cover: IMG.night,
    category: 'champions-league',
    tags: ['champions-league', 'rankings'],
    author: 'elena@splash.test',
    views: 16742,
    hoursAgo: 38,
    sections: [
      { h: 'The new leader', p: paragraphs('Eleven months of consistency finally outweighed one brilliant evening') },
      { h: 'Climbers and fallers', p: paragraphs('Two forwards dropped after quiet legs while a defender climbed four places') },
      { h: 'What would settle it', p: paragraphs('The next round of knockout ties should provide a definitive answer') },
    ],
  },
  {
    slug: 'bayern-munich-eyeing-premier-league-winger-80m',
    title: 'Bayern Munich Eyeing Premier League Winger in $80M Winter Swoop',
    excerpt:
      'The German champions are ready to spend big on a wide forward as they prepare for a key summer transition.',
    cover: IMG.action,
    category: 'transfers',
    tags: ['transfers', 'premier-league'],
    author: 'david@splash.test',
    views: 9903,
    hoursAgo: 11,
    sections: [
      { h: 'The scouting picture', p: paragraphs('Twelve months of live scouting reports have already been filed') },
      { h: 'Price and timing', p: paragraphs('The selling club wants the fee settled before the window opens') },
      { h: 'Alternative targets', p: paragraphs('Two wide players in Serie A remain on the shortlist as leverage') },
    ],
  },
  {
    slug: 'haaland-golden-boot-race-25-goals',
    title: 'Golden Boot Race: Haaland Reaches 25 Goals In Just 18 Games',
    excerpt:
      'The Norwegian has hit the net in nine consecutive league matches — a pace no striker has managed in a decade.',
    cover: IMG.ball,
    category: 'premier-league',
    tags: ['premier-league', 'rankings', 'golden-boot', 'man-city'],
    author: 'david@splash.test',
    views: 15990,
    hoursAgo: 60,
    sections: [
      { h: 'The numbers', p: paragraphs('A strike rate of 1.39 per game is the best return of his career') },
      { h: 'How he is scoring', p: paragraphs('Nearly two thirds come from six-yard-box touches rather than distance') },
      { h: 'The chasing pack', p: paragraphs('Four strikers remain within touching distance, but two of them are overperforming xG badly') },
    ],
  },
  {
    slug: '140m-bid-submitted-for-bundesliga-midfield-dynamo',
    title: '$140M Bid Submitted For Bundesliga Midfield Dynamo Ahead Of January Window',
    excerpt:
      'Premier League giants are ready to shatter transfer records to secure the prodigy before rival clubs intervene.',
    cover: IMG.action,
    category: 'transfers',
    tags: ['transfers', 'premier-league'],
    author: 'david@splash.test',
    views: 22105,
    hoursAgo: 8,
    sections: [
      { h: 'The offer', p: paragraphs('The package includes add-ons tied to appearances and continental qualification') },
      { h: 'Why now', p: paragraphs('Club officials believe a winter deal avoids a summer auction they expect to escalate') },
      { h: 'What the player wants', p: paragraphs('Playing time in a title-challenging side, plus a clear pathway that the current club insists exists') },
    ],
  },
  {
    slug: 'manchester-city-agree-terms-with-brazilian-phenom',
    title: 'Manchester City Agree Terms With 19-Year-Old Brazilian Phenom',
    excerpt:
      'Personal terms are settled on a five-year contract as the clubs negotiate the final fee.',
    cover: IMG.pitch,
    category: 'transfers',
    tags: ['transfers', 'man-city', 'premier-league'],
    author: 'elena@splash.test',
    views: 19873,
    hoursAgo: 14,
    sections: [
      { h: 'Personal terms agreed', p: paragraphs('A five-year deal with a significant performance-linked rise') },
      { h: 'The fee dispute', p: paragraphs('The selling club holds out for a fixed sum the buying side considers above market') },
      { h: 'Squad planning', p: paragraphs('The recruitment team views him as the long-term successor rather than an immediate starter') },
    ],
  },
  {
    slug: 'bayern-munich-join-race-for-premier-league-winger',
    title: 'Bayern Munich Join Race For Premier League Winger As Fees Rise',
    excerpt:
      'The German champions move into pole position after fresh contact with intermediaries.',
    cover: IMG.crowd,
    category: 'transfers',
    tags: ['transfers', 'premier-league'],
    author: 'elena@splash.test',
    views: 8450,
    hoursAgo: 22,
    sections: [
      { h: 'A new bidder', p: paragraphs('Contact was made through intermediaries late last week') },
      { h: 'Valuation gap', p: paragraphs('The selling club wants parity with last summer wide-forward deals') },
      { h: 'Contract situation', p: paragraphs('Two years remaining, which strengthens the seller’s hand considerably') },
    ],
  },
  {
    slug: 'real-madrid-stage-late-comeback-against-bayern',
    title: 'Real Madrid Stage Late Comeback Against Bayern In Quarter Final Classic',
    excerpt:
      'Two goals in stoppage time complete a famous European night at the Bernabéu.',
    cover: IMG.night,
    category: 'champions-league',
    tags: ['champions-league', 'real-madrid'],
    author: 'melanie@splash.test',
    views: 31207,
    hoursAgo: 18,
    sections: [
      { h: 'A night that refused to end', p: paragraphs('The stadium had emptied mentally long before the equaliser') },
      { h: 'The tactical shift', p: paragraphs('A back four became a back three and the wing-backs finally found space') },
      { h: 'Tie in balance', p: paragraphs('Away goals are gone, so the second leg becomes a straight knockout match') },
    ],
  },
  {
    slug: 'ucl-quarter-final-draw-psg-inter-milan',
    title: 'UCL Quarter Final Draw Confirmed: PSG To Face Inter Milan',
    excerpt:
      'The seeded ties are set after this afternoon’s ceremony in Nyon, with two blockbuster matchups.',
    cover: IMG.stadium,
    category: 'champions-league',
    tags: ['champions-league', 'serie-a'],
    author: 'elena@splash.test',
    views: 12668,
    hoursAgo: 30,
    sections: [
      { h: 'The ties', p: paragraphs('Two heavyweight pairings and one rematch of a semi-final from two seasons ago') },
      { h: 'Key battles', p: paragraphs('The full-back duel on one flank will likely decide the first leg') },
      { h: 'Schedule congestion', p: paragraphs('Both domestic leagues shuffle fixtures to accommodate the expanded calendar') },
    ],
  },
  {
    slug: 'inter-milan-go-top-after-five-goal-thriller',
    title: 'Inter Milan Go Top After Five-Goal Thriller at San Siro',
    excerpt: 'Lautaro Martínez scores two stunning volleys as Inter edge Napoli in a chaotic contest.',
    cover: IMG.night,
    category: 'world-football',
    tags: ['serie-a', 'rankings'],
    author: 'david@splash.test',
    views: 10231,
    hoursAgo: 44,
    sections: [
      { h: 'Chaos from the first whistle', p: paragraphs('Three goals inside the opening half hour') },
      { h: 'The two volleys', p: paragraphs('Both struck first time, both from deliveries nobody else attacked') },
      { h: 'Title implications', p: paragraphs('A two-point lead with a head-to-head still to come in May') },
    ],
  },
  {
    slug: 'barcelonas-young-guns-fire-them-clear-in-la-liga',
    title: "Barcelona's Young Guns Fire Them Clear At The Top Of La Liga",
    excerpt:
      'A 4-1 win extends the lead at the summit thanks to two assists from the academy graduate.',
    cover: IMG.action,
    category: 'world-football',
    tags: ['la-liga', 'barcelona', 'rankings'],
    author: 'alexandre@splash.test',
    views: 13490,
    hoursAgo: 66,
    sections: [
      { h: 'A generational display', p: paragraphs('Three teenagers featured and two of them decided the game') },
      { h: 'The academy dividend', p: paragraphs('Seven graduates have now started a league match this season') },
      { h: 'What comes next', p: paragraphs('A difficult away run begins in ten days') },
    ],
  },
]

const REPLIES = [
  'Watched this twice already — the second half was relentless.',
  'Genuinely think the midfield shape is the story nobody is talking about.',
  'Counter-point: they got away with two fouls in the build-up to that goal.',
]

const TOP_COMMENTS = [
  'This is the most complete performance we have put together all season.',
  'The pressing triggers in the first ten minutes were fascinating.',
  'I had us at 4th in August. Happy to be wrong about that.',
  'Great write-up — the passing network graphic says it all.',
  'That second-half change completely changed the game.',
]

async function main() {
  const existing = await prisma.article.count()
  if (existing > 0 && !force) {
    console.log(`Already ${existing} articles in the database — pass --force to reseed.`)
    return
  }

  if (force) {
    await prisma.commentLike.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.articleLike.deleteMany()
    await prisma.bookmark.deleteMany()
    await prisma.articleTag.deleteMany()
    await prisma.article.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    console.log('Cleared previous seed data.')
  }

  const passwordHash = await bcrypt.hash('Password123!', 10)
  const users = {}
  for (const author of [...AUTHORS, DEMO, ...FANS]) {
    users[author.email] = await prisma.user.upsert({
      where: { email: author.email },
      // Verified so the seeded accounts can sign in immediately.
      update: { role: author.role, emailVerifiedAt: new Date() },
      create: {
        name: author.name,
        email: author.email,
        password: passwordHash,
        role: author.role,
        emailVerifiedAt: new Date(),
      },
    })
  }

  const categories = {}
  for (const category of CATEGORIES) {
    categories[category.slug] = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { name: category.name, slug: category.slug },
    })
  }

  const tags = {}
  for (const name of TAGS) {
    tags[name] = await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), slug: name },
    })
  }

  let seeded = 0
  for (const article of ARTICLES) {
    const content = article.sections
      .map((section) => `<h2>${section.h}</h2>${section.p.map((p) => `<p>${p}</p>`).join('')}`)
      .join('')
    const record = await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content,
        coverImage: article.cover,
        status: 'PUBLISHED',
        views: article.views,
        publishedAt: new Date(Date.now() - article.hoursAgo * 3600_000),
        authorId: users[article.author].id,
        categoryId: categories[article.category].id,
        tags: { create: article.tags.map((slug) => ({ tagId: tags[slug].id })) },
      },
    })
    seeded++

    // Likes spread across the catalogue so counts look alive.
    const fanEmails = [...AUTHORS.map((a) => a.email), ...FANS.map((f) => f.email)]
    const likeCount = Math.min(Math.round(article.views / 900), fanEmails.length)
    for (let i = 0; i < likeCount; i++) {
      const liker = users[fanEmails[i]]
      await prisma.articleLike.upsert({
        where: { userId_articleId: { userId: liker.id, articleId: record.id } },
        update: {},
        create: { userId: liker.id, articleId: record.id },
      })
    }
  }

  // Comments with threaded replies on three articles, empty everywhere else
  // so the empty state is exercised too.
  const commented = [ARTICLES[6], ARTICLES[2], ARTICLES[0], ARTICLES[10], ARTICLES[7]]
  for (const [index, article] of commented.entries()) {
    const record = await prisma.article.findUnique({ where: { slug: article.slug } })
    const exists = await prisma.comment.count({ where: { articleId: record.id } })
    if (exists > 0) continue

    for (let i = 0; i <= index; i++) {
      const author = users[AUTHORS[(i + index) % AUTHORS.length].email]
      const parent = await prisma.comment.create({
        data: {
          content: TOP_COMMENTS[(i + index) % TOP_COMMENTS.length],
          userId: author.id,
          articleId: record.id,
        },
      })
      await prisma.commentLike.createMany({
        data: [
          { userId: users[DEMO.email].id, commentId: parent.id },
          { userId: users[AUTHORS[0].email].id, commentId: parent.id },
          { userId: users[FANS[0].email].id, commentId: parent.id },
        ],
        skipDuplicates: true,
      })
      const reply = await prisma.comment.create({
        data: {
          content: REPLIES[(i + index) % REPLIES.length],
          userId: users[AUTHORS[(i + 1) % AUTHORS.length].email].id,
          articleId: record.id,
          parentId: parent.id,
        },
      })
      await prisma.commentLike.create({
        data: { userId: users[DEMO.email].id, commentId: reply.id },
      })
    }
  }

  const [articles, comments, likes] = await Promise.all([
    prisma.article.count(),
    prisma.comment.count(),
    prisma.articleLike.count(),
  ])
  console.log(
    `Seeded ${seeded} articles (${articles} total), ${comments} comments, ${likes} article likes.`,
  )
  console.log('Demo login: reader@splash.test / Password123!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
