import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency, getCustomerLoanSummary, formatDateTime, getEventLabel, getEventColor } from '@/lib/calculations';
import type { InstallmentPaymentPayload } from '@/lib/types';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, events, deleteCustomer } = useApp();

  const customer = customers.find(c => c.id === id);
  const summary = useMemo(() => customer ? getCustomerLoanSummary(customer, events) : null, [customer, events]);
  const customerEvents = useMemo(() => events.filter(e => (e.payload as any).customerId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [events, id]);

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
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={() => navigate(-1)} className="hover:opacity-50"><ArrowLeft size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">{customer.name}</span>
        <button onClick={confirmDelete} className="hover:opacity-50"><Trash2 size={20} className="text-destructive" /></button>
      </div>

      <div className="overflow-y-auto pb-8">
        <div className="mx-5 mt-2 bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-primary-light flex items-center justify-center">
              <span className="font-bold text-lg text-primary">#{customer.serialNumber}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-xl text-foreground">{customer.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{customer.villageName}</p>
              {customer.phone && <p className="text-[13px] text-muted-foreground mt-0.5">{customer.phone}</p>}
            </div>
          </div>

          {summary.hasLoan && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Given', value: formatCurrency(summary.loanAmount), color: '' },
                { label: 'Payable', value: formatCurrency(summary.totalPayable), color: '' },
                { label: 'Paid', value: formatCurrency(summary.amountPaid), color: 'text-success' },
                { label: 'Remaining', value: formatCurrency(summary.remainingAmount), color: summary.isFullyPaid ? 'text-success' : 'text-warning' },
              ].map(cell => (
                <div key={cell.label} className="bg-background rounded-lg p-3">
                  <p className="font-medium text-[11px] text-muted-foreground mb-1">{cell.label}</p>
                  <p className={`font-bold text-base ${cell.color || 'text-foreground'}`}>{cell.value}</p>
                </div>
              ))}
            </div>
          )}

          {summary.hasLoan && (
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-[13px] text-muted-foreground">{summary.installmentsPaid} of {summary.totalInstallments} installments</span>
                <span className="font-bold text-[13px] text-primary">{Math.round((summary.amountPaid / summary.totalPayable) * 100)}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (summary.amountPaid / summary.totalPayable) * 100)}%` }} />
              </div>
              {perInstallment > 0 && <p className="text-xs text-muted-foreground mt-2 text-center">{formatCurrency(perInstallment)} per installment</p>}
            </div>
          )}
        </div>

        <div className="px-5 mt-4 space-y-2.5">
          {summary.hasLoan && !summary.isFullyPaid && (
            <button onClick={() => navigate(`/payment/${customer.id}`)} className="w-full flex items-center justify-center gap-2.5 bg-primary text-primary-foreground rounded-[14px] py-4 font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all">
              <ArrowDownCircle size={20} />Record Payment
            </button>
          )}
          {summary.hasLoan && summary.isFullyPaid && (
            <button onClick={() => navigate(`/loan/renew?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}&previousLoanEventId=${summary.activeLoanEventId}`)} className="w-full flex items-center justify-center gap-2 bg-primary-light text-primary rounded-[14px] py-3.5 font-semibold text-[15px] hover:opacity-80 transition-opacity">
              <RefreshCw size={18} />Renew Loan
            </button>
          )}
        </div>

        {customerEvents.length > 0 && (
          <div className="mx-5 mt-6">
            <h3 className="font-semibold text-base text-foreground mb-3">Payment History</h3>
            {customerEvents.map(event => {
              const color = getEventColor(event.eventType);
              let amountStr = '';
              if (event.eventType === 'INSTALLMENT_PAYMENT') {
                const p = event.payload as InstallmentPaymentPayload;
                const parts: string[] = [];
                if (p.offlineAmount > 0) parts.push(`Cash ${formatCurrency(p.offlineAmount)}`);
                if (p.onlineAmount > 0) parts.push(`Online ${formatCurrency(p.onlineAmount)}`);
                amountStr = parts.join(' + ');
              }
              return (
                <div key={event.eventId} className="flex gap-3 mb-4">
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[13px]" style={{ color }}>{getEventLabel(event.eventType)}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                    </div>
                    {amountStr && <p className="font-medium text-sm text-foreground mt-1">{amountStr}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
