
import { Customer, ServiceSuggestion } from './types.ts';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '555-0123',
    email: 'john@example.com',
    lastVisit: '2026-05-10',
    vehicle: '2020 Toyota Camry',
  },
  {
    id: '2',
    name: 'Sarah Smith',
    phone: '555-4567',
    email: 'sarah@example.com',
    lastVisit: '2026-04-15',
    vehicle: '2018 Honda CR-V',
  }
];

export const MOCK_SUGGESTIONS: ServiceSuggestion[] = [
  {
    id: 's1',
    customerId: '1',
    serviceName: 'Air Filter Replacement',
    price: 70,
    status: 'declined',
    suggestedAt: '2026-05-10',
  },
  {
    id: 's2',
    customerId: '1',
    serviceName: 'Radiator Flush',
    price: 190,
    status: 'declined',
    suggestedAt: '2026-05-10',
  },
  {
    id: 's3',
    customerId: '2',
    serviceName: 'Fuel Injection Service',
    price: 129,
    status: 'declined',
    suggestedAt: '2026-04-15',
  }
];
