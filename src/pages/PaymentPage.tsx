import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency, getCustomerLoanSummary } from '@/lib/calculations';

export default function PaymentPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, events, makePayment } = useApp();
  const [onlineAmount, setOnlineAmount] = useState('');
  const [offlineAmount, setOfflineAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const customer = customers.find(c => c.id === customerId);
  const summary = useMemo(() => customer ? getCustomerLoanSummary(customer, events) : null, [customer, events]);
  const totalAmount = (parseFloat(onlineAmount) || 0) + (parseFloat(offlineAmount) || 0);
  const canSave = totalAmount > 0 && summary?.activeLoanEventId;

  const doSave = () => {
    if (!customer || !summary?.activeLoanEventId) return;
    setSaving(true);
    try {
      makePayment(customer.id, customer.name, summary.activeLoanEventId, parseFloat(onlineAmount) || 0, parseFloat(offlineAmount) || 0);
      navigate(-1);
    } catch { setSaving(false); }
  };

  const handleSave = () => {
    if (!canSave || saving) return;
    if (summary && totalAmount > summary.remainingAmount) {
      if (confirm(`Payment of ${formatCurrency(totalAmount)} exceeds remaining ${formatCurrency(summary.remainingAmount)}. Continue?`)) doSave();
      return;
    }
    doSave();
  };

  if (!customer || !summary) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)}><X size={22} className="text-foreground" /></button>
          <span className="font-semibold text-[17px] text-foreground">Payment</span>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center pt-20"><p>Customer not found</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">Record Payment</span>
        <button onClick={handleSave} disabled={!canSave || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40"><Check size={22} className="text-primary" /></button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 bg-card rounded-xl p-3.5 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
            <span className="font-bold text-sm text-primary">#{customer.serialNumber}</span>
          </div>
          <div>
            <p className="font-semibold text-base text-foreground">{customer.name}</p>
            <p className="text-[13px] text-muted-foreground">{customer.villageName}</p>
          </div>
        </div>

        <div className="bg-warning-light rounded-xl p-4 flex flex-col items-center mb-6">
          <span className="font-medium text-xs text-warning">Remaining</span>
          <span className="font-bold text-[28px] text-warning mt-1">{formatCurrency(summary.remainingAmount)}</span>
          <span className="text-xs text-warning mt-1">{summary.remainingInstallments} installments left</span>
        </div>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Cash Amount</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-xl text-foreground border border-border outline-none focus:border-primary text-center" placeholder="0" value={offlineAmount} onChange={e => setOfflineAmount(e.target.value)} type="number" autoFocus />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Online Amount</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-xl text-foreground border border-border outline-none focus:border-primary text-center" placeholder="0" value={onlineAmount} onChange={e => setOnlineAmount(e.target.value)} type="number" />

        {totalAmount > 0 && (
          <div className="bg-success-light rounded-xl p-4 flex flex-col items-center mt-6">
            <span className="font-medium text-xs text-success">Total Payment</span>
            <span className="font-bold text-2xl text-success mt-1">{formatCurrency(totalAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
