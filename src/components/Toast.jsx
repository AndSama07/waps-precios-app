import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />
  };

  const borders = {
    success: 'border-emerald-500/40 bg-slate-900/95 text-emerald-200',
    error: 'border-rose-500/40 bg-slate-900/95 text-rose-200',
    info: 'border-blue-500/40 bg-slate-900/95 text-blue-200'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200 max-w-sm">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur ${borders[toast.type || 'success']}`}>
        {icons[toast.type || 'success']}
        <span className="text-xs sm:text-sm font-semibold text-white">
          {toast.message}
        </span>
      </div>
    </div>
  );
}
