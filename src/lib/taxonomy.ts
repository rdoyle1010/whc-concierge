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

// ─── Business & Leadership Skills ───
export const BUSINESS_SKILLS_FULL = [
  'Reception & Front of House','Revenue Management','Stock Control','Team Leadership','Staff Training','Rota Management',
  'KPI Reporting','Health & Safety','COSHH Management','Budget Management','Client Consultation','Upselling & Retail',
  'Social Media','Event Coordination','Membership Management',
]

// ─── Hotel & Spa Groups (experience with) ───
export const HOTEL_BRANDS_FULL = [
  'Four Seasons','Mandarin Oriental','Rosewood','Fairmont','Raffles','Ritz-Carlton','St. Regis','Waldorf Astoria',
  'Park Hyatt','Peninsula','Aman','Six Senses','Banyan Tree','One&Only','Belmond','Bulgari Hotels','Dorchester Collection',
  'Maybourne','Corinthia','Kempinski','Shangri-La','Soho House','Red Carnation','InterContinental','Sofitel','Marriott','Hilton',
  'Champneys','Center Parcs Aqua Sana','Independent luxury hotel','Destination spa','Day spa group','Cruise line spa','Other',
]

// ─── Systems ───
export const SYSTEMS_FULL = [
  'Book4Time','SpaSoft','Mindbody','Spa Booker','Treatwell','Premier Software',
  'Rezlynx','Opera PMS','Concept','Shortcuts','Salon IQ','Other',
]
