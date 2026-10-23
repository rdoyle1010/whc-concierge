import type { PolicyEntry } from './types'

// People.
//
// Three, not ten. Disciplinary and grievance procedures are deliberately not
// in this pack: they are the documents most likely to be tested in front of a
// tribunal, they turn on jurisdiction and on the individual contract, and a
// template bought off a website is exactly the wrong way to hold one. A spa
// should take those from an employment adviser, and saying so is worth more
// than selling a version of them.
//
// What is here is the three that are genuinely operational, where the spa
// context changes the content and where most properties have nothing written
// at all.

export const PEOPLE_POLICIES: PolicyEntry[] = [
  {
    reference: 'HR-EQUALITY-POL-831',
    title: 'Equality, Diversity and Inclusion Policy',
    department: 'HR & PEOPLE TEAM',
    group: 'People',
    purpose:
      'To state how this spa treats its team and its guests, in an industry where the workforce is diverse, '
      + 'the guests are international, and the work involves touching people.',
    appliesTo: 'Everybody working in or on behalf of the spa, and every guest using it.',
    position: [
      'People are recruited, developed and promoted on what they can do and how they do it. Nothing else '
      + 'enters the decision.',
      'A guest is served the same whoever they are. Where a guest requests a therapist of a particular sex '
      + 'for reasons of faith, culture or comfort, we accommodate it where we can and say so plainly where we '
      + 'cannot, without treating either the guest or the therapist as a problem.',
      'A request from a guest that is discriminatory towards a member of the team is refused. We will lose the '
      + 'booking rather than the person.',
      'Adjustments for disability, faith, pregnancy or caring responsibility are made where they can be, and '
      + 'asking for one is never held against anybody.',
    ],
    rules: [
      {
        area: 'Recruiting and developing',
        items: [
          'Advertise against the job description and shortlist against the essential criteria.',
          'Use the same questions and the same scoring for every candidate for a role.',
          'Record the reason for every hiring decision, in terms of the criteria.',
          'Offer development on the basis of performance and potential, not on who asks loudest.',
          'Make reasonable adjustments at application, interview and in the role.',
        ],
      },
      {
        area: 'On the floor',
        items: [
          'Language, humour and comment that would exclude somebody is not acceptable, including where nobody present objects.',
          'Uniform, appearance and dress standards accommodate faith and culture: [the property states how].',
          'Rotas accommodate religious observance and caring responsibility where the operation allows.',
          'A therapist may decline a booking that would require them to work outside a boundary of faith or comfort, and is supported.',
        ],
      },
      {
        area: 'Guests',
        items: [
          'Accommodate a same-sex therapist request where staffing allows, and say honestly at booking where it does not.',
          'Refuse a request that is discriminatory towards a member of the team, and tell the guest why.',
          'Where a guest is abusive to a member of the team on any discriminatory basis, the duty manager ends the visit.',
          'Accessibility: [the property states what it can offer and where it cannot].',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'The position, and backing a decision to lose a booking over it.' },
      { role: 'Spa Manager', duty: 'Fair recruitment, fair development, and acting on a concern immediately.' },
      { role: 'Duty manager', duty: 'Ending a visit where a guest is abusive on a discriminatory basis.' },
      { role: 'Everybody', duty: 'Raising a concern rather than tolerating something they would not want said to them.' },
    ],
    records: [
      'Recruitment records: criteria, scoring and the reason for each decision',
      'Adjustments requested and what was provided',
      'Concerns raised and how each was handled',
      'Incidents where a guest was refused or a visit ended, and why',
      'Training records for this policy at induction',
    ],
    breach: [
      'Discriminatory language or conduct is a disciplinary matter, up to and including dismissal.',
      'Making a recruitment or development decision on anything other than the criteria is a serious breach.',
      'Accommodating a discriminatory request from a guest, at the expense of a member of the team, is a breach by whoever allowed it.',
      'Retaliating against somebody who raised a concern is treated as the most serious breach of this policy.',
    ],
    reviewTriggers: [
      'Any concern, complaint or claim raised under this policy',
      'A change to the team structure or to the recruitment process',
      'A change to the uniform or appearance standard',
    ],
  },

  {
    reference: 'HR-SOCIALMEDIA-POL-832',
    title: 'Social Media and Personal Devices Policy',
    department: 'HR & PEOPLE TEAM',
    group: 'People',
    purpose:
      'To protect guest privacy and the property’s reputation, in a place where people are undressed and '
      + 'where a single photograph can end a career and a contract.',
    appliesTo: 'Everybody working in or on behalf of the spa, on and off duty.',
    position: [
      'Nothing about a guest ever appears on a personal account. Not their name, not their treatment, not a '
      + 'photograph, not an anonymised anecdote that anybody who was there could decode.',
      'Who visits a spa is confidential. That a guest was here at all is confidential, and it is the piece '
      + 'most often given away.',
      'Personal devices are not carried on the treatment floor or into wet areas. [The property states where '
      + 'they are kept.]',
      'A complaint about the property posted publicly is answered by the property, not by a member of the team '
      + 'defending it in the comments, however unfair it is.',
    ],
    rules: [
      {
        area: 'What is never posted',
        items: [
          'Any photograph taken inside the spa, including of an empty room or of back of house.',
          'Any reference to a guest, by name, by description, or by a detail that would identify them.',
          'Anything about a colleague without their agreement.',
          'Anything about an incident, a complaint or an investigation.',
          'Anything that would identify a guest as being present, including a check-in or a tagged location.',
        ],
      },
      {
        area: 'Personal accounts',
        items: [
          'Make clear that views are your own where you identify your employer.',
          'Do not speak for the property, respond to a review as it, or represent it in any group or forum.',
          'Do not connect with a guest from a personal account or accept a connection from one.',
          'Do not contact a guest through any channel except the property system.',
        ],
      },
      {
        area: 'Devices at work',
        items: [
          'Phones are not carried on the treatment floor, poolside or in wet areas.',
          'Personal use is at breaks, in [the area the property designates].',
          'Guest information is never photographed, copied to a personal device, or sent through a personal account.',
          'Where a device is used for work, it is under [the property arrangements] and the data comes off it when you leave.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'The property response to anything posted publicly about it.' },
      { role: '[Marketing or the role the property names]', duty: 'Official accounts and responding to reviews.' },
      { role: 'Spa Manager', duty: 'Enforcing the device standard on the floor.' },
      { role: 'Everybody', duty: 'Guest confidentiality, on and off duty, during employment and after it.' },
    ],
    records: [
      'Acknowledgement of this policy at induction',
      'Any breach and the action taken',
      'Approved official accounts and who holds access to them',
    ],
    breach: [
      'Posting a photograph taken inside the spa is gross misconduct.',
      'Identifying a guest, however indirectly, is gross misconduct and may be a data protection breach reportable to a regulator.',
      'Contacting a guest through a personal account is a serious disciplinary matter.',
      'Responding publicly on behalf of the property without authority is a disciplinary matter.',
    ],
    reviewTriggers: [
      'Any breach or near breach',
      'A change to the official accounts or who holds them',
      'A change to device arrangements or to the systems used',
    ],
  },

  {
    reference: 'HR-PRESENTATION-POL-833',
    title: 'Uniform, Appearance and Personal Presentation Policy',
    department: 'HR & PEOPLE TEAM',
    group: 'People',
    purpose:
      'To set the presentation standard, which in a spa is partly about the brand and substantially about '
      + 'hygiene and safety.',
    appliesTo: 'Everybody working in a guest-facing or treatment role, and anybody entering a treatment or wet area.',
    position: [
      'Most of this standard exists for hygiene and safety rather than for appearance. Nails, jewellery and '
      + 'hair are on the list because of what they carry and what they catch, not because of taste.',
      'The standard accommodates faith, culture and disability. Where an item of dress or appearance matters '
      + 'to somebody, we find a way that also meets the hygiene requirement rather than refusing it.',
      'Uniform is provided and maintained by the property. Nobody is asked to work in something that does not '
      + 'fit or is not clean.',
      'The standard is held consistently. A standard applied to some people and not others is not a standard.',
    ],
    rules: [
      {
        area: 'Hygiene critical',
        items: [
          'Nails short, clean and unvarnished for anybody delivering hands-on treatment. No enhancements.',
          'No rings other than a plain band, no bracelets, no watches during treatment. They harbour and they scratch.',
          'Hair tied back and off the face and the collar for treatment and food handling.',
          'Cuts and abrasions covered with a waterproof dressing before contact.',
          'No strong fragrance on anybody delivering treatment: a guest may be sensitive and it interferes with the product.',
        ],
      },
      {
        area: 'Uniform',
        items: [
          'Clean, pressed and complete at the start of every shift, changed if it becomes soiled.',
          'Name badge worn and legible in every guest-facing role.',
          'Footwear closed, non-slip and appropriate to the area. Wet area footwear as [the property specifies].',
          'Changed at the property rather than travelled in, where the property provides changing facilities.',
        ],
      },
      {
        area: 'Accommodation',
        items: [
          'Religious dress and head covering are accommodated, in a form that meets the hygiene requirement.',
          'Adjustments for a disability or a health condition are made on request.',
          'Visible tattoos and piercings: [the property states its position, applied consistently].',
          'Where somebody cannot meet an element of the standard, they raise it rather than working around it, and a solution is found.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'The standard, and that it is capable of accommodating faith, culture and disability.' },
      { role: 'Spa Manager', duty: 'Holding it consistently, and providing uniform that fits and is replaced.' },
      { role: 'Everybody', duty: 'Meeting it, and raising anything they cannot meet rather than ignoring it.' },
    ],
    records: [
      'Uniform issued and replaced',
      'Adjustments agreed and on what basis',
      'Any repeated failure to meet the standard and the conversation about it',
    ],
    breach: [
      'A first failure is a conversation and, where possible, a solution the same shift.',
      'Repeated failure after a conversation is a disciplinary matter.',
      'Delivering a treatment with nails, jewellery or an uncovered wound that breaches the hygiene standard is treated under the infection control policy.',
      'Applying the standard selectively is a breach by the manager doing it.',
    ],
    reviewTriggers: [
      'A change to the uniform or the supplier',
      'An infection control finding relating to presentation',
      'A request for an accommodation the current standard cannot meet',
    ],
  },
]
