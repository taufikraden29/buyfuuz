
import { Plus, Target, Trash2, Sparkles } from 'lucide-react';
import { formatRupiah } from '../../utils/financeHelpers';
import type { SavingsGoal } from '../../types/finance';

interface SavingsTabProps {
  goals: SavingsGoal[];
  loadingGoals: boolean;
  setSelectedGoal: (g: SavingsGoal | null) => void;
  setFundType: (type: 'add' | 'withdraw') => void;
  setFundAmount: (amt: string) => void;
  setShowAddGoalModal: (show: boolean) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onDeleteGoal: (id: string) => void;
}

export default function SavingsTab({
  goals,
  loadingGoals,
  setSelectedGoal,
  setFundType,
  setFundAmount,
  setShowAddGoalModal,
  openConfirm,
  onDeleteGoal
}: SavingsTabProps) {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-slate-800">Target Tabungan</h2>
          <p className="text-[11px] text-slate-400">Rencanakan masa depan keuangan Anda</p>
        </div>
        <button 
          onClick={() => setShowAddGoalModal(true)}
          className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-600 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
        >
          <Plus size={11} strokeWidth={2.5} />
          <span>Buat Target</span>
        </button>
      </div>

      {loadingGoals ? (
        <div className="space-y-3">
          {[1, 2].map(n => (
            <div key={n} className="h-24 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="p-8 bg-white border border-slate-100 rounded-[20px] text-center">
          <Target className="mx-auto text-slate-300 mb-2 animate-bounce" size={26} />
          <p className="text-xs text-slate-500 font-bold">Belum ada target tabungan</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Buat target untuk laptop baru, liburan, atau dana darurat.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {goals.map(g => {
            const percent = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
            return (
              <div key={g.id} className="p-4 bg-white border border-slate-100 rounded-[22px] space-y-3 shadow-2xs relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700">{g.title}</h3>
                    <span className="text-[9px] text-slate-400">
                      Terkumpul: <span className="font-bold text-slate-600">{formatRupiah(g.currentAmount)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setFundType('add');
                        setFundAmount('');
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[9px] font-bold transition-colors cursor-pointer"
                    >
                      Tabung (+)
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setFundType('withdraw');
                        setFundAmount('');
                      }}
                      className="px-2 py-0.5 rounded bg-rose-50 text-rose-500 hover:bg-rose-100 text-[9px] font-bold transition-colors cursor-pointer"
                    >
                      Tarik (-)
                    </button>
                    <button
                      onClick={() => {
                        openConfirm(
                          'Hapus Target Tabungan',
                          `Apakah Anda yakin ingin menghapus target "${g.title}"? Seluruh progres dana saat ini akan hilang.`,
                          () => onDeleteGoal(g.id)
                        );
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 active:scale-95 transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${g.color || 'bg-indigo-500'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-slate-400">
                    <span>{percent}% SELESAI</span>
                    <span>TARGET: {formatRupiah(g.targetAmount)}</span>
                  </div>
                </div>

                {percent >= 100 && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-2 rounded-xl text-[9px] font-bold flex items-center gap-1.5">
                    <Sparkles size={11} className="text-emerald-500 animate-spin" />
                    <span>Selamat! Target tabungan Anda telah tercapai! 🎉</span>
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
