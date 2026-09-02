const ROLE_LEVELS: Record<string, number> = {
  'Apprentice': 1, 'Junior': 2, 'Junior Therapist': 2, 'Receptionist': 2, 'Spa Receptionist': 2,
  'Spa Attendant': 1, 'Nail Technician': 2, 'Therapist': 3, 'Beauty Therapist': 3,
  'Wellness Practitioner': 3, 'Yoga/Pilates Instructor': 3, 'Personal Trainer': 3,
  'Nutritionist': 3, 'Hair Stylist': 3, 'Barber': 3, 'Senior Therapist': 4,
  'Lead Therapist': 5, 'Supervisor': 5, 'Spa Manager': 6, 'Operations Manager': 6,
  'Spa & Wellness Operations Manager': 6, 'Spa Director': 7, 'Director': 7, 'Director of Spa': 7,
}

function roleLevel(value: string): number {
  const role = value.trim().toLowerCase()
  if (!role) return 3
  const exact = Object.entries(ROLE_LEVELS).find(([label]) => label.toLowerCase() === role)
  if (exact) return exact[1]
  if (/director|head of spa|head of wellness/.test(role)) return 7
  if (/manager/.test(role)) return 6
  if (/lead therapist|team lead|supervisor/.test(role)) return 5
  if (/senior/.test(role)) return 4
  if (/therapist|practitioner|instructor|trainer|nutritionist|stylist|barber/.test(role)) return 3
  if (/junior|reception|nail technician/.test(role)) return 2
  if (/apprentice|attendant/.test(role)) return 1
  return 3
}

const PROFICIENCY_WEIGHT: Record<string, number> = { beginner: .25, basic: .25, intermediate: .5, competent: .5, advanced: .75, master: 1, expert: 1 }
const PROFICIENCY_LABEL: Record<string, string> = { beginner: 'beginner', basic: 'beginner', intermediate: 'intermediate', competent: 'intermediate', advanced: 'advanced', master: 'master', expert: 'master' }
type RoleFamily = 'leadership' | 'reception' | 'treatment' | 'fitness' | 'hair' | 'other'
type CandidateScope = 'same_level' | 'step_up' | 'emerging' | 'open_transferable'

function roleFamily(value: string): RoleFamily {
  const role = value.toLowerCase()
  if (/director|manager|head of spa|operations lead/.test(role)) return 'leadership'
  if (/reception|front desk|concierge|attendant/.test(role)) return 'reception'
  if (/therapist|practitioner|nail|beauty|massage|aesthetic|supervisor|team lead/.test(role)) return 'treatment'
  if (/fitness|personal trainer|yoga|pilates|nutrition/.test(role)) return 'fitness'
  if (/hair|stylist|barber/.test(role)) return 'hair'
  return 'other'
}

function overlapScore(candidateArr: string[], requiredArr: string[]): { score: number; matches: string[] } {
  if (!requiredArr.length) return { score: -1, matches: [] }
  const matches = requiredArr.filter(r => candidateArr.some(c => c.toLowerCase() === r.toLowerCase()))
  return { score: Math.round(matches.length / requiredArr.length * 100), matches }
}

function validCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}
function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radius = 3958.761, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(b.latitude-a.latitude), dLng = toRad(b.longitude-a.longitude), lat1=toRad(a.latitude), lat2=toRad(b.latitude)
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2
  return 2*radius*Math.asin(Math.sqrt(h))
}
function candidateRadiusMiles(candidate: any): number | null {
  const explicit=Number(candidate.travel_radius_miles); if (Number.isFinite(explicit)&&explicit>0) return explicit
  const commute=String(candidate.max_commute||'').toLowerCase()
  if (commute.includes('willing to relocate')) return 250
  if (commute.includes('1.5 hour')) return 45
  if (commute.includes('1 hour')) return 30
  if (commute.includes('45')) return 22
  if (commute.includes('30')) return 15
  return null
}
function geographicLocationScore(candidate:any, job:any) {
  const cc=validCoordinate(candidate.latitude,-90,90)&&validCoordinate(candidate.longitude,-180,180)
  const jc=validCoordinate(job.latitude,-90,90)&&validCoordinate(job.longitude,-180,180)
  if (cc&&jc) {
    const distance=distanceMiles({latitude:candidate.latitude,longitude:candidate.longitude},{latitude:job.latitude,longitude:job.longitude})
    const relocation=String(candidate.max_commute||'').toLowerCase().includes('willing to relocate')||String(candidate.transport_method||'').toLowerCase().includes('relocating')
    if (relocation) return {score:100,distance,basis:'distance' as const}
    const cr=candidateRadiusMiles(candidate), er=Number(job.radius_miles), employerRadius=Number.isFinite(er)&&er>0?er:null
    const effective=cr&&employerRadius?Math.min(cr,employerRadius):cr||employerRadius
    if (!effective) return {score:distance<=5?100:distance<=15?90:distance<=30?75:distance<=50?55:30,distance,basis:'distance' as const}
    if (distance<=effective*.35) return {score:100,distance,basis:'distance' as const}
    if (distance<=effective*.7) return {score:90,distance,basis:'distance' as const}
    if (distance<=effective) return {score:75,distance,basis:'distance' as const}
    if (distance<=effective*1.25) return {score:40,distance,basis:'distance' as const}
    return {score:10,distance,basis:'distance' as const}
  }
  const jl=String(job.location||'').toLowerCase(), prefs:string[]=(candidate.location_preferences||[]).map((l:string)=>l.toLowerCase())
  if (jl&&prefs.length) return {score:prefs.some(l=>jl.includes(l)||l==='worldwide')?100:30,distance:null,basis:'text' as const}
  return {score:jl?50:-1,distance:null,basis:'unknown' as const}
}

function progressionPolicy(candidate:any, job:any, candidateRole:string, requiredRole:string) {
  const candLevel=roleLevel(candidateRole), jobLevel=roleLevel(requiredRole)
  const levelGap=jobLevel-candLevel
  const scope=(job.candidate_scope || 'step_up') as CandidateScope
  const candidateFamily=roleFamily(candidateRole), jobFamily=roleFamily(requiredRole)
  const businessSkills:string[]=candidate.business_skills||[]
  const careerEvidence:string[]=candidate.career_evidence||[]
  const leadershipEvidence=businessSkills.filter(s=>['Team Leadership','Staff Training','Rota Management','Revenue Management','Budget Management','KPI Reporting','Membership Management'].includes(s)).length
  const progressionBridge=(jobFamily==='leadership' && (candidateFamily==='leadership'||candidateFamily==='treatment'||candidateFamily==='reception')) && leadershipEvidence>=2
  const sameFamily=candidateFamily==='other'||jobFamily==='other'||candidateFamily===jobFamily||progressionBridge

  let allowed=true
  if (scope==='same_level') allowed=levelGap<=0
  else if (scope==='step_up') allowed=levelGap<=1
  else if (scope==='emerging') allowed=levelGap<=2
  else allowed=true

  let score:number
  if (!sameFamily && scope!=='open_transferable') score=15
  else if (levelGap<=0) score=100
  else if (levelGap===1) score=scope==='same_level'?35:85
  else if (levelGap===2) score=scope==='emerging'||scope==='open_transferable'?65:30
  else score=scope==='open_transferable'?45:10

  if (progressionBridge && levelGap>0) score=Math.max(score, levelGap===1?90:70)
  return {candLevel,jobLevel,levelGap,scope,allowed,sameFamily,progressionBridge,leadershipEvidence,careerEvidence,score}
}

