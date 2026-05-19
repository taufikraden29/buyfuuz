import { useState } from 'react';
import { Search, X, HelpCircle } from 'lucide-react';
import { CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import { 
  formatRupiah, 
  formatShortDate, 
  groupTransactionsByMonth, 
  formatCalendarAmt 
} from '../../utils/financeHelpers';
import type { Transaction } from '../../types/finance';

interface HistoryTabProps {
  transactions: Transaction[];
  loadingTxs: boolean;
  setSelectedTxDetail: (tx: Transaction | null) => void;
}

export default function HistoryTab({
  transactions,
  loadingTxs,
  setSelectedTxDetail
}: HistoryTabProps) {
  // Local Filter States
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [txSearch, setTxSearch] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<'all' | string>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<'all' | string>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Get unique months list for dropdown filter
  const uniqueMonths = Array.from(new Set(transactions.map(t => {
    const [year, month] = t.date.split('-');
    return `${year}-${month}`;
  }))).sort((a, b) => b.localeCompare(a));

  // Filtered transactions for the transactions list
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(txSearch.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(txSearch.toLowerCase()));
    const matchesType = txTypeFilter === 'all' || t.type === txTypeFilter;
    const matchesCategory = txCategoryFilter === 'all' || t.categoryId === txCategoryFilter;
    
    const [year, month] = t.date.split('-');
    const matchesMonth = selectedMonthFilter === 'all' || `${year}-${month}` === selectedMonthFilter;
    
    return matchesSearch && matchesType && matchesCategory && matchesMonth;
  });

  // Calendar calculations
  const activeMonthForCalendar = selectedMonthFilter === 'all' 
    ? (uniqueMonths[0] || new Date().toISOString().split('-').slice(0, 2).join('-'))
    : selectedMonthFilter;

  const [calYearStr, calMonthStr] = activeMonthForCalendar.split('-');
  const calYear = Number(calYearStr);
  const calMonth = Number(calMonthStr) - 1;

  const firstDayOfMonth = new Date(calYear, calMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const paddingSlots = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const calendarCells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < paddingSlots; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${calYearStr}-${calMonthStr}-${dayStr}`;
    calendarCells.push({ day, dateStr });
  }

  // Filtered transactions for calendar day selection
  const calendarFilteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(txSearch.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(txSearch.toLowerCase()));
    const matchesType = txTypeFilter === 'all' || t.type === txTypeFilter;
    const matchesCategory = txCategoryFilter === 'all' || t.categoryId === txCategoryFilter;
    
    const [year, month] = t.date.split('-');
    const matchesMonth = `${year}-${month}` === activeMonthForCalendar;
    const matchesDay = !selectedCalendarDay || t.date === selectedCalendarDay;

    return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesDay;
  });

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800">Riwayat Transaksi</h2>
          <p className="text-[11px] text-slate-400">Temukan dan atur pengeluaran Anda</p>
        </div>
        {/* View Switcher: Daftar vs Kalender */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl text-[9px] font-extrabold w-32 border border-slate-200/20">
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedCalendarDay(null);
            }}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white text-indigo-600 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('calendar');
            }}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'calendar' 
                ? 'bg-white text-indigo-600 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Kalender
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3.5 p-3.5 bg-white border border-slate-100 rounded-[20px] shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari deskripsi atau catatan..."
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors"
          />
          {txSearch && (
            <button 
              onClick={() => setTxSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Periode Bulanan Selector */}
        <div className="space-y-1">
          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Periode Bulanan</label>
          <select
            value={selectedMonthFilter}
            onChange={(e) => {
              setSelectedMonthFilter(e.target.value);
              setSelectedCalendarDay(null);
            }}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-[11px] px-2.5 py-2 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors font-bold text-slate-600 cursor-pointer"
          >
            <option value="all">Semua Bulan (Tampilan Kronologis)</option>
            {uniqueMonths.map(m => {
              const [year, month] = m.split('-');
              const dateObj = new Date(Number(year), Number(month) - 1, 1);
              const label = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
        </div>

        {/* Horizontal Category Filtering Row */}
        <div className="space-y-1">
          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Pilih Kategori</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scroll-smooth no-scrollbar -mx-3.5 px-3.5">
            <button
              onClick={() => setTxCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all border cursor-pointer ${
                txCategoryFilter === 'all'
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-xs'
                  : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Semua
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setTxCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all border flex items-center gap-1 cursor-pointer ${
                  txCategoryFilter === c.id
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-xs'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <DynamicIcon name={c.icon} size={11} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters grid for type */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl">
          {(['all', 'income', 'expense'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setTxTypeFilter(type)}
              className={`py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                txTypeFilter === type 
                  ? 'bg-white text-indigo-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === 'all' && 'Semua'}
              {type === 'income' && 'Pemasukan (+)'}
              {type === 'expense' && 'Pengeluaran (-)'}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR VIEW MODAL / SHEET GRID */}
      {viewMode === 'calendar' && (
        <div className="p-3.5 bg-white border border-slate-100 rounded-[20px] shadow-2xs space-y-3.5 animate-scale-in">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
              {new Date(calYear, calMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            {selectedCalendarDay && (
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="text-[9px] font-bold text-indigo-500 hover:underline cursor-pointer"
              >
                Tampilkan Semua Hari
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
            <div>Sn</div>
            <div>Sl</div>
            <div>Rb</div>
            <div>Km</div>
            <div>Jm</div>
            <div>Sb</div>
            <div>Mg</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 rounded-lg"></div>;
              }

              const dayTxs = transactions.filter(t => t.date === cell.dateStr);
              const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
              const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
              const isSelected = selectedCalendarDay === cell.dateStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedCalendarDay(isSelected ? null : cell.dateStr)}
                  className={`aspect-square p-1 rounded-xl flex flex-col justify-between items-center transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-indigo-500 border-indigo-600 text-white shadow-xs shadow-indigo-150' 
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-700'}`}>{cell.day}</span>
                  <div className="w-full text-center space-y-0.5">
                    {dayIncome > 0 && (
                      <span className={`text-[6.5px] font-black block leading-tight ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>
                        +{formatCalendarAmt(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className={`text-[6.5px] font-black block leading-tight ${isSelected ? 'text-rose-200' : 'text-rose-500'}`}>
                        -{formatCalendarAmt(dayExpense)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW RENDER */}
      {viewMode === 'list' ? (
        loadingTxs ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 bg-white border border-slate-100 rounded-[20px] text-center">
            <HelpCircle className="mx-auto text-slate-300 mb-2 animate-bounce" size={26} />
            <p className="text-xs text-slate-500 font-bold">Tidak ada transaksi ditemukan</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupTransactionsByMonth(filteredTransactions).map(group => (
              <div key={group.key} className="space-y-2 animate-slide-up">
                {/* Monthly Header */}
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full"></span>
                    {group.monthYear}
                  </h3>
                  <div className="flex gap-1 text-[8px] font-extrabold">
                    {group.income > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/30">
                        +{formatRupiah(group.income)}
                      </span>
                    )}
                    {group.expense > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100/30">
                        -{formatRupiah(group.expense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Transaction list for this group */}
                <div className="space-y-2">
                  {group.list.map(tx => {
                    const cat = CATEGORIES.find(c => c.id === tx.categoryId);
                    return (
                      <div 
                        key={tx.id} 
                        onClick={() => setSelectedTxDetail(tx)}
                        className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8.5 h-8.5 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                            {cat && <DynamicIcon name={cat.icon} size={16} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-700 truncate">{tx.title}</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              {formatShortDate(tx.date)} {tx.notes && `• ${tx.notes}`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-1">
                          <span className={`text-xs font-bold block ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-700'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {cat?.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* CALENDAR DAY TRANSACTIONS LIST */
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1 pt-1">
            <h3 className="text-xs font-bold text-slate-700">
              {selectedCalendarDay 
                ? `Transaksi: ${new Date(selectedCalendarDay).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `Semua Transaksi Bulan Ini`
              }
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              {calendarFilteredTransactions.length} Transaksi
            </span>
          </div>

          {loadingTxs ? (
            <div className="space-y-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : calendarFilteredTransactions.length === 0 ? (
            <div className="p-8 bg-white border border-slate-100 rounded-[20px] text-center">
              <HelpCircle className="mx-auto text-slate-300 mb-2 animate-bounce" size={26} />
              <p className="text-xs text-slate-500 font-bold">Tidak ada transaksi ditemukan</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendarFilteredTransactions.map(tx => {
                const cat = CATEGORIES.find(c => c.id === tx.categoryId);
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTxDetail(tx)}
                    className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5 animate-slide-up"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8.5 h-8.5 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                        {cat && <DynamicIcon name={cat.icon} size={16} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-700 truncate">{tx.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {formatShortDate(tx.date)} {tx.notes && `• ${tx.notes}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-1">
                      <span className={`text-xs font-bold block ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-700'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">
                        {cat?.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
