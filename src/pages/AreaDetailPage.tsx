import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MinusCircle, PlusCircle, Edit3, Smartphone, Search, X, MapPin, Home, CheckCircle, Clock, Plus, CalendarIcon, ChevronDown } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency, formatDateTime, getEventLabel, getEventColor, getCustomerLoanSummary, isOnboardingPayment, filterEventsByDate, getPaymentMode, getPaymentModeColor, formatDate } from '@/lib/calculations';
import type { FinanceEvent, CustomerLoanSummary, Village, NewLoanPayload, RenewLoanPayload, InstallmentPaymentPayload, ExpensePayload, CapitalAddedPayload, AdjustmentPayload, OnboardingBalancePayload, DateFilter, DateFilterMode, PaymentMode } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TabKey = 'dashboard' | 'customers' | 'history';

function TabBar({ active, onSelect }: { active: TabKey; onSelect: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'customers', label: 'Customers' },
    { key: 'history', label: 'History' },
  ];
  return (
    <div className="flex border-b border-border px-5">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`py-3 mr-7 border-b-2 text-[15px] font-medium transition-colors ${active === t.key ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => onSelect(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Date Filter Component
function DateFilterSelector() {
  const { dateFilter, setDateFilter } = useApp();
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'custom' | 'rangeStart' | 'rangeEnd'>('custom');
  const [rangeStart, setRangeStart] = useState<Date | undefined>();

  const dateOptions: { key: DateFilterMode; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'custom', label: 'Custom' },
    { key: 'range', label: 'Range' },
    { key: 'all', label: 'All' },
  ];

  const getLabel = () => {
    switch (dateFilter.mode) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'custom': return dateFilter.customDate ? format(new Date(dateFilter.customDate), 'dd MMM') : 'Custom';
      case 'range': return dateFilter.startDate && dateFilter.endDate
        ? `${format(new Date(dateFilter.startDate), 'dd MMM')} - ${format(new Date(dateFilter.endDate), 'dd MMM')}`
        : 'Range';
      case 'all': return 'All Time';
    }
  };

  const handleSelect = (mode: DateFilterMode) => {
    if (mode === 'today' || mode === 'yesterday' || mode === 'all') {
      setDateFilter({ mode });
      setShowCalendar(false);
    } else if (mode === 'custom') {
      setCalendarMode('custom');
      setShowCalendar(true);
    } else if (mode === 'range') {
      setCalendarMode('rangeStart');
      setRangeStart(undefined);
      setShowCalendar(true);
    }
  };

  const handleDatePick = (date: Date | undefined) => {
    if (!date) return;
    if (calendarMode === 'custom') {
      setDateFilter({ mode: 'custom', customDate: date.toISOString() });
      setShowCalendar(false);
    } else if (calendarMode === 'rangeStart') {
      setRangeStart(date);
      setCalendarMode('rangeEnd');
    } else if (calendarMode === 'rangeEnd' && rangeStart) {
      const s = rangeStart < date ? rangeStart : date;
      const e = rangeStart < date ? date : rangeStart;
      setDateFilter({ mode: 'range', startDate: s.toISOString(), endDate: e.toISOString() });
      setShowCalendar(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:opacity-80">
          <CalendarIcon size={14} className="text-primary" />
          {getLabel()}
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        {!showCalendar ? (
          <div className="p-2 space-y-0.5">
            {dateOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  dateFilter.mode === opt.key ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="px-3 pt-2 pb-1">
              <p className="text-xs font-medium text-muted-foreground">
                {calendarMode === 'custom' ? 'Pick a date' : calendarMode === 'rangeStart' ? 'Pick start date' : 'Pick end date'}
              </p>
            </div>
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDatePick}
              className={cn("p-3 pointer-events-auto")}
            />
            <div className="px-3 pb-2">
              <button onClick={() => setShowCalendar(false)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Dashboard Tab
function DashboardTab() {
  const { dashboard } = useApp();
  const navigate = useNavigate();

  return (
    <div className="p-5 pb-10">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm text-muted-foreground">Financial Summary</span>
        <DateFilterSelector />
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <DashRow label="Opening Balance (BF)" value={formatCurrency(dashboard.openingBalance)} color="text-foreground" />
        <div className="h-px bg-border my-0.5" />

        {/* New vs Renewed Loans */}
        <DashRow label="Total Given" value={`- ${formatCurrency(dashboard.totalGiven)}`} color="text-destructive" />
        {(dashboard.totalGivenNew > 0 || dashboard.totalGivenRenewed > 0) && (
          <div className="pl-4 space-y-0.5">
            {dashboard.totalGivenNew > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">↳ New Loans</span>
                <span className="font-semibold text-xs text-foreground">{formatCurrency(dashboard.totalGivenNew)}</span>
              </div>
            )}
            {dashboard.totalGivenRenewed > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">↳ Renewed Loans</span>
                <span className="font-semibold text-xs text-foreground">{formatCurrency(dashboard.totalGivenRenewed)}</span>
              </div>
            )}
          </div>
        )}

        <DashRow label="VK (Margin)" value={formatCurrency(dashboard.vk)} color="text-warning" />
        {(dashboard.vkNew > 0 || dashboard.vkRenewed > 0) && (
          <div className="pl-4 space-y-0.5">
            {dashboard.vkNew > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">↳ New Loans VK</span>
                <span className="font-semibold text-xs text-warning">{formatCurrency(dashboard.vkNew)}</span>
              </div>
            )}
            {dashboard.vkRenewed > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">↳ Renewed Loans VK</span>
                <span className="font-semibold text-xs text-warning">{formatCurrency(dashboard.vkRenewed)}</span>
              </div>
            )}
          </div>
        )}

        <div className="h-px bg-border my-0.5" />
        <div className="flex justify-between items-center py-2.5">
          <div className="flex-1">
            <p className="font-medium text-[15px] text-foreground">Total Collected</p>
            <div className="flex gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Smartphone size={12} className="text-info" />
                <span className="text-xs text-muted-foreground">{formatCurrency(dashboard.totalCollectedOnline)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-warning">₹</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(dashboard.totalCollectedOffline)}</span>
              </div>
            </div>
          </div>
          <span className="font-bold text-[17px] text-success">+ {formatCurrency(dashboard.totalCollected)}</span>
        </div>
        <div className="h-px bg-border my-0.5" />
        <DashRow label="Expenses" value={`- ${formatCurrency(dashboard.expenses)}`} color="text-destructive" />
        <DashRow label="Capital Added" value={`+ ${formatCurrency(dashboard.capitalAdded)}`} color="text-warning" />
        {dashboard.adjustments !== 0 && (
          <DashRow label="Adjustments" value={`${dashboard.adjustments >= 0 ? '+' : ''} ${formatCurrency(dashboard.adjustments)}`} color="text-purple-500" />
        )}
        <div className="h-px bg-border my-0.5" />
        <div className="flex justify-between items-center pt-3">
          <span className="font-semibold text-base text-foreground">Closing Balance</span>
          <span className={`font-bold text-[22px] ${dashboard.closingBalance < 0 ? 'text-destructive' : 'text-primary'}`}>
            {formatCurrency(dashboard.closingBalance)}
          </span>
        </div>
      </div>

      <div className="flex gap-2.5 mt-4">
        <button onClick={() => navigate('/expense/create')} className="flex-1 flex items-center justify-center gap-1.5 bg-card rounded-xl py-3 shadow-sm hover:opacity-80 transition-opacity">
          <MinusCircle size={18} className="text-destructive" />
          <span className="font-medium text-[13px] text-foreground">Expense</span>
        </button>
        <button onClick={() => navigate('/capital/create')} className="flex-1 flex items-center justify-center gap-1.5 bg-card rounded-xl py-3 shadow-sm hover:opacity-80 transition-opacity">
          <PlusCircle size={18} className="text-info" />
          <span className="font-medium text-[13px] text-foreground">Capital</span>
        </button>
        <button onClick={() => navigate('/adjustment/create')} className="flex-1 flex items-center justify-center gap-1.5 bg-card rounded-xl py-3 shadow-sm hover:opacity-80 transition-opacity">
          <Edit3 size={18} className="text-purple-500" />
          <span className="font-medium text-[13px] text-foreground">Adjust</span>
        </button>
      </div>
    </div>
  );
}

function DashRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <span className="font-medium text-[15px] text-foreground">{label}</span>
      <span className={`font-bold text-[17px] ${color}`}>{value}</span>
    </div>
  );
}

// Customers Tab with village selector
function CustomersTab({ areaId }: { areaId: string }) {
  const { villages, customerSummaries } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  const filteredBySearch = useMemo(() => {
    let list = customerSummaries;
    if (selectedVillageId) {
      list = list.filter(cs => cs.customer.villageId === selectedVillageId);
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    const num = parseInt(q);
    return list.filter(cs => {
      if (!isNaN(num) && cs.customer.serialNumber === num) return true;
      return cs.customer.name.toLowerCase().includes(q) || cs.customer.phone.includes(q) || cs.customer.villageName.toLowerCase().includes(q);
    });
  }, [customerSummaries, search, selectedVillageId]);

  const today = new Date().toDateString();

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Village selector chips */}
      {villages.length > 1 && (
        <div className="flex gap-2 px-5 pt-3 pb-1 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setSelectedVillageId(null)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${!selectedVillageId ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
          >
            All Villages
          </button>
          {villages.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVillageId(v.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${selectedVillageId === v.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 bg-card mx-5 mt-2 mb-2 rounded-xl px-3.5 h-11 shadow-sm">
        <Search size={16} className="text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-full"
          placeholder="Search by name or serial #"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search.length > 0 && (
          <button onClick={() => setSearch('')}><X size={16} className="text-muted-foreground" /></button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-20">
        {filteredBySearch.length === 0 && villages.length === 0 && !search.trim() ? (
          <div className="flex flex-col items-center pt-16 gap-2.5">
            <Home size={40} className="text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No villages yet</p>
            <p className="text-[13px] text-muted-foreground text-center">Add a village to start adding customers</p>
          </div>
        ) : filteredBySearch.length === 0 ? (
          <div className="flex flex-col items-center pt-16 gap-2.5">
            <Search size={36} className="text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No results</p>
          </div>
        ) : (
          filteredBySearch.map(summary => (
            <CustomerRow key={summary.customer.id} summary={summary} />
          ))
        )}
      </div>

      <div className="fixed bottom-5 right-5 flex gap-2 z-10">
        <button
          onClick={() => navigate('/village/create')}
          className="flex items-center gap-1.5 bg-card text-foreground border border-border px-4 py-3 rounded-3xl font-semibold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={16} />
          Village
        </button>
        {villages.length > 0 && (
          <button
            onClick={() => navigate(`/customer/create${selectedVillageId ? `?villageId=${selectedVillageId}` : ''}`)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-3 rounded-3xl font-semibold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Customer
          </button>
        )}
      </div>
    </div>
  );
}

function CustomerRow({ summary }: { summary: CustomerLoanSummary }) {
  const navigate = useNavigate();
  const { customer, hasLoan, isFullyPaid, remainingAmount, loanAmount, installmentsPaid, totalInstallments, loanType, paidToday } = summary;
  const loanTypeLabel = hasLoan && loanType ? (loanType === 'RENEWED' ? 'Renewed' : 'New') : '';

  return (
    <button
      onClick={() => navigate(`/customer/${customer.id}`)}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-xl p-3 mb-1.5 shadow-sm hover:opacity-80 transition-opacity text-left",
        paidToday ? "bg-success-light border border-success/20" : "bg-card"
      )}
    >
      <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0 ${isFullyPaid ? 'bg-success-light' : 'bg-primary-light'}`}>
        <span className={`font-bold text-xs ${isFullyPaid ? 'text-success' : 'text-primary'}`}>#{customer.serialNumber}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
              {paidToday && (
                <span className="flex items-center gap-0.5 bg-success/10 text-success text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  <CheckCircle size={10} />
                  Paid today
                </span>
              )}
            </div>
            {hasLoan && <p className="text-xs text-muted-foreground mt-0.5">{loanTypeLabel} {formatCurrency(loanAmount)}</p>}
          </div>
          {hasLoan && !isFullyPaid ? (
            <span className="font-bold text-[15px] text-destructive flex-shrink-0">{formatCurrency(remainingAmount)}</span>
          ) : hasLoan && isFullyPaid ? (
            <div className="flex items-center gap-1 bg-success-light px-1.5 py-0.5 rounded flex-shrink-0">
              <CheckCircle size={13} className="text-success" />
              <span className="font-semibold text-[11px] text-success">Paid</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground flex-shrink-0">No loan</span>
          )}
        </div>
        {hasLoan && <p className="text-[11px] text-muted-foreground mt-1">{installmentsPaid}/{totalInstallments} installments</p>}
      </div>
    </button>
  );
}

