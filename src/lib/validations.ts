import { z } from 'zod'

// ── Shared enums ──
const contactType = z.enum(['general', 'complaint', 'partnership'])
const contractType = z.enum(['permanent', 'fixed_term', 'freelance', 'agency', 'seasonal'])
const roleLevelEnum = z.enum([
  'Apprentice', 'Junior', 'Junior Therapist', 'Therapist', 'Senior Therapist',
  'Lead Therapist', 'Spa Manager', 'Operations Manager', 'Spa & Wellness Operations Manager',
  'Spa Director', 'Director', 'Director of Spa', 'Receptionist', 'Spa Receptionist',
  'Spa Attendant', 'Beauty Therapist', 'Wellness Practitioner', 'Yoga/Pilates Instructor',
  'Personal Trainer', 'Nutritionist', 'Nail Technician', 'Hair Stylist', 'Barber',
])
const reviewDimension = z.number().int().min(1).max(5)

// ── Contact form ──
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  type: contactType.default('general'),
})

// ── Talent profile ──
export const talentProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email').optional(),
  phone: z.string().regex(/^(\+44|0)\d{9,10}$/, 'Please enter a valid UK phone number').optional().or(z.literal('')),
  bio: z.string().max(2000, 'Bio must be under 2000 characters').optional(),
  role_level: roleLevelEnum.optional(),
  headline: z.string().max(200).optional(),
  treatment_skills: z.array(z.string()).max(50, 'Maximum 50 skills').optional(),
  experience_years: z.number().int().min(0).max(50).optional(),
})

// ── Employer profile ──
export const employerProfileSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(200),
  contact_email: z.string().email('Please enter a valid email').optional(),
  property_type: z.string().optional(),
  location: z.string().optional(),
})

// ── Job listing ──
export const jobListingSchema = z.object({
  job_title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  job_description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  salary_min: z.number().min(0, 'Salary cannot be negative').optional(),
  salary_max: z.number().min(0).optional(),
  location: z.string().min(1, 'Location is required'),
  contract_type: contractType.default('permanent'),
  required_role_level: roleLevelEnum.optional(),
}).refine(data => {
  if (data.salary_min && data.salary_max) return data.salary_max >= data.salary_min
  return true
}, { message: 'Maximum salary must be greater than minimum', path: ['salary_max'] })

// ── Application ──
export const applicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  cover_note: z.string().max(1000, 'Cover note must be under 1000 characters').optional(),
})

// ── Review ──
export const reviewSchema = z.object({
  reviewer_id: z.string().uuid(),
  reviewed_id: z.string().uuid(),
  rating: z.number().min(1).max(5).optional(),
  criteria_scores: z.object({
    professionalism: reviewDimension,
    punctuality: reviewDimension,
    communication: reviewDimension,
    skillLevel: reviewDimension,
    reliability: reviewDimension,
    overallExperience: reviewDimension,
  }).optional(),
  comment: z.string().max(2000, 'Comment must be under 2000 characters').optional(),
  type: z.enum(['candidate', 'employer']).default('candidate'),
}).refine(data => data.rating || data.criteria_scores, {
  message: 'Either rating or criteria_scores is required',
})

// ── Blog post ──
export const blogPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  category: z.string().optional(),
  excerpt: z.string().max(300, 'Excerpt must be under 300 characters').optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').max(50000),
})

// ── Profile update (partial, any allowed field) ──
export const profileUpdateSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID'),
  data: z.record(z.string(), z.unknown()).refine(d => Object.keys(d).length > 0, 'No fields provided'),
})

// ── Helper ──
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean; data?: T; errors?: { field: string; message: string }[]
} {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }

  const errors = result.error.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }))
  return { success: false, errors }
}
