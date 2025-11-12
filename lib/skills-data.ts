/**
 * Skills & Expertise Taxonomy for Linkist
 * Comprehensive list of professional skills organized by category
 */

export interface SkillCategory {
  name: string;
  skills: string[];
}

export const SKILLS_BY_CATEGORY: SkillCategory[] = [
  {
    name: "Business & Management",
    skills: [
      "Business Development",
      "Strategic Planning",
      "Leadership & Team Management",
      "Operations Management",
      "Project Management",
      "Change Management",
      "Process Optimization",
      "Product Management",
      "Risk Analysis",
      "Negotiation",
      "Business Analytics",
      "Market Research",
      "Supply Chain Management",
      "Financial Planning",
      "Stakeholder Management",
    ],
  },
  {
    name: "Sales & Marketing",
    skills: [
      "Sales Strategy",
      "B2B Sales",
      "Client Relationship Management (CRM)",
      "Account Management",
      "Brand Management",
      "Digital Marketing",
      "Social Media Strategy",
      "Performance Marketing (Google/Meta Ads)",
      "SEO/SEM",
      "Marketing Automation",
      "Content Strategy",
      "Copywriting",
      "Influencer Marketing",
      "Lead Generation",
      "Public Relations",
    ],
  },
  {
    name: "Technology & Engineering",
    skills: [
      "Software Development",
      "Web Development",
      "Mobile App Development",
      "Cloud Computing (AWS, Azure, GCP)",
      "DevOps",
      "Cybersecurity",
      "AI & Machine Learning",
      "Data Science",
      "Database Management",
      "Blockchain",
      "Internet of Things (IoT)",
      "UI/UX Design",
      "API Development",
      "System Architecture",
    ],
  },
  {
    name: "Data & Analytics",
    skills: [
      "Data Analysis",
      "Business Intelligence",
      "Predictive Analytics",
      "Data Visualization",
      "SQL / Python for Data",
      "Power BI / Tableau",
      "A/B Testing",
      "Data Engineering",
      "Customer Analytics",
      "Market Intelligence",
    ],
  },
  {
    name: "Creative & Design",
    skills: [
      "Graphic Design",
      "Brand Identity Design",
      "Motion Graphics",
      "Video Editing",
      "Animation",
      "Photography",
      "UI Design",
      "UX Research",
      "3D Design",
      "Product Visualization",
      "Art Direction",
      "Creative Strategy",
    ],
  },
  {
    name: "Communication & Public Relations",
    skills: [
      "Corporate Communication",
      "Public Speaking",
      "Copywriting",
      "Media Relations",
      "Internal Communications",
      "Presentation Skills",
      "Brand Storytelling",
      "Event Planning",
    ],
  },
  {
    name: "Networking & Relationship Building",
    skills: [
      "Partnership Development",
      "Community Building",
      "Networking Strategy",
      "Event Networking",
      "Investor Relations",
      "Client Retention",
      "Collaboration Management",
    ],
  },
  {
    name: "Entrepreneurship & Innovation",
    skills: [
      "Startup Strategy",
      "Fundraising & Pitching",
      "Innovation Management",
      "Venture Building",
      "Product-Market Fit Analysis",
      "Scaling Strategy",
      "Go-to-Market Planning",
    ],
  },
  {
    name: "Industry Expertise",
    skills: [
      "Finance & Banking",
      "Real Estate",
      "Healthcare",
      "Education",
      "Retail & E-commerce",
      "Energy & Sustainability",
      "Logistics & Supply Chain",
      "Manufacturing",
      "Technology",
      "Media & Entertainment",
    ],
  },
  {
    name: "AI-Specific & Future Skills",
    skills: [
      "Generative AI",
      "AI Prompt Engineering",
      "Automation Strategy",
      "Chatbot Design",
      "Data Ethics & Governance",
      "AI-Driven Marketing",
      "Predictive Personalization",
      "AI-Powered CRM Tools",
    ],
  },
  {
    name: "Soft Skills",
    skills: [
      "Leadership",
      "Teamwork",
      "Adaptability",
      "Emotional Intelligence",
      "Creativity",
      "Problem Solving",
      "Time Management",
      "Decision Making",
      "Empathy",
      "Mentorship",
    ],
  },
];

// Flat array of all skills for quick search
export const ALL_SKILLS: string[] = SKILLS_BY_CATEGORY.flatMap(
  (category) => category.skills
);

// Helper function to search skills
export function searchSkills(query: string): Array<{ skill: string; category: string }> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase().trim();
  const results: Array<{ skill: string; category: string }> = [];

  SKILLS_BY_CATEGORY.forEach((category) => {
    category.skills.forEach((skill) => {
      if (skill.toLowerCase().includes(lowerQuery)) {
        results.push({ skill, category: category.name });
      }
    });
  });

  return results;
}

// Helper to get category for a skill
export function getSkillCategory(skillName: string): string | null {
  for (const category of SKILLS_BY_CATEGORY) {
    if (category.skills.includes(skillName)) {
      return category.name;
    }
  }
  return null;
}
