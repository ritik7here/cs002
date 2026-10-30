import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let Icon = CheckCircle2;
        let borderClass = 'border-emerald-200 dark:border-emerald-800';
        let bgClass = 'bg-white dark:bg-neutral-900';
        let iconClass = 'text-emerald-500';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-red-200 dark:border-red-800';
          iconClass = 'text-red-500';
        } else if (toast.type === 'info') {
          Icon = Info;
          borderClass = 'border-blue-200 dark:border-blue-800';
          iconClass = 'text-blue-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg ${borderClass} ${bgClass} text-xs text-neutral-800 dark:text-neutral-200 transition-all duration-300 animate-in slide-in-from-bottom-2`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
              <span className="font-medium leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
