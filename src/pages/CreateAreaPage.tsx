import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Star, Upload } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function CreateAreaPage() {
  const navigate = useNavigate();
  const { createArea, selectArea } = useApp();
  const [name, setName] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const area = createArea(name.trim(), isOnboarding, isOnboarding ? parseFloat(openingBalance) || 0 : undefined);
      selectArea(area.id);
      navigate('/');
    } catch { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">New Area</span>
        <button onClick={handleSave} disabled={!name.trim() || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40">
          <Check size={22} className="text-primary" />
        </button>
      </div>

      <div className="p-5">
        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Area Name</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="e.g. North District" value={name} onChange={e => setName(e.target.value)} autoFocus />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Finance Type</label>
        <div className="flex gap-3">
          <button className={`flex-1 flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-colors ${!isOnboarding ? 'border-primary bg-primary-light' : 'border-border bg-card'}`} onClick={() => setIsOnboarding(false)}>
            <Star size={18} className={!isOnboarding ? 'text-primary' : 'text-muted-foreground'} />
            <span className={`font-semibold text-sm ${!isOnboarding ? 'text-primary' : 'text-muted-foreground'}`}>Fresh Finance</span>
            <span className="text-xs text-muted-foreground">Starting new</span>
          </button>
          <button className={`flex-1 flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-colors ${isOnboarding ? 'border-primary bg-primary-light' : 'border-border bg-card'}`} onClick={() => setIsOnboarding(true)}>
            <Upload size={18} className={isOnboarding ? 'text-primary' : 'text-muted-foreground'} />
            <span className={`font-semibold text-sm ${isOnboarding ? 'text-primary' : 'text-muted-foreground'}`}>Existing Finance</span>
            <span className="text-xs text-muted-foreground">Onboarding</span>
          </button>
        </div>

        {isOnboarding && (
          <>
            <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Opening Balance (BF)</label>
            <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Enter current cash balance" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} type="number" />
            <p className="text-xs text-muted-foreground mt-2 leading-[18px]">This is the cash you currently have in hand. Past history will not be recalculated.</p>
          </>
        )}
      </div>
    </div>
  );
}
