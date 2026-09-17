import type { PublicPagesContent } from './public-page-content'

// The default public page content and the plain helpers that build it, with
// no zod behind any of it.
//
// public-page-content.ts imports zod for its schemas, and Footer reached in
// here for these defaults. Footer renders on every page, so the whole
// validator shipped site-wide to supply some fallback wording. The helpers
// were never schema code - they only happened to live in the same file.
//
// The type import above is erased at compile time, so nothing is pulled at
// runtime and the cycle it appears to form does not exist.

// The four labelled tiles above the footer. No pictures in the code.
//
// These used to ship as four Unsplash photographs, and the Footer painted them
// on first render before fetching the real band - so every visitor saw four
// stock images swap to Rebecca's a moment later, on every page, which reads as
// a site that has not finished loading rather than one that has.
//
// The labels and the crops stay, because they are the design. The pictures
// come from the database or the tile stays empty, which is also how the panel
// backdrops work: a page shows the photography Talent House owns, or none.
export const defaultEditorialBand = [
  { url: '', alt: 'Luxury spa treatment in progress', label: 'Spa & wellness', focalX: 50, focalY: 50 },
  { url: '', alt: 'Contemporary luxury hospitality interior', label: 'Exceptional properties', focalX: 50, focalY: 50 },
  { url: '', alt: 'Modern timber sauna and wellness space', label: 'Wellness environments', focalX: 50, focalY: 50 },
  { url: '', alt: 'Warm Mediterranean hospitality courtyard', label: 'Destination hospitality', focalX: 50, focalY: 50 },
]


// The questions, moved out of the page so they can be edited.
//
// Not retyped: lifted whole, so the twenty-three answers on the site are the
// twenty-three answers here. The one that quoted featured-listing prices now
// carries tokens instead of the numbers, because an FAQ that names a price is
// an FAQ that goes stale the first afternoon somebody changes one, and the
// whole point of the pricing screen was that she can change them.
export const FAQ_PRICE_TOKENS = [
  'featured_7day_price', 'featured_7day_days',
  'featured_30day_price', 'featured_30day_days',
] as const

