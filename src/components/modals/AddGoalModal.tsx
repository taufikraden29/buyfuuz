import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { getLivePreviewText, GOAL_TEMPLATES, cleanCurrencyString, formatCurrencyInput } from '../../utils/financeHelpers';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AddGoalModal({
  isOpen,
  onClose,
  userName,
  showToast
}: AddGoalModalProps) {
  const queryClient = useQueryClient();

  // Local Form States
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalColor, setGoalColor] = useState('bg-emerald-500');

  const resetForm = () => {
    setGoalTitle('');
    setGoalTarget('');
    setGoalColor('bg-emerald-500');
  };

  const addGoalMutation = useMutation({
    mutationFn: api.addSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
      onClose();
      showToast('Target tabungan baru ditambahkan! 🏆', 'success');
    },
    onError: () => {
      showToast('Gagal membuat target tabungan.', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget) return;

    addGoalMutation.mutate({
      title: goalTitle,
      targetAmount: Math.abs(Number(cleanCurrencyString(goalTarget))),
      color: goalColor,
    });
  };

  if (!isOpen) return null;

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
            <h3 className="text-sm font-black text-slate-850">Buat Target Tabungan</h3>
            <p className="text-xs text-slate-500 font-medium">Sisihkan dana untuk mimpi {userName || 'Kak'}</p>
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
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nama Target / Rencana</label>
            <input
              type="text"
              required
              placeholder="Contoh: Beli Laptop Baru, Liburan Jepang"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-semibold text-slate-800 shadow-2xs"
            />
            {/* Goal Title Templates */}
            <div className="flex flex-wrap gap-1.5 mt-2 animate-scale-in">
              {GOAL_TEMPLATES.map((tpl) => (
                <button
                  type="button"
                  key={tpl}
                  onClick={() => setGoalTitle(tpl)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/55 text-[11px] font-extrabold text-indigo-700 transition-all cursor-pointer hover:scale-102 active:scale-95 shadow-2xs"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Target Amount */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Target Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={goalTarget}
                onChange={(e) => setGoalTarget(formatCurrencyInput(e.target.value))}
                className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-250 transition-colors font-bold text-slate-700 shadow-2xs"
              />
            </div>
            {/* Dynamic Preview */}
            {goalTarget && (
              <div className="text-xs text-indigo-600 font-extrabold mt-1 text-right animate-scale-in">
                Format: {getLivePreviewText(goalTarget)}
              </div>
            )}
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">Pilih Warna Aksen</label>
            <div className="flex gap-3">
              {[
                { class: 'bg-emerald-500', name: 'Emerald' },
                { class: 'bg-indigo-500', name: 'Indigo' },
                { class: 'bg-pink-500', name: 'Pink' },
                { class: 'bg-amber-500', name: 'Amber' },
                { class: 'bg-purple-500', name: 'Purple' }
              ].map(c => (
                <button
                  type="button"
                  key={c.class}
                  onClick={() => setGoalColor(c.class)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${c.class} ${
                    goalColor === c.class ? 'ring-3 ring-indigo-200 scale-110 shadow-xs' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={addGoalMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 active:scale-98 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-indigo-150 border border-indigo-700 transition-all cursor-pointer"
          >
            {addGoalMutation.isPending ? 'Membuat...' : 'Buat Target'}
          </button>
        </form>

      </div>
    </div>
  );
}
