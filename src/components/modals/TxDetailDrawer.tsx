import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Copy } from 'lucide-react';
import { api, CATEGORIES } from '../../services/api';
import { formatRupiah } from '../../utils/financeHelpers';
import type { Transaction } from '../../types/finance';

interface TxDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTx: Transaction | null;
  userName: string;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function TxDetailDrawer({
  isOpen,
  onClose,
  selectedTx,
  userName,
  openConfirm,
  showToast
}: TxDetailDrawerProps) {
  const queryClient = useQueryClient();

  const deleteTxMutation = useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      onClose();
      showToast('Transaksi berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus transaksi.', 'error');
    }
  });

  if (!isOpen || !selectedTx) return null;

  const category = CATEGORIES.find(c => c.id === selectedTx.categoryId);

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
            <h3 className="text-sm font-black text-slate-850">Detail Transaksi</h3>
            <p className="text-xs text-slate-500 font-medium">Informasi lengkap transaksi {userName || 'Kak'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-3.5 text-xs text-slate-800">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Kategori</span>
              <div className="flex items-center gap-1.5 font-extrabold">
                <span className={`w-2.5 h-2.5 rounded-full ${category?.color.split(' ')[0] || 'bg-slate-200'}`}></span>
                <span>{category?.name || 'Lain-lain'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Nominal Uang</span>
              <div className="flex items-center gap-2">
                <span className={`font-black text-sm ${selectedTx.type === 'income' ? 'text-emerald-700' : 'text-slate-850'}`}>
                  {selectedTx.type === 'income' ? '+' : '-'}{formatRupiah(selectedTx.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTx.amount.toString());
                    showToast('Nominal transaksi berhasil disalin! 📋', 'success');
                  }}
                  className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 hover:text-indigo-650 text-slate-500 transition-all active:scale-90 cursor-pointer flex items-center justify-center shadow-3xs"
                  title="Salin Nominal Transaksi"
                >
                  <Copy size={11} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Waktu Pencatatan</span>
              <span className="font-extrabold text-slate-700">
                {new Date(selectedTx.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="py-1.5">
            <span className="text-slate-500 block mb-1 font-bold">Catatan Kecil</span>
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed italic">
              {selectedTx.notes || 'Tidak ada catatan tambahan untuk transaksi ini.'}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                openConfirm(
                  'Hapus Transaksi',
                  `Apakah ${userName || 'Kak'} yakin ingin menghapus pencatatan "${selectedTx.title}" sebesar ${formatRupiah(selectedTx.amount)}? Tindakan ini tidak dapat dibatalkan.`,
                  () => deleteTxMutation.mutate(selectedTx.id)
                );
              }}
              disabled={deleteTxMutation.isPending}
              className="py-2.5 px-4 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-755 text-white shadow-md border border-rose-700 flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:bg-slate-350"
            >
              <Trash2 size={13} />
              {deleteTxMutation.isPending ? 'Menghapus...' : 'Hapus Transaksi'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
