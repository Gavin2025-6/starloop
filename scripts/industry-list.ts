export type Priority = 'HIGH' | 'MED';
export type IndustryCategory = 'medical' | 'home_services' | 'automotive' | 'professional' | 'beauty_wellness' | 'residential';

export interface Industry {
  keyword: string;
  category: IndustryCategory;
  avgCustomerValue: number;
  priority: Priority;
}

export const industries: Industry[] = [
  // Medical
  { keyword: "dentist", category: "medical", avgCustomerValue: 800, priority: "HIGH" },
  { keyword: "orthodontist", category: "medical", avgCustomerValue: 5000, priority: "HIGH" },
  { keyword: "optometrist", category: "medical", avgCustomerValue: 400, priority: "HIGH" },
  { keyword: "chiropractor", category: "medical", avgCustomerValue: 300, priority: "HIGH" },
  { keyword: "physiotherapy clinic", category: "medical", avgCustomerValue: 250, priority: "HIGH" },
  { keyword: "dermatologist", category: "medical", avgCustomerValue: 350, priority: "HIGH" },
  { keyword: "plastic surgeon", category: "medical", avgCustomerValue: 8000, priority: "HIGH" },
  { keyword: "veterinary clinic", category: "medical", avgCustomerValue: 400, priority: "HIGH" },
  // Home Services
  { keyword: "HVAC contractor", category: "home_services", avgCustomerValue: 1500, priority: "HIGH" },
  { keyword: "plumber", category: "home_services", avgCustomerValue: 800, priority: "HIGH" },
  { keyword: "electrician", category: "home_services", avgCustomerValue: 600, priority: "HIGH" },
  { keyword: "roofing contractor", category: "home_services", avgCustomerValue: 8000, priority: "HIGH" },
  { keyword: "landscaping company", category: "home_services", avgCustomerValue: 2000, priority: "MED" },
  { keyword: "pest control", category: "home_services", avgCustomerValue: 400, priority: "MED" },
  { keyword: "house cleaning service", category: "home_services", avgCustomerValue: 1800, priority: "MED" },
  { keyword: "locksmith", category: "home_services", avgCustomerValue: 200, priority: "MED" },
  // Automotive
  { keyword: "car dealership", category: "automotive", avgCustomerValue: 35000, priority: "HIGH" },
  { keyword: "auto repair shop", category: "automotive", avgCustomerValue: 600, priority: "HIGH" },
  { keyword: "auto body shop", category: "automotive", avgCustomerValue: 2000, priority: "HIGH" },
  // Professional Services
  { keyword: "law firm", category: "professional", avgCustomerValue: 5000, priority: "HIGH" },
  { keyword: "accounting firm", category: "professional", avgCustomerValue: 2000, priority: "HIGH" },
  { keyword: "mortgage broker", category: "professional", avgCustomerValue: 3000, priority: "HIGH" },
  { keyword: "real estate agent", category: "professional", avgCustomerValue: 8000, priority: "HIGH" },
  { keyword: "insurance agent", category: "professional", avgCustomerValue: 1200, priority: "MED" },
  // Beauty & Wellness
  { keyword: "day spa", category: "beauty_wellness", avgCustomerValue: 500, priority: "MED" },
  { keyword: "hair salon", category: "beauty_wellness", avgCustomerValue: 800, priority: "MED" },
  { keyword: "massage therapy", category: "beauty_wellness", avgCustomerValue: 400, priority: "MED" },
  { keyword: "gym fitness center", category: "beauty_wellness", avgCustomerValue: 600, priority: "MED" },
  { keyword: "personal trainer", category: "beauty_wellness", avgCustomerValue: 1200, priority: "MED" },
  // Residential
  { keyword: "property management company", category: "residential", avgCustomerValue: 15000, priority: "HIGH" },
  { keyword: "storage facility", category: "residential", avgCustomerValue: 1200, priority: "MED" },
];

export const highPriorityIndustries = industries.filter(i => i.priority === 'HIGH');
export default industries;
