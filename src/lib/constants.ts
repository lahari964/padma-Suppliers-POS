import { InventoryItem, Employee } from '../types';

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Admin', mobile: '', role: 'Admin', pin: '1234' },
];

export const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Shamiana / Pandal (10x10)', price: 800, category: 'Tents & Canopies' },
  { id: '2', name: 'Buffet Table', price: 100, category: 'Furniture' },
  { id: '3', name: 'Neelkamal Chairs', price: 15, category: 'Furniture' },
  { id: '4', name: 'Maharaja Sofa', price: 1200, category: 'Furniture' },
  { id: '5', name: 'Metal Halide Light', price: 150, category: 'Lighting & Electrical' },
  { id: '6', name: 'LED Par Light', price: 300, category: 'Lighting & Electrical' },
  { id: '7', name: 'Red Floor Mat / Carpet', price: 500, category: 'Decor & Linens' },
  { id: '8', name: 'Wooden Stage Platform', price: 1500, category: 'Structures' },
  { id: '9', name: 'Mist Fan / Cooler', price: 300, category: 'Cooling & Heating' },
  { id: '10', name: 'DJ Sound System', price: 2500, category: 'Audio/Visual' },
];
