import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MinusCircle, PlusCircle, Edit3, Smartphone, Search, X, MapPin, Home, CheckCircle, Clock, Plus } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency, formatDateTime, getEventLabel, getEventColor, getCustomerLoanSummary } from '@/lib/calculations';
import type { FinanceEvent, CustomerLoanSummary, Village, NewLoanPayload, RenewLoanPayload, InstallmentPaymentPayload, ExpensePayload, CapitalAddedPayload, AdjustmentPayload, OnboardingBalancePayload } from '@/lib/types';

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

// Dashboard Tab
function DashboardTab() {
  const { dashboard } = useApp();
  const navigate = useNavigate();

  return (
    <div className="p-5 pb-10">
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <DashRow label="Opening Balance (BF)" value={formatCurrency(dashboard.openingBalance)} color="text-foreground" />
        <div className="h-px bg-border my-0.5" />
        <DashRow label="Total Given" value={`- ${formatCurrency(dashboard.totalGiven)}`} color="text-destructive" />
        <DashRow label="VK (Margin)" value={formatCurrency(dashboard.vk)} color="text-warning" />
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

// Customers Tab
function CustomersTab({ areaId }: { areaId: string }) {
  const { villages, customerSummaries } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return customerSummaries;
    const q = search.trim().toLowerCase();
    const num = parseInt(q);
    return customerSummaries.filter(cs => {
      if (!isNaN(num) && cs.customer.serialNumber === num) return true;
      return cs.customer.name.toLowerCase().includes(q) || cs.customer.phone.includes(q) || cs.customer.villageName.toLowerCase().includes(q);
    });
  }, [customerSummaries, search]);

  const villageGroups = useMemo(() => {
    const groups: { village: Village; customers: CustomerLoanSummary[] }[] = [];
    for (const v of villages) {
      const custs = filteredBySearch.filter(cs => cs.customer.villageId === v.id);
      groups.push({ village: v, customers: custs });
    }
    const ungrouped = filteredBySearch.filter(cs => !villages.some(v => v.id === cs.customer.villageId));
    if (ungrouped.length > 0) {
      groups.push({ village: { id: '_other', areaId, name: 'Other', nextSerialNumber: 0, createdAt: '' }, customers: ungrouped });
    }
    return groups.filter(g => g.customers.length > 0 || !search.trim());
  }, [villages, filteredBySearch, search, areaId]);

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex items-center gap-2 bg-card mx-5 mt-3 mb-2 rounded-xl px-3.5 h-11 shadow-sm">
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
        {villageGroups.length === 0 && villages.length === 0 && !search.trim() ? (
          <div className="flex flex-col items-center pt-16 gap-2.5">
            <Home size={40} className="text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No villages yet</p>
            <p className="text-[13px] text-muted-foreground text-center">Add a village to start adding customers</p>
          </div>
        ) : filteredBySearch.length === 0 && search.trim() ? (
          <div className="flex flex-col items-center pt-16 gap-2.5">
            <Search size={36} className="text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No results</p>
          </div>
        ) : (
          villageGroups.map(group => (
            <div key={group.village.id} className="mb-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  <span className="font-semibold text-sm text-foreground">{group.village.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[13px] text-muted-foreground">{group.customers.length}</span>
                  <button onClick={() => navigate(`/customer/create?villageId=${group.village.id}`)} className="p-0.5 hover:opacity-60">
                    <PlusCircle size={22} className="text-primary" />
                  </button>
                </div>
              </div>
              {group.customers.map(summary => (
                <CustomerRow key={summary.customer.id} summary={summary} />
              ))}
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/village/create')}
        className="fixed bottom-5 right-5 flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-3 rounded-3xl font-semibold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all z-10"
      >
        <Plus size={16} />
        Village
      </button>
    </div>
  );
}

function CustomerRow({ summary }: { summary: CustomerLoanSummary }) {
  const navigate = useNavigate();
  const { customer, hasLoan, isFullyPaid, remainingAmount, loanAmount, installmentsPaid, totalInstallments, loanType } = summary;
  const loanTypeLabel = hasLoan && loanType ? (loanType === 'RENEWED' ? 'Renewed' : 'New') : '';

  return (
    <button
      onClick={() => navigate(`/customer/${customer.id}`)}
      className="w-full flex items-center gap-2.5 bg-card rounded-xl p-3 mb-1.5 shadow-sm hover:opacity-80 transition-opacity text-left"
    >
      <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0 ${isFullyPaid ? 'bg-success-light' : 'bg-primary-light'}`}>
        <span className={`font-bold text-xs ${isFullyPaid ? 'text-success' : 'text-primary'}`}>#{customer.serialNumber}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
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

// History Tab
const EVENT_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'NEW_LOAN', label: 'New Loan', color: '#2563EB' },
  { key: 'RENEW_LOAN', label: 'Renewed Loan', color: '#8B5CF6' },
  { key: 'INSTALLMENT_PAYMENT', label: 'Payment', color: '#16A34A' },
  { key: 'EXPENSE', label: 'Expense', color: '#DC2626' },
  { key: 'CAPITAL_ADDED', label: 'Capital', color: '#0EA5E9' },
];

function HistoryTab() {
  const { events } = useApp();
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return events;
    return events.filter(e => e.eventType === filter);
  }, [events, filter]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex gap-2 px-5 py-3 overflow-x-auto flex-shrink-0">
        {EVENT_FILTERS.map(f => (
          <button
            key={f.key}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />}
            {f.label}
          </button>
        ))}
      </div>

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

  const getDetails = (): { name: string; info: string } => {
    switch (event.eventType) {
      case 'ONBOARDING_BALANCE': return { name: '', info: formatCurrency((event.payload as OnboardingBalancePayload).amount) };
      case 'NEW_LOAN': { const p = event.payload as NewLoanPayload; return { name: p.customerName, info: `Given: ${formatCurrency(p.loanAmount)} | Payable: ${formatCurrency(p.totalPayable)}` }; }
      case 'RENEW_LOAN': { const p = event.payload as RenewLoanPayload; return { name: p.customerName, info: `Given: ${formatCurrency(p.loanAmount)} | Payable: ${formatCurrency(p.totalPayable)}` }; }
      case 'INSTALLMENT_PAYMENT': { const p = event.payload as InstallmentPaymentPayload; return { name: p.customerName, info: formatCurrency(p.totalAmount) }; }
      case 'EXPENSE': { const p = event.payload as ExpensePayload; return { name: p.description, info: formatCurrency(p.amount) }; }
      case 'CAPITAL_ADDED': { const p = event.payload as CapitalAddedPayload; return { name: p.description, info: formatCurrency(p.amount) }; }
      case 'ADJUSTMENT_EVENT': { const p = event.payload as AdjustmentPayload; return { name: p.reason, info: formatCurrency(Math.abs(p.amount)) }; }
      default: return { name: '', info: '' };
    }
  };

  const details = getDetails();

  return (
    <div className="flex items-start gap-3 bg-card rounded-xl p-3.5 mb-2 shadow-sm">
      <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: color }} />
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
