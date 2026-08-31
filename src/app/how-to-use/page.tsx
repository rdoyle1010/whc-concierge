'use client'

import Link from 'next/link'
import { useState } from 'react'

type Role = 'talent' | 'employer'

type Step = { n:string; title:string; copy:string }

const talent: Step[] = [
  { n:'01', title:'Build your profile', copy:'Add your CV, experience, skills, availability, location and preferences. Stealth Mode lets you stay hidden from your current employer.' },
  { n:'02', title:'Discover the right work', copy:'Browse matched permanent roles, residencies and Agency shifts with real employer and job information.' },
  { n:'03', title:'Apply and track', copy:'Save roles, apply, follow progress and withdraw interest from one account.' },
  { n:'04', title:'Get Interview Ready', copy:'Use your CV, the job description and employer information together to understand the role, prepare evidence and practise harder questions.' },
  { n:'05', title:'Build reputation', copy:'Verified work can lead to star ratings, reviews and employer references that strengthen your profile.' },
  { n:'06', title:'Keep developing', copy:'Complete Academy courses and assessments, earn certificates and add visible professional development to your profile.' },
]

const employer: Step[] = [
  { n:'01', title:'Create your property profile', copy:'Show the property properly with images, spa information, location, travel details and the experience of working there.' },
  { n:'02', title:'Post the complete role', copy:'Publish the full job description, requirements, benefits and working pattern so candidates can make an informed decision.' },
  { n:'03', title:'Review matched Talent', copy:'See applicants and matched professionals, compare fit and keep conversations together in Messages.' },
  { n:'04', title:'Cover gaps with Agency', copy:'Find flexible spa professionals using availability, distance and travel practicality, then manage bookings from one place.' },
  { n:'05', title:'Build employer reputation', copy:'Properties collect verified ratings and reviews too, helping strong employers stand out.' },
  { n:'06', title:'Manage it anywhere', copy:'The website and app use the same live account, jobs, profiles, applications, bookings, messages and reputation data.' },
]

export default function HowToUsePage(){
  const [role,setRole]=useState<Role>('talent')
  const steps=role==='talent'?talent:employer

  return <main className="min-h-screen bg-white text-[#173246]">
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="mb-12 max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">How Wellness House works</p>
        <h1 className="text-4xl font-medium leading-tight text-[#0b2f4d] md:text-6xl">One platform. A much simpler way to move through spa careers and recruitment.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">Use the website or the app. Your account and live data stay together, so you can start something in one and continue in the other.</p>
      </div>

      <div className="mb-10 inline-flex border border-slate-200 p-1">
        <button onClick={()=>setRole('talent')} className={`px-5 py-3 text-sm font-semibold ${role==='talent'?'bg-[#0b2f4d] text-white':'text-slate-600'}`}>I’m Talent</button>
        <button onClick={()=>setRole('employer')} className={`px-5 py-3 text-sm font-semibold ${role==='employer'?'bg-[#0b2f4d] text-white':'text-slate-600'}`}>I’m an Employer</button>
      </div>

      <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2">
        {steps.map(step=><div key={step.n} className="bg-white p-7 md:p-9">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400">{step.n}</p>
          <h2 className="mt-4 text-xl font-semibold text-[#173246]">{step.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{step.copy}</p>
        </div>)}
      </div>

      <div className="mt-12 flex flex-col gap-4 bg-[#f4f7f8] p-7 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-lg font-semibold text-[#173246]">You do not have to learn the platform first.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Start with the next thing you need to do. The app now includes the same 60-second guide from Home whenever you want it.</p></div>
        <Link href="/" className="shrink-0 bg-[#0b2f4d] px-5 py-3 text-center text-sm font-semibold text-white">Go to Wellness House</Link>
      </div>
    </section>
  </main>
}
