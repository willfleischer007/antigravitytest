/**
 * Scoring Logic based on PRD Section 5
 */

export const DEFAULT_WEIGHTS = {
  prestige: 0.30,
  culture: 0.25,
  career: 0.20,
  financial: 0.15,
  location: 0.10,
}

export const calculateCompositeScore = (school, allSchools, weights) => {
  if (school.isRuledOut) return null

  // 1-5 star fields normalization (0-20 pts)
  const normalizeStar = (val) => (val ? (val * 4) : 0)
  
  // Prestige & Brand
  const prestigeScore = (normalizeStar(school.prestigeTier) + normalizeStar(school.brandPerception)) / 2
  
  // Program Feel & Culture
  const cultureScore = (normalizeStar(school.cultureScore) + normalizeStar(school.gutFeel)) / 2
  
  // Career Fit
  const employerMap = { 'Yes': 20, 'Partial': 10, 'No': 0 }
  const careerScore = (normalizeStar(school.careerFit) + (employerMap[school.employerPresence] || 0)) / 2
  
  // Financial (Relative)
  const netCosts = allSchools.map(s => (s.estTotal || 0) - (s.scholarship || 0))
  const minNet = Math.min(...netCosts)
  const maxNet = Math.max(...netCosts)
  
  let financialScore = 0
  if (maxNet !== minNet) {
    const currentNet = (school.estTotal || 0) - (school.scholarship || 0)
    // Lowest net = 20, Highest net = 0
    financialScore = ((maxNet - currentNet) / (maxNet - minNet)) * 20
  } else {
    financialScore = 20 // If all are equal, everyone gets full points for financial
  }
  
  // Location & Life
  const locationScore = normalizeStar(school.proximity)
  
  // Weighted sum
  const finalScore = 
    (prestigeScore * weights.prestige) +
    (cultureScore * weights.culture) +
    (careerScore * weights.career) +
    (financialScore * weights.financial) +
    (locationScore * weights.location)
    
  // Final score is scaled to 100
  // Each category above is max 20, and weights sum to 1.0 (100%)
  // So the sum is max 20. To get 0-100, we multiply by 5.
  return Math.round(finalScore * 5)
}
