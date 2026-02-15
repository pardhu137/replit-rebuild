import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Check, RefreshCw } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function RenewLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId') || '';
  const customerName = searchParams.get('customerName') || '';
  const previousLoanEventId = searchParams.get('previousLoanEventId') || '';
  const { renewLoan } = useApp();
  const [loanAmount, setLoanAmount] = useState('');
  const [totalPayable, setTotalPayable] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = loanAmount && totalPayable && totalInstallments;

  const handleSave = () => {
    if (!canSave || saving) return;
    const la = parseFloat(loanAmount), tp = parseFloat(totalPayable), ti = parseInt(totalInstallments);
    if (isNaN(la) || isNaN(tp) || isNaN(ti) || la <= 0 || tp <= 0 || ti <= 0) { alert('Please enter valid loan details'); return; }
    setSaving(true);
    try { renewLoan(customerId, customerName, previousLoanEventId, la, tp, ti); navigate(-1); } catch { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">Renew Loan</span>
        <button onClick={handleSave} disabled={!canSave || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40"><Check size={22} className="text-primary" /></button>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2.5 bg-primary-light rounded-lg px-3.5 py-2.5">
          <RefreshCw size={18} className="text-primary" />
          <span className="font-semibold text-[15px] text-primary">{customerName}</span>
        </div>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Loan Amount (Given)</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Amount given to customer" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} type="number" autoFocus />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Total Payable Amount</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Total amount to be repaid" value={totalPayable} onChange={e => setTotalPayable(e.target.value)} type="number" />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Total Installments</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Number of installments" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} type="number" />
      </div>
    </div>
  );
}
