import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Calendar } from 'lucide-react';
import { api, CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import { getLivePreviewText, TITLE_TEMPLATES, cleanCurrencyString, formatCurrencyInput, formatRupiah } from '../../utils/financeHelpers';
import type { Account, Transaction } from '../../types/finance';

interface AddTxModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AddTxModal({
  isOpen,
  onClose,
  accounts,
  showToast
}: AddTxModalProps) {
  const queryClient = useQueryClient();

  // Fetch transactions to compute balances
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  });

  // Calculate current balances for all accounts
  const accountBalances = useMemo(() => {
    return accounts.map(acc => {
      const accountTxs = transactions.filter(t => t.accountId === acc.id || (!t.accountId && acc.id === 'acc-tunai'));
      const income = accountTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = accountTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { ...acc, balance: income - expense };
    });
  }, [accounts, transactions]);

  // Local Form States
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [txCategory, setTxCategory] = useState('cat-makanan');
  const [txAmount, setTxAmount] = useState('');
  const [txTitle, setTxTitle] = useState('');
  const [txAccount, setTxAccount] = useState('acc-tunai');
  const [txTargetAccount, setTxTargetAccount] = useState('acc-bank');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');

  const resetForm = () => {
    setTxTitle('');
    setTxAmount('');
    setTxType('expense');
    setTxCategory('cat-makanan');
    setTxAccount('acc-tunai');
    setTxTargetAccount('acc-bank');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
  };

  const addTxMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      amount: number;
      type: 'expense' | 'income' | 'transfer';
      categoryId: string;
      accountId: string;
      targetAccountId?: string;
      date: string;
      notes?: string;
    }) => {
      if (data.type === 'transfer') {
        if (!data.targetAccountId) throw new Error('Target account is required for transfer');
        const sourceAcc = accounts.find(a => a.id === data.accountId);
        const targetAcc = accounts.find(a => a.id === data.targetAccountId);
        const sourceName = sourceAcc ? sourceAcc.name : 'Rekening Asal';
        const targetName = targetAcc ? targetAcc.name : 'Rekening Tujuan';
        const transferId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Pair 1: Outgoing (Expense) from Source Account
        await api.addTransaction({
          title: `Transfer ke ${targetName}`,
          amount: data.amount,
          type: 'expense',
          categoryId: 'cat-transfer',
          accountId: data.accountId,
          date: data.date,
          notes: data.notes ? `[Transfer] ${data.notes}` : `Transfer dana ke ${targetName}`,
          transferId
        });

        // Pair 2: Incoming (Income) to Target Account
        return await api.addTransaction({
          title: `Transfer dari ${sourceName}`,
          amount: data.amount,
          type: 'income',
          categoryId: 'cat-transfer',
          accountId: data.targetAccountId,
          date: data.date,
          notes: data.notes ? `[Transfer] ${data.notes}` : `Transfer dana dari ${sourceName}`,
          transferId
        });
      } else {
        return api.addTransaction({
          title: data.title,
          amount: data.amount,
          type: data.type as 'expense' | 'income',
          categoryId: data.categoryId,
          accountId: data.accountId,
          date: data.date,
          notes: data.notes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      resetForm();
      onClose();
      showToast('Transaksi berhasil dicatat! 📝', 'success');
    },
    onError: () => {
      showToast('Gagal menambahkan transaksi.', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount) return;

    addTxMutation.mutate({
      title: txTitle,
      amount: Math.abs(Number(cleanCurrencyString(txAmount))),
      type: txType,
      categoryId: txType === 'transfer' ? 'cat-transfer' : txCategory,
      accountId: txAccount,
      targetAccountId: txType === 'transfer' ? txTargetAccount : undefined,
      date: txDate,
      notes: txNotes || undefined,
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
            <h3 className="text-sm font-extrabold text-slate-800">Catat Transaksi Baru</h3>
            <p className="text-xs text-slate-555">Atur uang masuk dan keluar dengan cermat</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Transaction Type Tab */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setTxCategory('cat-makanan');
              }}
              className={`py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                txType === 'expense'
                  ? 'bg-white text-rose-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setTxCategory('cat-gaji');
              }}
              className={`py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                txType === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('transfer');
                setTxCategory('cat-transfer');
                // Ensure default target account is not the same as source account
                const defaultTarget = accounts.find(a => a.id !== txAccount)?.id || '';
                setTxTargetAccount(defaultTarget);
              }}
              className={`py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                txType === 'transfer'
                  ? 'bg-white text-indigo-650 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Jumlah Uang</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={txAmount}
                onChange={(e) => setTxAmount(formatCurrencyInput(e.target.value))}
                className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-bold text-slate-700 shadow-2xs"
              />
            </div>
            {/* Dynamic Rupiah Preview */}
            {txAmount && (
              <div className="text-xs text-indigo-600 font-extrabold mt-1 text-right animate-scale-in">
                Format: {getLivePreviewText(txAmount)}
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Judul / Keperluan</label>
            <input
              type="text"
              required
              placeholder={txType === 'transfer' ? 'Contoh: Transfer bulanan, topup Gopay, dst.' : 'Contoh: Makan Ramen, Gaji Pokok, dst.'}
              value={txTitle}
              onChange={(e) => setTxTitle(e.target.value)}
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-semibold text-slate-800 shadow-2xs"
            />
            {/* Title Templates */}
            {txType !== 'transfer' && (
              <div className="flex flex-wrap gap-1.5 mt-2 animate-scale-in">
                {(TITLE_TEMPLATES[txCategory] || []).map((tpl) => (
                  <button
                    type="button"
                    key={tpl}
                    onClick={() => setTxTitle(tpl)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-[11px] font-extrabold text-indigo-700 transition-all cursor-pointer hover:scale-102 active:scale-95 shadow-2xs"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Grid Picker */}
          {txType !== 'transfer' && (
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Kategori</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.filter(c =>
                  c.id !== 'cat-transfer' && (
                    txType === 'income'
                      ? c.type === 'income' || c.type === 'both'
                      : c.type === 'expense' || c.type === 'both'
                  )
                ).map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setTxCategory(c.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      txCategory === c.id
                        ? 'bg-indigo-50 border-indigo-300 scale-102 ring-1 ring-indigo-200 shadow-2xs font-extrabold'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8.5 h-8.5 rounded-lg ${c.color} flex items-center justify-center flex-shrink-0 text-xs shadow-3xs`}>
                      {c.icon && <DynamicIcon name={c.icon} size={15} />}
                    </div>
                    <span className="text-[11px] font-black text-slate-700 truncate max-w-full">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className={txType === 'transfer' ? 'grid grid-cols-2 gap-3.5' : ''}>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                {txType === 'transfer' ? 'Rekening Asal' : 'Metode Pembayaran (Dompet/Rekening)'}
              </label>
              <select
                value={txAccount}
                onChange={(e) => {
                  const newSource = e.target.value;
                  setTxAccount(newSource);
                  if (txType === 'transfer' && txTargetAccount === newSource) {
                    const remaining = accountBalances.filter(a => a.id !== newSource);
                    if (remaining.length > 0) {
                      setTxTargetAccount(remaining[0].id);
                    }
                  }
                }}
                className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-extrabold text-slate-700 shadow-2xs cursor-pointer"
              >
                {accountBalances.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatRupiah(acc.balance)})
                  </option>
                ))}
              </select>
              {/* Show selected source balance */}
              {(() => {
                const selectedAcc = accountBalances.find(ab => ab.id === txAccount);
                if (!selectedAcc) return null;
                return (
                  <div className="text-[10px] text-slate-500 font-extrabold mt-1.5 ml-1 flex justify-between animate-fade-in">
                    <span>Saldo Asal:</span>
                    <span className={selectedAcc.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}>
                      {formatRupiah(selectedAcc.balance)}
                    </span>
                  </div>
                );
              })()}
            </div>

            {txType === 'transfer' && (
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Rekening Tujuan</label>
                <select
                  value={txTargetAccount}
                  onChange={(e) => setTxTargetAccount(e.target.value)}
                  className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-extrabold text-slate-700 shadow-2xs cursor-pointer"
                >
                  {accountBalances.filter(a => a.id !== txAccount).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
                {/* Show selected target balance */}
                {(() => {
                  const selectedAcc = accountBalances.find(ab => ab.id === txTargetAccount);
                  if (!selectedAcc) return null;
                  return (
                    <div className="text-[10px] text-slate-500 font-extrabold mt-1.5 ml-1 flex justify-between animate-fade-in">
                      <span>Saldo Tujuan:</span>
                      <span className={selectedAcc.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}>
                        {formatRupiah(selectedAcc.balance)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Date Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Tanggal</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-extrabold text-slate-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
            <textarea
              placeholder="Tambahkan detail catatan kecil..."
              value={txNotes}
              onChange={(e) => setTxNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-medium text-slate-800 resize-none shadow-2xs"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={addTxMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 active:scale-98 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-indigo-150 border border-indigo-700 transition-all cursor-pointer"
          >
            {addTxMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>

      </div>
    </div>
  );
}
