import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Copy, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/financeHelpers';
import type { Bill, Transaction, Account } from '../../types/finance';

interface BillDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBillDetail: Bill | null;
  accounts: Account[];
  transactions: Transaction[];
  userName: string;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function BillDetailDrawer({
  isOpen,
  onClose,
  selectedBillDetail,
  accounts,
  transactions,
  userName,
  openConfirm,
  showToast
}: BillDetailDrawerProps) {
  const queryClient = useQueryClient();

  const [drawerPayMonthsCount, setDrawerPayMonthsCount] = useState(1);
  const [settleAccountId, setSettleAccountId] = useState('acc-bank');

  // Compute account balances
  const accountBalances = useMemo(() => {
    return accounts.map(acc => {
      const accountTxs = transactions.filter(t => t.accountId === acc.id || (!t.accountId && acc.id === 'acc-tunai'));
      const income = accountTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = accountTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { ...acc, balance: income - expense };
    });
  }, [accounts, transactions]);

  const settleAmount = selectedBillDetail
    ? selectedBillDetail.amount * (selectedBillDetail.isInstallment && selectedBillDetail.status === 'unpaid' ? drawerPayMonthsCount : 1)
    : 0;

  const eligibleAccounts = useMemo(() => {
    if (!selectedBillDetail) return [];
    return selectedBillDetail.type === 'debt'
      ? accountBalances.filter(ab => ab.balance >= settleAmount)
      : accountBalances;
  }, [selectedBillDetail, accountBalances, settleAmount]);

  const computedSettleAccountId = eligibleAccounts.some(acc => acc.id === settleAccountId)
    ? settleAccountId
    : (eligibleAccounts[0]?.id || 'acc-bank');

  // React Query Mutations
  const updateBillStatusMutation = useMutation({
    mutationFn: ({ id, status, payMonthsCount, accountId }: { id: string; status: 'unpaid' | 'paid'; payMonthsCount?: number; accountId?: string }) =>
      api.updateBillStatus(id, status, payMonthsCount, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onClose();
      showToast('Status tagihan diperbarui! 🎯', 'success');
    },
    onError: () => {
      showToast('Gagal memperbarui status tagihan.', 'error');
    }
  });

  const deleteBillMutation = useMutation({
    mutationFn: api.deleteBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      onClose();
      showToast('Catatan tagihan berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus tagihan.', 'error');
    }
  });

  if (!isOpen || !selectedBillDetail) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
      {/* Floating Close Button above the card */}
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
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase inline-block mb-1.5 ${selectedBillDetail.status === 'paid'
              ? 'bg-slate-100 text-slate-600 border border-slate-200'
              : selectedBillDetail.type === 'debt'
                ? 'bg-amber-50 text-amber-700 border border-amber-250'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
              }`}>
              {selectedBillDetail.type === 'debt' ? 'Hutang Saya' : 'Piutang Saya'}
            </span>
            <h3 className="text-sm font-black text-slate-850">{selectedBillDetail.title}</h3>
            <p className="text-[10px] text-slate-550 font-medium mt-0.5">Detail tagihan {userName || 'Kak'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-800">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Status Pembayaran</span>
            <span className={`font-black uppercase text-[10px] ${selectedBillDetail.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {selectedBillDetail.status === 'paid' ? 'Lunas 🎉' : 'Belum Lunas'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Nominal Uang</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-850">{formatRupiah(selectedBillDetail.amount)}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedBillDetail.amount.toString());
                  showToast('Nominal berhasil disalin! 📋', 'success');
                }}
                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 hover:text-indigo-650 text-slate-500 transition-all active:scale-90 cursor-pointer flex items-center justify-center shadow-3xs"
                title="Salin Nominal"
              >
                <Copy size={11} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Kontak</span>
            <span className="font-extrabold text-slate-800">{selectedBillDetail.contactName}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Tanggal Jatuh Tempo</span>
            <span className="font-extrabold text-slate-800">
              {new Date(selectedBillDetail.dueDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {selectedBillDetail.isRecurring && (
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Tipe Pengulangan</span>
              <span className="font-black text-indigo-700 flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin-slow" />
                Berulang Bulanan
              </span>
            </div>
          )}

          {selectedBillDetail.isInstallment && (
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Tipe Pembayaran</span>
              <span className="font-black text-indigo-700">
                Angsuran ({selectedBillDetail.installmentNumber}/{selectedBillDetail.installmentCount})
              </span>
            </div>
          )}

          <div className="py-1">
            <span className="text-slate-500 block mb-1 font-bold">Catatan Kecil</span>
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed italic">
              {selectedBillDetail.notes || 'Tidak ada catatan tambahan untuk tagihan ini.'}
            </p>
          </div>

          {selectedBillDetail.isInstallment && selectedBillDetail.status === 'unpaid' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 my-2 shadow-3xs">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Jumlah Bulan yang Dibayar</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: selectedBillDetail.installmentCount! - selectedBillDetail.installmentNumber! + 1 }, (_, index) => index + 1).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDrawerPayMonthsCount(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${drawerPayMonthsCount === m
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-extrabold'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                  >
                    {m === (selectedBillDetail.installmentCount! - selectedBillDetail.installmentNumber! + 1) ? `Semua (${m} Bln)` : `${m} Bulan`}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-200/50">
                <span className="text-slate-550 font-black">Total Pembayaran:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-indigo-700 text-xs">
                    {formatRupiah(selectedBillDetail.amount * drawerPayMonthsCount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText((selectedBillDetail.amount * drawerPayMonthsCount).toString());
                      showToast('Total nominal berhasil disalin! 📋', 'success');
                    }}
                    className="p-1 rounded-md hover:bg-slate-100 hover:text-indigo-700 text-slate-500 transition-all active:scale-90 cursor-pointer flex items-center justify-center shadow-3xs"
                    title="Salin Total Pembayaran"
                  >
                    <Copy size={10} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedBillDetail.status === 'unpaid' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 my-2 shadow-3xs animate-scale-in">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">
                {selectedBillDetail.type === 'debt' ? 'Bayar dengan (Sumber Dana)' : 'Terima ke (Akun Penerima)'}
              </span>
              {selectedBillDetail.type === 'debt' && eligibleAccounts.length === 0 ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-extrabold flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Tidak ada rekening/dompet dengan saldo cukup ({formatRupiah(settleAmount)}) untuk membayar tagihan ini. Silakan isi saldo terlebih dahulu.
                  </span>
                </div>
              ) : (
                <select
                  value={computedSettleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full bg-white hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-extrabold text-slate-700 shadow-3xs cursor-pointer"
                >
                  {eligibleAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Saldo: {formatRupiah(acc.balance)})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                const newStatus = selectedBillDetail.status === 'paid' ? 'unpaid' : 'paid';
                updateBillStatusMutation.mutate({
                  id: selectedBillDetail.id,
                  status: newStatus,
                  payMonthsCount: newStatus === 'paid' ? drawerPayMonthsCount : undefined,
                  accountId: newStatus === 'paid' ? computedSettleAccountId : undefined
                });
              }}
              disabled={selectedBillDetail.status === 'unpaid' && selectedBillDetail.type === 'debt' && eligibleAccounts.length === 0}
              className={`w-full py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-md border flex items-center justify-center gap-1.5 cursor-pointer ${selectedBillDetail.status === 'paid'
                ? 'bg-amber-600 hover:bg-amber-755 text-white border-amber-700 shadow-amber-150'
                : selectedBillDetail.type === 'debt' && eligibleAccounts.length === 0
                  ? 'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-755 text-white border-emerald-700 shadow-emerald-150'
                }`}
            >
              <CheckCircle2 size={13} />
              {selectedBillDetail.status === 'paid' ? 'Tandai Belum Lunas' : 'Tandai Lunas & Selesai'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  openConfirm(
                    'Hapus Catatan',
                    `Apakah Anda yakin ingin menghapus catatan tagihan "${selectedBillDetail.title}"?`,
                    () => deleteBillMutation.mutate(selectedBillDetail.id)
                  );
                }}
                className="py-2.5 px-4 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-755 text-white shadow-md border border-rose-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                Hapus
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
