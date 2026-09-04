import type { CourseContent } from '../academy-types'

// Spa Revenue Fundamentals - the exemplar of the Talent House course standard.
// Every module: why it matters, outcomes, structured teaching with worked
// numbers, a visual that explains something, a scenario, a practical
// activity, a formative knowledge check, key terms, a case study, a
// takeaway and a next step. Built to be USED at work, not read.

const content: CourseContent = {
  slug: 'spa-revenue-fundamentals',
  aims: 'This course teaches the commercial arithmetic of a spa: what capacity really is, how utilisation and average treatment rate combine into RevPATH, and how pricing and demand decisions change the number at the bottom. By the end, a therapist, supervisor or new manager can read their spa\'s performance the way a director does - and explain, with numbers, why one decision beats another. Every module uses the same worked example spa so the figures build into a complete picture.',
  audience: 'Therapists moving toward senior or supervisory roles, new spa managers who have inherited a P&L without training, reception and coordination staff who control the diary, and anyone in a spa who wants to understand the numbers behind the rota.',
  prerequisites: 'None. The maths never goes beyond multiplication, division and percentages, and every calculation is worked in full.',
  outcomes: [
    'Calculate a spa\'s true sellable capacity in room-hours and therapist-hours',
    'Measure utilisation correctly and read it by daypart rather than by day',
    'Calculate and interpret average treatment rate and revenue per available treatment hour (RevPATH)',
    'Explain how pricing, demand-shaping and the booking diary move RevPATH',
    'Diagnose a underperforming week using the demand → capacity → pricing → utilisation → RevPATH chain',
    'Present a commercial recommendation with the numbers to support it',
  ],
  author: { name: 'Talent House Academy', role: 'Developed by Wellness House Collective', note: 'Reviewed by the Talent House editorial team. Figures in worked examples are illustrative of typical UK luxury spa operations.' },
  references: [
    { label: 'UK Spa Association - industry resources and operational guidance', url: 'https://www.spa-uk.org' },
    { label: 'Global Wellness Institute - wellness economy research', url: 'https://globalwellnessinstitute.org' },
    { label: 'Your own spa\'s booking system reports - the most valuable reference in this course is your live diary data' },
  ],
  lastReviewed: '2026-08-31',
  version: '1.0',
  lessons: [
    {
      title: 'Understanding Spa Capacity',
      whyThisMatters: 'Every conversation about spa revenue starts with one ceiling: how many treatment hours could this spa possibly sell? Managers who cannot state their capacity precisely end up arguing about marketing when the real problem is an empty Tuesday room - or turning away Saturday guests a better diary could have served. Capacity is the denominator of every metric in this course.',
      objectives: [
        'Distinguish theoretical capacity from sellable capacity',
        'Calculate room-hours and therapist sellable hours for a real week',
        'Identify which of the two is the binding constraint on any given day',
      ],
      sections: [
        {
          heading: 'Two ceilings, and the lower one wins',
          body: 'A spa has two capacities, and revenue is capped by whichever is lower at any moment.\n\nRoom capacity is physical: treatment rooms multiplied by open hours. Our worked example throughout this course is The Linden Spa - a luxury hotel spa with 6 treatment rooms, open 9:00 to 19:00, seven days a week. Its theoretical room capacity is 6 rooms × 10 hours = 60 room-hours per day, 420 per week. No marketing budget on earth sells the 421st hour.\n\nTherapist capacity is human: how many treatment hours the rostered team can actually deliver. This is where most managers over-estimate, because a rostered hour is not a sellable hour. A therapist on an 8-hour shift loses roughly an hour to lunch and short breaks, and 5-10 minutes between every treatment to reset the room, wash up and read the next consultation form. In practice a well-run 8-hour shift yields about 5.5 to 6 sellable treatment hours.\n\nSo when The Linden rosters 5 therapists on a Tuesday, its therapist capacity is about 5 × 5.75 = 28.75 sellable hours - against 60 room-hours of physical space. On Tuesday, therapists are the constraint and half the rooms will sit dark whatever happens. On Saturday, with 8 therapists rostered (46 sellable hours), rooms start to bind during the afternoon peak. Knowing which ceiling binds, hour by hour, is the first skill of revenue management.',
        },
        {
          heading: 'Calculating sellable capacity honestly',
          body: 'The calculation is simple; the discipline is in the honesty of the assumptions.\n\nStep 1 - room-hours: rooms × open hours, minus any hours a room is genuinely unavailable (maintenance, a room dedicated to a training morning). The Linden: 6 × 10 = 60 per day.\n\nStep 2 - sellable therapist-hours: for each rostered shift, shift length minus breaks minus changeover time. Use your spa\'s real figures, not hopes: if your treatments are mostly 60 minutes with a 10-minute reset, each treatment consumes 70 minutes of therapist time, so an 8-hour shift with an hour of breaks delivers 7 hours × (60/70) ≈ 6 treatment-hours at absolute best - call it 5.75 to be honest about consultations that run long.\n\nStep 3 - the binding constraint per daypart: line the two numbers up morning, afternoon and evening. Rooms bind when the spa is busy and well-staffed; therapists bind when the rota is thin.\n\nA common trap: counting the multi-purpose or relaxation room as capacity when it cannot take a massage couch, or counting a therapist who only does nails against demand that is 80% massage. Capacity is only real when it can serve the demand that actually arrives - which is why skill mix belongs in the capacity conversation, not just headcount.',
        },
        {
          heading: 'Why capacity is a weekly decision, not a fixed fact',
          body: 'The rooms are fixed. Almost nothing else is. Opening hours can flex seasonally. The rota moves therapist capacity up and down every week - which means capacity planning IS rota planning, and the weekly rota is the biggest revenue decision most spas make without noticing.\n\nThe practical rhythm: every week, before the rota is published, compare forecast demand (booking pace, hotel occupancy, last year\'s pattern) against planned sellable hours by daypart. Where demand exceeds therapist capacity, you are about to turn money away - add hours, or move them from a daypart with slack. Where therapist capacity exceeds likely demand by a wide margin, you are about to pay for empty hands - trim, retrain, or move the hours to marketing-supported slots.\n\nThe Linden\'s numbers make it concrete: its Saturday demand routinely books 44 of a possible 46 sellable hours (nearly full), while Tuesday books 12 of 28.75 (42%). Same rooms, same brand, same prices - the difference is that capacity was planned against Saturday\'s demand and merely inherited on Tuesday.',
        },
      ],
      visuals: [
        { kind: 'table', title: 'The Linden Spa - capacity by day (worked example)', headers: ['', 'Rooms × hours', 'Room-hours', 'Therapists', 'Sellable hours', 'Binding constraint'], rows: [
          ['Tuesday', '6 × 10', '60', '5', '28.75', 'Therapists'],
          ['Friday', '6 × 10', '60', '7', '40.25', 'Therapists'],
          ['Saturday', '6 × 10', '60', '8', '46.0', 'Rooms (2-5pm peak)'],
        ], caption: 'Sellable hours assume 5.75 treatment-hours per 8-hour shift after breaks and resets. The constraint that binds changes with the rota.' },
        { kind: 'image_placeholder', title: 'IMAGE: Treatment room set-up example', description: 'A photograph of a prepared treatment room helps new team members connect "room-hours" to the physical asset being sold. Admin can upload via Academy Downloads.' },
      ],
      scenario: 'Your spa director asks: "Can we take a group booking of 10 massages next Tuesday between 10:00 and 13:00?" You have 6 rooms and 5 therapists rostered that morning, of whom 4 can deliver massage. Each massage is 60 minutes plus a 10-minute reset. Before reading on, work out: how many massages CAN you deliver in that window, and what would you need to change to say yes?',
      activity: 'Calculate your own spa\'s capacity for next week. Write down: (1) room-hours per day; (2) sellable therapist-hours per day using shift length minus breaks minus realistic changeover; (3) for each day, which constraint binds. If you do not manage the rota, ask for a copy - the exercise works the same. Keep this sheet: modules 2 and 4 build on it.',
      knowledgeCheck: [
        { q: 'A spa has 8 rooms open 10 hours a day, and 6 therapists each delivering 5.75 sellable hours. What is today\'s sellable capacity?', options: ['80 hours - the rooms set the ceiling', '34.5 hours - the therapists are the binding constraint', '48 hours - therapists × 8-hour shifts', '60 hours - a safe average of the two'], answer: 1, why: 'Revenue is capped by the LOWER of the two ceilings. 6 × 5.75 = 34.5 sellable therapist-hours, well below the 80 room-hours - so therapists bind, and 45.5 room-hours will sit unused whatever marketing does.' },
        { q: 'Why is an 8-hour rostered shift not 8 sellable hours?', options: ['Because therapists work slowly', 'Because breaks, room resets and consultation time consume roughly a quarter of the shift', 'Because guests often cancel', 'It is 8 sellable hours if the diary is managed well'], answer: 1, why: 'Breaks (about an hour) and the 5-10 minute reset between every treatment are structural, not inefficiency. Honest capacity maths uses 5.5-6 sellable hours per 8-hour shift.' },
        { q: 'Your Saturday afternoon is fully booked and turning guests away, while Tuesday runs at 40%. The most accurate description is:', options: ['The spa needs more marketing', 'The spa has a capacity problem', 'The spa has a capacity ALLOCATION problem - hours are planned against the wrong days', 'The spa should raise prices across the board'], answer: 2, why: 'Total weekly capacity may be fine; it is pointed at the wrong days. Moving rostered hours toward proven demand beats both blanket marketing and blanket pricing changes.' },
      ],
      keyTerms: [
        { term: 'Room-hours', definition: 'Treatment rooms multiplied by open hours - the physical ceiling on what a spa can sell.' },
        { term: 'Sellable hours', definition: 'The treatment hours a rostered team can genuinely deliver after breaks, resets and consultation time; typically 5.5-6 per 8-hour shift.' },
        { term: 'Binding constraint', definition: 'Whichever of room capacity or therapist capacity is lower at a given time - the one that actually caps revenue.' },
        { term: 'Skill mix', definition: 'The spread of treatments a rostered team can deliver; capacity only counts when it can serve the demand that arrives.' },
      ],
      caseStudy: {
        title: 'The group booking The Linden nearly refused',
        scenario: 'A corporate group asks The Linden for 12 massages on a Thursday between 14:00 and 17:00. The spa manager\'s first instinct is to refuse: "we only have 6 rooms." The coordinator does the maths instead. The window is 3 hours; each massage occupies a room for 70 minutes, so each room can host 2 massages in the window with 40 minutes spare. Six rooms × 2 = 12 - exactly feasible on rooms. Therapists: 5 rostered, 4 massage-qualified, each able to deliver 2 massages in the window = 8. Four short.',
        insight: 'The room maths said yes; the therapist maths said not yet. Because the constraint was identified precisely, the fix was precise too: two agency therapists booked for a 3-hour window (at a known cost of £150) against £1,080 of group revenue, and one in-house therapist\'s shift moved by two hours. The booking was taken profitably. Capacity thinking did not change what the spa had - it changed what the spa could see. A manager who says "we\'re full" or "we can fit you in" without this arithmetic is guessing in both directions.',
      },
      summary: 'Capacity is two ceilings - physical room-hours and honest sellable therapist-hours - and the lower one caps revenue at every moment. Rooms are fixed; the rota moves the other ceiling every week, which makes the rota a revenue decision. State your capacity precisely and half the arguments about performance answer themselves.',
      nextStep: 'Before your next shift, find out (or work out) your spa\'s sellable capacity for that day - and notice which constraint binds in the morning versus the afternoon.',
    },
    {
      title: 'Utilisation',
      whyThisMatters: 'Utilisation is the single number that tells you whether the capacity you are paying for is earning. Two spas with identical rooms, prices and payroll can differ by tens of thousands of pounds a year purely on utilisation - and the difference is usually invisible in a daily "busy or quiet?" impression, because averages hide the dayparts where the money leaks.',
      objectives: [
        'Calculate utilisation against sellable capacity, not rostered hours',
        'Read utilisation by daypart and spot the patterns a daily average hides',
        'Know the healthy operating band and what readings outside it mean',
      ],
      sections: [
        {
          heading: 'The calculation, and the honest denominator',
          body: 'Utilisation = booked treatment hours ÷ sellable capacity hours.\n\nThe numerator is easy - your booking system knows the treatment hours delivered. The denominator is where honesty matters: divide by SELLABLE hours (module 1), not rostered hours, and not room-hours on days when therapists bind.\n\nThe Linden\'s Tuesday: 12 booked hours ÷ 28.75 sellable = 42% utilisation. Its Saturday: 44 ÷ 46 = 96%.\n\nWhy the denominator discipline matters: measured against rostered hours (5 × 8 = 40), Tuesday would read as 30% - alarming. Against room-hours (60), 20% - catastrophic. Against sellable hours, 42% - poor but precise. You cannot fix a number you have mis-measured, and you especially cannot compare weeks or negotiate rota changes with a director using a number that moves depending on who calculated it.',
        },
        {
          heading: 'Averages lie: read by daypart',
          body: 'A day that averages 70% utilisation is almost never 70% all day. It is a 95% morning stacked on a 45% late afternoon, or the reverse. The response to each daypart is different, so the average is close to useless for decisions.\n\nBuild a simple grid - days across the top, dayparts down the side (9-12, 12-3, 3-6, 6-7 works for most spas) - and fill it with four weeks of utilisation. Patterns appear immediately and they are remarkably stable: the Saturday 2pm wall of demand, the midweek dead zone, the surprising Friday evening. This grid is the treasure map for every module that follows: peak protection (module 5) defends the dark green squares; demand-shaping fills the pale ones; the rota (module 1) should mirror the grid\'s shape.\n\nOne warning: utilisation of therapist time and utilisation of rooms can tell different stories in the same daypart. If Saturday afternoon shows 96% therapist utilisation and 65% room utilisation, the bottleneck is hands, not space - one agency therapist adds revenue; a seventh room would add nothing.',
        },
        {
          heading: 'What good looks like - and why 100% is not the target',
          body: 'Across well-run spas, sustained utilisation of 65-80% of sellable hours is healthy. Below about 55%, you are paying for empty hands - a demand problem, an allocation problem, or both. Above about 85% for sustained periods, you are running hot: no room for walk-ins or VIP requests, no slack when a therapist calls in sick, treatments back-to-back all day with the injury risk that carries, and - commercially - proof that your prices are too low for your demand at those times (module 5\'s subject).\n\n100% utilisation is not a triumph; it is a queue you cannot see. Every fully-booked daypart contains guests who wanted to book and could not. The aim is a diary that runs deliberately warm at the peaks, deliberately activated in the troughs, with the difference between them narrowed over time by pricing, packaging and rota design.\n\nUtilisation is also the fastest health-check when revenue falls: if utilisation held but revenue dropped, the problem is rate (module 3). If utilisation fell, the problem is demand or diary. Ten seconds with two numbers replaces an hour of speculation.',
        },
      ],
      visuals: [
        { kind: 'table', title: 'The Linden - utilisation by daypart (four-week average)', headers: ['Daypart', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], rows: [
          ['9:00-12:00', '38%', '41%', '45%', '58%', '88%', '79%'],
          ['12:00-15:00', '46%', '49%', '55%', '71%', '97%', '90%'],
          ['15:00-18:00', '44%', '47%', '58%', '78%', '95%', '72%'],
          ['18:00-19:00', '30%', '33%', '49%', '70%', '61%', '41%'],
        ], caption: 'The daily averages (Tue 42%, Sat 92%) hide the real geography: a midweek morning problem and a Saturday midday wall. Decisions live in the squares, not the averages.' },
        { kind: 'flow', title: 'The ten-second revenue diagnosis', steps: ['Revenue is down', 'Did utilisation fall?', 'YES → demand or diary problem (marketing, allocation, booking flow)', 'NO → rate problem (mix, discounting, treatment length - module 3)'], caption: 'Two numbers split every revenue conversation into the right half of the map before anyone proposes a fix.' },
      ],
      scenario: 'Your director says: "Revenue was £4,100 down last month - I want a promotion running by Friday." You pull the numbers: utilisation was flat at 71% both months; average treatment rate fell from £96 to £88. What do you say in tomorrow\'s meeting - and why would the promotion have made things worse?',
      activity: 'Build your spa\'s daypart grid for the last four full weeks: four dayparts down the side, seven days across the top, utilisation in each cell (booked hours ÷ sellable hours). Shade anything above 85% and anything below 50%. Bring it to your next management conversation - it will change what gets discussed.',
      knowledgeCheck: [
        { q: 'Booked treatment hours were 22 today; sellable hours were 34.5. Utilisation is:', options: ['64%', '73%', '58%', '46%'], answer: 0, why: '22 ÷ 34.5 = 0.638 → 64%. Inside the healthy 65-80% band, just. The habit to build is dividing by sellable hours every time - not rostered, not room-hours.' },
        { q: 'Sustained 92% utilisation across every daypart most strongly suggests:', options: ['Excellent management - aim to hold it', 'Under-pricing at peak and invisible turned-away demand', 'The spa needs fewer therapists', 'Nothing - higher is always better'], answer: 1, why: 'Above ~85% sustained means guests who wanted to book could not, no operational slack, and prices below what demand would bear at peak. It is a queue you cannot see - and module 5\'s pricing levers are the answer.' },
        { q: 'Revenue fell 9% but utilisation held steady. The first place to look is:', options: ['Marketing spend', 'The booking website', 'Average treatment rate - mix, discounting or shorter treatments', 'Therapist punctuality'], answer: 2, why: 'Volume held; value per hour fell. That is a rate story: guests trading down, promotions leaking into full-price demand, or a mix shift toward shorter or cheaper treatments.' },
      ],
      keyTerms: [
        { term: 'Utilisation', definition: 'Booked treatment hours divided by sellable capacity hours - the share of the capacity you pay for that actually earns.' },
        { term: 'Daypart', definition: 'A distinct segment of the trading day analysed separately; the level at which utilisation patterns become decisions.' },
        { term: 'Healthy band', definition: 'Sustained utilisation of roughly 65-80% of sellable hours; below ~55% signals waste, above ~85% signals strain and under-pricing.' },
        { term: 'Turned-away demand', definition: 'Guests who tried to book and could not - invisible in utilisation figures, visible in a refusal log or full dayparts.' },
      ],
      caseStudy: {
        title: 'The "quiet spa" that was actually full',
        scenario: 'A new manager inherits a spa the owner describes as "never busy - look at the numbers": 61% average utilisation, revenue flat for two years. Her predecessor ran two discount campaigns a year to "fill the place up", with little lasting effect. Her first week, she builds the daypart grid instead of launching a third campaign. It shows 9-12 weekdays at 34%... and Friday-through-Sunday afternoons pinned at 93-98%, with reception confirming they turn away 15-25 booking requests every weekend.',
        insight: 'The spa did not have a demand problem; it had two opposite problems wearing one average. The discount campaigns had been actively harmful - they could only be redeemed at weekends, adding discounted demand to dayparts already turning away full-price guests. Her response worked both ends: weekend prices up 8% with zero volume loss (the queue absorbed it), a fenced midweek-morning product for the local retired market, and two rostered hours moved from Tuesday to Saturday. Revenue rose 14% in a quarter with no marketing spend. The grid did not create the opportunity - it had been sitting in the booking system for two years. It made it visible.',
      },
      summary: 'Utilisation - booked hours over sellable hours - is the earning rate of the capacity you pay for. Read it by daypart, never by average; hold the 65-80% band; treat sustained readings above 85% as under-pricing, not success. Paired with rate, it splits every revenue problem into the right half of the map in ten seconds.',
      nextStep: 'Start a turned-away log at reception this week: every request you could not fit, with day and time. Four weeks of it turns "I think weekends are full" into a pricing case (module 5).',
    },
    {
      title: 'Average Treatment Rate',
      whyThisMatters: 'If utilisation is how MUCH of your capacity sells, average treatment rate is how WELL it sells. It is the number that moves silently - a promotion here, a mix drift there - until a busy spa discovers it is earning less per hour than it did a year ago. Managers who track ATR catch in a week what others explain to their director six months too late.',
      objectives: [
        'Calculate average treatment rate and average rate per treatment HOUR - and know why they differ',
        'Identify the three forces that move ATR: menu mix, discounting and duration',
        'Use ATR alongside utilisation to read any revenue change correctly',
      ],
      sections: [
        {
          heading: 'Two averages, one trap',
          body: 'Average treatment rate (ATR) = treatment revenue ÷ number of treatments. The Linden last week: £24,150 across 253 treatments = £95.45 ATR.\n\nUseful - but incomplete, because treatments are not the same length. A £95 30-minute express and a £95 90-minute ritual have identical ATR and wildly different economics: one earns £190 per treatment hour, the other £63.\n\nSo the sharper measure is average rate per treatment HOUR: treatment revenue ÷ booked treatment hours. The Linden: £24,150 ÷ 246 hours = £98.17 per hour. This is the number that connects to capacity - because capacity is sold in hours, not in treatment counts.\n\nThe trap the two averages expose: a spa can grow its ATR while its rate per hour falls, simply by selling longer treatments at a modest premium. A 90-minute massage at £150 lifts ATR versus a 60-minute at £120 - but earns £100/hour versus £120/hour. Neither number is "wrong"; they answer different questions. Count in hours whenever the conversation is about capacity, rota or RevPATH.',
        },
        {
          heading: 'The three forces that move the rate',
          body: 'When rate moves, one of three things happened - and each has a different owner and fix.\n\nMix: the blend of what sold shifted. More express facials and fewer signature rituals drops the rate without a single price changing. Mix moves with who is booking (hotel guests buy differently from locals), with what reception suggests first, with what the website showcases, and with which therapists are on (guests follow their favourite\'s specialities). Read mix by listing revenue share by treatment monthly.\n\nDiscounting: the silent leak. Every voucher, package rate, member discount and "manager\'s gesture" lands in the same revenue line. A spa that discounts 15% of its bookings by 20% has cut its rate by 3% - about £8,700 a year at The Linden\'s volume - often without anyone deciding to. Read it by tracking the gap between menu (rack) rate and achieved rate.\n\nDuration creep: treatments quietly running long. A 60-minute massage that habitually runs 70 minutes with the same price has cut its hourly rate by 14% and eaten reset time besides. Kindness is not the enemy - unmanaged kindness is.\n\nThe discipline: when the rate moves more than 2-3%, name which force moved it before proposing any fix. The fixes do not overlap: mix responds to steering and menu design, discounting to fences and approval rules, duration to training and scheduling honesty.',
        },
        {
          heading: 'Rate × utilisation: reading revenue like a professional',
          body: 'Here is the tool this module and the last one build together. Any revenue change decomposes into volume (utilisation) and value (rate per hour):\n\nRevenue = sellable hours × utilisation × rate per hour.\n\nThe Linden\'s week: 231 sellable hours × 71% utilisation × £98.17 ≈ £16,100 midweek revenue. When a director asks "why is revenue down?", the professional answer names which factor moved: "Utilisation held at 71%; rate fell £6 because the spring promotion leaked into weekend bookings" is a diagnosis. "It was quiet" is a shrug.\n\nThis is also how you evaluate any commercial idea BEFORE running it. A 20%-off midweek promotion must lift midweek volume by a full quarter just to stand still on revenue (0.8 × 1.25 = 1.00 exactly) - and by more in practice, because some redemptions displace bookings that would have paid full price. A £5 price rise on the signature massage (sold 60 times a week) is £15,600 a year if volume holds - and volume usually holds when the peak is queuing. Run the two-factor arithmetic on every proposal and weak ideas eliminate themselves.',
        },
      ],
      visuals: [
        { kind: 'table', title: 'Same revenue, different economics', headers: ['Treatment', 'Price', 'Duration', 'ATR effect', 'Rate per hour'], rows: [
          ['Express facial', '£65', '30 min', 'Lowers ATR', '£130/hr'],
          ['Signature massage', '£120', '60 min', 'Near ATR', '£120/hr'],
          ['Luxury ritual', '£150', '90 min', 'Raises ATR', '£100/hr'],
          ['Spa day package (pp)', '£95', '75 min', 'Near ATR', '£76/hr'],
        ], caption: 'The ritual flatters the ATR while earning the least per hour of the treatments; the express does the reverse. Count in hours whenever capacity is the question.' },
        { kind: 'flow', title: 'When the rate moves, name the force first', steps: ['Rate moved >2-3%', 'Check MIX: revenue share by treatment', 'Check DISCOUNTING: achieved vs menu rate', 'Check DURATION: actual vs scheduled minutes', 'Fix the force that moved - they do not share fixes'] },
      ],
      scenario: 'Reception proposes featuring the 90-minute ritual (£150) on the homepage instead of the 60-minute signature (£120), "because it\'s our most premium treatment". Saturday afternoons already run at 95% utilisation. Using rate-per-hour thinking: what happens to Saturday revenue if the feature works and guests switch? Would your answer change for Tuesday morning?',
      activity: 'Pull last month\'s numbers and calculate both averages for your spa: ATR (revenue ÷ treatments) and rate per treatment hour (revenue ÷ booked hours). Then list your five best-selling treatments with each one\'s rate per hour, including reset time in the divisor. Rank them. The ranking almost never matches the team\'s instinct about which treatments "matter most".',
      knowledgeCheck: [
        { q: 'Revenue £18,400; 205 treatments; 190 booked hours. Rate per treatment hour is:', options: ['£89.76', '£96.84', '£112.20', '£82.10'], answer: 1, why: '£18,400 ÷ 190 hours = £96.84. (ATR would be £18,400 ÷ 205 = £89.76 - the other option, answering a different question.)' },
        { q: 'A spa\'s ATR rose 4% while rate per hour fell 3%. The most likely cause:', options: ['Discounting increased', 'Guests shifted toward longer treatments at a modest premium', 'Prices were cut', 'The booking system is broken'], answer: 1, why: 'Longer treatments raise revenue per TREATMENT while lowering revenue per HOUR when the premium does not match the extra time - the classic divergence between the two averages.' },
        { q: 'A blanket 20%-off promotion (applied to all bookings) needs what volume lift just to hold revenue level?', options: ['About 10%', 'About 20%', 'About 25%', 'About 40%'], answer: 2, why: '0.8 × (1 + L) = 1.0 → L = 25% (the general rule: d ÷ (1 - d)). And that is the FLOOR - in practice you need more, because some redemptions displace bookings that would have paid full price. Most promotions never clear the bar, which is why the arithmetic comes before the artwork.' },
      ],
      keyTerms: [
        { term: 'Average treatment rate (ATR)', definition: 'Treatment revenue divided by number of treatments - value per sale, blind to duration.' },
        { term: 'Rate per treatment hour', definition: 'Treatment revenue divided by booked treatment hours - value per unit of capacity, the number that connects to the rota and RevPATH.' },
        { term: 'Mix', definition: 'The blend of treatments sold; shifts in mix move the averages without any price changing.' },
        { term: 'Achieved rate vs menu rate', definition: 'What was actually paid versus what the menu says; the gap is your true discounting level, wherever it hides.' },
        { term: 'Duration creep', definition: 'Treatments habitually running past their scheduled time at the same price - an invisible cut to the hourly rate.' },
      ],
      caseStudy: {
        title: 'The busiest month that earned less',
        scenario: 'The Linden\'s October: 8% more treatments than September, utilisation up 4 points - and treatment revenue DOWN £1,900. The owner suspects theft; the manager suspects the numbers. Decomposition takes twenty minutes: rate per hour fell from £98 to £87. Mix analysis shows why: a "Autumn Reset" package (75 minutes, £76/hour equivalent) sold brilliantly - 61 packages - and its buyers were one-third existing regulars who would otherwise have booked the £120/hour signature.',
        insight: 'Nothing was stolen; value per hour was traded away for volume the spa did not need in the dayparts the package sold into (the package had no daypart fence, so 40% redeemed at weekends). The repair kept the genuinely good part - the package recruited 40 new guests - and fixed the leak: midweek-only validity, price up £10, and reception trained to hold regulars on their usual treatments. November: volume gave back 3 points of utilisation, revenue rose £2,300. The lesson the manager wrote on the office whiteboard: "Busy is a feeling. Rate per hour is a fact."',
      },
      summary: 'Track both averages - per treatment and per hour - and reach for the hourly one whenever capacity is in the conversation. When the rate moves, name the force (mix, discounting, duration) before fixing anything, and read every revenue change through rate × utilisation. Value per hour is where busy spas quietly lose money.',
      nextStep: 'Calculate the achieved-versus-menu-rate gap for last month. If you have never measured it, expect a surprise - then find which discounts caused it and ask which of them ever earned their keep.',
    },
    {
      title: 'RevPATH',
      whyThisMatters: 'RevPATH - revenue per available treatment hour - is the one number that combines everything so far: capacity, utilisation and rate, in a single figure a director can steer by. It is the spa\'s equivalent of the hotel\'s RevPAR, and walking into a leadership meeting fluent in it changes how seriously your commercial judgement is taken.',
      objectives: [
        'Calculate RevPATH and decompose it into utilisation × rate per hour',
        'Benchmark RevPATH by daypart and track it weekly',
        'Choose the correct lever - volume or value - from a RevPATH movement',
      ],
      sections: [
        {
          heading: 'One number that cannot be gamed',
          body: 'RevPATH = treatment revenue ÷ AVAILABLE (sellable) treatment hours.\n\nNote the denominator: available hours, not booked hours. That single choice is what makes RevPATH honest. Rate per hour (module 3) can look splendid while half the diary sits empty - it only counts the hours that sold. RevPATH charges you for the empty ones.\n\nThe Linden\'s week: £24,150 revenue ÷ 299 sellable hours = £80.77 RevPATH.\n\nAnd the beautiful identity underneath it: RevPATH = utilisation × rate per hour. Check: 82.3% (246 booked ÷ 299 sellable) × £98.17 = £80.77 - the same number. The RevPATH calculator in Resources &amp; Tools reproduces this exact example. This identity is the whole toolkit in one line: any RevPATH change MUST have come through utilisation, rate, or both, and you already know (modules 2 and 3) how to chase each one to its cause.\n\nThat is also why RevPATH cannot be gamed the way single metrics can. Fill the diary with discounts and utilisation rises while rate falls - RevPATH barely moves. Push prices past what demand bears and rate rises while utilisation falls - RevPATH tells on you. It rewards only genuine improvement.',
        },
        {
          heading: 'Using RevPATH: weekly, by daypart, against yourself',
          body: 'RevPATH earns its keep as a tracked series, not a one-off calculation.\n\nWeekly: one number per week, on a chart on the office wall. Trends appear in four weeks that monthly reporting hides for a quarter.\n\nBy daypart: The Linden\'s Saturday afternoon runs £118 RevPATH; Tuesday morning runs £31. That 4:1 spread IS the commercial agenda - every initiative in the spa should be traceable to raising a specific square\'s RevPATH. It also prices decisions: an hour of therapist time moved from Tuesday morning to Saturday (module 1) is worth roughly £87 a week; a Tuesday activation that lifts the morning to £45 is worth £42 a week per hour activated - both now comparable in one currency.\n\nAgainst yourself: published cross-industry RevPATH benchmarks are scarce and definitions vary, so the honest benchmark is your own spa: this week versus last, this quarter versus last year, daypart versus daypart. What matters is the direction and the decomposition, not a league table. (When you do compare with another spa, agree the denominator first - a spa using room-hours will look artificially worse than one using sellable therapist-hours.)',
        },
        {
          heading: 'From number to decision',
          body: 'The professional habit is a fixed little routine whenever RevPATH moves or a target is set.\n\n1. Decompose: which factor moved - utilisation or rate? (Ten seconds, module 2\'s flow.)\n2. Localise: which dayparts carry the movement? (The grid.)\n3. Name the force: for rate - mix, discounting, duration; for utilisation - demand, allocation, diary friction.\n4. Choose the lever that matches: fenced offers or activation for soft dayparts; price, upgrade paths or length-mix steering for cheap-but-full ones; rota reallocation when the two are mismatched.\n5. Price the action in RevPATH terms before doing it: "this should add £6 of Tuesday-morning RevPATH; review in four weeks."\n\nRun that loop monthly and you are, functionally, doing revenue management - the same discipline hotels run on rooms, sized for a spa diary. Module 5 goes deeper into the pricing levers; module 6 makes you run the whole loop on a realistic case.',
        },
      ],
      visuals: [
        { kind: 'flow', title: 'The revenue engine', steps: ['DEMAND (who wants to book, when)', 'CAPACITY (sellable hours you point at that demand)', 'PRICING (what each hour sells for)', 'UTILISATION (share of hours that sell)', 'RevPATH (revenue ÷ available hours)', 'REVENUE (RevPATH × available hours)'], caption: 'Every commercial decision in a spa pushes on one link of this chain. RevPATH is where the chain becomes one steerable number.' },
        { kind: 'table', title: 'The Linden - RevPATH decomposition by daypart', headers: ['Daypart', 'Utilisation', 'Rate/hour', 'RevPATH'], rows: [
          ['Tuesday 9-12', '38%', '£82', '£31'],
          ['Friday 15-18', '78%', '£101', '£79'],
          ['Saturday 12-15', '97%', '£122', '£118'],
        ], caption: 'Same spa, same week. The 4:1 spread between squares is the commercial agenda, and the decomposition shows which lever each square needs.' },
      ],
      scenario: 'Your owner sets a target: "RevPATH up 10% by summer." Current: 71% utilisation, £98 rate, £69.58 RevPATH. Sketch two different routes to £76.50: one led by utilisation, one led by rate. Which is more realistic for YOUR spa\'s current daypart grid - and what would each cost to attempt?',
      activity: 'Calculate your spa\'s RevPATH for each of the last four weeks (revenue ÷ sellable hours from your module 1 worksheet). Then decompose the best and worst week: was the difference utilisation, rate, or both? Write three sentences you could say to a director explaining the gap. This is the exact format of module 6\'s assessed case.',
      knowledgeCheck: [
        { q: 'Revenue £21,600; sellable hours 280; booked hours 210. RevPATH is:', options: ['£102.86', '£77.14', '£75.00', '£96.40'], answer: 1, why: '£21,600 ÷ 280 AVAILABLE hours = £77.14. (£102.86 is rate per BOOKED hour - the number that ignores your empty diary.)' },
        { q: 'RevPATH fell 8%; utilisation is unchanged. Where has the loss come from?', options: ['Fewer sellable hours', 'Rate per hour - mix, discounting or duration', 'Marketing reach', 'It is impossible to say'], answer: 1, why: 'RevPATH = utilisation × rate per hour. If utilisation held, arithmetic leaves only rate - and module 3\'s three forces tell you where to look next.' },
        { q: 'Why does RevPATH use available hours rather than booked hours in the denominator?', options: ['Booked hours are hard to measure', 'So the empty hours you paid for count against the result', 'Tradition from the hotel industry', 'To make the number bigger'], answer: 1, why: 'Charging the metric for unsold capacity is exactly what makes it honest - a full-looking rate per booked hour can hide an empty diary; RevPATH cannot.' },
        { q: 'Moving one rostered therapist-hour from a £31-RevPATH daypart to a £118-RevPATH daypart that is therapist-constrained is worth roughly:', options: ['Nothing - revenue just moves around', '£87 per week per hour moved', '£149 per week', 'It cannot be estimated'], answer: 1, why: 'The hour stops earning ~£31 and starts earning ~£118 where demand is queuing: net ~£87. RevPATH turns rota debates into arithmetic.' },
      ],
      keyTerms: [
        { term: 'RevPATH', definition: 'Revenue per available treatment hour: treatment revenue divided by sellable capacity hours - the spa\'s single steerable performance number.' },
        { term: 'The RevPATH identity', definition: 'RevPATH = utilisation × rate per hour; every movement decomposes into one or both factors.' },
        { term: 'Decomposition', definition: 'Splitting a performance change into its factors before choosing a response - the routine that separates diagnosis from guessing.' },
        { term: 'RevPAR', definition: 'The hotel equivalent (revenue per available room); knowing the parallel helps you speak the wider property\'s commercial language.' },
      ],
      caseStudy: {
        title: 'Two managers, one owner, one number',
        scenario: 'A small group owns two comparable spas. Spa A\'s manager reports "a record month - 84% utilisation!". Spa B\'s manager reports "rate held at £104/hour despite a soft market". The owner, newly fluent in RevPATH, asks both for the same figure. Spa A: 84% × £74 = £62.16 (the record utilisation was bought with a member-getaway promotion that discounted 30% of hours). Spa B: 66% × £104 = £68.64.',
        insight: 'Each manager had told the truth about their favourite number, and each favourite number hid the other half of the story. On the honest common metric, the "soft" spa was outperforming the "record" one by 10%. The owner\'s response set the group\'s reporting standard: RevPATH weekly, decomposed, by daypart - and both managers\' next initiatives were priced in RevPATH before approval. Spa A\'s manager, to her credit, used the same arithmetic to redesign the promotion with fences and a smaller discount; four months later Spa A led the group. The number did not manage the spas - it made the same truth visible to everyone managing them.',
      },
      summary: 'RevPATH divides revenue by the hours you HAD, not the hours you sold - which makes it the one spa number that cannot be flattered. It decomposes exactly into utilisation × rate per hour, localises to dayparts, and prices every commercial idea in one currency. Track it weekly, decompose it always, and benchmark against your own history.',
      nextStep: 'Put this week\'s RevPATH - one number - somewhere the team sees it, and commit to writing it up weekly for a month. The conversation it starts is the point.',
    },
    {
      title: 'Pricing and Demand',
      whyThisMatters: 'Pricing is the strongest lever in this course and the one most spas touch least - typically once a year, straight across the menu, guided by nerve rather than data. Meanwhile the diary already knows exactly where price is wrong: the dayparts that queue are underpriced, and the dayparts that echo are mispackaged. This module turns that diary evidence into pricing decisions.',
      objectives: [
        'Read demand signals (queues, refusal logs, booking lead times) as pricing evidence',
        'Protect peak revenue with fences instead of leaking discounts into it',
        'Design trough products that add demand without repricing existing demand',
        'Judge any discount with the cannibalisation question before running it',
      ],
      sections: [
        {
          heading: 'The diary is a pricing report',
          body: 'Demand tells you about price constantly, if you record it.\n\nQueues: a daypart pinned above 90% utilisation with a turned-away log (module 2) is paying you less than it would happily pay. A measured, modest price move at those times - £5 on the signature treatments, a peak-time menu tier - converts invisible queues into revenue with little volume risk, because by definition demand exceeds supply there. The Linden\'s Saturday-afternoon queue absorbed an 8% rise without losing a booking.\n\nBooking lead time: when Saturday slots sell out ten days ahead, the market is telling you the price clears too easily. When they sell out two hours ahead, price is nearer the mark.\n\nEchoes: a 38% Tuesday morning is not evidence that Tuesday should be cheaper across the board - it is evidence that the CURRENT product at the current price does not fit whoever is free on Tuesday mornings. That calls for a different product (next section), not a defaced price list.\n\nThe discipline underneath: never move price on instinct alone, and never leave it untouched for a year out of fear. Small moves, evidence-led, daypart by daypart, reviewed against the diary.',
        },
        {
          heading: 'Protect the peak: fences',
          body: 'A fence is a condition that keeps a lower price from leaking into demand that would have paid full rate. Fences are what make flexible pricing safe.\n\nGood fences for a spa: daypart validity (midweek-morning only), advance purchase (booked 14+ days ahead), audience (members, local residents, NHS staff), season, and product form (a package with added value rather than a visible percentage off the same treatment).\n\nThe difference fences make is arithmetic, not cosmetic. An unfenced 20% promotion applies to everyone - including the majority who were paying full price - so it must generate at least a quarter more volume before it adds a pound (d ÷ (1 - d), module 3), and more in practice once displaced full-price bookings are counted. A fenced offer applies only to demand you were not getting; every redemption is closer to incremental. Same discount, opposite economics.\n\nEqually important is what never goes on sale: the peak. Discounting a queuing daypart is paying guests to take slots you would have sold anyway - and teaching your best customers that the rack rate is optional. If a promotion CAN be redeemed on Saturday afternoon, assume it will be. Write the fence into the terms, the booking system and reception\'s script, or it does not exist.',
        },
        {
          heading: 'Fill the trough: value, products and the dignity rule',
          body: 'Soft dayparts respond to three tools, in this order.\n\nValue before discount: adding something cheap-to-you and valuable-to-the-guest (a scalp ritual, thermal access, a lunch pairing with the hotel) protects the rate architecture. "Tuesday Reset - signature massage plus thermal morning, £135" reads as a product; "£120 massage for £96" reads as an admission.\n\nProducts for the people who are actually free: the Tuesday-morning market is retirees, shift workers, freelancers, new parents. Build for them - a residents\' membership with midweek validity (predictable revenue, fenced by design), a monthly "first Tuesday" series, a course-of-six sold at a committed price. These create demand rather than repricing it.\n\nOperational use of what will not sell: training, deep cleaning, maintenance, familiarisation visits. An hour that raises capability is not an idle hour.\n\nAnd the dignity rule, which is also a brand rule: if you would be uncomfortable with your highest-paying regular seeing the offer, do not run it. Luxury pricing is a claim about worth; a spa permanently on flash sale is making the opposite claim in public. The trough is a design problem, and design - unlike discounting - compounds.',
        },
      ],
      visuals: [
        { kind: 'matrix', title: 'The daypart pricing map', xLabel: 'Utilisation (low → high)', yLabel: 'Rate/hour (high → low)', quadrants: ['Cheap but FULL: raise price, add premium tier', 'Expensive and full: protect - no offers can land here', 'Cheap and empty: redesign the product, fence hard', 'Expensive but empty: add value or repackage before touching price'], caption: 'Place each daypart from your grid into a quadrant. Each quadrant has one correct family of moves - and "discount everything" appears in none of them.' },
        { kind: 'image_placeholder', title: 'IMAGE: Spa reception at peak time', description: 'A photograph of a queuing reception moment makes turned-away demand tangible for teams who only ever hear the average numbers.' },
      ],
      scenario: 'Head office sends a directive: "Run 25% off everything for January - it worked at our sister hotel." Your grid shows January weekends at 88% utilisation and midweek at 44%, and last year\'s unfenced January sale produced a rate collapse you spent February recovering from. Draft the three-sentence reply that accepts the goal (a stronger January) while replacing the method. What do you propose instead, and what one number will you report back with?',
      activity: 'Take your daypart grid and place every square into the pricing map\'s four quadrants. Then write ONE evidence-led action for the fullest square (a protection or price move) and ONE for the emptiest (a fenced product or value-add), each with the RevPATH change you expect and a review date four weeks out. You have just written a pricing plan.',
      knowledgeCheck: [
        { q: 'Saturday 2-5pm runs at 96% with a 20-refusal weekly log. The strongest evidence-led move is:', options: ['A Saturday promotion to reward loyalty', 'A modest peak price rise or premium tier - demand already exceeds supply', 'Extend Saturday hours immediately', 'Nothing - full is the goal'], answer: 1, why: 'A queuing daypart is underpriced by definition. A measured rise converts refused demand into revenue at near-zero volume risk; a promotion there would be paying people to take slots that were already sold.' },
        { q: 'The main purpose of a fence on an offer is to:', options: ['Make the terms look official', 'Limit the offer to demand you would NOT otherwise have won', 'Reduce refund requests', 'Comply with advertising rules'], answer: 1, why: 'Fences (daypart, advance-purchase, audience, product form) stop the discount leaking into full-price demand - the difference between an offer that adds revenue and one that quietly transfers it.' },
        { q: 'An unfenced 20% discount needs at least ~25% more volume to break even. The fenced version of the same offer needs:', options: ['The same ~25%', 'More - fences reduce uptake', 'Much less - most redemptions are incremental demand', 'Break-even does not apply to fenced offers'], answer: 2, why: 'When the lower price reaches only guests who would not have booked at full rate, nearly every redemption is new revenue rather than repriced revenue - the arithmetic flips in your favour.' },
        { q: 'The "dignity rule" for spa offers says:', options: ['Never discount below cost', 'Offers must be approved by the GM', 'If your highest-paying regular seeing the offer would embarrass you, do not run it', 'Discounts only in January'], answer: 2, why: 'Luxury pricing is a public claim about worth. The rule keeps trough-filling creative (value, products, memberships) instead of eroding the brand your peak prices depend on.' },
      ],
      keyTerms: [
        { term: 'Fence', definition: 'A condition (daypart, advance purchase, audience, product form) that keeps a lower price from reaching demand that would have paid full rate.' },
        { term: 'Cannibalisation', definition: 'Revenue a promotion takes from full-price sales; estimate before, measure after, on every offer.' },
        { term: 'Turned-away log', definition: 'Reception\'s record of bookings refused for lack of space - the hardest evidence for a peak price move.' },
        { term: 'Value-add', definition: 'Enriching an offer instead of cutting its price, protecting the rate architecture while lifting appeal.' },
        { term: 'Rate architecture', definition: 'The deliberate structure of prices across the menu and dayparts; discounts leak, architecture holds.' },
      ],
      caseStudy: {
        title: 'January, done twice',
        scenario: 'Year one at The Linden: head office\'s 25%-off-everything January. Utilisation rose 9 points; rate per hour fell £19; RevPATH fell £4; and February\'s full-price bookings dipped as regulars waited to see if the sale returned. Year two, new manager, same January target: no sitewide sale. Instead - weekends protected entirely; a fenced "New Year Reset" midweek product at full treatment rate with added thermal time and a £15 retail credit; a January-only joining offer on the midweek membership; and the sister hotel\'s corporate rate desk given ten fenced midweek slots a week to sell.',
        insight: 'Year two\'s January: utilisation up 6 points midweek with weekends untouched, rate per hour DOWN only £2 (the retail credit\'s cost), RevPATH up £5, and 31 new members paying monthly through spring - revenue year one\'s sale never created. The comparison became the group\'s standard pricing case study, and the manager\'s covering note said it in one line: "We stopped renting our own guests back at a discount, and built products for the guests we did not have."',
      },
      summary: 'The diary is a pricing report: queues mean underpriced, echoes mean mispackaged. Protect the peak absolutely, fence every offer, add value before cutting price, and design trough products for the people actually free at those hours. Price in small, evidence-led, daypart-sized moves - and let the dignity rule guard the brand.',
      nextStep: 'Find the single fullest square on your grid and write the one-paragraph case for a modest price move there, using your turned-away evidence. Even if you cannot enact it, presenting it well is exactly the skill module 6 assesses.',
    },
    {
      title: 'Commercial Case Study',
      whyThisMatters: 'Everything so far has taught a piece of the engine. Real spas break in combinations - a soft midweek AND a rate leak AND a rota pointed at the wrong days - and the professional skill is running the full diagnosis in order, quantifying as you go, and emerging with a prioritised plan you could defend to an owner. This module is that rehearsal, and it mirrors the final assessment.',
      objectives: [
        'Run the demand → capacity → pricing → utilisation → RevPATH diagnosis on a realistic spa',
        'Quantify each problem before proposing anything',
        'Prioritise actions by RevPATH impact and effort, with measures and review dates',
      ],
      sections: [
        {
          heading: 'The situation: Harewood House Spa',
          body: 'You have just been appointed spa manager at Harewood House, a 12-treatment-room spa in a luxury country hotel. The owner\'s brief: "It feels busy at weekends, dead in the week, and the numbers have drifted for two years. Tell me what is actually wrong and what you would do in your first quarter."\n\nThe facts you assemble in week one:\n- 12 rooms, open 9:00-19:00 daily (120 room-hours/day).\n- Rota: 6 therapists midweek, 10 at weekends; sellable hours ≈ 5.75 per 8-hour shift → ~34.5 midweek, ~57.5 weekend.\n- Treatment utilisation: 58% overall - but 91% Friday-Sunday and 39% Tuesday-Thursday.\n- Treatment revenue: £41,400/week across ~380 booked hours → rate per hour ≈ £109... but the achieved rate midweek is £84 against a menu-implied £118, dragged by a standing "Midweek Escape 30% off" running for 14 months with no fences.\n- Payroll is 46% of treatment revenue. Retail conversion 8% (team average; best therapist 19%).\n- Weekend turned-away log (you started one): 22 refusals a week, concentrated Saturday 12:00-16:00.\n\nBefore reading the next section: spend ten minutes with these numbers and write YOUR diagnosis in the diagnosis order. Which problems are demand, which are capacity allocation, which are pricing? Roughly what is each costing per week?',
        },
        {
          heading: 'The worked diagnosis',
          body: 'Capacity and allocation: weekend sellable capacity (57.5 × 2 days ≈ 115 hours at 91%) is queuing while midweek (34.5 × 3 ≈ 103.5 hours at 39%) idles. The rota is better matched than most - the problem is not headcount but what the midweek hours are FOR. Two Saturday hours are worth adding from the midweek allocation immediately: at weekend RevPATH (~£99: 91% × £109) versus midweek (~£33: 39% × £84), each moved hour earns ~£66 more. Weekly value of a modest 4-hour reallocation: ~£265.\n\nPricing, peak: 22 refusals at an average ticket of ~£115 is up to £2,500/week of demand the spa cannot serve at current peak capacity - part is capturable by the reallocation, part by a measured Saturday peak-tier price move (the queue absorbs it; even +6% on ~£13,000 of weekend revenue is ~£780/week at minimal volume risk).\n\nPricing, trough: the unfenced 30% has run so long it IS the midweek price - achieved rate £84. It cannot simply be deleted without a demand hole; it must be replaced: fenced value-led midweek products, a residents\' membership, corporate partnerships. Closing even half the £34/hour rate gap on ~120 midweek booked hours is ~£2,000/week over a quarter.\n\nRetail: the 8%-vs-19% spread is a coaching gap, not a personality lottery (the manager programme covers the method). Moving the team average to 13% on £41,400 is ~£2,000/week of retail at ~50% margin.\n\nTotal identified: roughly £5,000-£6,500/week of addressable value - none of it requiring a marketing budget.',
        },
        {
          heading: 'The plan an owner would approve',
          body: 'Priorities, ordered by impact ÷ effort, each with a measure and a date:\n\n1. This week - rota: move 4 midweek hours to Saturday peak; start capturing refusals. Measure: Saturday refusals, weekend RevPATH. Review in 2 weeks.\n2. Week 2 - peak pricing: Saturday premium tier on the top five treatments (+£8), justified by the refusal log. Measure: weekend rate/hour and volume. Review in 4 weeks.\n3. Weeks 2-6 - replace the leak: "Midweek Escape" closed to new bookings; launch fenced replacements (midweek product at full treatment rate with thermal+lunch value; residents\' midweek membership; two corporate partners). Measure: midweek achieved rate and utilisation. Review in 8 weeks.\n4. Weeks 1-12 - retail coaching: prescription method training, per-therapist monthly reviews. Measure: retail conversion by therapist. Review monthly.\n5. Quarter-end - report to owner in the engine\'s language: RevPATH by daypart, before and after, decomposed.\n\nNote what the plan does NOT contain: a general price rise (only the evidenced peak), a marketing campaign (demand exists; it is being mispriced and misallocated), or a discount (one is being retired). That restraint - matching each lever to the diagnosed problem - is precisely what this course has trained, and precisely what the final assessment rewards.',
        },
      ],
      visuals: [
        { kind: 'table', title: 'Harewood House - the quarter\'s targets', headers: ['Metric', 'Now', 'Quarter target', 'Weekly value'], rows: [
          ['Weekend RevPATH', '£99', '£108', '~£1,000'],
          ['Midweek achieved rate/hr', '£84', '£101', '~£2,000'],
          ['Midweek utilisation', '39%', '46%', 'within above'],
          ['Retail conversion', '8%', '13%', '~£1,000 margin'],
          ['Saturday refusals/week', '22', '<8', 'captured above'],
        ], caption: 'Every target traces to a diagnosed cause and a specific action - the difference between a plan and a wish list.' },
        { kind: 'flow', title: 'The diagnosis order (memorise this)', steps: ['DEMAND - what wants to book, when? (grid + refusal log)', 'CAPACITY - are sellable hours pointed at it? (rota vs grid)', 'PRICING - is each daypart priced to its evidence? (achieved vs menu, fences)', 'UTILISATION & RATE - decompose what changed', 'RevPATH - price every action in one currency, set review dates'] },
      ],
      scenario: 'The owner reads your plan and pushes back on one line: "The 30% midweek offer brings people in - my wife\'s friends all use it. Why would you kill our most popular promotion?" You have the numbers from this module. Write - actually write - the four-sentence answer that wins the argument without calling the owner\'s two-year-old decision a mistake.',
      activity: 'Now run the full five-step diagnosis on YOUR spa, using the worksheets from modules 1, 2 and 4: one page, ending in three prioritised actions each with a quantified weekly value, a measure and a review date. This document is the course\'s real output - and the format the final assessment asks you to reproduce on a fresh case.',
      knowledgeCheck: [
        { q: 'Harewood\'s single most valuable early move is the rota reallocation because:', options: ['It is the cheapest to explain', 'It moves hours from ~£33 RevPATH to ~£99 RevPATH against proven queuing demand - high impact, near-zero cost or risk', 'Payroll falls', 'Weekends are more prestigious'], answer: 1, why: 'Impact ÷ effort: each moved hour earns ~£66 more per week, the demand is evidenced by the refusal log, and nothing is spent. Plans that start with their highest-certainty move earn the trust that funds the harder moves.' },
        { q: 'Why can the 14-month unfenced discount not simply be cancelled overnight?', options: ['The booking system cannot remove it', 'It has become the de facto midweek price - deletion leaves a demand hole; it must be REPLACED with fenced products', 'Guests would complain to the owner', 'Discounts are legally binding'], answer: 1, why: 'After 14 months, midweek demand has formed around £84. The repair is substitution - value-led fenced products and memberships that rebuild the rate - not amputation.' },
        { q: 'The plan proposes no marketing campaign because:', options: ['Marketing never works for spas', 'The diagnosis shows demand exists but is mispriced and misallocated - the levers that match the problem are pricing and rota, not reach', 'There is no budget', 'The owner dislikes advertising'], answer: 1, why: 'Matching lever to diagnosis is the course\'s core discipline. Weekend demand queues (a pricing/capacity story) and midweek demand is priced into worthlessness (a pricing/product story). Reach was never the constraint.' },
      ],
      keyTerms: [
        { term: 'Diagnosis order', definition: 'Demand → capacity → pricing → utilisation/rate → RevPATH: the fixed sequence that stops solutions arriving before problems are named.' },
        { term: 'Impact ÷ effort', definition: 'The prioritisation test: quantified weekly value against cost, risk and time - highest-certainty moves first.' },
        { term: 'Addressable value', definition: 'The quantified weekly worth of each diagnosed problem - what turns a complaint list into a business case.' },
        { term: 'Review date', definition: 'The pre-committed moment an action\'s measure is checked; plans without them are intentions.' },
      ],
      caseStudy: {
        title: 'The owner\'s answer',
        scenario: 'The strongest version of the four-sentence reply to Harewood\'s owner: "The offer absolutely brings people in - about 120 booked hours a week, and we should keep serving every one of them. What the last year\'s numbers show is that it also reprices the guests who would have come anyway, which costs us roughly £2,000 a week against a fenced version of the same idea. So I am not proposing we kill it - I am proposing we replace it with midweek products that protect the £84 your wife\'s friends pay while rebuilding the rate everyone else pays. If midweek achieved rate has not moved £10 by the eight-week review, we put the old offer back."',
        insight: 'Notice the construction: it concedes what is true (the offer generates bookings), quantifies the actual problem (repricing, not unpopularity), replaces rather than removes, and - the masterstroke - offers a reversibility guarantee with a date and a number. Owners rarely refuse a reversible, measured experiment. The arithmetic from modules 2-5 is what makes each sentence possible; the diagnosis order is what put the sentences in the right sequence. This is the level of commercial conversation the final assessment - and your next salary review - rewards.',
      },
      summary: 'Real spas break in combinations, so the diagnosis runs in order: demand, capacity, pricing, then the decomposed metrics - quantifying at every step - before a single action is proposed. Prioritise by impact over effort, attach a measure and a review date to everything, and present in RevPATH so every action shares one currency. You now own the full engine.',
      nextStep: 'Complete the final assessment, then put your one-page diagnosis of your own spa (this module\'s activity) in front of your manager or director within two weeks. The RevPATH calculator in Resources &amp; Tools does the arithmetic; the thinking is now yours.',
    },
  ],
}

export default content