export function calculateMatchScore(candidate:any, job:any): {
  score:number; label:string; colour:string; bgColour:string; breakdown:any; matchingSkills:string[]; hardStop:boolean; hardStopReason?:string; matchExplanation:string; distanceMiles:number|null; locationBasis:'distance'|'text'|'unknown'; progression?:any; mode?:'permanent'|'agency'|'leadership'
} {
  const emptyBreakdown={roleLevel:-1,treatmentSkills:-1,brands:-1,qualifications:-1,experience:-1,businessSkills:-1,systems:-1,location:-1,shiftCompatibility:-1,transport:-1,accommodation:-1,proficiencyDepth:-1,salaryFit:-1,availability:-1,profileCompleteness:0,reviewScore:0}
  const empty={score:10,label:'Requirement Missing',colour:'#555555',bgColour:'#F3F4F6',breakdown:emptyBreakdown,matchingSkills:[] as string[],hardStop:true,matchExplanation:'',distanceMiles:null,locationBasis:'unknown' as const}

  const candidateRole=String(candidate.role_level||candidate.current_role||candidate.job_title||'')
  const requiredRole=String(job.required_role_level||job.job_title||job.title||'')
  const policy=progressionPolicy(candidate,job,candidateRole,requiredRole)

  const insuranceApplies=job.insurance_required&&(roleFamily(requiredRole)==='treatment'||(job.is_agency_role&&roleFamily(requiredRole)!=='leadership'))
  if (insuranceApplies&&!candidate.has_insurance) return {...empty,hardStopReason:'Professional insurance required for treatment delivery'}

  const requiredSkills:string[]=job.required_skills||[], candidateSkills:string[]=candidate.treatment_skills||candidate.skills||candidate.services_offered||[]
  const treatmentResult=overlapScore(candidateSkills,requiredSkills)
  const brandResult=overlapScore(candidate.product_houses||[],job.required_brands||job.required_product_houses||[])
  const qualResult=overlapScore(candidate.qualifications||[],job.required_qualifications||[])
  const minYears=job.min_years_experience||0, candYears=candidate.experience_years||candidate.years_experience||0
  const expScore=minYears===0?-1:candYears>=minYears?100:Math.max(10,Math.round(candYears/minYears*80))
  const bizResult=overlapScore(candidate.business_skills||[],job.preferred_business_skills||[])
  const sysResult=overlapScore(candidate.systems_knowledge||candidate.systems_experience||[],job.required_systems||[])
  const geo=geographicLocationScore(candidate,job), locationScore=geo.score
  const jobShift=String(job.shift_pattern||'').toLowerCase(), candidateShifts:string[]=(candidate.shift_preferences||[]).map((s:string)=>s.toLowerCase())
  let shiftScore=jobShift?50:-1
  if (jobShift&&candidateShifts.length) shiftScore=candidateShifts.includes('flexible')||candidateShifts.some(s=>jobShift.includes(s))?100:30
  const candidateTransport=candidate.transport_method||'', candidateCommute=candidate.max_commute||''
  let transportScore=candidateTransport||candidateCommute?70:-1
  if (candidateTransport==='Own car'||candidateTransport==='Relocating for role') transportScore=100
  else if (candidateTransport==='Public transport') transportScore=80
  if (candidateCommute==='Willing to relocate') transportScore=100
  else if (candidateCommute==='1.5 hours') transportScore=Math.max(transportScore,90)
  else if (candidateCommute==='1 hour') transportScore=Math.max(transportScore,80)
  let accommodationScore=-1
  if (candidate.needs_accommodation&&!job.offers_accommodation) accommodationScore=20
  else if (candidate.needs_accommodation&&job.offers_accommodation) accommodationScore=100
  const profs:Record<string,string>=candidate.skill_proficiencies||{}
  let proficiencyScore=-1
  if (requiredSkills.length&&Object.keys(profs).length) {
    let total=0,count=0
    for (const skill of requiredSkills) { const match=Object.entries(profs).find(([k])=>k.toLowerCase()===skill.toLowerCase()); if(match){total+=(PROFICIENCY_WEIGHT[match[1]]||.5)*100;count++} }
    proficiencyScore=count?Math.round(total/count):-1
  }
  const profileScore=Math.min(100,candidate.profile_completion_score||candidate.profile_completion_pct||0)
  const rv=candidate.review_score||0, reviewScoreNorm=rv>=4.5?100:rv>=4?85:rv>=3.5?65:rv>0?40:50

  // Different logic for agency, permanent and leadership roles: the same
  // factors matter differently for a Saturday shift, a permanent post and a
  // Director appointment.
  const mode:'permanent'|'agency'|'leadership'=job.is_agency_role?'agency':roleFamily(requiredRole)==='leadership'?'leadership':'permanent'

  // Salary fit: does the role's band meet the candidate's stated expectation?
  const expectationMin=Number(candidate.salary_expectation_min||candidate.salary_expectation||0)
  const jobSalaryMin=Number(job.salary_min||0), jobSalaryMax=Number(job.salary_max||job.salary_min||0)
  let salaryScore=-1
  if (mode!=='agency'&&expectationMin>0&&jobSalaryMax>0) {
    if (jobSalaryMax>=expectationMin) salaryScore=jobSalaryMin>=expectationMin?100:88
    else {
      const shortfall=(expectationMin-jobSalaryMax)/expectationMin
      salaryScore=shortfall<=0.05?72:shortfall<=0.15?48:22
    }
  }

  // Availability: how soon can they realistically start?
  const AVAILABILITY_SCORE:Record<string,number>={immediately:100,'1_week':95,'2_weeks':88,'1_month':72,not_available:10}
  const availabilityScore=candidate.availability_status?AVAILABILITY_SCORE[String(candidate.availability_status)]??60:-1

  const MODE_WEIGHTS:Record<string,Record<string,number>>={
    permanent:{roleLevel:30,treatments:15,brands:8,qualifications:12,experience:10,business:11,systems:6,location:10,shift:5,transport:3,accommodation:2,proficiency:3,salary:6,availability:4,review:0},
    agency:{roleLevel:10,treatments:24,brands:10,qualifications:12,experience:8,business:3,systems:6,location:16,shift:8,transport:6,accommodation:1,proficiency:6,salary:0,availability:10,review:8},
    leadership:{roleLevel:36,treatments:5,brands:6,qualifications:10,experience:14,business:18,systems:4,location:8,shift:2,transport:2,accommodation:1,proficiency:0,salary:8,availability:4,review:4},
  }
  const w=MODE_WEIGHTS[mode]
  const components=[
    {value:policy.score,weight:w.roleLevel},{value:treatmentResult.score,weight:w.treatments},{value:brandResult.score,weight:w.brands},{value:qualResult.score,weight:w.qualifications},{value:expScore,weight:w.experience},{value:bizResult.score,weight:w.business},{value:sysResult.score,weight:w.systems},{value:locationScore,weight:w.location},{value:shiftScore,weight:w.shift},{value:transportScore,weight:w.transport},{value:accommodationScore,weight:w.accommodation},{value:proficiencyScore,weight:w.proficiency},{value:salaryScore,weight:w.salary},{value:availabilityScore,weight:w.availability},{value:rv>0?reviewScoreNorm:-1,weight:w.review},
  ].filter(c=>c.value>=0&&c.weight>0)
  const weight=components.reduce((t,c)=>t+c.weight,0)
  let score=weight?components.reduce((t,c)=>t+c.value*c.weight,0)/weight:10
  if (!policy.allowed && policy.scope!=='open_transferable') score=Math.min(score,44)
  if (!policy.sameFamily && policy.scope!=='open_transferable') score=Math.min(score,25)
  const rounded=Math.max(10,Math.round(score))
  const label=rounded>=90?'Perfect Match':rounded>=75?'Strong Match':rounded>=60?'Good Match':rounded>=45?'Partial Match':'Low Match'
  const colour=rounded>=90?'#16A34A':rounded>=75?'#1D4ED8':rounded>=60?'#D97706':'#555555'
  const bgColour=rounded>=90?'#DCFCE7':rounded>=75?'#DBEAFE':rounded>=60?'#FEF3C7':'#F3F4F6'
  const matchingSkills=[...treatmentResult.matches,...brandResult.matches,...qualResult.matches,...bizResult.matches].slice(0,6)
  const reasons:string[]=[]
  if (policy.levelGap===1 && policy.allowed) reasons.push('career progression fit')
  if (policy.progressionBridge) reasons.push('leadership evidence supports progression')
  if (qualResult.matches.length) reasons.push(`${qualResult.matches[0]} qualification`)
  if (bizResult.matches.length) reasons.push(`${bizResult.matches[0]} business experience`)
  if (brandResult.matches.length&&reasons.length<3) reasons.push(`${brandResult.matches[0]} product experience`)
  if (treatmentResult.matches.length&&reasons.length<3) {
    const skill=treatmentResult.matches[0], prof=Object.entries(profs).find(([k])=>k.toLowerCase()===skill.toLowerCase())?.[1], pl=prof?PROFICIENCY_LABEL[prof]:null
    reasons.push(pl?`${pl}-level ${skill}`:`${skill} skills`)
  }
  if (geo.distance!=null&&locationScore>=75&&reasons.length<3) reasons.push(`${geo.distance.toFixed(1)} miles from the role`)
  const strength=rounded>=90?'Excellent':rounded>=75?'Strong':rounded>=60?'Good':'Partial'
  let matchExplanation=reasons.length?`${strength} match based on ${reasons.join(', ')}.`:''
  if (policy.levelGap===1&&policy.allowed) matchExplanation += ` This employer is open to candidates ready for the next career step.`
  if (!policy.allowed&&policy.scope==='same_level') matchExplanation += ` This employer asked WHC to prioritise candidates already at this level.`
  if (mode==='agency') matchExplanation += ` Weighted for agency work: treatment capability, availability, distance and reliability count most.`
  if (mode==='leadership') matchExplanation += ` Weighted for a leadership appointment: level, commercial and people experience count most.`
  if (salaryScore>=0&&salaryScore<50) matchExplanation += ` Note: the advertised salary sits below their stated expectation.`

  return {score:rounded,label,colour,bgColour,breakdown:{roleLevel:policy.score,treatmentSkills:treatmentResult.score,brands:brandResult.score,qualifications:qualResult.score,experience:expScore,businessSkills:bizResult.score,systems:sysResult.score,location:locationScore,shiftCompatibility:shiftScore,transport:transportScore,accommodation:accommodationScore,proficiencyDepth:proficiencyScore,salaryFit:salaryScore,availability:availabilityScore,profileCompleteness:profileScore,reviewScore:reviewScoreNorm},matchingSkills,hardStop:false,matchExplanation,distanceMiles:geo.distance,locationBasis:geo.basis,mode,progression:{scope:policy.scope,levelGap:policy.levelGap,isStepUp:policy.levelGap===1&&policy.allowed,bridge:policy.progressionBridge}}
}

export function rankCandidates(candidates:any[],job:any,minScore=10,blockedEmployerIds?:string[]) {
  const employerId=job.employer_id||job.employer_profile_id
  return candidates.filter(c=>!(blockedEmployerIds&&employerId&&blockedEmployerIds.includes(c.id))).map(c=>({...calculateMatchScore(c,job),candidateId:c.id})).filter(r=>r.score>=minScore).sort((a,b)=>b.score-a.score)
}
export function filterBlockedCandidates(candidates:any[],blockedCandidateIds:string[]) { return blockedCandidateIds.length?candidates.filter(c=>!blockedCandidateIds.includes(c.id)):candidates }
