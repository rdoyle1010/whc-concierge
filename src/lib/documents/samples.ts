// What is given away complete, free, with no email address asked for.
//
// Three rules decided this list and they are worth keeping when it changes.
//
// It is not the documents that carry the liability. A risk assessment and a
// pool emergency plan are what somebody is actually paying for, and giving one
// away is giving away the product rather than a sample of it.
//
// It is complete. A watermarked first page proves nothing except that there is
// a watermark. What convinces a spa director is opening a document and finding
// the sections they did not expect somebody to have thought of.
//
// It is one of each shape, because the library is four shapes and a buyer who
// has seen a procedure still does not know what a checklist or a job
// description looks like.
export const FREE_SAMPLES: string[] = [
  // A procedure, the cheapest thing in the shop and the shape most of it is.
  'REC-ARRIVE-SOP-018',
  // A checklist, the thing a team actually prints.
  'REC-OPENING-CHK-501',
  // A job description, the one most often needed in a hurry.
  'THER-SPATHERAPIST-JD-712',
]

export const isSample = (reference: string) => FREE_SAMPLES.includes(reference)
