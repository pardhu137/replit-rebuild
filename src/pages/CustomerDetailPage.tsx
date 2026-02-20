import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ArrowDownCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency, getCustomerLoanSummary, formatDateTime, getCustomerLoanSections, isOnboardingPayment, getPaymentMode, getPaymentModeColor, getPaymentModeLabel } from '@/lib/calculations';
import type { InstallmentPaymentPayload, PaymentMode } from '@/lib/types';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, events, deleteCustomer } = useApp();

  const customer = customers.find(c => c.id === id);
  const summary = useMemo(() => customer ? getCustomerLoanSummary(customer, events) : null, [customer, events]);
  const loanSections = useMemo(() => customer ? getCustomerLoanSections(customer, events) : [], [customer, events]);

  if (!customer || !summary) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <span className="font-semibold text-[17px] text-foreground">Customer</span>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center pt-20"><p className="text-muted-foreground">Customer not found</p></div>
      </div>
    );
  }

  const confirmDelete = () => {
    if (confirm(`Delete "${customer.name}"? This cannot be undone.`)) {
      deleteCustomer(customer.id);
      navigate(-1);
    }
  };

  const perInstallment = summary.totalInstallments > 0 ? summary.totalPayable / summary.totalInstallments : 0;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Sticky header with summary, progress, and action button */}
      <div className="sticky top-0 z-10 bg-background pb-2">
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={() => navigate(-1)} className="hover:opacity-50"><ArrowLeft size={22} className="text-foreground" /></button>
          <span className="font-semibold text-[17px] text-foreground">{customer.name}</span>
          <button onClick={confirmDelete} className="hover:opacity-50"><Trash2 size={20} className="text-destructive" /></button>
        </div>

        <div className="mx-5 bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-[44px] h-[44px] rounded-[12px] bg-primary-light flex items-center justify-center">
              <span className="font-bold text-base text-primary">#{customer.serialNumber}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.villageName}</p>
            </div>
          </div>

          {summary.hasLoan && (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Given', value: formatCurrency(summary.loanAmount) },
                  { label: 'Payable', value: formatCurrency(summary.totalPayable) },
                  { label: 'Paid', value: formatCurrency(summary.amountPaid), color: 'text-success' },
                  { label: 'Left', value: formatCurrency(summary.remainingAmount), color: summary.isFullyPaid ? 'text-success' : 'text-warning' },
                ].map(cell => (
                  <div key={cell.label} className="bg-background rounded-lg p-2 text-center">
                    <p className="font-medium text-[10px] text-muted-foreground">{cell.label}</p>
                    <p className={`font-bold text-xs ${cell.color || 'text-foreground'}`}>{cell.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-[12px] text-muted-foreground">{summary.installmentsPaid}/{summary.totalInstallments} inst.</span>
                  <span className="font-bold text-[12px] text-primary">{Math.round((summary.amountPaid / summary.totalPayable) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (summary.amountPaid / summary.totalPayable) * 100)}%` }} />
                </div>
                {perInstallment > 0 && <p className="text-[10px] text-muted-foreground mt-1 text-center">{formatCurrency(perInstallment)} per installment</p>}
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 mt-2 space-y-2">
          {summary.hasLoan && !summary.isFullyPaid && (
            <button onClick={() => navigate(`/payment/${customer.id}`)} className="w-full flex items-center justify-center gap-2.5 bg-primary text-primary-foreground rounded-[14px] py-3.5 font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all">
              <ArrowDownCircle size={18} />Record Payment
            </button>
          )}
          {summary.hasLoan && summary.isFullyPaid && (
            <button onClick={() => navigate(`/loan/renew?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}&previousLoanEventId=${summary.activeLoanEventId}`)} className="w-full flex items-center justify-center gap-2 bg-primary-light text-primary rounded-[14px] py-3 font-semibold text-[15px] hover:opacity-80 transition-opacity">
              <RefreshCw size={16} />Renew Loan
            </button>
          )}
        </div>
      </div>

      {/* Scrollable loan history grouped by loan */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">
        {loanSections.length > 0 && (
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Loan History</h3>
        )}
        {loanSections.map(section => (
          <LoanSectionCard key={section.loanEvent.eventId} section={section} />
        ))}
      </div>
    </div>
  );
}

function LoanSectionCard({ section }: { section: import('@/lib/types').LoanSection }) {
  const [expanded, setExpanded] = useState(section.isActive);
  const hasPayments = section.payments.filter(p => !isOnboardingPayment(p)).length > 0;
  const [paymentFilter, setPaymentFilter] = useState<PaymentMode | 'all'>('all');

  const nonOnboardingPayments = useMemo(() => {
    let payments = section.payments.filter(p => !isOnboardingPayment(p));
    if (paymentFilter !== 'all') {
      payments = payments.filter(p => getPaymentMode(p) === paymentFilter);
    }
    return payments;
  }, [section.payments, paymentFilter]);

  const canExpand = hasPayments;

  return (
    <div className="bg-card rounded-xl mb-3 shadow-sm overflow-hidden">
      <button
        onClick={() => canExpand && setExpanded(!expanded)}
        className={`w-full p-3.5 text-left ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${section.loanType === 'RENEWED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {section.loanType === 'RENEWED' ? 'Renewed' : 'New'}
            </span>
            {section.isClosed && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success-light text-success">Closed</span>
            )}
          </div>
          {canExpand && (expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />)}
        </div>
        <div className="flex justify-between mt-2">
          <div>
            <p className="text-[11px] text-muted-foreground">Given {formatCurrency(section.loanAmount)} → Payable {formatCurrency(section.totalPayable)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {section.installmentsPaid}/{section.totalInstallments} paid • Remaining {formatCurrency(section.remainingAmount)}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Started: {formatDateTime(section.startDate)}
          {section.closedDate && ` • Closed: ${formatDateTime(section.closedDate)}`}
        </p>
      </button>

      {expanded && hasPayments && (
        <div className="border-t border-border px-3.5 pb-3 pt-2">
          {/* Payment mode sub-filters */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto">
            {(['all', 'cash', 'online', 'mixed'] as const).map(key => (
              <button
                key={key}
                onClick={() => setPaymentFilter(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors ${paymentFilter === key ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border'}`}
              >
                {key === 'all' ? 'All' : key === 'cash' ? '💵 Cash' : key === 'online' ? '🌐 Online' : '💜 Mixed'}
              </button>
            ))}
          </div>

          {nonOnboardingPayments.map(payment => {
            const p = payment.payload as InstallmentPaymentPayload;
            const mode = getPaymentMode(payment);
            const modeColor = getPaymentModeColor(mode);
            const parts: string[] = [];
            if (p.offlineAmount > 0) parts.push(`💵 ${formatCurrency(p.offlineAmount)}`);
            if (p.onlineAmount > 0) parts.push(`🌐 ${formatCurrency(p.onlineAmount)}`);

            return (
              <div key={payment.eventId} className="flex gap-2.5 mb-2.5 last:mb-0">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: modeColor }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-foreground">{parts.join(' + ')}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(payment.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {nonOnboardingPayments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No {paymentFilter} payments</p>
          )}
        </div>
      )}
    </div>
  );
}
