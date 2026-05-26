import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah, getLivePreviewText, cleanCurrencyString, formatCurrencyInput } from '../../utils/financeHelpers';
import type { SavingsGoal } from '../../types/finance';

interface GoalFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGoal: SavingsGoal | null;
  fundType: 'add' | 'withdraw';
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function GoalFundModal({
  isOpen,
  onClose,
  selectedGoal,
  fundType,
  showToast
}: GoalFundModalProps) {
  const queryClient = useQueryClient();
  const [fundAmount, setFundAmount] = useState('');

  const resetForm = () => {
    setFundAmount('');
  };

  const updateGoalProgressMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.addSavingsProgress(id, amount),
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
      onClose();
      const dirText = fundType === 'add' ? 'ditabung' : 'ditarik';
      showToast(`Dana berhasil ${dirText}! 💰`, 'success');

      // If 100% completed, celebrate
      if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
        showToast(`Selamat! Target "${updatedGoal.title}" tercapai! 🎉`, 'success');
      }
    },
    onError: () => {
      showToast('Gagal memperbarui dana tabungan.', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !fundAmount) return;

    const cleanAmt = Math.abs(Number(cleanCurrencyString(fundAmount)));
    const amt = cleanAmt * (fundType === 'add' ? 1 : -1);

    // Validation: make sure withdraw amount doesn't exceed current amount
    if (fundType === 'withdraw' && Math.abs(amt) > selectedGoal.currentAmount) {
      showToast('Penarikan dana melebihi tabungan saat ini!', 'error');
      return;
    }

    updateGoalProgressMutation.mutate({
      id: selectedGoal.id,
      amount: amt
    });
  };

  if (!isOpen || !selectedGoal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
      {/* Floating Close Button above the card */}
      <button
        type="button"
        onClick={() => {
          resetForm();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/80 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 z-55 cursor-pointer"
        title="Tutup"
      >
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">

        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-850">
              {fundType === 'add' ? 'Tabung Uang' : 'Tarik Uang'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Target: {selectedGoal.title}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nominal Uang</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={fundAmount}
                onChange={(e) => setFundAmount(formatCurrencyInput(e.target.value))}
                className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-bold text-slate-800 shadow-2xs"
              />
            </div>
            {/* Dynamic Preview */}
            {fundAmount && (
              <div className="text-xs text-indigo-650 font-extrabold mt-1 text-right animate-scale-in">
                Format: {getLivePreviewText(fundAmount)}
              </div>
            )}
            <p className="text-xs text-slate-500 font-semibold mt-2">
              Saldo tabungan saat ini: <span className="font-extrabold text-slate-700">{formatRupiah(selectedGoal.currentAmount)}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={updateGoalProgressMutation.isPending}
            className={`w-full py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md border transition-all cursor-pointer ${
              fundType === 'add'
                ? 'bg-emerald-600 hover:bg-emerald-755 border-emerald-700 shadow-emerald-150'
                : 'bg-rose-600 hover:bg-rose-755 border-rose-700 shadow-rose-150'
            }`}
          >
            {updateGoalProgressMutation.isPending
              ? 'Memproses...'
              : fundType === 'add' ? 'Konfirmasi Tabung' : 'Konfirmasi Tarik'
            }
          </button>
        </form>

      </div>
    </div>
  );
}