// History Tab with Adjustment filter + payment mode sub-filters
const EVENT_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'NEW_LOAN', label: 'New Loan', color: '#2563EB' },
  { key: 'RENEW_LOAN', label: 'Renewed Loan', color: '#8B5CF6' },
  { key: 'INSTALLMENT_PAYMENT', label: 'Payment', color: '#16A34A' },
  { key: 'EXPENSE', label: 'Expense', color: '#DC2626' },
  { key: 'CAPITAL_ADDED', label: 'Capital', color: '#0EA5E9' },
  { key: 'ADJUSTMENT_EVENT', label: 'Adjustment', color: '#D97706' },
];

const PAYMENT_SUB_FILTERS: { key: PaymentMode | 'all'; label: string; color?: string }[] = [
  { key: 'all', label: 'All Payments' },
  { key: 'cash', label: '💵 Cash', color: '#EAB308' },
  { key: 'online', label: '🌐 Online', color: '#3B82F6' },
  { key: 'mixed', label: '💜 Mixed', color: '#8B5CF6' },
];

function HistoryTab() {
  const { events, dateFilter } = useApp();
  const [filter, setFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | 'all'>('all');

  const filtered = useMemo(() => {
    // Exclude onboarding payments from history
    let list = events.filter(e => !isOnboardingPayment(e));

    // Apply date filter
    if (dateFilter.mode !== 'all') {
      list = filterEventsByDate(list, dateFilter);
    }

    // Apply event type filter
    if (filter !== 'ALL') {
      list = list.filter(e => e.eventType === filter);
    }

    // Apply payment mode sub-filter
    if (filter === 'INSTALLMENT_PAYMENT' && paymentModeFilter !== 'all') {
      list = list.filter(e => getPaymentMode(e) === paymentModeFilter);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, filter, paymentModeFilter, dateFilter]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center px-5 pt-3 pb-1">
        <span className="font-semibold text-sm text-muted-foreground">History</span>
        <DateFilterSelector />
      </div>

      <div className="flex gap-2 px-5 py-2 overflow-x-auto flex-shrink-0">
        {EVENT_FILTERS.map(f => (
          <button
            key={f.key}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
            onClick={() => { setFilter(f.key); setPaymentModeFilter('all'); }}
          >
            {f.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Payment mode sub-filters */}
      {filter === 'INSTALLMENT_PAYMENT' && (
        <div className="flex gap-2 px-5 pb-2 overflow-x-auto flex-shrink-0">
          {PAYMENT_SUB_FILTERS.map(f => (
            <button
              key={f.key}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border whitespace-nowrap transition-colors ${paymentModeFilter === f.key ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border'}`}
              onClick={() => setPaymentModeFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center pt-16 gap-2.5">
            <Clock size={40} className="text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No events yet</p>
            <p className="text-[13px] text-muted-foreground text-center">Financial actions will appear here</p>
          </div>
        ) : (
          filtered.map(event => <HistoryEventItem key={event.eventId} event={event} />)
        )}
      </div>
    </div>
  );
}

function HistoryEventItem({ event }: { event: FinanceEvent }) {
  const color = getEventColor(event.eventType);

  const getDetails = (): { name: string; info: string; paymentBreakdown?: string } => {
    switch (event.eventType) {
      case 'ONBOARDING_BALANCE': return { name: '', info: formatCurrency((event.payload as OnboardingBalancePayload).amount) };
      case 'NEW_LOAN': { const p = event.payload as NewLoanPayload; return { name: p.customerName, info: `Given: ${formatCurrency(p.loanAmount)} | Payable: ${formatCurrency(p.totalPayable)}` }; }
      case 'RENEW_LOAN': { const p = event.payload as RenewLoanPayload; return { name: p.customerName, info: `Given: ${formatCurrency(p.loanAmount)} | Payable: ${formatCurrency(p.totalPayable)}` }; }
      case 'INSTALLMENT_PAYMENT': {
        const p = event.payload as InstallmentPaymentPayload;
        const parts: string[] = [];
        if (p.offlineAmount > 0) parts.push(`💵 ${formatCurrency(p.offlineAmount)}`);
        if (p.onlineAmount > 0) parts.push(`🌐 ${formatCurrency(p.onlineAmount)}`);
        return { name: p.customerName, info: parts.join(' + '), paymentBreakdown: parts.join(' + ') };
      }
      case 'EXPENSE': { const p = event.payload as ExpensePayload; return { name: p.description, info: formatCurrency(p.amount) }; }
      case 'CAPITAL_ADDED': { const p = event.payload as CapitalAddedPayload; return { name: p.description, info: formatCurrency(p.amount) }; }
      case 'ADJUSTMENT_EVENT': { const p = event.payload as AdjustmentPayload; return { name: p.reason, info: `${p.amount >= 0 ? '+' : ''}${formatCurrency(p.amount)}` }; }
      default: return { name: '', info: '' };
    }
  };

  const details = getDetails();
  const mode = event.eventType === 'INSTALLMENT_PAYMENT' ? getPaymentMode(event) : null;
  const modeColor = mode ? getPaymentModeColor(mode) : null;

  return (
    <div className="flex items-start gap-3 bg-card rounded-xl p-3.5 mb-2 shadow-sm">
      <span
        className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
        style={{ backgroundColor: mode ? modeColor! : color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-bold text-xs uppercase" style={{ color }}>{getEventLabel(event.eventType)}</span>
          <span className="text-[11px] text-muted-foreground">{formatDateTime(event.createdAt)}</span>
        </div>
        {details.name && <p className="font-medium text-sm text-foreground mt-1">{details.name}</p>}
        <p className="font-semibold text-[15px] text-foreground mt-0.5">{details.info}</p>
      </div>
    </div>
  );
}

// Main Area Screen
export default function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { areas, selectArea, selectedAreaId } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const area = areas.find(a => a.id === id);

  useEffect(() => {
    if (id && id !== selectedAreaId) selectArea(id);
  }, [id, selectedAreaId, selectArea]);

  if (!area) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={() => navigate('/')}><ArrowLeft size={22} className="text-foreground" /></button>
          <span className="font-bold text-xl text-foreground">Area</span>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex items-center justify-center pt-20">
          <p className="text-muted-foreground">Area not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={() => navigate('/')} className="hover:opacity-50 transition-opacity">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <span className="font-bold text-xl text-foreground">{area.name}</span>
        <div className="w-10" />
      </div>

      <TabBar active={activeTab} onSelect={setActiveTab} />

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'customers' && <CustomersTab areaId={id!} />}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}
