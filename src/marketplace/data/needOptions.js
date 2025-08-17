// Need Categories Data
export const needCategories = [
  {
    id: 1,
    name: 'Home & Garden',
    icon: 'home',
    description: 'Home improvement, gardening, and maintenance needs'
  },
  {
    id: 2,
    name: 'Professional Services',
    icon: 'briefcase',
    description: 'Legal, accounting, consulting, and business services'
  },
  {
    id: 3,
    name: 'Health & Wellness',
    icon: 'heart',
    description: 'Medical, fitness, and wellness needs'
  },
  {
    id: 4,
    name: 'Education & Training',
    icon: 'graduation-cap',
    description: 'Tutoring, courses, and skill development'
  },
  {
    id: 5,
    name: 'Technology',
    icon: 'laptop',
    description: 'IT support, software development, and technical help'
  },
  {
    id: 6,
    name: 'Events & Entertainment',
    icon: 'calendar',
    description: 'Event planning, entertainment, and celebration services'
  },
  {
    id: 7,
    name: 'Transportation',
    icon: 'car',
    description: 'Moving, delivery, and transportation needs'
  },
  {
    id: 8,
    name: 'Personal Care',
    icon: 'user',
    description: 'Beauty, grooming, and personal assistance'
  }
];

// Need Priority Levels
export const needPriorityLevels = [
  { id: 'low', name: 'Low Priority', color: '#4CAF50', description: 'Not urgent' },
  { id: 'medium', name: 'Medium Priority', color: '#FF9800', description: 'Moderate urgency' },
  { id: 'high', name: 'High Priority', color: '#F44336', description: 'Urgent' },
  { id: 'critical', name: 'Critical', color: '#9C27B0', description: 'Very urgent' }
];

// Need Status Options
export const needStatusOptions = [
  { id: 'open', name: 'Open', color: '#4CAF50', description: 'Looking for providers' },
  { id: 'in_progress', name: 'In Progress', color: '#2196F3', description: 'Being addressed' },
  { id: 'completed', name: 'Completed', color: '#4CAF50', description: 'Need fulfilled' },
  { id: 'cancelled', name: 'Cancelled', color: '#9E9E9E', description: 'No longer needed' },
  { id: 'expired', name: 'Expired', color: '#F44336', description: 'Time limit exceeded' }
];

// Need Budget Ranges
export const needBudgetRanges = [
  { id: 'under_100', name: 'Under $100', range: [0, 100] },
  { id: '100_500', name: '$100 - $500', range: [100, 500] },
  { id: '500_1000', name: '$500 - $1,000', range: [500, 1000] },
  { id: '1000_5000', name: '$1,000 - $5,000', range: [1000, 5000] },
  { id: 'over_5000', name: 'Over $5,000', range: [5000, Infinity] },
  { id: 'negotiable', name: 'Negotiable', range: null }
];

// Need Timeline Options
export const needTimelineOptions = [
  { id: 'asap', name: 'ASAP', description: 'Immediate need' },
  { id: 'within_week', name: 'Within a Week', description: 'Need within 7 days' },
  { id: 'within_month', name: 'Within a Month', description: 'Need within 30 days' },
  { id: 'flexible', name: 'Flexible', description: 'No specific timeline' }
];

// Need Location Types
export const needLocationTypes = [
  { id: 'remote', name: 'Remote', description: 'Can be done online/remotely' },
  { id: 'onsite', name: 'On-site', description: 'Must be done at specific location' },
  { id: 'hybrid', name: 'Hybrid', description: 'Combination of remote and on-site' }
];

// Need Features/Tags
export const needFeatures = [
  'Urgent',
  'Long-term Project',
  'One-time Service',
  'Recurring Service',
  'Professional Required',
  'Licensed Required',
  'Insurance Required',
  'Background Check Required',
  'Weekend Available',
  'Evening Available',
  'Eco-friendly Preferred',
  'Local Provider Preferred',
  'Experience Required',
  'References Required'
];

// Need Filter Options
export const needFilters = {
  budgetRange: needBudgetRanges,
  priority: needPriorityLevels,
  status: needStatusOptions,
  timeline: needTimelineOptions,
  locationType: needLocationTypes,
  features: needFeatures,
  distance: [1, 5, 10, 25, 50] // km
};

// Need Form Validation Rules
export const needValidationRules = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 100
  },
  description: {
    required: true,
    minLength: 20,
    maxLength: 1000
  },
  budget: {
    required: false,
    min: 0
  },
  category: {
    required: true
  },
  priority: {
    required: true
  },
  timeline: {
    required: true
  },
  location: {
    required: true
  }
};

// Need Quote Status
export const quoteStatus = [
  { id: 'pending', name: 'Pending', color: '#FF9800' },
  { id: 'accepted', name: 'Accepted', color: '#4CAF50' },
  { id: 'rejected', name: 'Rejected', color: '#F44336' },
  { id: 'expired', name: 'Expired', color: '#9E9E9E' }
]; 