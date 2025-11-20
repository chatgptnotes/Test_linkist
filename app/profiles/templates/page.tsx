'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkIcon from '@mui/icons-material/Work';
import CodeIcon from '@mui/icons-material/Code';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PaletteIcon from '@mui/icons-material/Palette';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MicIcon from '@mui/icons-material/Mic';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CoffeeIcon from '@mui/icons-material/Coffee';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

// Icon aliases
const ArrowLeft = ArrowBackIcon;
const Check = CheckIcon;
const Sparkles = AutoAwesomeIcon;
const Briefcase = WorkIcon;
const Code = CodeIcon;
const Camera = CameraAltIcon;
const Music = MusicNoteIcon;
const Heart = FavoriteIcon;
const Palette = PaletteIcon;
const Trophy = EmojiEventsIcon;
const Mic = MicIcon;
const BookOpen = MenuBookIcon;
const Coffee = CoffeeIcon;
const SportsEsports = SportsEsportsIcon;


const templates = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Perfect for business professionals and corporate networking',
    icon: Briefcase,
    color: 'bg-blue-500',
    features: ['Contact Information', 'Work Experience', 'Professional Links', 'Resume Upload'],
    popular: true
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Showcase your creative portfolio and artistic work',
    icon: Palette,
    color: 'bg-purple-500',
    features: ['Portfolio Gallery', 'Creative Projects', 'Artistic Bio', 'Social Links'],
    popular: false
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Display your coding projects and technical skills',
    icon: Code,
    color: 'bg-green-500',
    features: ['GitHub Integration', 'Tech Stack', 'Projects Showcase', 'Code Snippets'],
    popular: true
  },
  {
    id: 'photographer',
    name: 'Photographer',
    description: 'Beautiful gallery layouts for your photography',
    icon: Camera,
    color: 'bg-orange-500',
    features: ['Photo Gallery', 'Album Organization', 'Booking Form', 'Pricing Packages'],
    popular: false
  },
  {
    id: 'musician',
    name: 'Musician',
    description: 'Share your music and connect with fans',
    icon: Music,
    color: 'bg-red-500',
    features: ['Music Player', 'Tour Dates', 'Merchandise', 'Fan Club'],
    popular: false
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Perfect for social media personalities',
    icon: Heart,
    color: 'bg-pink-500',
    features: ['Social Feed', 'Brand Partnerships', 'Media Kit', 'Analytics'],
    popular: true
  },
  {
    id: 'athlete',
    name: 'Athlete',
    description: 'Showcase your sports achievements and stats',
    icon: Trophy,
    color: 'bg-yellow-500',
    features: ['Stats Dashboard', 'Achievement Timeline', 'Training Schedule', 'Sponsorships'],
    popular: false
  },
  {
    id: 'speaker',
    name: 'Speaker',
    description: 'Promote your speaking engagements and expertise',
    icon: Mic,
    color: 'bg-indigo-500',
    features: ['Speaking Topics', 'Event Calendar', 'Testimonials', 'Booking Form'],
    popular: false
  },
  {
    id: 'educator',
    name: 'Educator',
    description: 'Share knowledge and connect with students',
    icon: BookOpen,
    color: 'bg-cyan-500',
    features: ['Course Listings', 'Student Resources', 'Office Hours', 'Publications'],
    popular: false
  },
  {
    id: 'freelancer',
    name: 'Freelancer',
    description: 'Attract clients and showcase your services',
    icon: Coffee,
    color: 'bg-amber-500',
    features: ['Service Packages', 'Client Testimonials', 'Availability Calendar', 'Quote Request'],
    popular: false
  },
  {
    id: 'gamer',
    name: 'Gamer',
    description: 'Level up your gaming presence',
    icon: SportsEsports,
    color: 'bg-violet-500',
    features: ['Stream Schedule', 'Gaming Stats', 'Clan Info', 'Tournament History'],
    popular: false
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design for any purpose',
    icon: Sparkles,
    color: 'bg-gray-500',
    features: ['Essential Info', 'Clean Layout', 'Fast Loading', 'Mobile Optimized'],
    popular: false
  }
]

export default function ProfileTemplatesPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    // Save template selection to localStorage for the builder
    localStorage.setItem('selectedProfileTemplate', templateId)

    // Navigate to profile builder with the selected template
    setTimeout(() => {
      router.push(`/profiles/builder?template=${templateId}`)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/profile-dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Choose a Template</h1>
                <p className="text-sm text-gray-500">Select a template that best fits your needs</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/profiles/builder?template=custom')}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Start from Scratch
            </button>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium">
            All Templates
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm hover:bg-gray-50 transition-colors">
            Popular
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm hover:bg-gray-50 transition-colors">
            Professional
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm hover:bg-gray-50 transition-colors">
            Creative
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm hover:bg-gray-50 transition-colors">
            Social
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => {
            const Icon = template.icon
            const isHovered = hoveredTemplate === template.id
            const isSelected = selectedTemplate === template.id

            return (
              <div
                key={template.id}
                className={`relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform ${
                  isHovered ? 'scale-105' : ''
                } ${isSelected ? 'ring-2 ring-black' : ''}`}
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                onClick={() => handleSelectTemplate(template.id)}
              >
                {template.popular && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                {/* Template Preview */}
                <div className={`h-48 ${template.color} bg-opacity-10 flex items-center justify-center relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-black/10`} />
                  <Icon className={`h-20 w-20 ${template.color.replace('bg-', 'text-')} relative z-10`} />

                  {/* Hover Overlay */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <button className="px-6 py-3 bg-white text-black rounded-lg font-medium transform transition-transform hover:scale-105">
                        Use Template
                      </button>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                  {/* Features */}
                  <div className="space-y-2">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-500">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {template.features.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{template.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 left-3">
                    <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Template CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h2>
              <p className="text-gray-300">Create a completely custom profile from scratch with our builder</p>
            </div>
            <button
              onClick={() => router.push('/profiles/builder?template=custom')}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Create Custom Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}