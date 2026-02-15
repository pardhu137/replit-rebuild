import type {
  FinanceEvent, DashboardData, CustomerLoanSummary, Customer,
  OnboardingBalancePayload, NewLoanPayload, RenewLoanPayload,
  InstallmentPaymentPayload, ExpensePayload, CapitalAddedPayload,
  AdjustmentPayload, DateFilter, LoanSection, PaymentMode,
} from './types';

function isOnboardingPayment(event: FinanceEvent): boolean {
  if (event.eventType !== 'INSTALLMENT_PAYMENT') return false;
  const p = event.payload as InstallmentPaymentPayload;
  return p.isOnboarding === true;
}

export function filterEventsByDate(events: FinanceEvent[], dateFilter: DateFilter): FinanceEvent[] {
  if (dateFilter.mode === 'all') return events;
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (dateFilter.mode) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (!dateFilter.customDate) return events;
      const d = new Date(dateFilter.customDate);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'range': {
      if (!dateFilter.startDate || !dateFilter.endDate) return events;
      const s = new Date(dateFilter.startDate);
      const e = new Date(dateFilter.endDate);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0);
      end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
      break;
    }
    default:
      return events;
  }

  return events.filter(e => {
    const d = new Date(e.createdAt);
    return d >= start && d <= end;
  });
}

export function calculateDashboard(events: FinanceEvent[], dateFilter?: DateFilter): DashboardData {
  let openingBalance = 0;
  for (const event of events) {
    if (event.eventType === 'ONBOARDING_BALANCE') {
      const p = event.payload as OnboardingBalancePayload;
      openingBalance += p.amount;
    }
  }

  const filteredEvents = dateFilter && dateFilter.mode !== 'all'
    ? filterEventsByDate(events, dateFilter) : events;

  let totalGiven = 0, totalGivenNew = 0, totalGivenRenewed = 0;
  let totalCollectedOnline = 0, totalCollectedOffline = 0;
  let expenses = 0, capitalAdded = 0, adjustments = 0;
  let totalPayableNew = 0, totalPayableRenewed = 0;

  for (const event of filteredEvents) {
    if (isOnboardingPayment(event)) continue;
    switch (event.eventType) {
      case 'ONBOARDING_BALANCE': break;
      case 'NEW_LOAN': {
        const p = event.payload as NewLoanPayload;
        totalGiven += p.loanAmount; totalGivenNew += p.loanAmount;
        totalPayableNew += p.totalPayable; break;
      }
      case 'RENEW_LOAN': {
        const p = event.payload as RenewLoanPayload;
        totalGiven += p.loanAmount; totalGivenRenewed += p.loanAmount;
        totalPayableRenewed += p.totalPayable; break;
      }
      case 'INSTALLMENT_PAYMENT': {
        const p = event.payload as InstallmentPaymentPayload;
        totalCollectedOnline += p.onlineAmount; totalCollectedOffline += p.offlineAmount; break;
      }
      case 'EXPENSE': { expenses += (event.payload as ExpensePayload).amount; break; }
      case 'CAPITAL_ADDED': { capitalAdded += (event.payload as CapitalAddedPayload).amount; break; }
      case 'ADJUSTMENT_EVENT': { adjustments += (event.payload as AdjustmentPayload).amount; break; }
    }
  }

  const totalCollected = totalCollectedOnline + totalCollectedOffline;
  const vkNew = totalGivenNew > 0 ? totalPayableNew - totalGivenNew : 0;
  const vkRenewed = totalGivenRenewed > 0 ? totalPayableRenewed - totalGivenRenewed : 0;
  const vk = vkNew + vkRenewed;
  const closingBalance = openingBalance + totalCollected + capitalAdded - totalGiven - expenses + adjustments;

  return { openingBalance, totalGiven, totalGivenNew, totalGivenRenewed, totalCollectedOnline, totalCollectedOffline, totalCollected, vk, vkNew, vkRenewed, expenses, capitalAdded, closingBalance, adjustments };
}

export function getCustomerLoanSummary(customer: Customer, events: FinanceEvent[]): CustomerLoanSummary {
  const customerEvents = events.filter((e: FinanceEvent) => {
    const p = e.payload as any;
    return p.customerId === customer.id;
  });

  const loanEvents = customerEvents
    .filter(e => e.eventType === 'NEW_LOAN' || e.eventType === 'RENEW_LOAN')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const activeLoan = loanEvents[loanEvents.length - 1];
  if (!activeLoan) {
    return { customer, activeLoanEventId: null, loanType: null, loanAmount: 0, totalPayable: 0, totalInstallments: 0, installmentsPaid: 0, amountPaid: 0, remainingAmount: 0, remainingInstallments: 0, isFullyPaid: true, paidToday: false, hasLoan: false };
  }

  const p = activeLoan.payload as NewLoanPayload | RenewLoanPayload;
  const payments = customerEvents.filter(e => e.eventType === 'INSTALLMENT_PAYMENT' && (e.payload as InstallmentPaymentPayload).loanEventId === activeLoan.eventId);

  let amountPaid = 0;
  let paidToday = false;
  const today = new Date().toDateString();
  for (const payment of payments) {
    const pp = payment.payload as InstallmentPaymentPayload;
    amountPaid += pp.totalAmount;
    if (!pp.isOnboarding && new Date(payment.createdAt).toDateString() === today) paidToday = true;
  }

  const installmentsPaid = payments.length;
  const remainingAmount = Math.max(0, p.totalPayable - amountPaid);
  const remainingInstallments = Math.max(0, p.totalInstallments - installmentsPaid);
  const isFullyPaid = remainingAmount <= 0;

  return { customer, activeLoanEventId: activeLoan.eventId, loanType: activeLoan.eventType === 'RENEW_LOAN' ? 'RENEWED' : 'NEW', loanAmount: p.loanAmount, totalPayable: p.totalPayable, totalInstallments: p.totalInstallments, installmentsPaid, amountPaid, remainingAmount, remainingInstallments, isFullyPaid, paidToday, hasLoan: true };
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hour}:${m} ${ampm}`;
}

export function getEventLabel(eventType: string): string {
  switch (eventType) {
    case 'ONBOARDING_BALANCE': return 'Opening Balance';
    case 'NEW_LOAN': return 'New Loan';
    case 'RENEW_LOAN': return 'Renewed Loan';
    case 'INSTALLMENT_PAYMENT': return 'Payment';
    case 'EXPENSE': return 'Expense';
    case 'CAPITAL_ADDED': return 'Capital Added';
    case 'ADJUSTMENT_EVENT': return 'Adjustment';
    default: return eventType;
  }
}

export function getEventColor(eventType: string): string {
  switch (eventType) {
    case 'ONBOARDING_BALANCE': return '#6366F1';
    case 'NEW_LOAN': return '#2563EB';
    case 'RENEW_LOAN': return '#8B5CF6';
    case 'INSTALLMENT_PAYMENT': return '#16A34A';
    case 'EXPENSE': return '#DC2626';
    case 'CAPITAL_ADDED': return '#0EA5E9';
    case 'ADJUSTMENT_EVENT': return '#D97706';
    default: return '#6B7280';
  }
}

export function getPaymentMode(event: FinanceEvent): PaymentMode {
  if (event.eventType !== 'INSTALLMENT_PAYMENT') return 'cash';
  const p = event.payload as InstallmentPaymentPayload;
  if (p.onlineAmount > 0 && p.offlineAmount > 0) return 'mixed';
  if (p.onlineAmount > 0) return 'online';
  return 'cash';
}
