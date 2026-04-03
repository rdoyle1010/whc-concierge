export interface CandidateProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  headline?: string
  specialisms?: string[]
  experience_years?: number
  salary_min?: number
  salary_max?: number
  availability?: string
  profile_image_url?: string
  cv_url?: string
  stealth_mode?: boolean
  blocked_employers?: string[]
  verified?: boolean
  created_at: string
  updated_at: string
}

export interface EmployerProfile {
  id: string
  user_id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  website?: string
  logo_url?: string
  description?: string
  location?: string
  property_type?: string
  verified?: boolean
  stripe_customer_id?: string
  subscription_tier?: string
  created_at: string
  updated_at: string
}

export interface PropertyProfile {
  id: string
  employer_id: string
  name: string
  location: string
  description?: string
  property_type?: string
  star_rating?: number
  image_url?: string
  amenities?: string[]
  created_at: string
}

export interface JobListing {
  id: string
  employer_id: string
  title: string
  description: string
  location: string
  job_type: string
  specialism?: string
  salary_min?: number
  salary_max?: number
  tier?: string
  benefits?: string[]
  requirements?: string[]
  status: 'active' | 'closed' | 'draft'
  created_at: string
  updated_at: string
  employer_profiles?: EmployerProfile
  property_profiles?: PropertyProfile
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
  cover_letter?: string
  created_at: string
  job_listings?: JobListing
  candidate_profiles?: CandidateProfile
}

export interface Match {
  id: string
  candidate_id: string
  employer_id: string
  job_id?: string
  score?: number
  status: string
  created_at: string
  candidate_profiles?: CandidateProfile
  employer_profiles?: EmployerProfile
  job_listings?: JobListing
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  image_url?: string
  author?: string
  published: boolean
  category?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description?: string
  type?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_date?: string
  end_date?: string
  target_audience?: string
  content?: string
  created_at: string
}

export interface SiteImage {
  id: string
  name: string
  url: string
  alt_text?: string
  category?: string
  uploaded_by?: string
  created_at: string
}

export interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment?: string
  type: 'candidate' | 'employer'
  created_at: string
}

export interface AgencyBooking {
  id: string
  candidate_id: string
  employer_id: string
  shift_date: string
  shift_type?: string
  hours?: number
  rate?: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}

export interface Complaint {
  id: string
  reporter_id: string
  reported_id?: string
  subject: string
  description: string
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
}

export interface Swipe {
  id: string
  user_id: string
  target_id: string
  direction: 'left' | 'right'
  target_type: 'job' | 'candidate'
  created_at: string
}
