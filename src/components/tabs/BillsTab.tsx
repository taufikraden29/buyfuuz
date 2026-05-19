import { useState } from 'react';
import { Wallet, Coins, ArrowUpRight, ArrowDownRight, Calendar, RefreshCw, ChevronRight } from 'lucide-react';
import { formatRupiah, formatShortDate } from '../../utils/financeHelpers';
import type { Bill } from '../../types/finance';

interface BillsTabProps {
  bills: Bill[];
  loadingBills: boolean;
  setSelectedBillDetail: (b: Bill | null) => void;
}

export default function BillsTab({
  bills,
  loadingBills,
  setSelectedBillDetail
}: BillsTabProps) {
  // Local Filter State: default to 'debt' as requested
  const [billFilter, setBillFilter] = useState<'all' | 'debt' | 'receivable' | 'paid'>('debt');

  // Calculations
  const totalUnpaidDebt = bills
    .filter(b => b.type === 'debt' && b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalUnpaidReceivable = bills
    .filter(b => b.type === 'receivable' && b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  const filteredBills = bills.filter(b => {
    if (billFilter === 'all') return true;
    if (billFilter === 'debt') return b.type === 'debt' && b.status === 'unpaid';
    if (billFilter === 'receivable') return b.type === 'receivable' && b.status === 'unpaid';
    if (billFilter === 'paid') return b.status === 'paid';
    return true;
  });

  const sortedBills = [...filteredBills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const currentMonthYear = new Date().toISOString().split('-').slice(0, 2).join('-');
  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  const unpaidReceivableThisMonth = bills
    .filter(b => b.type === 'receivable' && b.status === 'unpaid' && b.dueDate.startsWith(currentMonthYear))
    .reduce((sum, b) => sum + b.amount, 0);

  const unpaidDebtThisMonth = bills
    .filter(b => b.type === 'debt' && b.status === 'unpaid' && b.dueDate.startsWith(currentMonthYear))
    .reduce((sum, b) => sum + b.amount, 0);

  const totalReceivableUnpaid = bills
    .filter(b => b.type === 'receivable' && b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalReceivablePaid = bills
    .filter(b => b.type === 'receivable' && b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalReceivableAll = totalReceivableUnpaid + totalReceivablePaid;
  const receivableCollectedPercent = totalReceivableAll > 0 
    ? Math.round((totalReceivablePaid / totalReceivableAll) * 100) 
    : 0;

  const totalDebtUnpaid = bills
    .filter(b => b.type === 'debt' && b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalDebtPaid = bills
    .filter(b => b.type === 'debt' && b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalDebtAll = totalDebtUnpaid + totalDebtPaid;
  const debtPaidPercent = totalDebtAll > 0 
    ? Math.round((totalDebtPaid / totalDebtAll) * 100) 
    : 0;

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-455">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Hutang Saya</span>
            <ArrowUpRight size={13} className="text-amber-500" />
          </div>
          <p className="text-sm font-black text-amber-700">{formatRupiah(totalUnpaidDebt)}</p>
          <p className="text-[10px] font-bold text-amber-500/80">Harus segera dibayar</p>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-455">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Piutang Saya</span>
            <ArrowDownRight size={13} className="text-emerald-500" />
          </div>
          <p className="text-sm font-black text-emerald-700">{formatRupiah(totalUnpaidReceivable)}</p>
          <p className="text-[10px] font-bold text-emerald-500/80">Harus segera ditagih</p>
        </div>
      </div>

      {/* Card Perhitungan Total Piutang */}
      {(billFilter === 'receivable' || billFilter === 'all') && (
        <div className="p-4 rounded-[22px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md relative overflow-hidden animate-scale-in">
          {/* Background decorative blobs */}
          <div className="absolute right-0 top-0 w-28 h-28 bg-white/10 rounded-full translate-x-8 -translate-y-8 blur-lg"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-md"></div>
          
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <Coins size={13} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black tracking-wide uppercase text-emerald-100">Kalkulasi Hak Piutang</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/10 text-[9px] font-black uppercase tracking-wider">
                Receivables Summary
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-[9px] font-bold text-emerald-200 block uppercase">Belum Lunas</span>
                <span className="text-[11px] font-extrabold text-white block mt-0.5">{formatRupiah(totalReceivableUnpaid)}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-[9px] font-bold text-emerald-200 block uppercase">Sudah Cair</span>
                <span className="text-[11px] font-extrabold text-emerald-100 block mt-0.5">{formatRupiah(totalReceivablePaid)}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-[9px] font-bold text-emerald-200 block uppercase">Total Piutang</span>
                <span className="text-[11px] font-extrabold text-white block mt-0.5">{formatRupiah(totalReceivableAll)}</span>
              </div>
            </div>

            {/* Progress Bar showing collected ratio */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-emerald-100">
                <span>Persentase Piutang Tertagih (Lunas)</span>
                <span>{receivableCollectedPercent}%</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${receivableCollectedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Perhitungan Total Hutang */}
      {(billFilter === 'debt' || billFilter === 'all') && (
        <div className="p-4 rounded-[22px] bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white shadow-md relative overflow-hidden animate-scale-in">
          {/* Background decorative blobs */}
          <div className="absolute right-0 top-0 w-28 h-28 bg-white/10 rounded-full translate-x-8 -translate-y-8 blur-lg"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-amber-500/20 rounded-full blur-md"></div>
          
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <Wallet size={13} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black tracking-wide uppercase text-amber-100">Kalkulasi Kewajiban Hutang</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/10 text-[9px] font-black uppercase tracking-wider">
                Debts Summary
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-[9px] font-bold text-amber-200 block uppercase">Belum Lunas</span>
                <span className="text-[11px] font-extrabold text-white block mt-0.5">{formatRupiah(totalDebtUnpaid)}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-[9px] font-bold text-amber-200 block uppercase">Sudah Lunas</span>
                <span className="text-[11px] font-extrabold text-amber-100 block mt-0.5">{formatRupiah(totalDebtPaid)}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="text-[9px] font-bold text-amber-200 block uppercase">Total Hutang</span>
                <span className="text-[11px] font-extrabold text-white block mt-0.5">{formatRupiah(totalDebtAll)}</span>
              </div>
            </div>

            {/* Progress Bar showing paid ratio */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-amber-100">
                <span>Persentase Hutang Terbayar (Lunas)</span>
                <span>{debtPaidPercent}%</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${debtPaidPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Focus Alert Card */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.03] border border-indigo-100/50 rounded-2xl flex items-center justify-between gap-3 shadow-3xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9.5 h-9.5 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center flex-shrink-0 animate-pulse-slow">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-extrabold text-indigo-500 uppercase tracking-wide">Fokus Jatuh Tempo ({currentMonthName})</span>
            <div className="flex items-center gap-3.5 mt-1">
              <div>
                <p className="text-[9.5px] font-bold text-slate-400">Piutang Cair</p>
                <p className="text-xs font-black text-emerald-600">{formatRupiah(unpaidReceivableThisMonth)}</p>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <p className="text-[9.5px] font-bold text-slate-400">Hutang Jatuh Tempo</p>
                <p className="text-xs font-black text-amber-600">{formatRupiah(unpaidDebtThisMonth)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-xl">
        {([
          { id: 'all', label: 'Semua' },
          { id: 'debt', label: 'Hutang' },
          { id: 'receivable', label: 'Piutang' },
          { id: 'paid', label: 'Lunas' }
        ] as const).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBillFilter(item.id)}
            className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              billFilter === item.id 
                ? 'bg-white text-indigo-600 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Bills Items List */}
      {loadingBills ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : sortedBills.length === 0 ? (
        <div className="p-8 bg-white border border-slate-100 rounded-[20px] text-center">
          <Wallet className="mx-auto text-slate-300 mb-2 animate-bounce" size={26} />
          <p className="text-xs text-slate-500 font-bold">Tidak ada catatan tagihan</p>
          <p className="text-xs text-slate-400 mt-0.5">Catat pinjaman atau tagihan bulanan untuk mulai memantau.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBills.map(b => {
            const isOverdue = b.status === 'unpaid' && new Date(b.dueDate) < new Date(new Date().toISOString().split('T')[0]);
            
            return (
              <div 
                key={b.id} 
                onClick={() => setSelectedBillDetail(b)}
                className={`p-3.5 bg-white border rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5 relative overflow-hidden ${
                  b.status === 'paid' 
                    ? 'border-slate-100 opacity-70' 
                    : b.type === 'debt'
                    ? 'border-l-4 border-l-amber-400 border-slate-100'
                    : 'border-l-4 border-l-emerald-400 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    b.status === 'paid'
                      ? 'bg-slate-100 text-slate-400'
                      : b.type === 'debt'
                      ? 'bg-amber-50 text-amber-500'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {b.type === 'debt' ? <Wallet size={18} /> : <Coins size={18} />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-700 truncate max-w-[150px] sm:max-w-xs">{b.title}</h4>
                      {b.isRecurring && (
                        <RefreshCw size={9.5} className="text-indigo-500 animate-spin-slow flex-shrink-0" />
                      )}
                      {b.isInstallment && (
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-650 text-[9px] font-extrabold tracking-wide border border-indigo-100/30 flex-shrink-0">
                          Cicilan {b.installmentNumber}/{b.installmentCount}
                        </span>
                      )}
                      {b.status === 'paid' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase flex-shrink-0">Lunas</span>
                      )}
                    </div>
                    
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-0.5 leading-tight">
                      <span className="font-medium">{b.type === 'debt' ? `Kepada: ${b.contactName}` : `Dari: ${b.contactName}`}</span>
                      {b.status === 'unpaid' ? (
                        <span className={`${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400 font-medium'}`}>
                          <span className="hidden sm:inline">•</span> Jatuh Tempo: {formatShortDate(b.dueDate)} {isOverdue && '⚠️ Terlambat'}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">
                          <span className="hidden sm:inline">•</span> Lunas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-1 flex items-center gap-2">
                  <span className={`text-xs font-black ${
                    b.status === 'paid' 
                      ? 'text-slate-400 line-through' 
                      : b.type === 'debt' 
                      ? 'text-amber-600' 
                      : 'text-emerald-600'
                  }`}>
                    {formatRupiah(b.amount)}
                  </span>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
