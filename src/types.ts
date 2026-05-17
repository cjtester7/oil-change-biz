
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  vehicle: string;
  totalSpent: number;
}

export type ServiceStatus = 'pending' | 'accepted' | 'declined';

export interface ServiceSuggestion {
  id: string;
  customerId: string;
  serviceName: string;
  category: 'Filter' | 'Fuel' | 'Radiator' | 'Other';
  price: number;
  status: ServiceStatus;
  suggestedAt: string;
}

export interface Visit {
  id: string;
  customerId: string;
  date: string;
  primaryService: string;
  isOilOnly: boolean;
  upsellRevenue: number;
  totalCost: number;
  suggestions: ServiceSuggestion[];
}
