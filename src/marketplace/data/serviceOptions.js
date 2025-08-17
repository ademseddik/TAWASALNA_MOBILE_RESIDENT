// Service Categories Data
export const serviceCategories = [
  {
    id: 1,
    name: 'Cleaning Services',
    icon: 'broom',
    description: 'House cleaning, office cleaning, and maintenance services'
  },
  {
    id: 2,
    name: 'Beauty & Wellness',
    icon: 'spa',
    description: 'Hair styling, makeup, massage, and wellness services'
  },
  {
    id: 3,
    name: 'Home Services',
    icon: 'home',
    description: 'Plumbing, electrical, carpentry, and home repairs'
  },
  {
    id: 4,
    name: 'Transportation',
    icon: 'car',
    description: 'Delivery, moving, and transportation services'
  },
  {
    id: 5,
    name: 'Education & Tutoring',
    icon: 'school',
    description: 'Private tutoring, language classes, and educational services'
  },
  {
    id: 6,
    name: 'Technology',
    icon: 'laptop',
    description: 'IT support, web development, and technical services'
  },
  {
    id: 7,
    name: 'Event Services',
    icon: 'calendar',
    description: 'Event planning, catering, and entertainment services'
  },
  {
    id: 8,
    name: 'Health & Fitness',
    icon: 'dumbbell',
    description: 'Personal training, nutrition consulting, and health services'
  }
];

// Service Features
export const serviceFeatures = [
  'Professional Certification',
  'Insurance Coverage',
  'Background Checked',
  '24/7 Availability',
  'Emergency Service',
  'Free Consultation',
  'Guaranteed Work',
  'Eco-Friendly',
  'Senior Discount',
  'Student Discount',
  'Bulk Discount',
  'Online Booking',
  'Mobile Service',
  'Weekend Service',
  'Holiday Service'
];

// Availability Options
export const availabilityOptions = [
  { id: 1, day: 'Monday', available: true, startTime: '09:00', endTime: '17:00' },
  { id: 2, day: 'Tuesday', available: true, startTime: '09:00', endTime: '17:00' },
  { id: 3, day: 'Wednesday', available: true, startTime: '09:00', endTime: '17:00' },
  { id: 4, day: 'Thursday', available: true, startTime: '09:00', endTime: '17:00' },
  { id: 5, day: 'Friday', available: true, startTime: '09:00', endTime: '17:00' },
  { id: 6, day: 'Saturday', available: false, startTime: '10:00', endTime: '15:00' },
  { id: 7, day: 'Sunday', available: false, startTime: '10:00', endTime: '15:00' }
];

// Service Pricing Types
export const pricingTypes = [
  { id: 'hourly', name: 'Hourly Rate', description: 'Charged per hour' },
  { id: 'fixed', name: 'Fixed Price', description: 'One-time payment' },
  { id: 'daily', name: 'Daily Rate', description: 'Charged per day' },
  { id: 'weekly', name: 'Weekly Rate', description: 'Charged per week' },
  { id: 'monthly', name: 'Monthly Rate', description: 'Charged per month' },
  { id: 'custom', name: 'Custom Pricing', description: 'Negotiable pricing' }
];

// Service Status Options
export const serviceStatusOptions = [
  { id: 'active', name: 'Active', color: '#4CAF50' },
  { id: 'inactive', name: 'Inactive', color: '#FF9800' },
  { id: 'archived', name: 'Archived', color: '#9E9E9E' },
  { id: 'pending', name: 'Pending Approval', color: '#2196F3' }
];

// Service Review Categories
export const reviewCategories = [
  'Quality of Service',
  'Professionalism',
  'Punctuality',
  'Communication',
  'Value for Money',
  'Overall Experience'
];

// Service Booking Status
export const bookingStatus = [
  { id: 'pending', name: 'Pending', color: '#FF9800' },
  { id: 'confirmed', name: 'Confirmed', color: '#4CAF50' },
  { id: 'in_progress', name: 'In Progress', color: '#2196F3' },
  { id: 'completed', name: 'Completed', color: '#4CAF50' },
  { id: 'cancelled', name: 'Cancelled', color: '#F44336' }
];

// Service Filter Options
export const serviceFilters = {
  priceRange: {
    min: 0,
    max: 1000,
    step: 10
  },
  rating: [1, 2, 3, 4, 5],
  availability: ['Available Now', 'Available Today', 'Available This Week'],
  features: serviceFeatures,
  distance: [1, 5, 10, 25, 50] // km
};

// Service Form Validation Rules
export const serviceValidationRules = {
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
  price: {
    required: true,
    min: 0
  },
  category: {
    required: true
  },
  features: {
    maxCount: 10
  },
  images: {
    maxCount: 10,
    maxSize: 5 // MB
  }
}; 