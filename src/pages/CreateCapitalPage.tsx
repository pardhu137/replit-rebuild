import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, MapPin } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function CreateCapitalPage() {
  const navigate = useNavigate();
  const { addCapital, selectedArea } = useApp();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave = amount && description.trim();

  const handleSave = () => {
    if (!canSave || saving) return;
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { alert('Please enter a valid amount'); return; }
    setSaving(true);
    try { addCapital(a, description.trim()); navigate(-1); } catch { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">Add Capital</span>
        <button onClick={handleSave} disabled={!canSave || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40"><Check size={22} className="text-primary" /></button>
      </div>
      <div className="p-5">
        {selectedArea && (
          <div className="flex items-center gap-1.5 bg-info-light px-3 py-1.5 rounded-lg w-fit">
            <MapPin size={14} className="text-info" />
            <span className="font-medium text-[13px] text-info">{selectedArea.name}</span>
          </div>
        )}
        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Amount</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Enter capital amount" value={amount} onChange={e => setAmount(e.target.value)} type="number" autoFocus />
        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Description</label>
        <textarea className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary h-20 resize-none" placeholder="Source of capital" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
    </div>
  );
}
