import { useState } from 'react';
import { Search, X, HelpCircle, Download, Printer } from 'lucide-react';
import { CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import { 
  formatRupiah, 
  formatShortDate, 
  groupTransactionsByMonth, 
  formatCalendarAmt 
} from '../../utils/financeHelpers';
import type { Transaction, Account } from '../../types/finance';

interface HistoryTabProps {
  transactions: Transaction[];
  accounts: Account[];
  loadingTxs: boolean;
  setSelectedTxDetail: (tx: Transaction | null) => void;
}

export default function HistoryTab({
  transactions,
  accounts = [],
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

  // --- CSV Export Handler ---
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Kategori', 'Judul/Keperluan', 'Tipe', 'Nominal (Rp)', 'Catatan'];
    const rows = filteredTransactions.map(t => {
      const category = CATEGORIES.find(c => c.id === t.categoryId)?.name || 'Lain-lain';
      const typeText = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      return [
        t.date,
        `"${category.replace(/"/g, '""')}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        typeText,
        t.amount,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_UangKu_${selectedMonthFilter === 'all' ? 'Semua' : selectedMonthFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PDF Print Export Handler ---
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const activeMonthLabel = selectedMonthFilter === 'all' 
      ? 'Semua Transaksi'
      : new Date(Number(calYearStr), Number(calMonthStr) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const rowsHtml = filteredTransactions.map(t => {
      const category = CATEGORIES.find(c => c.id === t.categoryId)?.name || 'Lain-lain';
      const typeText = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const typeClass = t.type === 'income' ? 'text-emerald-700' : 'text-slate-800';
      const prefix = t.type === 'income' ? '+' : '-';
      return `
        <tr>
          <td>${new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          <td><b>${t.title}</b><br><small style="color:#64748b">${category}</small></td>
          <td class="${typeClass}">${typeText}</td>
          <td class="${typeClass}" style="text-align: right; font-weight: bold;">${prefix}Rp ${t.amount.toLocaleString('id-ID')}</td>
          <td><small style="color:#64748b">${t.notes || '-'}</small></td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Keuangan UangKu - ${activeMonthLabel}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            h1 { margin-bottom: 5px; font-size: 24px; color: #0f172a; }
            p { margin-top: 0; color: #64748b; font-size: 14px; }
            .summary-cards { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
            .card { padding: 15px; border: 1px solid #cbd5e1; border-radius: 12px; }
            .card h3 { margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            .card p { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #cbd5e1; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: 700; color: #334155; }
            .text-emerald-700 { color: #047857; }
            .text-slate-800 { color: #1e293b; }
            .print-btn { padding: 10px 18px; background-color: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
            @media print {
              body { padding: 0; }
              .print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
            <div>
              <h1>Laporan Keuangan UangKu</h1>
              <p>Periode: <b>${activeMonthLabel}</b></p>
            </div>
            <button class="print-btn" onclick="window.print()">Cetak Laporan</button>
          </div>
          
          <div class="summary-cards">
            <div class="card" style="border-left: 4px solid #059669;">
              <h3>Total Pemasukan</h3>
              <p class="text-emerald-700">Rp ${totalIncome.toLocaleString('id-ID')}</p>
            </div>
            <div class="card" style="border-left: 4px solid #dc2626;">
              <h3>Total Pengeluaran</h3>
              <p>Rp ${totalExpense.toLocaleString('id-ID')}</p>
            </div>
            <div class="card" style="border-left: 4px solid #4f46e5; background-color: #f5f3ff;">
              <h3>Selisih (Net)</h3>
              <p style="color: ${balance >= 0 ? '#047857' : '#b91c1c'}">Rp ${balance.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Tanggal</th>
                <th style="width: 30%;">Transaksi</th>
                <th style="width: 15%;">Tipe</th>
                <th style="width: 20%; text-align: right;">Nominal</th>
                <th style="width: 20%;">Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex justify-between items-center mb-1 gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-slate-50 text-[10.5px] font-black shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title="Ekspor ke Excel/CSV"
          >
            <Download size={12} strokeWidth={2.5} />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-slate-50 text-[10.5px] font-black shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title="Cetak Laporan PDF"
          >
            <Printer size={12} strokeWidth={2.5} />
            <span>PDF</span>
          </button>
        </div>

        <div className="flex bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold w-32 border border-slate-200/55">
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedCalendarDay(null);
            }}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white text-indigo-650 font-extrabold shadow-sm' 
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
                ? 'bg-white text-indigo-650 font-extrabold shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Kalender
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3.5 p-3.5 bg-white border border-slate-200 rounded-[20px] shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Cari deskripsi atau catatan..."
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-medium text-slate-800"
          />
          {txSearch && (
            <button 
              onClick={() => setTxSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Periode Bulanan Selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Periode Bulanan</label>
          <select
            value={selectedMonthFilter}
            onChange={(e) => {
              setSelectedMonthFilter(e.target.value);
              setSelectedCalendarDay(null);
            }}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-200 transition-colors font-extrabold text-slate-700 cursor-pointer"
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
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Kategori</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scroll-smooth no-scrollbar -mx-3.5 px-3.5">
            <button
              onClick={() => setTxCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all border cursor-pointer ${
                txCategoryFilter === 'all'
                  ? 'bg-indigo-600 border-indigo-650 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setTxCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all border flex items-center gap-1 cursor-pointer ${
                  txCategoryFilter === c.id
                    ? 'bg-indigo-600 border-indigo-650 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <DynamicIcon name={c.icon} size={11} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters grid for type */}
        <div className="grid grid-cols-3 p-1 bg-slate-200/70 rounded-xl border border-slate-200/30">
          {(['all', 'income', 'expense'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setTxTypeFilter(type)}
              className={`py-1 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                txTypeFilter === type 
                  ? 'bg-white text-indigo-650 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
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
        <div className="p-3.5 bg-white border border-slate-200 rounded-[20px] shadow-sm space-y-3.5 animate-scale-in">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
              {new Date(calYear, calMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            {selectedCalendarDay && (
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Tampilkan Semua Hari
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-500 uppercase tracking-wider">
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
                return <div key={`empty-${idx}`} className="aspect-square bg-slate-100/50 rounded-xl"></div>;
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
                      ? 'bg-indigo-650 border-indigo-755 text-white shadow-md shadow-indigo-150' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs'
                  }`}
                >
                  <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-800'}`}>{cell.day}</span>
                  <div className="w-full text-center space-y-0.5">
                    {dayIncome > 0 && (
                      <span className={`text-[8.5px] font-black block leading-tight ${isSelected ? 'text-emerald-250' : 'text-emerald-700'}`}>
                        +{formatCalendarAmt(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className={`text-[8.5px] font-black block leading-tight ${isSelected ? 'text-rose-250' : 'text-rose-650'}`}>
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
            <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupTransactionsByMonth(filteredTransactions).map(group => (
              <div key={group.key} className="space-y-2.5 animate-slide-up">
                {/* Monthly Header */}
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-indigo-600 rounded-full"></span>
                    {group.monthYear}
                  </h3>
                  <div className="flex gap-1.5 text-[10px] font-black">
                    {group.income > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{formatRupiah(group.income)}
                      </span>
                    )}
                    {group.expense > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-650 border border-rose-200">
                        -{formatRupiah(group.expense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Transaction list for this group */}
                <div className="space-y-2">
                  {group.list.map(tx => {
                    const cat = CATEGORIES.find(c => c.id === tx.categoryId);
                    const acc = accounts.find(a => a.id === tx.accountId) || accounts.find(a => a.id === 'acc-tunai');
                    return (
                      <div 
                        key={tx.id} 
                        onClick={() => setSelectedTxDetail(tx)}
                        className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-sm hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8.5 h-8.5 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                            {cat && <DynamicIcon name={cat.icon} size={16} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-800 truncate">{tx.title}</h4>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-550 font-medium">
                                {formatShortDate(tx.date)} {tx.notes && `• ${tx.notes}`}
                              </span>
                              {acc && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] font-extrabold text-slate-600 flex items-center gap-0.5">
                                  <DynamicIcon name={acc.icon} size={8} />
                                  {acc.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-1">
                          <span className={`text-xs font-extrabold block ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-850'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 block uppercase">
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
            <span className="text-xs font-bold text-slate-400">
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
              <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendarFilteredTransactions.map(tx => {
                const cat = CATEGORIES.find(c => c.id === tx.categoryId);
                const acc = accounts.find(a => a.id === tx.accountId) || accounts.find(a => a.id === 'acc-tunai');
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTxDetail(tx)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-sm hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5 animate-slide-up"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8.5 h-8.5 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                        {cat && <DynamicIcon name={cat.icon} size={16} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-855 truncate">{tx.title}</h4>
                        <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-555 font-medium">
                            {formatShortDate(tx.date)} {tx.notes && `• ${tx.notes}`}
                          </span>
                          {acc && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] font-extrabold text-slate-600 flex items-center gap-0.5">
                              <DynamicIcon name={acc.icon} size={8} />
                              {acc.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-1">
                      <span className={`text-xs font-extrabold block ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-855'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 block uppercase">
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
