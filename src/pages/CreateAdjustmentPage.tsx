import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Plus, Minus } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatDateTime, getEventLabel, formatCurrency } from '@/lib/calculations';

export default function CreateAdjustmentPage() {
  const navigate = useNavigate();
  const { events, createAdjustment } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isNegative, setIsNegative] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const recentEvents = events.slice(0, 20);
  const canSave = selectedEvent && amount && reason.trim();

  const handleSave = () => {
    if (!canSave || saving) return;
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { alert('Please enter a valid amount'); return; }
    setSaving(true);
    try { createAdjustment(selectedEvent!, isNegative ? -a : a, reason.trim()); navigate(-1); } catch { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:opacity-50"><X size={22} className="text-foreground" /></button>
        <span className="font-semibold text-[17px] text-foreground">Adjustment</span>
        <button onClick={handleSave} disabled={!canSave || saving} className="w-10 h-10 flex items-center justify-center hover:opacity-70 disabled:opacity-40"><Check size={22} className="text-primary" /></button>
      </div>
      <div className="p-5 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground leading-5 mb-4">Select the original event to adjust. The original event will remain unchanged.</p>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Reference Event</label>
        {recentEvents.map(e => (
          <button key={e.eventId} className={`w-full flex items-center justify-between rounded-lg p-3 mb-1.5 border text-left transition-colors ${selectedEvent === e.eventId ? 'border-primary bg-primary-light' : 'border-border bg-card'}`} onClick={() => setSelectedEvent(e.eventId)}>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{getEventLabel(e.eventType)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(e.createdAt)}</p>
            </div>
            {selectedEvent === e.eventId && <Check size={16} className="text-primary" />}
          </button>
        ))}

        <div className="h-px bg-border my-4" />

        <label className="font-semibold text-sm text-foreground block mb-2">Adjustment Type</label>
        <div className="flex gap-3">
          <button className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 border-2 transition-colors ${!isNegative ? 'border-success bg-success-light' : 'border-border bg-card'}`} onClick={() => setIsNegative(false)}>
            <Plus size={16} className={!isNegative ? 'text-success' : 'text-muted-foreground'} />
            <span className={`font-semibold text-sm ${!isNegative ? 'text-success' : 'text-muted-foreground'}`}>Add</span>
          </button>
          <button className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 border-2 transition-colors ${isNegative ? 'border-destructive bg-destructive-light' : 'border-border bg-card'}`} onClick={() => setIsNegative(true)}>
            <Minus size={16} className={isNegative ? 'text-destructive' : 'text-muted-foreground'} />
            <span className={`font-semibold text-sm ${isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>Deduct</span>
          </button>
        </div>

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Amount</label>
        <input className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary" placeholder="Adjustment amount" value={amount} onChange={e => setAmount(e.target.value)} type="number" />

        <label className="font-semibold text-sm text-foreground block mb-2 mt-4">Reason</label>
        <textarea className="w-full bg-card rounded-xl px-4 py-3.5 text-base text-foreground border border-border outline-none focus:border-primary h-20 resize-none" placeholder="Why is this adjustment needed?" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="h-10" />
      </div>
    </div>
  );
}
