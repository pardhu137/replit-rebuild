import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, MapPin } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function CreateVillagePage() {
  const navigate = useNavigate();
  const { createVillage, selectedArea } = useApp();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try { createVillage(name.trim()); navigate(-1); } catch { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">New Village</span>
        <button onClick={handleSave} disabled={!name.trim() || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40"><Check size={22} className="text-primary" /></button>
      </div>
      <div className="p-5">
        {selectedArea && (
          <div className="flex items-center gap-1.5 bg-primary-light px-3 py-1.5 rounded-lg self-start w-fit">
            <MapPin size={14} className="text-primary" />
            <span className="font-medium text-[13px] text-primary">{selectedArea.name}</span>
          </div>
        )}
        <label className="font-semibold text-sm text-foreground block mb-2 mt-5">Village Name</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Enter village name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
    </div>
  );
}
