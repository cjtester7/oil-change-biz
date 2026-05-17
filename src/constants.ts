
import { Customer, ServiceSuggestion, Visit } from './types.ts';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '555-0123',
    email: 'john@example.com',
    lastVisit: '2026-05-10',
    vehicle: '2020 Toyota Camry',
    totalSpent: 450,
  },
  {
    id: '2',
    name: 'Sarah Smith',
    phone: '555-4567',
    email: 'sarah@example.com',
    lastVisit: '2026-04-15',
    vehicle: '2018 Honda CR-V',
    totalSpent: 1200,
  },
  {
    id: '3',
    name: 'Robert Miller',
    phone: '555-8899',
    email: 'robert@hotmail.com',
    lastVisit: '2026-05-16',
    vehicle: '2022 Ford F-150',
    totalSpent: 85,
  }
];

export const MOCK_VISITS: Visit[] = [
  {
    id: 'v1',
    customerId: '1',
    date: '2026-05-10',
    primaryService: 'Signature Service Oil Change',
    isOilOnly: true,
    upsellRevenue: 0,
    totalCost: 85,
    suggestions: [
      { id: 's1', customerId: '1', serviceName: 'Engine Air Filter', category: 'Filter', price: 70, status: 'declined', suggestedAt: '2026-05-10' },
      { id: 's2', customerId: '1', serviceName: 'Radiator Flush', category: 'Radiator', price: 190, status: 'declined', suggestedAt: '2026-05-10' }
    ]
  },
  {
    id: 'v2',
    customerId: '3',
    date: '2026-05-16',
    primaryService: 'Signature Service Oil Change',
    isOilOnly: true,
    upsellRevenue: 0,
    totalCost: 85,
    suggestions: [
      { id: 's3', customerId: '3', serviceName: 'Cabin Air Filter', category: 'Filter', price: 40, status: 'declined', suggestedAt: '2026-05-16' },
      { id: 's4', customerId: '3', serviceName: 'Fuel Injection Service', category: 'Fuel', price: 129, status: 'declined', suggestedAt: '2026-05-16' }
    ]
  }
];

export const SERVICE_MENU = [
  { name: 'Signature Service Oil Change', basePrice: 85, margin: 'Low' },
  { name: 'Engine Air Filter', basePrice: 70, margin: 'High' },
  { name: 'Cabin Air Filter', basePrice: 40, margin: 'High' },
  { name: 'Fuel Injection Service', basePrice: 129, margin: 'High' },
  { name: 'Radiator Flush', basePrice: 190, margin: 'Medium' }
];
