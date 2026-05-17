
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  vehicle: string;
}

export interface ServiceSuggestion {
  id: string;
  customerId: string;
  serviceName: string;
  price: number;
  status: 'pending' | 'accepted' | 'declined';
  suggestedAt: string;
}

export interface Visit {
  id: string;
  customerId: string;
  date: string;
  servicePerformed: string;
  totalCost: number;
  suggestions: string[]; // IDs of suggestions
}
