import type { CourseContent } from '../academy-types'

const content: CourseContent = {
  slug: 'consultation-excellence',
  aims: `This course sets out to transform the consultation from an administrative formality into the professional heart of every treatment. It examines why the first five minutes with a guest determine the quality, safety and commercial value of the whole hour, and it equips therapists with a repeatable method: establishing safety through contraindication screening, using the written form as a clinical and legal document, questioning in a structured way that surfaces what the guest truly wants, and closing the loop with personalised aftercare and accurate record keeping. Throughout, the standard applied is that of the UK luxury spa and five-star hotel sector, where consultation quality is audited, remembered by guests and reflected directly in rebooking rates.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, UK luxury spas, five-star hotel spas and premium day spas. It suits newly qualified therapists who want to build correct habits from the start, experienced therapists who have drifted into rushing or scripting their consultations, and senior therapists or team leaders responsible for coaching consultation standards across a team. Front-of-house colleagues who prepare guests for treatments will also benefit from understanding what a complete consultation involves.`,
  outcomes: [
    'Conduct a structured, guest-centred consultation that meets five-star and audit-level standards',
    'Screen for contraindications and apply adapt-or-refer protocols without guesswork',
    'Use closed and open questioning to build and confirm an accurate treatment brief',
    'Complete, store and use consultation records lawfully, securely and to the benefit of the returning guest',
  ],
  lessons: [
    {
      title: 'Why the consultation is the treatment',
      objectives: [
        'Explain the three simultaneous functions of a professional consultation: safety, personalisation and trust',
        'Describe how consultation behaviour signals professionalism before any hands-on work begins',
        'Apply positioning, eye contact and active listening techniques that make a guest feel genuinely heard',
      ],
      sections: [
        {
          heading: 'The treatment begins in the chair, not on the couch',
          body: `Ask a guest to describe a memorable spa visit and they rarely begin with effleurage technique. They begin with how they were received: whether someone sat with them, asked intelligent questions and seemed to care about the answers. In the luxury sector the consultation is not a preliminary to the treatment; it is the first act of it. Everything that follows, the pressure you choose, the areas you prioritise, the products you select, the amount of conversation you offer, flows from those opening minutes. A therapist who walks a guest straight to the couch with a quick glance at the booking sheet is delivering a generic service to a specific person. A therapist who consults properly is already treating. This is also the part of the guest journey most often rushed, usually because columns are tight and the form feels like admin. Resisting that pressure is a professional discipline in itself: two calm minutes at the start routinely save ten confused minutes later.`,
        },
        {
          heading: 'Three jobs at once: safety, brief, trust',
          body: `A proper consultation performs three functions simultaneously, and the order matters. First and always, safety. Its primary purpose is to identify contraindications, medical conditions, allergies and anything else that could make the planned treatment unsafe or in need of adaptation. No commercial or experiential goal ever outranks this. Second, the brief. What a guest booked and what a guest wants are frequently different things. The person who booked a back massage may really be carrying the tension of a poor month of sleep; the facial guest may be quietly worried about a specific event in three weeks. The consultation is where you discover the real assignment. Third, trust. A guest who has been asked thoughtful questions relaxes sooner, communicates more honestly during the treatment and accepts recommendations afterwards, because you have demonstrated expertise before laying a hand on them. Miss any one of the three and the treatment is compromised before it starts.`,
        },
        {
          heading: 'How professionalism is read in the first minute',
          body: `Guests judge competence from behavioural cues long before they can judge technique. The strongest cues are simple and controllable. Sit at the same level as the guest rather than standing over them; height difference reads as hierarchy, and hierarchy suppresses honest disclosure. Hold natural eye contact when they speak, rather than staring at the form. Use their name early and correctly. Above all, listen more than you speak: a useful working ratio is to let the guest do roughly two thirds of the talking. There is a world of difference, and guests detect it instantly, between a therapist reading questions off a card and a professional conducting a conversation with a form to support it. The form is your prompt, not your script. When a guest gives an answer that deserves a follow-up, follow it up, even if the next printed field says something else. Genuine curiosity cannot be faked for long, but it can be practised until it is habitual.`,
        },
        {
          heading: 'The commercial case for slowing down',
          body: `It is tempting to see consultation time as time taken away from the treatment. The economics of the luxury spa say otherwise. Rebooking and retail, the two numbers on which a therapist's commercial reputation rests, are both downstream of consultation quality. A guest who felt heard rebooks; a guest who received a competent but impersonal hour does not, and in the luxury market dissatisfied guests rarely say why, they simply disappear. Requested therapists, the ones guests ask for by name, are almost invariably strong consulters, because being requested is a function of feeling known. There is also a defensive case: the consultation is where problems are prevented. An allergy caught in the chair costs nothing; the same allergy discovered mid-facial costs the treatment, the guest and possibly an insurance claim. Whichever way you measure it, in loyalty, in revenue or in risk, the consultation is the highest-value five minutes of the appointment.`,
        },
      ],
      keyTerms: [
        { term: 'Contraindication', definition: `A medical condition, medication or circumstance that makes a treatment unsafe, or that requires the treatment to be adapted or postponed.` },
        { term: 'Treatment brief', definition: `The agreed summary of what the guest wants from the session: focus areas, pressure, atmosphere and desired outcome, gathered during the consultation.` },
        { term: 'Active listening', definition: `Listening with full attention and visible engagement, using eye contact, follow-up questions and reflection of the guest's own words, rather than waiting to speak.` },
        { term: 'Requested therapist', definition: `A therapist whom guests ask for by name when rebooking; a key marker of consultation quality and personal reputation within a spa.` },
      ],
      caseStudy: {
        title: 'The rushed column at The Fairleigh Hall Spa',
        scenario: `Amara is a therapist at The Fairleigh Hall Spa, a country house hotel in the Cotswolds. On a fully booked Saturday she is running four minutes late when Mrs Ellison arrives for a 60-minute deep tissue massage. Amara is tempted to walk her straight through and complete the form on the couch. Instead she takes a breath, sits opposite Mrs Ellison at eye level and asks her usual opening questions. Within two minutes she learns that Mrs Ellison had shoulder surgery eight months ago, has been cleared for massage but remains anxious about firm work near the joint, and that what she really wants is relief for her lower back after a long drive.`,
        insight: `Two minutes of proper consultation changed the entire treatment. Amara adapted her plan away from the shoulder, focused the deep work on the lower back and agreed a signal for any discomfort. Had she rushed to the couch, she would have delivered the booked treatment onto a post-surgical shoulder, risking harm, a complaint and an insurance question. The professional response is that lateness is recovered inside the treatment through efficient sequencing, never by cutting the consultation. Safety and the real brief are only ever discovered in the chair.`,
      },
      summary: `The consultation is not the paperwork before the treatment; it is the treatment's first and most important phase. In a few structured minutes it must keep the guest safe by surfacing contraindications, uncover what the guest actually wants rather than what they booked, and establish the trust that lets everything else succeed. Delivered at the guest's level, with genuine listening and unhurried attention, it is also the strongest predictor of rebooking, requests by name and a therapist's long-term reputation.`,
    },
    {
      title: 'The consultation form, properly used',
      objectives: [
        'Explain how the consultation form protects the guest, the therapist and the business simultaneously',
        'Apply the adapt-or-refer protocol when a contraindication or medical disclosure is flagged',
        'Complete and store consultation records in line with data protection and insurance requirements',
      ],
      sections: [
        {
          heading: 'A clinical and legal document, not admin',
          body: `Every field on a well-designed consultation form exists because something once went wrong without it. The form is simultaneously a clinical screening tool, a record of professional decision-making and a legal document, and it protects three parties at once. It protects the guest, because systematic questioning catches what casual conversation misses. It protects you, because a complete, signed form is the evidence of what you asked, what you were told and what you did about it. And it protects the business, whose insurance cover typically depends on consultation records being completed correctly for every treatment. Treat it accordingly. A form filled in with one-word answers while the guest undresses is worth little; a form completed as part of a genuine conversation, signed and dated, is a professional asset. The discipline is the same as in any clinical setting: if it is not recorded, from an insurer's point of view it did not happen.`,
        },
        {
          heading: 'Contraindications: adapt or refer, never guess',
          body: `Medical screening comes first on the form because it comes first in importance. The classic flags include pregnancy, high or low blood pressure, recent surgery or injury, cardiovascular conditions, diabetes, skin conditions, current medication and allergies. Each can change, restrict or rule out a treatment. When something is flagged, you have exactly two professional options. Adapt: modify the treatment within your training and your spa's written protocol, for example adjusting positioning, pressure, duration, products or areas worked. Or refer: where your protocol or insurance requires it, ask for a doctor's confirmation before treating, or decline and rebook. What you never do is guess. The sentence to ban from your working vocabulary is any version of it will probably be fine, because probably is not a clinical judgement and it is you, not the guest, who carries the professional responsibility. Take pregnancy as the standard example: massage can often proceed, but only adapted according to your training, the trimester and your spa's protocol, never unchanged and never on instinct.`,
        },
        {
          heading: 'Recording disclosures, and recording refusals',
          body: `How you write matters almost as much as what you ask. Record what the guest tells you in their own words wherever possible: guest reports occasional dizziness on standing is evidence; the vague tick in a box is not. Then record the decision you made because of it: pressure reduced over lumbar region, guest positioned semi-reclined. The pairing of disclosure and response is what demonstrates professional reasoning if the record is ever examined. Guests sometimes decline to share medical information, and they are entitled to. The correct response is not to refuse treatment automatically, nor to shrug and carry on as if nothing happened. You note the refusal clearly on the form, in wording such as guest declined to disclose medical history, and then follow your spa's protocol, which may mean proceeding with a conservative general treatment, obtaining a signed acknowledgement, or declining specific higher-risk treatments. The note is essential: it converts an information gap into a documented, defensible decision.`,
        },
        {
          heading: 'Sensitive data and secure handling',
          body: `Consultation forms contain health information, which UK data protection law treats as special category data, the most protected class of personal information. That status carries practical duties every therapist must live by. Forms are stored securely, in locked cabinets or access-controlled systems, and retrieved only when needed. A form is never left on the trolley, at reception or anywhere a passing guest or colleague could read it. Guests' conditions are never discussed with colleagues by name; if you need advice on adapting a treatment, describe the condition, not the person. Records are kept only as long as the business's retention policy requires, and disposed of confidentially. Guests notice discretion just as they notice its absence: a visible stranger's form on the side is an instant signal that their own secrets are not safe here. Handling sensitive data impeccably is not an add-on to five-star service; in a spa, confidentiality is part of the luxury.`,
        },
      ],
      keyTerms: [
        { term: 'Adapt or refer', definition: `The two professional responses to a flagged contraindication: modify the treatment within training and protocol, or refer the guest for medical confirmation before treating. Guessing is never a third option.` },
        { term: 'Special category data', definition: `The UK data protection classification for health information, requiring the highest standard of secure storage, limited access and confidential handling.` },
        { term: 'Documented refusal', definition: `A written note on the form recording that a guest declined to share medical information, followed by the spa's protocol; it turns a gap into a defensible record.` },
        { term: 'Signed form', definition: `A consultation record completed and signed by the guest, providing professional and insurance protection by evidencing what was asked, disclosed and agreed.` },
      ],
      caseStudy: {
        title: 'The undisclosed medication at the Belgrave House Spa',
        scenario: `Tomas, a senior therapist at the Belgrave House Spa in Edinburgh, is consulting Mr Okafor before a hot stone massage. On the form Mr Okafor ticks no to medication, but in conversation mentions that his blood pressure tablets make him a little light-headed in the mornings. Tomas gently revisits the form: so we do have a blood pressure medication, let me note that properly. Mr Okafor waves it away, saying it is nothing and he would rather not go into detail. Tomas now has a partially disclosed condition, a declined disclosure and a heat-based treatment booked in fifteen minutes.`,
        insight: `Tomas's professional response has three steps. He records exactly what was said, in the guest's words, including the declined detail. He applies protocol rather than instinct: blood pressure medication and heat are a recognised combination requiring caution, so he offers an adapted treatment, reducing stone temperature and duration and monitoring how the guest feels, in line with his spa's written guidance. And he never frames it as an obstacle: the guest hears a personalised treatment, not a refusal. The form now shows a disclosure, a decision and a reason, which is precisely what a clinical record is for.`,
      },
      summary: `The consultation form is a clinical, legal and commercial document that protects guest, therapist and business at once. Medical screening leads, and every flag is met with adapt or refer, never with guesswork. Disclosures are recorded in the guest's own words alongside the decisions they triggered, and a declined disclosure is itself noted and handled by protocol. Because the form holds special category health data, it is stored securely, never left in view and never discussed by name. A complete signed form is professional protection; an incomplete one is a liability.`,
    },
    {
      title: 'Questions that unlock the treatment',
      objectives: [
        'Distinguish closed from open questions and sequence them correctly within a consultation',
        `Conduct an open questioning phase that uncovers pressure, focus, atmosphere and the guest's hoped-for outcome`,
        'Confirm the treatment brief by repeating it back in a single agreed sentence before beginning',
      ],
      sections: [
        {
          heading: 'Two kinds of question, one correct order',
          body: `Closed questions collect facts; open questions collect the treatment brief. Both are essential, and the sequence matters. Closed questions invite short, specific answers and are the right tool for the safety phase: any injuries, operations or medical conditions I should know about, any allergies, are you comfortable with oil on the skin. They are efficient, unambiguous and easy to record. But a consultation built only from closed questions produces a safe, generic treatment, because closed questions can only confirm what you already thought to ask. Open questions, which cannot be answered with yes or no, hand the agenda to the guest and surface what you would never have guessed. The professional structure is therefore closed first, open second: establish the facts that keep the guest safe, then widen the conversation to discover what will make the treatment theirs. Reversing the order feels friendly but risks burying a safety question after rapport has made the guest reluctant to raise problems.`,
        },
        {
          heading: 'The open questions that do the work',
          body: `A small repertoire of open questions, asked with genuine attention, unlocks almost every consultation. How is your sleep at the moment reveals stress load, energy and often the real reason for the visit. Where do you hold your tension lets the guest map their own body and hands you the focus areas without guesswork. What does a typical week look like for you surfaces desk posture, driving, lifting, training. And the quietly decisive one: what would make this hour perfect for you. The answers to these questions tell you pressure preference, focus areas, whether the guest wants conversation or silence, and the outcome they are privately hoping for, whether that is pain relief, an hour of oblivion or simply feeling looked after. Listen for the answer behind the answer: fine, just busy, said with a sigh, is an invitation to one gentle follow-up. Do not interrogate; three or four well-chosen open questions, properly listened to, outperform a dozen delivered as a checklist.`,
        },
        {
          heading: 'Repeating the brief back: the one-sentence contract',
          body: `The consultation is completed, not by the last question, but by the confirmation. Before you begin, gather everything you have learned into one clear sentence and offer it back: so today we will focus on your shoulders and neck, medium-to-firm pressure, and you would rather I check in once and then let you drift off, shall we begin. This single sentence does several jobs at once. It proves to the guest that they have been heard, which guests value as highly as the treatment itself. It converts a loose conversation into an agreed plan, giving both of you a shared definition of success. It catches misunderstandings while they are still free to fix: if you have misread the pressure or the focus, the guest corrects you now, not silently at minute forty. And it hands control back to the guest at exactly the moment they are about to become passive on the couch. Therapists who repeat the brief back are rebooked at conspicuously higher rates, because the habit guarantees the guest's actual wishes, not the therapist's assumptions, define the hour.`,
        },
        {
          heading: 'Reading what is not said',
          body: `Questioning technique is completed by observation, because guests communicate as much through manner as through words. Short answers and closed body language usually signal a guest who wants quiet efficiency; match it by tightening the consultation rather than working harder to draw them out. A guest who answers at length and keeps chatting is telling you the connection is part of the experience for them. Hesitations matter: a pause before no when you ask about injuries deserves one gentle, non-intrusive follow-up, such as anything even minor that I should be careful around. Watch the body as well: guests often touch or guard the area that troubles them while describing something else entirely. None of this replaces the spoken consultation, and observation must never override a stated preference, but layered on top of good questions it produces the treatments guests describe as she just knew. That reputation is not intuition; it is disciplined attention, practised until it looks effortless.`,
        },
      ],
      keyTerms: [
        { term: 'Closed question', definition: `A question inviting a short, specific answer such as yes or no; the correct tool for gathering safety-critical facts quickly and unambiguously.` },
        { term: 'Open question', definition: `A question that cannot be answered with yes or no, such as where do you hold your tension; it hands the agenda to the guest and reveals the real treatment brief.` },
        { term: 'Repeated-back brief', definition: `A one-sentence summary of focus areas, pressure and atmosphere offered to the guest for confirmation before the treatment begins; the moment the plan becomes agreed.` },
        { term: 'The answer behind the answer', definition: `The fuller truth signalled by tone, hesitation or body language beneath a brief spoken reply, deserving one gentle follow-up question.` },
      ],
      caseStudy: {
        title: 'The misread booking at the Harbourlight Spa, Cornwall',
        scenario: `Elena consults Mr Whitfield at the Harbourlight Spa, a coastal five-star hotel near St Ives. He has booked the signature relaxation massage, and his closed-question answers are unremarkable: no injuries, no allergies, first visit. When Elena opens up the conversation with how is your sleep at the moment, he laughs briefly and admits he has barely slept since starting a new job, and that his wife booked this because he cannot switch off. Asked what would make the hour perfect, he says honestly: I would love to not think for an hour. He then chats nervously, filling every silence.`,
        insight: `The booking said relaxation massage; the open questions revealed the actual assignment, which is an hour of mental quiet for an anxious first-timer. Elena's professional response is to design for that outcome: she explains the treatment fully before it starts so nothing surprises him, repeats the brief back, medium pressure, full body, and I will settle you in and then leave you in peace unless you need me, and lets the rhythm of the massage slow his talking naturally rather than shushing him. The confirmation sentence matters doubly here: it tells a nervous guest exactly what will happen, which is itself the beginning of switching off.`,
      },
      summary: `Great consultations follow a deliberate questioning architecture: closed questions first to establish the safety-critical facts, then open questions, such as where do you hold your tension and what would make this hour perfect, to uncover the real brief of pressure, focus, atmosphere and hoped-for outcome. The consultation is sealed by repeating the brief back in one sentence, proving the guest has been heard and converting conversation into an agreed plan. Layer on attentive observation of tone and body language, and the treatment that follows belongs to the guest, not to a script.`,
    },
    {
      title: 'Closing the loop',
      objectives: [
        'Deliver aftercare advice that is explicitly linked to what the guest disclosed in the consultation',
        'Make professional recommendations for products and follow-up bookings from genuine findings rather than scripts',
        'Record guest preferences and treatment notes that enable a personalised, five-star return visit',
      ],
      sections: [
        {
          heading: 'The consultation ends at the goodbye',
          body: `A consultation that stops when the massage begins is only half done. Properly understood, it is a loop: what you learn in the chair shapes the treatment, and what you learned and found then shapes the aftercare, the recommendation and the record. The loop closes at the goodbye, not at the couch. This final phase is disproportionately powerful because it is the freshest memory the guest carries out of the building, and because it is where the guest discovers whether the attentive questioning at the start was genuine or performed. A therapist who asked about sleep at two o'clock and says nothing about it at three has quietly told the guest the questions were a formality. One who connects the ending to the beginning has demonstrated an hour of continuous attention. In the luxury sector, where guests are rarely surprised by technical quality, this continuity is precisely what they describe when they explain why one spa felt exceptional and another merely competent.`,
        },
        {
          heading: 'Aftercare that references the consultation',
          body: `Generic aftercare, drink water, avoid alcohol, take it easy, is heard as a script and forgotten in the car park. Personalised aftercare is built by joining three things in one sentence: what the guest told you, what you did, and what they should do next. Because you mentioned poor sleep, tonight avoid caffeine and drink plenty of water, and the lavender in that blend will keep working into the evening. Because we worked deeply on that lower back, expect it to feel warm tomorrow; a gentle walk will help more than the gym. The structure is simple: consultation finding, treatment link, specific action. Keep it to two or three points, spoken while the guest is settled with water rather than mid-corridor, and where your spa provides aftercare cards, personalise them with a written line. Aftercare framed this way is remembered and followed, which means the guest gets a better result from the treatment, which in turn is what brings them back. It costs thirty seconds and it is the cheapest quality upgrade in the industry.`,
        },
        {
          heading: 'Recommendation as service, not selling',
          body: `The close of the treatment is also the natural, honest moment for professional recommendation, and the same loop logic applies: recommend only from what you found and what they told you. If you discovered dehydrated skin, the serum that addresses it is aftercare in a bottle; if you found chronic shoulder tension from desk work, a follow-up booking in three or four weeks is the clinically sensible next step, not an upsell. Anchor every recommendation to the finding: your skin is dehydrated rather than dry, so the one product I would send you home with is this serum. Keep it brief, specific and pressure-free, and accept a no with complete warmth, noting the product on the guest's record for another day. Done this way, recommendation is experienced as expertise, and withholding it is actually the poorer service: you are the professional who has just spent an hour with this guest's body or skin, and nobody in any shop is better placed to advise them.`,
        },
        {
          heading: 'The record that builds regulars',
          body: `The final act of closing the loop happens after the guest has gone: writing the record for next time. Before your next guest arrives, note the things that will make the return visit feel remembered. Pressure preference and any adjustments made. Focus areas and what you found there. Products used and how the skin or body responded. Atmosphere preferences: conversation or quiet, music, temperature. Anything personal and appropriate the guest shared, such as an upcoming marathon or a stressful job move. These notes convert into five-star moments months later: a returning guest greeted with shall we work on those shoulders again, slightly firmer this time, has just experienced being remembered, which is among the rarest luxuries a busy spa can offer. Regulars built this way are the backbone of a therapist's column, income and reputation, and requested therapists are, almost without exception, diligent record keepers. Write the notes while they are fresh; a memory relied on across a busy week is a record already half lost.`,
        },
      ],
      keyTerms: [
        { term: 'Closing the loop', definition: `Connecting the end of the visit back to its beginning, so that aftercare, recommendations and records all flow visibly from what the guest disclosed and what the treatment found.` },
        { term: 'Personalised aftercare', definition: `Advice built from a consultation finding, a treatment link and a specific action, rather than a generic script; remembered and followed because it belongs to the guest.` },
        { term: 'Professional recommendation', definition: `A product or follow-up booking suggested from genuine findings and framed as expertise, offered without pressure and dropped gracefully if declined.` },
        { term: 'Guest record', definition: `The written note of preferences, findings, products and personal details that lets a future visit begin with recognition rather than repetition.` },
      ],
      caseStudy: {
        title: 'The remembered guest at The Wexford Grand, Mayfair',
        scenario: `Priya, a therapist at The Wexford Grand in Mayfair, treated Ms Laurent six weeks ago: firm pressure, focus on the right shoulder from carrying a laptop bag, no conversation after the first check-in, and a rose-scented oil the guest loved. Priya recorded all of it before her next appointment. Today Ms Laurent returns, booked by an assistant who gave no details. Priya opens the consultation with a warm greeting by name, then: last time we worked firmly on that right shoulder and you liked the rose blend and a quiet room, shall we start there and you tell me what has changed. Ms Laurent visibly relaxes and mentions, unprompted, that she has since switched to a rucksack on Priya's earlier advice.`,
        insight: `Every element of this moment was manufactured six weeks earlier by a two-minute record. The greeting shows recognition, the recalled preferences remove the burden of re-explaining, and the open follow-up question keeps the consultation live rather than assuming nothing has changed, which matters because histories and preferences do change and must be re-confirmed each visit. Note also the compound effect: the aftercare advice Priya linked to the consultation was actually followed, improving the guest's outcome and deepening trust. This is how one-off guests become regulars, and how therapists become requested by name.`,
      },
      summary: `The consultation closes at the goodbye, not at the couch. Aftercare earns attention when it explicitly references what the guest disclosed, joining finding, treatment and action in one personal sentence. The close is also the honest moment for recommendation, offered from genuine findings as service rather than selling, and released gracefully if declined. Finally, preferences, findings and products are written to the guest's record while fresh, so the next visit can open with recognition. That remembered welcome is how regulars are made, and regulars are how careers are built.`,
    },
  ],
}

export default content
