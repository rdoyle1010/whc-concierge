/**
 * Shared taxonomy data used by both talent and employer profiles.
 * This is the single source of truth for all matching-related options.
 * Both sides MUST use these same lists for the matching algorithm to work.
 */

// ─── Services ───
export const SERVICES_CATEGORIES = [
  { name: 'Massage & Bodywork', items: ['Swedish Massage','Deep Tissue Massage','Hot Stone Massage','Sports Massage','Lymphatic Drainage','Pregnancy Massage','Thai Massage','Lomi Lomi','Shiatsu','Reflexology','Aromatherapy Massage'] },
  { name: 'Facial Treatments', items: ['Classic Facial','Anti-Ageing Facial','Microdermabrasion','Chemical Peel','LED Therapy','Microneedling','Dermaplaning','Hydrafacial','Lymphatic Facial','Bespoke Facial'] },
  { name: 'Body Treatments', items: ['Body Wrap','Body Scrub','Hydrotherapy','Mud Treatment','Thalassotherapy','Detox Treatment','Slimming Treatment'] },
  { name: 'Beauty & Aesthetics', items: ['Manicure','Pedicure','Gel Nails','Nail Art','Lash Extensions','Lash Lift & Tint','Brow Shaping','Brow Lamination','HD Brows','Waxing','Threading','Tinting','Semi-Permanent Makeup','Spray Tan'] },
  { name: 'Hair', items: ['Cutting','Colouring','Highlights','Blow Dry','Hair Up','Keratin Treatment','Scalp Treatment','Barbering'] },
  { name: 'Wellness & Movement', items: ['Yoga','Pilates','Meditation','Breathwork','Sound Healing','Reiki','Crystal Healing','Chakra Balancing','Hypnotherapy','Life Coaching','Nutrition Consultation','Personal Training','Fitness Classes','Swimming Instruction','Golf Instruction'] },
  { name: 'Holistic & Eastern', items: ['Acupuncture','Acupressure','Ayurvedic Treatments','Abhyanga','Shirodhara','Marma Therapy','Traditional Chinese Medicine','Cupping','Gua Sha','Moxibustion'] },
  { name: 'Medical Aesthetics', items: ['Botox/Fillers','Laser Hair Removal','IPL','Skin Peels','Mesotherapy','PRP','Collagen Induction','HIFU'] },
  { name: 'Water Therapies', items: ['Flotation Therapy','Watsu','Aqua Wellness','Hydrotherapy Pool'] },
]

// ─── Product Houses ───
export const PRODUCT_HOUSES_FULL = [
  'ESPA','Elemis','Decléor','Comfort Zone','La Stone','Kama Ayurveda','111SKIN','Wildsmith','Dr Barbara Sturm','VOYA','Bamford',
  'Subtle Energies','Sodashi','Ila Spa','Thalgo','Guinot','Dermalogica','IMAGE Skincare','Environ','Medik8','Murad','Payot','Caudalie',
  'Clarins','Sisley','La Mer','Darphin','Valmont','Biologique Recherche','QMS Medicosmetics','Intraceuticals','Babor','Germaine de Capuccini',
  'Anne Semonin','Susanne Kaufmann','Aromatherapy Associates','REN Clean Skincare','Eve Lom','Liz Earle','Cowshed','Oriela Frank',
  'Grown Alchemist','Mauli Rituals','Temple Spa','Sothys','Repêchage','Other',
]

// ─── Qualifications & Certifications ───
export const QUALS_CATEGORIES = [
  { name: 'Industry Qualifications', items: ['CIDESCO','CIBTAC','ITEC','VTCT','City & Guilds','BTEC Level 2 Beauty','BTEC Level 3 Beauty','NVQ Level 2 Beauty','NVQ Level 3 Beauty','NVQ Level 4 Beauty','NVQ Level 2 Hairdressing','NVQ Level 3 Hairdressing','HND Beauty','Degree in Beauty Therapy'] },
  { name: 'Specialist Certifications', items: ['First Aid','Manual Handling','COSHH','Food Hygiene Level 2','Level 3 Sports Massage','Level 4 Sports Massage','Ayurvedic Practitioner Diploma','Hot Stone Certified','Lymphatic Drainage Certified','Pregnancy Massage Certified','Medical Aesthetics Certificate','Laser/IPL Certified','Dermaplaning Certified','Microneedling Certified','Reflexology Diploma','Aromatherapy Diploma','Reiki Level 1','Reiki Level 2','Reiki Master','Yoga Teacher 200hr','Yoga Teacher 500hr','Pilates Instructor','Personal Training Level 3','Nutrition Advisor','Life Coach Certificate'] },
]

// ─── Systems ───
export const SYSTEMS_FULL = [
  'Book4Time','SpaSoft','Mindbody','Spa Booker','Treatwell','Premier Software',
  'Rezlynx','Opera PMS','Concept','Shortcuts','Salon IQ','Other',
]
