import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { getLivePreviewText, BILL_TEMPLATES, formatRupiah, cleanCurrencyString, formatCurrencyInput } from '../../utils/financeHelpers';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AddBillModal({
  isOpen,
  onClose,
  userName,
  showToast
}: AddBillModalProps) {
  const queryClient = useQueryClient();

  // Local Form States
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billType, setBillType] = useState<'debt' | 'receivable'>('debt');
  const [billContact, setBillContact] = useState('');
  const [billDueDate, setBillDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [billIsRecurring, setBillIsRecurring] = useState(false);
  const [billIsInstallment, setBillIsInstallment] = useState(false);
  const [billInstallmentsCount, setBillInstallmentsCount] = useState('3');
  const [billNotes, setBillNotes] = useState('');

  const resetForm = () => {
    setBillTitle('');
    setBillAmount('');
    setBillType('debt');
    setBillContact('');
    setBillDueDate(new Date().toISOString().split('T')[0]);
    setBillNotes('');
    setBillIsRecurring(false);
    setBillIsInstallment(false);
    setBillInstallmentsCount('3');
  };

  const addBillMutation = useMutation({
    mutationFn: api.addBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      resetForm();
      onClose();
      showToast('Tagihan berhasil dicatat! 💸', 'success');
    },
    onError: () => {
      showToast('Gagal mencatat tagihan.', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle.trim() || !billAmount || !billContact.trim()) return;

    addBillMutation.mutate({
      title: billTitle,
      amount: Math.abs(Number(cleanCurrencyString(billAmount))),
      type: billType,
      contactName: billContact,
      dueDate: billDueDate,
      status: 'unpaid',
      isRecurring: billIsRecurring,
      isInstallment: billIsInstallment,
      installmentCount: billIsInstallment ? Number(billInstallmentsCount) : undefined,
      notes: billNotes || undefined
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
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-955/85 border border-white/10 shadow-lg text-white flex items-center justify-center transition-all active:scale-90 z-55 cursor-pointer"
        title="Tutup"
      >
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">

        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-850">Catat Tagihan / Piutang</h3>
            <p className="text-xs text-slate-500 font-medium">Kelola kewajiban bayar dan hak tagih {userName || 'Kak'}</p>
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
          {/* Bill Type Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 border border-slate-200/30 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setBillType('debt');
                setBillIsRecurring(false);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                billType === 'debt'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Hutang (Saya Berhutang)
            </button>
            <button
              type="button"
              onClick={() => {
                setBillType('receivable');
                setBillIsRecurring(false);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                billType === 'receivable'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Piutang (Teman Berhutang)
            </button>
          </div>

          {/* Contact Name */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nama Kontak (Orang / Lembaga)</label>
            <input
              type="text"
              required
              placeholder={billType === 'debt' ? 'Contoh: Bu Kos, Indihome' : 'Contoh: Andi, Rian'}
              value={billContact}
              onChange={(e) => setBillContact(e.target.value)}
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-semibold shadow-2xs text-slate-850"
            />
          </div>

          {/* Title Templates Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Template Judul</label>
            <div className="flex flex-wrap gap-1.5">
              {BILL_TEMPLATES[billType].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBillTitle(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${
                    billTitle === t
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-550'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Keterangan / Deskripsi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Bayar Listrik Bulanan"
              value={billTitle}
              onChange={(e) => setBillTitle(e.target.value)}
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-semibold shadow-2xs text-slate-850"
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Jumlah Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={billAmount}
                onChange={(e) => setBillAmount(formatCurrencyInput(e.target.value))}
                className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-bold text-slate-800 shadow-2xs"
              />
            </div>
            {/* Live Rupiah Preview */}
            {billAmount && (
              <span className="text-xs text-indigo-600 font-extrabold mt-1 block px-1 animate-scale-in">
                {getLivePreviewText(billAmount)}
              </span>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Tanggal Jatuh Tempo</label>
            <input
              type="date"
              required
              value={billDueDate}
              onChange={(e) => setBillDueDate(e.target.value)}
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-extrabold text-slate-700 shadow-2xs"
            />
          </div>

          {/* Recurring Monthly Toggler */}
          {!billIsInstallment && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-3xs">
              <div>
                <span className="text-xs font-bold text-slate-750 block">Ulangi Setiap Bulan</span>
                <span className="text-[11px] text-slate-500 font-medium">Tagihan baru otomatis terbit untuk bulan depan setelah lunas</span>
              </div>
              <button
                type="button"
                onClick={() => setBillIsRecurring(!billIsRecurring)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
                  billIsRecurring ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                    billIsRecurring ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Installment / Paylater Toggler */}
          {!billIsRecurring && (
            <div className="space-y-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 block">Angsuran / Cicilan (Paylater)</span>
                  <span className="text-[11px] text-slate-500 font-medium">Pecah nominal menjadi beberapa cicilan bulanan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillIsInstallment(!billIsInstallment)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
                    billIsInstallment ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                      billIsInstallment ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {billIsInstallment && (
                <div className="pt-3.5 border-t border-slate-200 space-y-3 animate-scale-in">
                  <div>
                    <label className="text-[11px] font-black text-slate-500 block mb-1.5 uppercase tracking-wider">Jumlah Angsuran (Bulan)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['3', '6', '12', '24'].map(months => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setBillInstallmentsCount(months)}
                          className={`py-1.5 text-xs font-black rounded-lg transition-all border cursor-pointer ${
                            billInstallmentsCount === months
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {months}x
                        </button>
                      ))}
                    </div>

                    {/* Manual Input for Custom Installments Count */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">Atau Isi Manual:</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          placeholder="Contoh: 5, 8, 10"
                          value={!['3', '6', '12', '24'].includes(billInstallmentsCount) ? billInstallmentsCount : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBillInstallmentsCount(val);
                          }}
                          className="w-full bg-white hover:bg-slate-55 focus:bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-105 transition-colors font-bold text-slate-700 shadow-2xs"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">bulan</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-655 pt-2 border-t border-dashed border-slate-200">
                    <span className="font-medium">Estimasi Angsuran / Bulan:</span>
                    <span className="font-black text-indigo-700">
                      {billAmount && Number(billInstallmentsCount) > 0
                        ? formatRupiah(Math.round(Number(cleanCurrencyString(billAmount)) / Number(billInstallmentsCount)))
                        : 'Rp 0'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
            <textarea
              placeholder="Tulis detail tambahan jika diperlukan..."
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-semibold shadow-2xs text-slate-850"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={addBillMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 border border-indigo-700 disabled:bg-slate-350 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-150 active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {addBillMutation.isPending ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </form>
      </div>
    </div>
  );
}
