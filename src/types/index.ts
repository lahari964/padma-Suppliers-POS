export type InventoryItem = { id: string; name: string; price: number; category: string; qtyAvailable?: number };

export type StagedItem = { inventoryId: string; name: string; price: number; qty: number };

export type CustomService = { id: string; name: string; price: number; };

export type BillItem = {
  id: string;
  inventoryId: string;
  name: string;
  price: number;
  issueDate: string;
  issueTime?: string;
  issueTimestamp: number;
  qtyIssued: number;
  qtyReturned: number;
  isDispatched?: boolean;
  dispatchDate?: string;
  dispatchTime?: string;
  days: number;
  handledBy?: string;
  originalPrice?: number;
};

export type ReturnLogItem = { name: string; qty: number; days: number; cost: number; time?: string };
export type ReturnLog = { date: string; time?: string; items: ReturnLogItem[]; handledBy?: string };
export type PaymentLog = { date: string; amount: number; method?: 'Cash' | 'UPI' | 'Bank'; handledBy?: string };
export type AuditLog = { timestamp: number; action: string; employeeName: string; details?: string };

export type DamageDetail = {
  itemId: string;
  name: string;
  qty: number;
  chargePerUnit: number;
  totalCharge: number;
};

export type Bill = {
  id: string;
  customerName: string;
  mobile: string;
  address: string;
  referral: string;
  advance: number;
  discount: number;
  status: 'Upcoming' | 'Active' | 'Pending' | 'Settled' | 'Partially Active' | 'Returned with Damages';
  totalCost: number;
  damageCharges?: number;
  damageDetails?: DamageDetail[];
  transportationCharges?: number;
  eventDate?: string;
  eventTime?: string;
  expectedReturnDate?: string;
  items: BillItem[];
  returnHistory: ReturnLog[];
  payments?: PaymentLog[];
  paymentPromiseDate?: string;
  createdBy?: string;
  notes?: string;
  billingStarted?: boolean;
  isQuotation?: boolean;
  customServices?: CustomService[];
  auditTrail?: AuditLog[];
};

export type Employee = {
  id: string;
  name: string;
  mobile: string;
  role: string;
  pin: string;
  status?: 'Active' | 'Inactive';
};

export type UserSession = {
  id: string;
  name: string;
  role: string;
  mobile: string;
  pin: string;
};
