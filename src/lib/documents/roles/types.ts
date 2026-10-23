// A job description, as content rather than as layout.
//
// The shape is the argument. Most spa job descriptions are a list of duties
// and nothing else, which is why they are useless three times over: at
// interview there is nothing to assess against, at appraisal there is nothing
// to measure against, and at a tribunal there is nothing to show the person
// was told what the job was.
//
// So every one of these carries four things a duty list does not. What the
// job is for, in one line, because a role nobody can state the purpose of is
// a role that grows by accident. What good looks like, written as behaviour
// somebody can observe rather than as an adjective. How it is measured, which
// makes an appraisal a conversation about numbers rather than about feelings.
// And what is required as distinct from what is wanted, so a hiring manager
// cannot quietly move the bar between two candidates.
//
// Anything that belongs to one property is a placeholder. Salary, hours, who
// this reports to by name, which systems the spa runs: nobody writing this
// knows them, and a plausible guess typed into a contract-adjacent document
// is worse than a blank.

export type RoleEntry = {
  reference: string
  title: string
  /** The register department, spelled exactly as the library spells it. */
  department: string
  /** Where it sits: used to group the pack and to set the tone. */
  band: 'Leadership' | 'Supervisory' | 'Treatment floor' | 'Front of house'
    | 'Wet area and fitness' | 'Support and back of house'
  /** One line on what the job is for. Not what it does. */
  purpose: string
  /** Who they answer to, as a role rather than a name. */
  reportsTo: string
  /** Who answers to them, or a line saying nobody does. */
  responsibleFor: string
  /** Duties grouped by area, because a flat list of thirty is unreadable. */
  duties: { area: string; items: string[] }[]
  /** Behaviour somebody can observe, not adjectives. */
  whatGoodLooksLike: string[]
  /** What the role is judged on, in numbers where numbers exist. */
  measuredBy: string[]
  /** Without these, they cannot do the job or cannot lawfully do it. */
  essential: string[]
  /** Wanted, and the difference is the point. */
  desirable: string[]
  /** The physical and practical truth of the job, stated plainly. */
  conditions: string[]
}
