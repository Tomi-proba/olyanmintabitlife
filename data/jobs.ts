export type MinEducation = 'none' | 'highschool' | 'bachelor';

export interface JobDefinition {
  id: string;
  field: string;
  /** 1 = entry/part-time, 2 = mid/skilled, 3 = professional (needs a degree), 4 = executive. */
  tier: 1 | 2 | 3 | 4;
  /** Title shown at job level 1, 2, and 3 (promotions move through these in order). */
  titles: [string, string, string];
  minAge: number;
  partTime: boolean;
  minEducation: MinEducation;
  minSmarts: number;
  /** Annual salary at level 1; promotions scale this up (see engine/career.ts). */
  baseSalary: number;
}

/**
 * The job board: 34 jobs across four tiers. To add a job, append an entry
 * here — no engine code changes needed. See the README for the field guide.
 */
export const JOBS: JobDefinition[] = [
  // ---------------------------------------------------------------------
  // Tier 1 — part-time (teens)
  // ---------------------------------------------------------------------
  { id: 'newspaper_delivery', field: 'Delivery', tier: 1, titles: ['Paper Carrier', 'Paper Carrier', 'Paper Carrier'], minAge: 14, partTime: true, minEducation: 'none', minSmarts: 0, baseSalary: 3500 },
  { id: 'dog_walker', field: 'Pet Care', tier: 1, titles: ['Dog Walker', 'Dog Walker', 'Dog Walker'], minAge: 14, partTime: true, minEducation: 'none', minSmarts: 0, baseSalary: 4000 },
  { id: 'babysitter', field: 'Childcare', tier: 1, titles: ['Babysitter', 'Babysitter', 'Babysitter'], minAge: 14, partTime: true, minEducation: 'none', minSmarts: 10, baseSalary: 4500 },
  { id: 'grocery_bagger', field: 'Retail', tier: 1, titles: ['Grocery Bagger', 'Grocery Bagger', 'Grocery Bagger'], minAge: 15, partTime: true, minEducation: 'none', minSmarts: 0, baseSalary: 6000 },
  { id: 'fast_food_crew', field: 'Food Service', tier: 1, titles: ['Crew Member', 'Crew Member', 'Shift Lead'], minAge: 15, partTime: true, minEducation: 'none', minSmarts: 0, baseSalary: 6500 },
  { id: 'lifeguard', field: 'Recreation', tier: 1, titles: ['Lifeguard', 'Lifeguard', 'Head Lifeguard'], minAge: 16, partTime: true, minEducation: 'none', minSmarts: 20, baseSalary: 8500 },

  // ---------------------------------------------------------------------
  // Tier 1 — full-time, no degree required
  // ---------------------------------------------------------------------
  { id: 'retail_associate', field: 'Retail', tier: 1, titles: ['Retail Associate', 'Retail Associate', 'Store Supervisor'], minAge: 16, partTime: false, minEducation: 'none', minSmarts: 10, baseSalary: 18000 },
  { id: 'waiter', field: 'Food Service', tier: 1, titles: ['Waiter', 'Waiter', 'Head Waiter'], minAge: 16, partTime: false, minEducation: 'none', minSmarts: 10, baseSalary: 20000 },
  { id: 'warehouse_worker', field: 'Logistics', tier: 1, titles: ['Warehouse Worker', 'Warehouse Worker', 'Warehouse Lead'], minAge: 18, partTime: false, minEducation: 'none', minSmarts: 5, baseSalary: 24000 },
  { id: 'janitor', field: 'Maintenance', tier: 1, titles: ['Janitor', 'Janitor', 'Facilities Lead'], minAge: 18, partTime: false, minEducation: 'none', minSmarts: 0, baseSalary: 22000 },
  { id: 'security_guard', field: 'Security', tier: 1, titles: ['Security Guard', 'Security Guard', 'Senior Security Guard'], minAge: 18, partTime: false, minEducation: 'none', minSmarts: 15, baseSalary: 25000 },
  { id: 'construction_laborer', field: 'Construction', tier: 1, titles: ['Construction Laborer', 'Construction Laborer', 'Crew Foreman'], minAge: 18, partTime: false, minEducation: 'none', minSmarts: 10, baseSalary: 28000 },
  { id: 'landscaper', field: 'Landscaping', tier: 1, titles: ['Landscaper', 'Landscaper', 'Crew Lead'], minAge: 17, partTime: false, minEducation: 'none', minSmarts: 5, baseSalary: 26000 },

  // ---------------------------------------------------------------------
  // Tier 2 — skilled / high school diploma
  // ---------------------------------------------------------------------
  { id: 'office_assistant', field: 'Administration', tier: 2, titles: ['Office Assistant', 'Office Coordinator', 'Office Manager'], minAge: 18, partTime: false, minEducation: 'highschool', minSmarts: 35, baseSalary: 30000 },
  { id: 'bank_teller', field: 'Finance', tier: 2, titles: ['Bank Teller', 'Senior Teller', 'Branch Supervisor'], minAge: 18, partTime: false, minEducation: 'highschool', minSmarts: 40, baseSalary: 32000 },
  { id: 'electrician', field: 'Trades', tier: 2, titles: ["Electrician's Apprentice", 'Electrician', 'Master Electrician'], minAge: 19, partTime: false, minEducation: 'highschool', minSmarts: 45, baseSalary: 45000 },
  { id: 'plumber', field: 'Trades', tier: 2, titles: ["Plumber's Apprentice", 'Plumber', 'Master Plumber'], minAge: 19, partTime: false, minEducation: 'highschool', minSmarts: 40, baseSalary: 44000 },
  { id: 'chef', field: 'Food Service', tier: 2, titles: ['Line Cook', 'Chef', 'Executive Chef'], minAge: 19, partTime: false, minEducation: 'highschool', minSmarts: 35, baseSalary: 38000 },
  { id: 'police_officer', field: 'Public Service', tier: 2, titles: ['Police Officer', 'Senior Officer', 'Sergeant'], minAge: 21, partTime: false, minEducation: 'highschool', minSmarts: 50, baseSalary: 48000 },
  { id: 'firefighter', field: 'Public Service', tier: 2, titles: ['Firefighter', 'Senior Firefighter', 'Fire Captain'], minAge: 21, partTime: false, minEducation: 'highschool', minSmarts: 45, baseSalary: 47000 },
  { id: 'sales_rep', field: 'Business', tier: 2, titles: ['Sales Representative', 'Senior Sales Rep', 'Sales Team Lead'], minAge: 18, partTime: false, minEducation: 'highschool', minSmarts: 40, baseSalary: 36000 },
  { id: 'truck_driver', field: 'Logistics', tier: 2, titles: ['Truck Driver', 'Long-Haul Driver', 'Fleet Lead'], minAge: 21, partTime: false, minEducation: 'highschool', minSmarts: 30, baseSalary: 42000 },
  { id: 'paralegal', field: 'Law', tier: 2, titles: ['Paralegal', 'Senior Paralegal', 'Lead Paralegal'], minAge: 20, partTime: false, minEducation: 'highschool', minSmarts: 55, baseSalary: 40000 },

  // ---------------------------------------------------------------------
  // Tier 3 — professional, bachelor's degree required
  // ---------------------------------------------------------------------
  { id: 'software_engineer', field: 'Technology', tier: 3, titles: ['Junior Software Engineer', 'Software Engineer', 'Senior Software Engineer'], minAge: 21, partTime: false, minEducation: 'bachelor', minSmarts: 70, baseSalary: 75000 },
  { id: 'registered_nurse', field: 'Medicine', tier: 3, titles: ['Registered Nurse', 'Registered Nurse', 'Charge Nurse'], minAge: 21, partTime: false, minEducation: 'bachelor', minSmarts: 65, baseSalary: 68000 },
  { id: 'accountant', field: 'Finance', tier: 3, titles: ['Junior Accountant', 'Accountant', 'Senior Accountant'], minAge: 21, partTime: false, minEducation: 'bachelor', minSmarts: 60, baseSalary: 62000 },
  { id: 'civil_engineer', field: 'Engineering', tier: 3, titles: ['Junior Civil Engineer', 'Civil Engineer', 'Senior Civil Engineer'], minAge: 21, partTime: false, minEducation: 'bachelor', minSmarts: 68, baseSalary: 70000 },
  { id: 'teacher', field: 'Education', tier: 3, titles: ['Teacher', 'Teacher', 'Lead Teacher'], minAge: 21, partTime: false, minEducation: 'bachelor', minSmarts: 55, baseSalary: 48000 },
  { id: 'marketing_manager', field: 'Business', tier: 3, titles: ['Marketing Coordinator', 'Marketing Manager', 'Senior Marketing Manager'], minAge: 22, partTime: false, minEducation: 'bachelor', minSmarts: 60, baseSalary: 65000 },
  { id: 'graphic_designer', field: 'Arts', tier: 3, titles: ['Junior Designer', 'Graphic Designer', 'Art Director'], minAge: 20, partTime: false, minEducation: 'bachelor', minSmarts: 50, baseSalary: 52000 },
  { id: 'financial_analyst', field: 'Finance', tier: 3, titles: ['Junior Analyst', 'Financial Analyst', 'Senior Financial Analyst'], minAge: 22, partTime: false, minEducation: 'bachelor', minSmarts: 65, baseSalary: 72000 },

  // ---------------------------------------------------------------------
  // Tier 4 — executive / advanced professional
  // ---------------------------------------------------------------------
  { id: 'attorney', field: 'Law', tier: 4, titles: ['Associate Attorney', 'Attorney', 'Senior Partner'], minAge: 25, partTime: false, minEducation: 'bachelor', minSmarts: 80, baseSalary: 95000 },
  { id: 'physician', field: 'Medicine', tier: 4, titles: ['Resident Physician', 'Physician', 'Chief of Medicine'], minAge: 26, partTime: false, minEducation: 'bachelor', minSmarts: 85, baseSalary: 150000 },
  { id: 'investment_banker', field: 'Finance', tier: 4, titles: ['Investment Analyst', 'Investment Banker', 'Managing Director'], minAge: 24, partTime: false, minEducation: 'bachelor', minSmarts: 78, baseSalary: 110000 },
  { id: 'ceo', field: 'Business', tier: 4, titles: ['Junior Executive', 'Executive Director', 'Chief Executive Officer'], minAge: 30, partTime: false, minEducation: 'bachelor', minSmarts: 82, baseSalary: 180000 },
];