export const DEFAULT_FAQ_SECTIONS = [

  { title: 'For Therapists & Wellness Professionals', items: [
    { question: 'How do I create a profile?', answer: 'Sign up free, complete the onboarding wizard covering your skills, qualifications, product house experience, and availability. Takes about 10 minutes.' },
    { question: 'Is it free to use?', answer: 'Yes, basic profiles are always free. If you want priority visibility in search results, you can purchase a one-off featured boost: {featured_7day_price} for {featured_7day_days} days or {featured_30day_price} for {featured_30day_days} days. Featured profiles are clearly labelled, and featuring never changes matching.' },
    { question: 'How does matching work?', answer: 'Skills, qualifications, brands, location and availability are weighted and scored, so both sides can see why a match is right. A score is a guide, not an automatic hiring decision.' },
    { question: 'Can I hide my profile from my current employer?', answer: 'Yes. In Talent Settings, Stealth Mode lets you block a specific employer. That business will not receive your profile in new searches, matching results, agency results or shortlists. It cannot withdraw information you already chose to send in an application or message, and authorised Talent House administrators can still access accounts when needed for safety and support.' },
    { question: 'What qualifications do you accept?', answer: 'CIDESCO, CIBTAC, VTCT, NVQ, ITEC, and more. Add any recognised qualification during onboarding.' },
    { question: 'How do I apply for a role?', answer: 'Browse matched roles, click Apply. The employer receives your profile with your match score.' },
    { question: 'Can I set up job alerts?', answer: 'Yes. Configure email alerts in your dashboard settings for new roles matching your profile.' },
  ]},
  { title: 'For Employers & Properties', items: [
    { question: 'How do I post a role?', answer: 'Create an employer account, complete your property profile, then post a role by selecting a tier.' },
    { question: 'What are the job posting tiers?', answer: 'The current tiers are Bronze and Platinum, with different listing lengths and visibility. Please use the Pricing page for the live price and inclusions before purchasing, as offers may change.' },
    { question: 'How long does approval take?', answer: 'Employer accounts are reviewed before they can view private talent profiles. Timing depends on whether the information supplied can be verified; contact support if your review appears to be delayed.' },
    { question: 'Can I search for candidates?', answer: 'Yes. Browse the talent pool, filter by skills and qualifications, and shortlist candidates directly.' },
    { question: "What's included in the match score?", answer: 'The score compares relevant role requirements with the professional’s profile, including skills, product houses, qualifications, role level, availability and location. Employers should still review the full profile and speak with the person.' },
    { question: 'How does location and travel matching work?', answer: 'Distance searches use postcode coordinates and straight-line miles. A professional is only included when the distance fits both the employer’s chosen search radius and the professional’s own travel radius. This is not a journey-time promise, so properties can also provide the nearest station or Tube, approximate walk, whether a car is required, parking and any taxi or shuttle support.' },
    { question: 'Do you offer bulk pricing?', answer: 'Contact us for volume discounts on multiple listings.' },
  ]},
  { title: 'Account & Privacy', items: [
    { question: 'How do I download my data?', answer: "Go to Settings and click 'Download My Data' for a full GDPR-compliant export." },
    { question: 'How do I delete my account?', answer: "Go to Settings and click 'Request Account Deletion'. The request is sent for review; support will confirm the next steps and any records that must be retained for legal or safety reasons." },
    { question: 'Is my data secure?', answer: 'We use authenticated accounts, role-based access controls and restricted database policies. Please use a unique password and report anything unexpected. Our Privacy Policy explains how personal data is handled under UK data-protection law.' },
    { question: 'Who can see my profile?', answer: 'Approved employers can view discoverable talent profiles. An employer blocked through Stealth Mode is excluded before profile data is sent to them. Authorised Talent House administrators retain access for moderation, safety and support.' },
  ]},
  { title: 'Payments & Billing', items: [
    { question: 'What payment methods do you accept?', answer: 'All major credit and debit cards via Stripe.' },
    { question: 'Can I get a refund?', answer: 'Please check the Terms and contact support with the payment details. A refund is not automatically guaranteed once a listing or paid service has been published or started.' },
    { question: 'Do you charge commission on hires?', answer: 'No commission. You pay for the listing, not the hire.' },
  ]},
]

// No photographs in the code, for the same reason the footer band has none.
//
// Every page that loads its content in the browser paints the default first
// and swaps a moment later. While these carried twenty Unsplash pictures, that
// meant every visitor saw a stock photograph on the Residency, Properties and
// Agency pages before the real one arrived - the owner watched it happen and
// described it as the old pictures still sitting behind the new ones. They
// were, on every load, for everybody.
//
// The alt text and the crops stay, because those are the design. A page shows
// the photography Talent House owns, or none.
const image = (url: string, alt: string) => ({ url, alt, focalX: 50, focalY: 50 })
const block = (eyebrow: string, heading: string, text: string, url = '', alt = '') => ({ eyebrow, heading, text, image: image(url, alt), visible: true })

