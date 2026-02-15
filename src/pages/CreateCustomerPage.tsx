import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Check, Home } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVillage = searchParams.get('villageId');
  const { villages, createCustomer, createNewLoan, selectedArea } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string | null>(preselectedVillage);
  const [loanAmount, setLoanAmount] = useState('');
  const [totalPayable, setTotalPayable] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [isOldCustomer, setIsOldCustomer] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedVillageData = villages.find(v => v.id === selectedVillage);
  const canSave = name.trim() && selectedVillage && loanAmount && totalPayable && totalInstallments;

  const handleSave = () => {
    if (!canSave || saving || !selectedVillageData) return;
    const la = parseFloat(loanAmount);
    const tp = parseFloat(totalPayable);
    const ti = parseInt(totalInstallments);
    if (isNaN(la) || isNaN(tp) || isNaN(ti) || la <= 0 || tp <= 0 || ti <= 0) { alert('Please enter valid loan details'); return; }
    if (tp < la) { alert('Total payable must be >= loan amount'); return; }
    setSaving(true);
    try {
      const customer = createCustomer({ villageId: selectedVillage!, villageName: selectedVillageData.name, name: name.trim(), phone: phone.trim() });
      createNewLoan(customer.id, customer.name, la, tp, ti, isOldCustomer ? parseInt(paidInstallments) || 0 : undefined, isOldCustomer ? parseFloat(paidAmount) || 0 : undefined);
      navigate(-1);
    } catch { setSaving(false); }
  };

  if (villages.length === 0) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
          <span className="font-semibold text-[17px] text-foreground">New Customer</span>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-10 gap-3 pt-20">
          <Home size={40} className="text-muted-foreground" />
          <p className="font-semibold text-[17px] text-foreground">No villages yet</p>
          <p className="text-sm text-muted-foreground text-center">Create a village first</p>
          <button onClick={() => { navigate(-1); setTimeout(() => navigate('/village/create'), 300); }} className="bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold text-sm mt-2">Create Village</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">New Customer</span>
        <button onClick={handleSave} disabled={!canSave || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40"><Check size={22} className="text-primary" /></button>
      </div>

      <div className="p-5 overflow-y-auto">
        <p className="font-bold text-base text-foreground mb-1">Customer Details</p>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Village</label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {villages.map(v => (
            <button key={v.id} className={`px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${selectedVillage === v.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`} onClick={() => setSelectedVillage(v.id)}>
              {v.name}
            </button>
          ))}
        </div>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Name</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Customer name" value={name} onChange={e => setName(e.target.value)} />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Phone</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Phone number (optional)" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />

        <div className="h-px bg-border my-6" />
        <p className="font-bold text-base text-foreground mb-1">Loan Details</p>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Loan Amount (Given)</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Amount given to customer" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} type="number" />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Total Payable Amount</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Total amount to be repaid" value={totalPayable} onChange={e => setTotalPayable(e.target.value)} type="number" />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Total Installments</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Number of installments" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} type="number" />

        <div className="h-px bg-border my-6" />

        <button className="flex items-center gap-3 mt-2" onClick={() => setIsOldCustomer(!isOldCustomer)}>
          <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-colors ${isOldCustomer ? 'bg-primary border-primary' : 'border-border'}`}>
            {isOldCustomer && <Check size={14} className="text-primary-foreground" />}
          </div>
          <span className="text-sm text-foreground">Onboarding existing customer (has prior payments)</span>
        </button>

        {isOldCustomer && (
          <>
            <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Installments Already Paid</label>
            <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Number of installments paid" value={paidInstallments} onChange={e => setPaidInstallments(e.target.value)} type="number" />
            <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Amount Already Paid</label>
            <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Total amount already paid" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} type="number" />
          </>
        )}
        <div className="h-10" />
      </div>
    </div>
  );
}
