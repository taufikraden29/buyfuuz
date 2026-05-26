import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import type { Account } from '../../types/finance';

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  userName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ManageAccountsModal({
  isOpen,
  onClose,
  accounts,
  userName,
  showToast
}: ManageAccountsModalProps) {
  const queryClient = useQueryClient();

  // Local Form States
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'bank' | 'wallet' | 'cash'>('bank');

  // React Query Mutations
  const addAccountMutation = useMutation({
    mutationFn: api.addAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setNewAccName('');
      setNewAccType('bank');
      showToast('Dompet / Rekening baru berhasil ditambahkan! 💳', 'success');
    },
    onError: () => {
      showToast('Gagal menambahkan dompet/rekening.', 'error');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Dompet / Rekening berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus dompet/rekening.', 'error');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    // Auto-assign icons based on account type
    let assignedIcon = 'Wallet';
    if (newAccType === 'bank') assignedIcon = 'CreditCard';
    else if (newAccType === 'wallet') assignedIcon = 'Smartphone';

    addAccountMutation.mutate({
      name: newAccName,
      type: newAccType,
      icon: assignedIcon
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-955/85 border border-white/10 shadow-lg text-white flex items-center justify-center transition-all active:scale-90 z-55 cursor-pointer"
        title="Tutup"
      >
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">

        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-850">Kelola Dompet & Rekening</h3>
            <p className="text-xs text-slate-500 font-medium">Tambah atau atur dompet digital dan rekening bank {userName || 'Kak'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Add New Account Form */}
        <form onSubmit={handleSubmit} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Tambah Akun Baru</h4>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Nama Dompet / Rekening</label>
            <input
              type="text"
              required
              placeholder="Contoh: Bank BCA, OVO, Dompet Harian"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="w-full bg-white hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-semibold text-slate-800 shadow-3xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Tipe Akun</label>
            <select
              value={newAccType}
              onChange={(e) => setNewAccType(e.target.value as 'bank' | 'wallet' | 'cash')}
              className="w-full bg-white hover:bg-slate-100/50 focus:bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-bold text-slate-700 shadow-3xs cursor-pointer"
            >
              <option value="bank">Rekening Bank (ATM/M-Banking)</option>
              <option value="wallet">E-Wallet (GoPay, OVO, Dana, ShopeePay)</option>
              <option value="cash">Tunai (Cash Fisik / Saku)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={addAccountMutation.isPending}
            className="w-full py-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md border border-indigo-700 transition-all cursor-pointer"
          >
            {addAccountMutation.isPending ? 'Menyimpan...' : 'Tambah Dompet/Rekening'}
          </button>
        </form>

        {/* Accounts list */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">Daftar Dompet & Rekening Saat Ini</h4>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {accounts.map(acc => {
              const isSystem = ['acc-tunai', 'acc-bank', 'acc-gopay'].includes(acc.id);
              return (
                <div key={acc.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-3xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center flex-shrink-0 text-xs shadow-3xs">
                      <DynamicIcon name={acc.icon} size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-slate-700 block truncate">{acc.name}</span>
                      <span className="text-[9px] text-slate-555 font-bold uppercase block tracking-wider">
                        {acc.type === 'bank' ? 'Rekening Bank' : acc.type === 'wallet' ? 'E-Wallet' : 'Tunai (Cash)'}
                      </span>
                    </div>
                  </div>

                  {isSystem ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[8.5px] font-bold text-slate-500 uppercase tracking-wide">
                      Bawaan
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus dompet/rekening "${acc.name}"? Transaksi yang sudah dicatat dengan akun ini akan tetap aman.`)) {
                          deleteAccountMutation.mutate(acc.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Hapus Dompet/Rekening"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
