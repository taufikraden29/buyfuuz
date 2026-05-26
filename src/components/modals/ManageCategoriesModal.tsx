import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2 } from 'lucide-react';
import { api, CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  userName,
  showToast
}: ManageCategoriesModalProps) {
  const queryClient = useQueryClient();

  // Local Form States
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('indigo');
  const [newCatIcon, setNewCatIcon] = useState('Bookmark');

  // React Query Mutations
  const addCategoryMutation = useMutation({
    mutationFn: api.addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setNewCatName('');
      showToast('Kategori kustom baru berhasil ditambahkan! 🏷️', 'success');
    },
    onError: () => {
      showToast('Gagal menambahkan kategori.', 'error');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('Kategori kustom berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus kategori.', 'error');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const colorMap: Record<string, { class: string, hex: string }> = {
      emerald: { class: 'bg-emerald-50 text-emerald-600 border border-emerald-250', hex: '#10b981' },
      indigo: { class: 'bg-indigo-50 text-indigo-500 border border-indigo-250', hex: '#6366f1' },
      rose: { class: 'bg-rose-50 text-rose-500 border border-rose-250', hex: '#f43f5e' },
      amber: { class: 'bg-amber-50 text-amber-500 border border-amber-250', hex: '#f59e0b' },
      purple: { class: 'bg-purple-50 text-purple-500 border border-purple-250', hex: '#a855f7' },
      sky: { class: 'bg-sky-50 text-sky-500 border border-sky-250', hex: '#0ea5e9' }
    };

    const selectedColorKey = newCatColor || 'indigo';
    const mapped = colorMap[selectedColorKey] || colorMap.indigo;

    addCategoryMutation.mutate({
      name: newCatName,
      type: newCatType,
      color: mapped.class,
      hexColor: mapped.hex,
      icon: newCatIcon
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
            <h3 className="text-sm font-black text-slate-850">Kelola Kategori</h3>
            <p className="text-xs text-slate-500 font-medium">Tambah atau atur kategori transaksi {userName || 'Kak'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Add New Category Form */}
        <form onSubmit={handleSubmit} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Tambah Kategori Baru</h4>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Nama Kategori</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pendidikan, Listrik, dst."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-white hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-semibold text-slate-800 shadow-3xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Tipe Transaksi</label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as 'expense' | 'income')}
                className="w-full bg-white hover:bg-slate-100/50 focus:bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-bold text-slate-700 shadow-3xs cursor-pointer"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Warna Aksen</label>
              <select
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-full bg-white hover:bg-slate-100/50 focus:bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-bold text-slate-700 shadow-3xs cursor-pointer"
              >
                <option value="indigo">Indigo (Ungu Biru)</option>
                <option value="emerald">Emerald (Hijau)</option>
                <option value="rose">Rose (Merah Muda)</option>
                <option value="amber">Amber (Kuning/Oranye)</option>
                <option value="purple">Purple (Ungu)</option>
                <option value="sky">Sky (Biru Langit)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Pilih Ikon</label>
            <div className="grid grid-cols-6 gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-3xs max-h-[92px] overflow-y-auto">
              {[
                'Bookmark', 'Briefcase', 'GraduationCap', 'Home', 'Gamepad', 'Gift',
                'HeartPulse', 'Coins', 'Car', 'Utensils', 'ShoppingBag', 'Sparkles',
                'HelpCircle', 'Receipt', 'Tv', 'Plane', 'TrendingUp'
              ].map(iconName => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setNewCatIcon(iconName)}
                  className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${newCatIcon === iconName
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-3xs scale-105'
                    : 'hover:bg-slate-50 border-transparent text-slate-500'
                    }`}
                  title={iconName}
                >
                  <DynamicIcon name={iconName} size={14} />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={addCategoryMutation.isPending}
            className="w-full py-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md border border-indigo-700 transition-all cursor-pointer"
          >
            {addCategoryMutation.isPending ? 'Menyimpan...' : 'Tambah Kategori'}
          </button>
        </form>

        {/* Categories list */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">Daftar Kategori Saat Ini</h4>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {CATEGORIES.map(c => {
              const isSystem = ['cat-makanan', 'cat-belanja', 'cat-transport', 'cat-hiburan', 'cat-tagihan', 'cat-kesehatan', 'cat-gaji', 'cat-investasi', 'cat-lainnya'].includes(c.id);
              return (
                <div key={c.id} className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-3xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7.5 h-7.5 rounded-lg ${c.color.split(' ')[0] || 'bg-slate-100'} flex items-center justify-center flex-shrink-0 text-xs shadow-3xs`}>
                      <DynamicIcon name={c.icon} size={13} className={c.color.split(' ')[1] || 'text-slate-600'} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-slate-700 block truncate">{c.name}</span>
                      <span className="text-[9px] text-slate-550 font-bold uppercase block tracking-wider">
                        {c.type === 'both' ? 'Pemasukan & Pengeluaran' : c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </div>
                  </div>

                  {!isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus kategori "${c.name}"? Transaksi yang sudah terdaftar dengan kategori ini akan tetap aman.`)) {
                          deleteCategoryMutation.mutate(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Hapus Kategori"
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
