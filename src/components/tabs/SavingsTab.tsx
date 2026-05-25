import { useState } from 'react';
import { Target, Trash2, Sparkles, Calculator } from 'lucide-react';
import { formatRupiah, getLivePreviewText } from '../../utils/financeHelpers';
import type { SavingsGoal } from '../../types/finance';

interface SavingsTabProps {
  goals: SavingsGoal[];
  loadingGoals: boolean;
  setSelectedGoal: (g: SavingsGoal | null) => void;
  setFundType: (type: 'add' | 'withdraw') => void;
  setFundAmount: (amt: string) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onDeleteGoal: (id: string) => void;
}

export default function SavingsTab({
  goals,
  loadingGoals,
  setSelectedGoal,
  setFundType,
  setFundAmount,
  openConfirm,
  onDeleteGoal
}: SavingsTabProps) {
  // Simulator States
  const [simTarget, setSimTarget] = useState('10000000');
  const [simMonths, setSimMonths] = useState('12');

  const targetVal = Math.abs(Number(simTarget)) || 0;
  const monthsVal = Math.max(1, Number(simMonths)) || 1;

  const perMonth = Math.round(targetVal / monthsVal);
  const perWeek = Math.round(targetVal / (monthsVal * 4.33));
  const perDay = Math.round(targetVal / (monthsVal * 30));

  let tipText = 'Target cukup menantang! Pastikan untuk mengatur ulang anggaran bulanan Anda agar seimbang. 📈';
  if (perDay <= 15000) {
    tipText = 'Setara dengan menyisihkan 1 cangkir kopi sachet per hari! Sangat realistis! ☕';
  } else if (perDay <= 50000) {
    tipText = 'Setara dengan harga 1 porsi makan siang di luar. Anda pasti bisa! 🍲';
  } else if (perDay <= 150000) {
    tipText = 'Setara dengan tiket nonton bioskop atau jajan akhir pekan. Skala prioritas! 🎬';
  }

  return (
    <div className="space-y-4 animate-slide-up">

      {loadingGoals ? (
        <div className="space-y-3">
          {[1, 2].map(n => (
            <div key={n} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-[20px] text-center shadow-xs">
          <Target className="mx-auto text-slate-400 mb-2 animate-bounce" size={26} />
          <p className="text-xs text-slate-800 font-extrabold">Belum ada target tabungan</p>
          <p className="text-xs text-slate-500 mt-0.5">Buat target untuk laptop baru, liburan, atau dana darurat.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {goals.map(g => {
            const percent = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
            return (
              <div key={g.id} className="p-4 bg-white border border-slate-200 rounded-[22px] space-y-3.5 shadow-sm relative">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-slate-800 truncate">{g.title}</h3>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      Terkumpul: <span className="font-extrabold text-slate-850">{formatRupiah(g.currentAmount)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setFundType('add');
                        setFundAmount('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-100 text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer hover:scale-102 active:scale-95"
                    >
                      Tabung (+)
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setFundType('withdraw');
                        setFundAmount('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100/80 border border-rose-100 text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer hover:scale-102 active:scale-95"
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 active:scale-90 transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${g.color || 'bg-indigo-500'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold text-slate-500 tracking-wide">
                    <span>{percent}% SELESAI</span>
                    <span>TARGET: {formatRupiah(g.targetAmount)}</span>
                  </div>
                </div>

                {percent >= 100 && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                    <Sparkles size={12} className="text-emerald-600 animate-spin" />
                    <span>Selamat! Target tabungan Anda telah tercapai! 🎉</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 📊 KALKULATOR IMPIAN (SIMULASI MENABUNG) */}
      <div className="p-4 bg-white border border-slate-200 rounded-[22px] space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center flex-shrink-0">
            <Calculator size={14} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 leading-tight">Kalkulator Impian (Simulasi)</h3>
            <p className="text-[10px] text-slate-500 font-bold">Rencanakan tabungan masa depan Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-1">Target Nominal</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">Rp</span>
              <input
                type="number"
                placeholder="0"
                value={simTarget}
                onChange={(e) => setSimTarget(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-[11px] pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-200 transition-colors font-bold text-slate-700 shadow-3xs"
              />
            </div>
            {simTarget && (
              <span className="text-[9px] text-indigo-600 font-black mt-0.5 block truncate max-w-full">
                {getLivePreviewText(simTarget)}
              </span>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-1">Durasi (Bulan)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="1"
                value={simMonths}
                onChange={(e) => setSimMonths(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-200 transition-colors font-bold text-slate-700 shadow-3xs"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">bln</span>
            </div>
          </div>
        </div>

        {/* Calculation Result Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
          <div className="p-2 bg-indigo-50/50 border border-indigo-100/70 rounded-xl text-center shadow-3xs">
            <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wide block">Per Bulan</span>
            <span className="text-[11px] font-black text-slate-800 block mt-0.5">{formatRupiah(perMonth)}</span>
          </div>
          <div className="p-2 bg-indigo-50/50 border border-indigo-100/70 rounded-xl text-center shadow-3xs">
            <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wide block">Per Minggu</span>
            <span className="text-[11px] font-black text-slate-800 block mt-0.5">{formatRupiah(perWeek)}</span>
          </div>
          <div className="p-2 bg-indigo-50/50 border border-indigo-100/70 rounded-xl text-center shadow-3xs">
            <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wide block">Per Hari</span>
            <span className="text-[11px] font-black text-slate-800 block mt-0.5">{formatRupiah(perDay)}</span>
          </div>
        </div>

        {/* Contextual Tip */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 font-extrabold leading-relaxed shadow-3xs flex gap-2">
          <span>💡</span>
          <span>{tipText}</span>
        </div>
      </div>

    </div>
  );
}
