import { useState } from 'react';
import { Plus, Wallet, Coins, ArrowUpRight, ArrowDownRight, Calendar, RefreshCw, ChevronRight } from 'lucide-react';
import { formatRupiah, formatShortDate } from '../../utils/financeHelpers';
import type { Bill } from '../../types/finance';

interface BillsTabProps {
  bills: Bill[];
  loadingBills: boolean;
  setSelectedBillDetail: (b: Bill | null) => void;
  setShowAddBillModal: (show: boolean) => void;
}

export default function BillsTab({
  bills,
  loadingBills,
  setSelectedBillDetail,
  setShowAddBillModal
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

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-slate-800">Tagihan & Piutang</h2>
          <p className="text-[11px] text-slate-400 font-medium">Pantau hutang piutang dan jatuh tempo</p>
        </div>
        <button 
          onClick={() => setShowAddBillModal(true)}
          className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-650 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
        >
          <Plus size={11} strokeWidth={2.5} />
          <span>Catat Tagihan</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-455">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Hutang Saya</span>
            <ArrowUpRight size={13} className="text-amber-500" />
          </div>
          <p className="text-sm font-black text-amber-700">{formatRupiah(totalUnpaidDebt)}</p>
          <p className="text-[8px] font-bold text-amber-500/80">Harus segera dibayar</p>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-455">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Piutang Saya</span>
            <ArrowDownRight size={13} className="text-emerald-500" />
          </div>
          <p className="text-sm font-black text-emerald-700">{formatRupiah(totalUnpaidReceivable)}</p>
          <p className="text-[8px] font-bold text-emerald-500/80">Harus segera ditagih</p>
        </div>
      </div>

      {/* Monthly Focus Alert Card */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.03] border border-indigo-100/50 rounded-2xl flex items-center justify-between gap-3 shadow-3xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center flex-shrink-0">
            <Calendar size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-wide">Fokus Jatuh Tempo ({currentMonthName})</span>
            <div className="flex items-center gap-3.5 mt-1">
              <div>
                <p className="text-[8px] font-bold text-slate-400">Piutang Cair</p>
                <p className="text-xs font-black text-emerald-600">{formatRupiah(unpaidReceivableThisMonth)}</p>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <p className="text-[8px] font-bold text-slate-400">Hutang Jatuh Tempo</p>
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
            className={`py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
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
          <p className="text-[10px] text-slate-400 mt-0.5">Catat pinjaman atau tagihan bulanan untuk mulai memantau.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedBills.map(b => {
            const isOverdue = b.status === 'unpaid' && new Date(b.dueDate) < new Date(new Date().toISOString().split('T')[0]);
            
            return (
              <div 
                key={b.id} 
                onClick={() => setSelectedBillDetail(b)}
                className={`p-3 bg-white border rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5 relative overflow-hidden ${
                  b.status === 'paid' 
                    ? 'border-slate-100 opacity-70' 
                    : b.type === 'debt'
                    ? 'border-l-4 border-l-amber-400 border-slate-100'
                    : 'border-l-4 border-l-emerald-400 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    b.status === 'paid'
                      ? 'bg-slate-100 text-slate-400'
                      : b.type === 'debt'
                      ? 'bg-amber-50 text-amber-500'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {b.type === 'debt' ? <Wallet size={16} /> : <Coins size={16} />}
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                      {b.title}
                      {b.isRecurring && (
                        <RefreshCw size={9} className="text-indigo-500 animate-spin-slow" />
                      )}
                      {b.isInstallment && (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-55 text-indigo-650 text-[8px] font-extrabold tracking-wide border border-indigo-100/30">
                          Cicilan {b.installmentNumber}/{b.installmentCount}
                        </span>
                      )}
                      {b.status === 'paid' && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase">Lunas</span>
                      )}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {b.type === 'debt' ? `Kepada: ${b.contactName}` : `Dari: ${b.contactName}`}
                      {b.status === 'unpaid' ? (
                        <span className={`ml-2 ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400 font-medium'}`}>
                          Jatuh Tempo: {formatShortDate(b.dueDate)} {isOverdue && '⚠️ Terlambat'}
                        </span>
                      ) : (
                        <span className="ml-2 text-emerald-600 font-bold">Lunas</span>
                      )}
                    </p>
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
                  <ChevronRight size={13} className="text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
