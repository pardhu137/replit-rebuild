export type EventType =
  | 'ONBOARDING_BALANCE'
  | 'NEW_LOAN'
  | 'RENEW_LOAN'
  | 'INSTALLMENT_PAYMENT'
  | 'EXPENSE'
  | 'CAPITAL_ADDED'
  | 'ADJUSTMENT_EVENT';

export interface BaseEvent {
  eventId: string;
  schemaVersion: number;
  accountId: string;
  areaId: string;
  createdBy: string;
  deviceId: string;
  createdAt: string;
  syncedAt: string | null;
  eventType: EventType;
  payload: any;
}

export interface OnboardingBalancePayload { amount: number; }
export interface NewLoanPayload { customerId: string; customerName: string; loanAmount: number; totalPayable: number; totalInstallments: number; }
export interface RenewLoanPayload { customerId: string; customerName: string; loanAmount: number; totalPayable: number; totalInstallments: number; previousLoanEventId: string; }
export interface InstallmentPaymentPayload { customerId: string; customerName: string; loanEventId: string; onlineAmount: number; offlineAmount: number; totalAmount: number; isOnboarding?: boolean; }
export interface ExpensePayload { amount: number; description: string; }
export interface CapitalAddedPayload { amount: number; description: string; }
export interface AdjustmentPayload { referenceEventId: string; amount: number; reason: string; }

export interface FinanceEvent extends BaseEvent {
  eventType: EventType;
  payload:
    | OnboardingBalancePayload
    | NewLoanPayload
    | RenewLoanPayload
    | InstallmentPaymentPayload
    | ExpensePayload
    | CapitalAddedPayload
    | AdjustmentPayload;
}

export interface Area {
  id: string;
  name: string;
  createdAt: string;
  isOnboarding: boolean;
}

export interface Village {
  id: string;
  areaId: string;
  name: string;
  nextSerialNumber: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  areaId: string;
  villageId: string;
  villageName: string;
  name: string;
  phone: string;
  serialNumber: number;
  createdAt: string;
}

export interface DashboardData {
  openingBalance: number;
  totalGiven: number;
  totalGivenNew: number;
  totalGivenRenewed: number;
  totalCollectedOnline: number;
  totalCollectedOffline: number;
  totalCollected: number;
  vk: number;
  vkNew: number;
  vkRenewed: number;
  expenses: number;
  capitalAdded: number;
  closingBalance: number;
  adjustments: number;
}

export type DateFilterMode = 'today' | 'yesterday' | 'custom' | 'range' | 'all';

export interface DateFilter {
  mode: DateFilterMode;
  customDate?: string;
  startDate?: string;
  endDate?: string;
}

export type PaymentMode = 'cash' | 'online' | 'mixed';

export interface CustomerLoanSummary {
  customer: Customer;
  activeLoanEventId: string | null;
  loanType: 'NEW' | 'RENEWED' | null;
  loanAmount: number;
  totalPayable: number;
  totalInstallments: number;
  installmentsPaid: number;
  amountPaid: number;
  remainingAmount: number;
  remainingInstallments: number;
  isFullyPaid: boolean;
  paidToday: boolean;
  hasLoan: boolean;
}

export interface LoanSection {
  loanEvent: FinanceEvent;
  loanType: 'NEW' | 'RENEWED';
  loanAmount: number;
  totalPayable: number;
  totalInstallments: number;
  payments: FinanceEvent[];
  amountPaid: number;
  remainingAmount: number;
  installmentsPaid: number;
  isActive: boolean;
  isClosed: boolean;
  startDate: string;
  closedDate?: string;
}
