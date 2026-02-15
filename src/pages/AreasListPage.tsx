import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Building2, Plus } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatDate } from '@/lib/calculations';

export default function AreasListPage() {
  const navigate = useNavigate();
  const { areas, loading } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="px-5 pt-8 pb-2">
          <p className="text-xs font-semibold tracking-[1.5px] text-primary mb-1">CASHBOOK</p>
          <h1 className="text-2xl font-bold text-foreground">Your Areas</h1>
        </div>

        <div className="px-5 pt-4 space-y-2.5">
          {areas.length === 0 && !loading ? (
            <div className="flex flex-col items-center pt-16 gap-3">
              <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mb-2">
                <Building2 size={48} className="text-primary" />
              </div>
              <p className="font-semibold text-lg text-foreground">No areas yet</p>
              <p className="text-sm text-muted-foreground text-center leading-5 px-5">
                Create your first finance area to start tracking collections and loans
              </p>
            </div>
          ) : (
            areas.map(area => (
              <button
                key={area.id}
                onClick={() => navigate(`/area/${area.id}`)}
                className="w-full flex items-center gap-3.5 bg-card rounded-[14px] p-4 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                  <MapPin size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[17px] text-foreground">{area.name}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">Since {formatDate(area.createdAt)}</p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="flex justify-center pt-5 pb-10">
          <button
            onClick={() => navigate('/area/create')}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-semibold text-[15px] hover:opacity-90 active:scale-[0.97] transition-all shadow-md"
          >
            <Plus size={18} />
            New Area
          </button>
        </div>
      </div>
    </div>
  );
}