export const DEFAULT_PUBLIC_PAGES_CONTENT: PublicPagesContent = {
  version: 1,
  editorialBand: defaultEditorialBand,
  faq: DEFAULT_FAQ_SECTIONS,
  pages: {
    properties: {
      label: 'Properties',
      hero: {
        eyebrow: 'Talent House properties',
        heading: 'Exceptional places to work.',
        text: 'Meet verified hotels, spas and wellness destinations using Talent House Collective to find exceptional people. Featured properties appear first.',
        image: image('', 'Luxury hospitality interior'),
      },
      blocks: [
        block('Verified partners', 'Properties building their teams with us.', 'Discover properties using Talent House Collective to recruit and book exceptional wellness professionals.', '', 'Luxury spa treatment'),
        block('A better first impression', 'See the place behind the role.', 'Property photography, brand information, reviews and live opportunities help professionals understand where they could work.', '', 'Contemporary wellness space'),
        block('For exceptional properties', 'Your employer brand should be visible.', 'Verified properties can build a richer profile so talent sees more than a job title.', '', 'Luxury destination hospitality'),
      ],
    },
    agency: {
      label: 'Agency',
      hero: {
        eyebrow: 'Flexible spa staffing',
        heading: 'Need a therapist tomorrow? Want flexible spa shifts?',
        text: 'Agency connects spas and hotels that need qualified cover with professionals who have chosen when they are available to work. Employers search the shift. Professionals choose when and where they work.',
        image: image('', 'Spa professional delivering a treatment'),
      },
      blocks: [
        block('For employers', 'Post the shift. See who is genuinely available.', 'Choose the date, hours, location and treatments you need. Talent House Collective shows suitable professionals whose availability fits the whole shift, together with their experience, skills, rate, location and verification information. Review the profile, make an offer and confirm the cover.', '', 'Luxury hotel spa team'),
        block('For professionals', 'Tell us when you are free. You decide what you accept.', 'Set your exact availability, hourly rate, travel radius, treatment skills and preferred working area. Suitable properties can find you for the hours you have chosen. You review the opportunity and decide whether the shift works for you.', '', 'Wellness professional'),
        block('Verification made clearer', 'Qualified abroad? Your experience should still make sense here.', 'Spa is an international industry. Profiles can show where a professional trained, the treatments they are qualified to perform, qualification review status, right-to-work information and insurance status. Where a formal UK equivalence has not been established, the platform does not pretend that it has.', '', 'Spa therapist at work'),
      ],
    },
    residency: {
      label: 'Residency',
      hero: {
        eyebrow: 'Curated Residency Marketplace',
        heading: 'Bring exceptional wellness talent into your property.',
        text: 'Discover experienced specialists for seasonal, short-term and signature residencies. Identity stays protected while you discuss fit, then agreed terms and payment stay securely on Talent House Collective.',
        image: image('', 'Destination wellness setting'),
      },
      blocks: [
        block('Residency talent', 'Specialists available for placement', 'Discover visiting practitioners, educators, trainers and programme creators for focused placements.', '', 'Luxury spa setting'),
        block('For properties', 'Create something guests cannot get every day.', 'Residencies can bring distinctive expertise, seasonal programming and new commercial energy into a spa or wellness operation.', '', 'Spa and wellness experience'),
        block('For specialists', 'Take your expertise somewhere remarkable.', 'Package your specialism, availability, preferred destinations and commercial terms into a protected professional listing.', '', 'Wellness practitioner'),
      ],
    },
    pricing: {
      label: 'Pricing',
      hero: {
        eyebrow: 'Pricing',
        heading: 'Choose what you need. Know what you pay.',
        text: 'A free career profile at the centre, optional visibility and flexible-work memberships for professionals, and clear commercial pricing for properties.',
        image: image('', 'Luxury spa treatment environment'),
      },
      blocks: [
        block('For professionals', 'Start free. Add only what helps your career.', 'Permanent recruitment remains free for Talent. Paid options are for extra visibility or participation in specialist marketplaces.', '', 'Wellness professional'),
        block('Flexible staffing & specialist bookings', 'The property pays the platform fee.', 'For Agency and Residency bookings, the commercial split is shown before confirmation so both sides know what has been agreed.', '', 'Premium hotel'),
        block('For employers', 'Permanent recruitment, without salary commission.', 'Choose the reach and support level for each role. Once you hire, there is no additional percentage fee on salary.', '', 'Luxury property interior'),
      ],
    },
    'coming-soon': {
      label: 'Coming Soon',
      hero: {
        eyebrow: 'Coming next',
        heading: 'Spa and wellness is where we start. Not where we stop.',
        text: 'Talent House Collective is the talent, flexible staffing and career platform for luxury hospitality. We begin with spa, beauty and the brands that supply them, then move into the departments every great property depends on.',
        image: image('', 'Luxury hospitality destination'),
      },
      blocks: [
        block('AI Interview & Confidence Coach', 'Not an answer machine. A confidence builder.', 'Help professionals understand themselves, pull stronger evidence from their own experience and practise until they can answer with confidence.', '', 'Professionals in conversation'),
        block('Hospitality expansion', 'From spa into the departments that make hospitality work.', 'Brands and product houses come next. Then events, food and beverage, front of house and housekeeping, starting with the properties we already work with.', '', 'Hospitality property'),
        block('Property arrival packs', 'Know the property before your first shift starts.', 'Confirmed Agency and Residency professionals receive the practical details they need before they arrive.', '', 'Spa operations'),
      ],
    },
    // The five added once the site had outgrown the originals. Each carries
    // exactly what the page said on the day it was made editable, so nothing
    // moved when this shipped.
    //
    // Text heroes, all of them: no hero photograph and no three-block band, so
    // the editor shows three boxes and no image picker. PAGE_SECTIONS says so
    // and a test holds it, because an editor offering a field the page does
    // not render is how somebody concludes the whole screen is broken.
    about: {
      label: 'About',
      hero: {
        eyebrow: 'About',
        heading: 'Built for an industry that deserves better.',
        text: 'Talent House Collective is the professional platform for spa and wellness careers - built by someone who has lived inside the industry.',
        image: image('', ''),
      },
      blocks: [
        // The founder section. The words are what the page already said, so
        // publishing changes nothing until she edits it - and the picture is
        // empty, because the one it used to ask for never existed.
        block(
          'Founder',
          'Founded by Rebecca Doyle',
          'Rebecca built her career inside the luxury spa and wellness sector - watching firsthand how poorly the industry was served by mainstream recruitment. '
          + 'Properties she admired struggled to find the right people. Therapists with extraordinary CVs were stuck in the wrong roles. The disconnect was costing the entire sector its standards.'
          + '\n\n'
          + 'Talent House Collective is the platform she wished had existed when she was hiring. Built with industry knowledge, not algorithms designed for office workers. '
          + 'Made for the people who make luxury wellness what it is.',
          '',
          'Rebecca Doyle, founder of Talent House Collective',
        ),
        block('', '', ''),
        block('', '', ''),
      ],
    },
    advertise: {
      label: 'Advertise',
      hero: {
        eyebrow: 'Advertise with Talent House Collective',
        heading: 'A real placement, with a clear audience and clear terms.',
        text: 'Choose where your brand appears, pay securely through Stripe, then Talent House reviews the creative before publication.',
        image: image('', ''),
      },
      blocks: [
        block('', '', ''),
        block('', '', ''),
        block('', '', ''),
      ],
    },
    'how-to-use': {
      label: 'How it works',
      hero: {
        eyebrow: 'How Talent House works',
        heading: 'One platform. A much simpler way to move through spa careers and recruitment.',
        text: 'Use the website or the app. Your account and live data stay together, so you can start something in one and continue in the other.',
        image: image('', ''),
      },
      blocks: [
        block('', '', ''),
        block('', '', ''),
        block('', '', ''),
      ],
    },
    academy: {
      label: 'Academy',
      hero: {
        eyebrow: 'Talent House Academy',
        heading: 'Learn what luxury spas actually expect from you.',
        text: 'Professional courses with assessments, verified certificates and CPD hours - built for spa careers, from the treatment room to director level.',
        image: image('', ''),
      },
      blocks: [
        block('', '', ''),
        block('', '', ''),
        block('', '', ''),
      ],
    },
    contact: {
      label: 'Contact',
      hero: {
        eyebrow: 'Contact',
        heading: 'Get in touch.',
        text: 'Questions, partnerships or feedback - we read every message.',
        image: image('', ''),
      },
      blocks: [block('', '', ''), block('', '', ''), block('', '', '')],
    },
    'agency-cover': {
      label: 'Agency Cover',
      hero: {
        eyebrow: 'Agency Cover',
        heading: 'Spa professionals on cover when your rota is short.',
        text: 'Agency Cover is the Talent House register of self-employed spa professionals available for individual shifts at hotels and spas across the UK. Search by date, hours and distance.',
        image: image('', ''),
      },
      blocks: [
        block('', '', ''),
        block('', '', ''),
        block('', '', ''),
      ],
    },
  },
}
