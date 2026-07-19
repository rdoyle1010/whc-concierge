import type { CourseContent } from '../academy-types'

const content: CourseContent = {
  slug: 'room-standards',
  aims: `This course trains therapists to treat the treatment room as the first act of the guest experience, not the backdrop to it. It sets out the sensory standards a luxury room must meet, the reset ritual that keeps those standards identical between every guest, and the disciplined turnaround routine that protects quality on a fully booked day. By the end, the therapist should be able to prepare, audit and reset a room to five-star condition without supervision, and to raise scheduling problems professionally rather than quietly lowering the standard.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, UK luxury hotel spas, day spas and destination spas, including agency and locum therapists who must hit an unfamiliar property's standard from their first shift. It is equally useful for senior therapists and coordinators who audit rooms, train juniors or design turnaround schedules.`,
  outcomes: [
    'Prepare and audit a luxury treatment room against a defined five-sense standard covering temperature, light, sound, scent and touch',
    'Execute a consistent reset ritual that returns the room to identical, flawless condition between every guest',
    'Run a fixed-order turnaround routine that holds the standard under back-to-back scheduling pressure',
    'Escalate impossible turnaround gaps to a coordinator professionally, protecting both the standard and the schedule',
  ],
  lessons: [
    {
      title: 'The room speaks first',
      objectives: [
        'Explain why the room communicates quality to the guest before the treatment begins',
        'Conduct a guest-eye walk-through of a treatment room and identify anything that breaks the standard',
        'Apply the reset ritual so the room is returned to identical, flawless condition between every guest',
      ],
      sections: [
        {
          heading: 'Why the room is the opening line',
          body: `A luxury guest forms a judgement within seconds of the door opening, long before your hands or your training come into play. The room sets the guest's expectations before the treatment begins, and those expectations frame everything that follows. Psychologists call this priming: the first impression becomes the lens through which every later detail is interpreted. A composed, warm, softly lit room primes the guest to expect skill, and they will read your treatment through that lens. A crumpled towel, a visible bin or a stray phone charger primes them to look for further faults, and they will find them. This is why a technically perfect treatment delivered in a sloppy room scores like a sloppy treatment on feedback forms and mystery-guest audits alike. In UK luxury properties, room presentation is a standing line on inspection checklists from bodies such as the AA and from brand-standard auditors, because inspectors know what therapists sometimes forget: the room is not the container for the experience, it is the first chapter of it.`,
        },
        {
          heading: 'The reset ritual',
          body: `The defining discipline of a five-star therapist is not a single perfect setup but an identical one, every time. The reset ritual means returning the room to exactly the same flawless condition between every single guest, whether it is the first booking of a quiet Tuesday or the sixth of a fully booked Saturday. The strongest spas remove ambiguity by photographing the perfect setup, trolley composed, couch dressed with the welcome fold, products faced, and fixing the photograph to the back of the door as the reference standard. If your property does not do this, build the photograph in your head: a precise mental image of where every towel, bottle and bolster belongs. The test of the ritual is interchangeability. A guest who visits at 9am and a friend who visits at 4pm should describe an identical room. Coordinators notice this consistency, and it is one of the quiet criteria by which VIP suite bookings are allocated. Consistency, not occasional brilliance, is the currency of luxury.`,
        },
        {
          heading: 'The guest-eye walk-through',
          body: `The most reliable audit tool costs nothing: walk into the room exactly as the guest will. Pause at the doorway and ask three questions in order. What do I see first? What do I smell first? What do I hear first? Seeing first should be the dressed couch, made like a fine hotel bed with the welcome fold turned back, and the trolley composed like a display case rather than a workbench. The bin must be empty and invisible, sited out of the natural sightline. Smelling first should be the spa's clean, softly signature scent, never leftover product, cleaning chemicals or food. Hearing first should be low, consistent music with no corridor noise bleeding through. Then apply the absolute rule: nothing personal in sight, ever. No phone, no water bottle, no keys, no cardigan on a chair. Personal items instantly reframe the space from sanctuary to staff room. The walk-through takes under a minute and catches the faults that familiarity makes invisible to someone who works in the room all day.`,
        },
      ],
      keyTerms: [
        { term: 'Reset ritual', definition: `The disciplined practice of returning the treatment room to identical, flawless condition between every guest, regardless of how tight the turnaround is.` },
        { term: 'Welcome fold', definition: `The turned-back corner of the couch linens, presented like a made hotel bed, that invites the guest onto the couch and signals fresh linen prepared for them alone.` },
        { term: 'Guest-eye walk-through', definition: `An audit technique in which the therapist enters the room as the guest would and checks, in order, what is seen first, smelled first and heard first.` },
        { term: 'Priming', definition: `The psychological effect by which a first impression shapes how every subsequent detail of an experience is judged, for better or worse.` },
      ],
      caseStudy: {
        title: `The 4pm room that matched the 9am photograph`,
        scenario: `Amara is a therapist at a five-star country house spa in the Cotswolds. On a fully booked Saturday, her coordinator mentions that a returning guest, Mrs Ellison, booked specifically after seeing a friend's photographs of her morning treatment room. Mrs Ellison's booking is at 4pm, Amara's sixth of the day. Between treatments Amara has been running her reset against the setup photograph on the back of the door: linens changed, trolley rebuilt, bin cleared, welcome fold squared. At 3:55pm she stands in the doorway and runs her walk-through. She spots her own water bottle on the windowsill, removes it, and opens the door to Mrs Ellison one minute later.`,
        insight: `Amara's professionalism lies not in a heroic one-off effort but in a repeatable system. The photograph gave her an objective standard, the reset ritual made the sixth room of the day identical to the first, and the guest-eye walk-through caught the one personal item that routine had let slip through. Mrs Ellison received exactly the room her friend had photographed, which is the definition of luxury consistency. Coordinators reward precisely this reliability when allocating VIP guests, because a therapist whose room never varies is a therapist who can be trusted unseen.`,
      },
      summary: `The room delivers the first minutes of the treatment before the therapist says a word, and the guest's whole experience is judged through that first impression. The professional response is the reset ritual: an identical, flawless room between every guest, verified against a photographed or memorised standard and audited with a guest-eye walk-through of what is seen, smelled and heard first. Nothing personal is ever visible. Consistency across every booking of the day, not occasional excellence, is what marks out a five-star therapist.`,
    },
    {
      title: 'The sensory checklist',
      objectives: [
        'Explain how each of the five senses should be set for an undressed, stationary guest rather than a working therapist',
        'Conduct a lying-down glare check and correct the most common lighting failure in treatment rooms',
        'Apply touch and scent standards to linens, robes, towels and product presentation on the trolley',
      ],
      sections: [
        {
          heading: 'Temperature: set for the guest, not for you',
          body: `The single most common comfort complaint in spa treatments is cold, and it happens because rooms get set for the wrong body. You are dressed, upright and physically working; the guest is undressed, still and slowing their metabolism as they relax. A still, unclothed body loses heat far faster than a moving, clothed one. The rule follows directly: set the room warmer than feels natural to you, typically several degrees above ordinary room comfort, and accept that you will feel slightly too warm while working. That is the correct calibration, not a fault. In cooler months, pre-warm the couch with a blanket or couch heater so the first contact with the linens is welcoming rather than a flinch. Check the guest's warmth early in the treatment with a quiet question, then watch for the silent signals: hunched shoulders, goosebumps, tension that does not release. A guest who is even slightly cold cannot relax, and a guest who cannot relax cannot receive the treatment you trained to give.`,
        },
        {
          heading: 'Light: the view from the couch',
          body: `Lighting is designed standing up and experienced lying down, which is why the most common lighting failure in treatment rooms is a glare source shining directly into the guest's eyes when they lie face-up. A ceiling spotlight that seems soft from the doorway becomes a bright point burning through closed eyelids from the couch. The fix is the simplest audit in this course: lie on the couch yourself, once, in both face-up and face-down positions, and look at what the guest will see. Correct any face-level glare with dimming, repositioning, indirect lamps or a shade. The wider standard is dimmed, indirect light throughout: enough for you to work safely and read product labels, never enough to feel clinical. If the room has adjustable scenes, set them before the guest enters rather than fiddling with switches mid-treatment. Light should be something the guest never consciously notices, because the moment they notice it, it is wrong.`,
        },
        {
          heading: 'Sound and scent: the invisible standards',
          body: `Sound in a luxury room should be noticed only when it stops. Keep music low, consistent and appropriate to the property's style, with no abrupt playlist changes, adverts or volume jumps. Door management matters as much as the playlist: close doors with a controlled hand, never a swing, and treat the corridor as part of the room, because silence outside the door is part of the experience inside it. Laughter at reception, trolley wheels and staff conversation all travel. Scent must be clean and softly signature, one deliberate note that guests come to associate with the property. The enemies of that signature are cocktails: leftover product from the previous treatment, cleaning chemical residue and food smells from a staff break. Air the room on every turnaround, even briefly in winter, so each guest arrives to fresh air carrying only the intended scent. Never mask a bad smell with more fragrance; layered smells read as exactly what they are, a cover-up.`,
        },
        {
          heading: 'Touch: every surface deliberate',
          body: `Touch is the therapist's professional medium, and the standard extends to every surface a guest might brush against, not just your hands. Linens must be smooth, fresh and taut, because a wrinkle under a bare back is noticed for the entire treatment. Robes and towels should be warm where the property allows, since a warmed towel is one of the cheapest genuine luxuries a spa can offer. Product bottles must be clean of residue and drips: an oily, smeared bottle on the trolley tells the guest, at close range, that the standard is cosmetic rather than real. Trolley presentation completes the sense audit: bottles clean, labels faced forward, products arranged in the order you will use them. Facing labels is borrowed from luxury retail, where it signals care and control, and order-of-use arrangement means your hands never hunt mid-treatment. The touch standard is simple to state and demanding to hold: every surface the guest contacts should feel considered, chosen and prepared for them specifically.`,
        },
      ],
      keyTerms: [
        { term: 'Sensory checklist', definition: `A five-sense audit of the treatment room, covering temperature, light, sound, scent and touch, each set for an undressed, stationary guest rather than a working therapist.` },
        { term: 'Glare check', definition: `Lying on the couch face-up and face-down to find any light source shining into the guest's eyes, the most common and most easily fixed lighting failure.` },
        { term: 'Facing', definition: `Arranging products so every label is turned forward and legible, a luxury retail discipline that signals care and control on the treatment trolley.` },
        { term: 'Signature scent', definition: `The single, deliberate, clean fragrance note a property maintains in its treatment spaces, protected by airing rooms on turnaround and never layering fragrance over other smells.` },
      ],
      caseStudy: {
        title: `The spotlight nobody had noticed`,
        scenario: `Daniel joins the spa of a luxury Edinburgh hotel and inherits Room 3, which colleagues mention has slightly weaker feedback scores than the identical Room 2, though nobody knows why. Before his first booking he runs the full sensory checklist. Temperature and scent pass. Then he lies on the couch face-up and immediately finds it: a ceiling spotlight aligned directly over the face cradle end, invisible from the doorway but glaring straight into a supine guest's closed eyes. Facilities re-angle the fitting and Daniel adds a dimmer scene for face-up phases of treatments. Over the following weeks, Room 3's comfort comments come back in line with Room 2's.`,
        insight: `The professional response was to trust the checklist over familiarity. Every therapist who had worked Room 3 had seen the room standing up; none had experienced it lying down, so the fault survived for months in plain sight. Daniel's glare check took under two minutes and found what feedback forms could only hint at, because guests rarely articulate low-grade discomfort, they simply score the experience lower. The lesson generalises: sensory faults are found from the guest's position, not the therapist's, and the cheapest audits, lying on the couch, standing in the doorway, are the ones that catch them.`,
      },
      summary: `Every sense in the room is calibrated for an undressed, stationary guest: temperature warmer than feels natural to the working therapist, with the couch pre-warmed in cooler months; light dimmed and indirect, verified by lying on the couch to catch face-level glare; sound low and consistent, with the corridor treated as part of the room; scent clean and singular, protected by airing on turnaround; and touch deliberate on every surface, from taut linens and warmed towels to residue-free bottles faced forward in order of use. The checklist is fast, visible to guests and inspectors alike, and entirely within the therapist's control.`,
    },
    {
      title: 'Turnaround under pressure',
      objectives: [
        'Explain why a fixed-order routine protects room standards more reliably than effort or intention when the schedule is tight',
        'Conduct a complete turnaround in the proven sequence, finishing with a doorway scan as the final check',
        'Apply professional escalation when the schedule genuinely leaves no time to reset the room properly',
      ],
      sections: [
        {
          heading: 'Routine beats memory under pressure',
          body: `Standards do not fail on quiet Tuesdays; they fail at 3pm on a fully booked Saturday, which is exactly when they matter most, because the busiest days serve the most guests. The protection is not trying harder but deciding less: a fixed turnaround routine, run in the same order every single time. This is the same logic behind checklists in aviation and surgery, fields that learned the hard way that trained professionals under time pressure reliably skip steps when working from memory, and reliably do not when working from a fixed sequence. When the order is invariant, your hands carry the routine while your mind is still with the last guest or ahead with the next one, and nothing is dropped. A therapist who improvises each turnaround will be excellent when fresh and patchy when rushed. A therapist who runs the same sequence every time is identical at 9am and 4pm, and identical is precisely what luxury promises.`,
        },
        {
          heading: 'The proven turnaround sequence',
          body: `Run the reset in this order, every time. First, linens stripped and straight into the laundry stream, never set down on a chair or floor. Second, surfaces and equipment disinfected, following the hygiene standards your property mandates. Third, the bin cleared, so no trace of the previous treatment remains. Fourth, products replenished and faced, labels forward, bottles wiped free of residue. Fifth, the trolley rebuilt to the standard layout, matching the setup photograph. Sixth, the couch dressed with fresh linens and the welcome fold. Seventh, temperature and lighting reset to the guest standard, since doors opening during turnaround shed heat and lights get raised for cleaning. Finally, the closing discipline: one slow scan of the room from the doorway, seeing it exactly as the arriving guest will. The doorway scan is the last line of defence, and it is always the final step, because it audits everything the previous seven produced. The logic of the order is contamination out first, presentation in last, inspection at the end.`,
        },
        {
          heading: 'Staging the next treatment',
          body: `A complete turnaround resets the last treatment and prepares the next one. Before the guest arrives, stage everything the coming treatment needs: products opened and arranged in order of use on the trolley, towels folded and positioned where your hands will want them, bolsters and supports ready, and any heated equipment, such as hot stones, started with enough lead time to reach temperature and be safety-tested before the guest is on the couch. The reason is the guest's experience of flow. A treatment reads as masterful when it unfolds without a single visible decision: no rummaging in a cupboard, no pause to open a stiff pump, no break in contact while you hunt for the right bottle. Mid-treatment scrambling breaks the guest's trance and your own rhythm, and both are hard to rebuild. Staging is also where seconds are honestly saved on a tight day: preparation moved before the treatment is time bought without any cut to hygiene or presentation, which are never the places to save it.`,
        },
        {
          heading: 'When the schedule is genuinely impossible',
          body: `Sometimes the diary is built wrong: back-to-back bookings with no turnaround gap at all, where even a flawless routine cannot deliver a hygienic, guest-ready room in the time given. The unprofessional responses are silent ones: quietly skipping disinfection, reusing linens, or starting late without telling anyone. Each transfers the schedule's failure onto the guest, the hygiene standard or a colleague, and each will eventually surface in a complaint, an audit or an incident. The professional response is escalation: flag the gap to the coordinator, factually and early. State the treatment times, the reset time your routine actually requires, and the shortfall, and ask for the schedule to be adjusted. This is not complaint but standard-keeping. The division of responsibility is clean: the therapist's job is to protect the standard; building a schedule that allows the standard is management's job to fix. Coordinators respect therapists who defend standards openly, and remember them when allocating the guests who matter most.`,
        },
      ],
      keyTerms: [
        { term: 'Turnaround', definition: `The interval between one guest leaving the treatment room and the next arriving, in which the full reset ritual and staging for the next treatment must be completed.` },
        { term: 'Fixed-order routine', definition: `A turnaround run in an identical sequence every time, so that no step depends on memory under pressure and nothing is skipped on busy days.` },
        { term: 'Doorway scan', definition: `The final step of every turnaround: one slow, deliberate look around the room from the doorway, seeing it exactly as the arriving guest will.` },
        { term: 'Staging', definition: `Preparing everything the next treatment needs before the guest arrives, products in order of use, towels positioned, heated equipment started and tested, so the treatment flows without interruption.` },
      ],
      caseStudy: {
        title: `Fifteen minutes short on a sold-out Saturday`,
        scenario: `Priya works at a busy city-centre luxury day spa in Manchester. On Friday evening she checks Saturday's diary and finds that a late double booking has left her with two ninety-minute treatments back to back and no turnaround gap between them, where her fixed routine needs a genuine fifteen minutes. The old temptation is obvious: she could shave the reset by skipping the surface disinfection and keeping the same couch cover, and probably nobody would notice. Instead she messages her coordinator that evening, stating the two booking times, her required reset time, and the shortfall, and asks whether the second booking can move by fifteen minutes or transfer to a colleague with a free room.`,
        insight: `Priya's response separates the standard from the schedule. By escalating early, factually and with the numbers, she gives the coordinator time to fix the diary while every option is still open; the same conversation at 2pm on Saturday would have had no good answers. She also refuses the silent corner-cut, which would have moved the schedule's failure onto hygiene, exactly the place it can never go. Far from marking her as difficult, the message marks her as a standard-keeper: a therapist who protects the guest and the business even when nobody is watching, which is the reputation that carries careers upward.`,
      },
      summary: `Pressure is when standards earn their keep, and the defence against pressure is routine, not effort. Run the turnaround in a fixed order every time: linens out, surfaces disinfected, bin cleared, products replenished and faced, trolley rebuilt, couch dressed, temperature and light reset, and always finish with one slow scan from the doorway as the guest will see it. Stage the next treatment's products, towels and heated equipment before the guest arrives so nothing interrupts the flow. And when the schedule truly allows no proper reset, flag it to the coordinator rather than cutting corners quietly: the therapist protects the standard, and fixing the schedule is management's job.`,
    },
  ],
}

export default content
