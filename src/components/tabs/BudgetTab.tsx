import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import { formatRupiah, getLivePreviewText } from '../../utils/financeHelpers';
import type { Budget } from '../../types/finance';

interface BudgetTabProps {
  budgets: Budget[];
  loadingBudgets: boolean;
  onUpdateBudget: (categoryId: string, limit: number) => void;
}

export default function BudgetTab({
  budgets,
  loadingBudgets,
  onUpdateBudget
}: BudgetTabProps) {
  const [editingBudget, setEditingBudget] = useState<{ categoryId: string; limit: string } | null>(null);

  const handleBudgetEditSubmit = (categoryId: string) => {
    if (!editingBudget || !editingBudget.limit) return;
    onUpdateBudget(categoryId, Math.abs(Number(editingBudget.limit)));
    setEditingBudget(null);
  };

  return (
    <div className="space-y-4 animate-slide-up">

      {loadingBudgets ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both').map(cat => {
            const budget = budgets.find(b => b.categoryId === cat.id);
            const isEditing = editingBudget?.categoryId === cat.id;

            const limit = budget ? budget.limit : 0;
            const spent = budget ? budget.spent : 0;
            const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
            const isNearLimit = percent >= 80;

            return (
              <div key={cat.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-8.5 h-8.5 rounded-xl ${cat.color} flex items-center justify-center flex-shrink-0`}>
                      <DynamicIcon name={cat.icon} size={16} />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-700">{cat.name}</h3>
                  </div>

                  {!isEditing && (
                    <button 
                      onClick={() => setEditingBudget({ categoryId: cat.id, limit: limit > 0 ? limit.toString() : '' })}
                      className="text-xs font-bold text-indigo-500 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {limit > 0 ? 'Edit Batas' : '+ Atur Batas'}
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 animate-scale-in">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Batas:</span>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          placeholder="Limit"
                          value={editingBudget.limit}
                          onChange={(e) => setEditingBudget({ ...editingBudget, limit: e.target.value })}
                          className="w-32 bg-white text-xs pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-300 font-bold text-slate-700"
                        />
                      </div>
                      <button 
                        onClick={() => handleBudgetEditSubmit(cat.id)}
                        className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
                        title="Simpan"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setEditingBudget(null)}
                        className="p-2 rounded-lg bg-white text-slate-400 border border-slate-200 hover:bg-slate-50 active:scale-95 cursor-pointer flex items-center justify-center"
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {isEditing && editingBudget.limit && (
                  <div className="text-xs text-indigo-500 font-bold text-right -mt-1 animate-scale-in">
                    Format: {getLivePreviewText(editingBudget.limit)}
                  </div>
                )}

                {limit > 0 ? (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] text-slate-400">
                        Terpakai: <span className="font-extrabold text-slate-600">{formatRupiah(spent)}</span>
                      </span>
                      <span className={`text-[11px] font-extrabold ${isNearLimit ? 'text-rose-500' : 'text-indigo-500'}`}>
                        {formatRupiah(limit)} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent >= 100 ? 'bg-red-400 animate-pulse' : isNearLimit ? 'bg-amber-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    {percent >= 100 ? (
                      <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50/70 p-2 rounded-lg text-[11px] font-bold">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>Batas anggaran terlampaui! Rem belanja kategori ini.</span>
                      </div>
                    ) : isNearLimit ? (
                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50/70 p-2 rounded-lg text-[11px] font-bold">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>Pengeluaran mendekati batas limit (diatas 80%).</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    Belum ada batas anggaran untuk kategori ini.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
