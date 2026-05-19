
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  Info, 
  Lightbulb, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';
import { CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import { formatRupiah, formatShortDate } from '../../utils/financeHelpers';
import type { Transaction, Budget } from '../../types/finance';

interface HomeTabProps {
  transactions: Transaction[];
  budgets: Budget[];
  loadingTxs: boolean;
  loadingBudgets: boolean;
  setCurrentTab: (tab: string) => void;
  setSelectedTxDetail: (tx: Transaction | null) => void;
}

export default function HomeTab({
  transactions,
  budgets,
  loadingTxs,
  loadingBudgets,
  setCurrentTab,
  setSelectedTxDetail
}: HomeTabProps) {
  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Insights helper
  const getInsights = () => {
    const activeBudgets = budgets.filter(b => b.limit > 0);
    const overBudgets = activeBudgets.filter(b => b.spent >= b.limit);
    const warningBudgets = activeBudgets.filter(b => b.spent >= b.limit * 0.8 && b.spent < b.limit);

    if (totalExpense > totalIncome && totalIncome > 0) {
      return {
        title: 'Dompet Defisit! ⚠️',
        message: `Pengeluaran Anda melebihi pemasukan sebesar ${formatRupiah(totalExpense - totalIncome)}. Coba batasi belanja non-primer dan amankan pos pengeluaran.`,
        color: 'bg-rose-50 border-rose-100 text-rose-700',
        icon: AlertCircle
      };
    }

    if (overBudgets.length > 0) {
      const catNames = overBudgets.map(b => CATEGORIES.find(c => c.id === b.categoryId)?.name || '').filter(Boolean);
      return {
        title: 'Anggaran Melampaui Batas! 🚨',
        message: `Anda telah melebihi batas anggaran untuk kategori: ${catNames.join(', ')}. Tunda pengeluaran ini hingga bulan berikutnya.`,
        color: 'bg-pink-50/70 border-pink-100/70 text-pink-700',
        icon: AlertCircle
      };
    }

    if (warningBudgets.length > 0) {
      const catName = CATEGORIES.find(c => c.id === warningBudgets[0].categoryId)?.name || '';
      return {
        title: 'Mendekati Batas Anggaran 🔔',
        message: `Anggaran kategori ${catName} sudah terpakai lebih dari 80%. Rem belanja untuk kategori ini agar saldo bulanan tetap aman.`,
        color: 'bg-amber-50/70 border-amber-100/70 text-amber-700',
        icon: Info
      };
    }

    if (savingRate >= 40 && totalIncome > 0) {
      return {
        title: 'Kesehatan Dompet: Sangat Sehat! 🌟',
        message: `Hebat! Anda berhasil menabung ${Math.round(savingRate)}% dari pemasukan. Teruskan performa luar biasa ini untuk dana darurat Anda.`,
        color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        icon: Lightbulb
      };
    }

    if (savingRate > 0 && totalIncome > 0) {
      return {
        title: 'Kondisi Keuangan: Stabil 📈',
        message: `Anda menyisihkan ${Math.round(savingRate)}% dari pemasukan. Tingkatkan porsi tabungan dengan mengurangi jajan atau pengeluaran impulsif.`,
        color: 'bg-blue-50 border-blue-100 text-blue-700',
        icon: Lightbulb
      };
    }

    return {
      title: 'Catat Pemasukan Anda 💵',
      message: 'Belum ada pemasukan yang dicatat. Masukkan pemasukan bulanan agar analisis rasio tabungan dapat berfungsi.',
      color: 'bg-slate-50 border-slate-100 text-slate-600',
      icon: Info
    };
  };

  const insight = getInsights();

  // Weekly expense trend chart helper
  const getWeeklyExpenseData = () => {
    const dataPoints: { day: string; amount: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      
      dataPoints.push({
        day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        amount: dayExpense
      });
    }
    return dataPoints;
  };

  const chartData = getWeeklyExpenseData();
  const maxChartVal = Math.max(...chartData.map(d => d.amount), 100000);

  const svgWidth = 320;
  const svgHeight = 120;
  const chartPoints = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * (svgWidth - 20) + 10;
    const y = svgHeight - ((d.amount / maxChartVal) * (svgHeight - 30) + 15);
    return { x, y, ...d };
  });

  let pathStr = '';
  if (chartPoints.length > 0) {
    pathStr = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      const prev = chartPoints[i - 1];
      const curr = chartPoints[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      pathStr += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }

  const areaPathStr = pathStr 
    ? `${pathStr} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight} L ${chartPoints[0].x} ${svgHeight} Z`
    : '';

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Balance Card */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-indigo-500 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 -translate-y-8 blur-xl"></div>
        <div className="absolute left-0 bottom-0 w-24 h-24 bg-purple-500/20 rounded-full -translate-x-6 translate-y-6 blur-lg"></div>

        <div className="relative z-10">
          <span className="text-[11px] font-medium tracking-wide uppercase opacity-75">Total Saldo Anda</span>
          <h2 className="text-2xl font-bold mt-1 tracking-tight">
            {loadingTxs ? (
              <span className="inline-block w-40 h-8 bg-white/20 animate-pulse rounded"></span>
            ) : (
              formatRupiah(currentBalance)
            )}
          </h2>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowUpRight size={16} className="text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase">Pemasukan</span>
                <span className="text-xs font-bold block">
                  {loadingTxs ? (
                    <span className="inline-block w-16 h-4 bg-white/20 animate-pulse rounded"></span>
                  ) : (
                    formatRupiah(totalIncome)
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowDownRight size={16} className="text-rose-300" />
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase">Pengeluaran</span>
                <span className="text-xs font-bold block text-rose-100">
                  {loadingTxs ? (
                    <span className="inline-block w-16 h-4 bg-white/20 animate-pulse rounded"></span>
                  ) : (
                    formatRupiah(totalExpense)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Financial Insights Panel */}
      <div className={`p-4 rounded-[22px] border ${insight.color} flex gap-3 transition-colors shadow-2xs`}>
        <div className="p-2 rounded-xl bg-white/50 backdrop-blur-xs flex-shrink-0 flex items-center justify-center self-start mt-0.5 animate-pulse">
          <insight.icon size={16} className="text-inherit" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">{insight.title}</h4>
          <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{insight.message}</p>
        </div>
      </div>

      {/* Chart Card */}
      <div className="p-4 rounded-[22px] bg-white border border-slate-100 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800">Tren Pengeluaran</h3>
            <p className="text-[10px] text-slate-400">Analisis pengeluaran 7 hari terakhir</p>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold">
            Grafik Mingguan
          </div>
        </div>

        {loadingTxs ? (
          <div className="h-[120px] flex items-center justify-center bg-slate-50/50 rounded-lg">
            <span className="text-xs text-slate-400 animate-pulse">Menghitung tren keuangan...</span>
          </div>
        ) : transactions.filter(t => t.type === 'expense').length === 0 ? (
          <div className="h-[120px] flex flex-col items-center justify-center bg-slate-50/50 rounded-lg p-4 text-center">
            <Info size={18} className="text-slate-400 mb-1" />
            <span className="text-[11px] text-slate-500">Belum ada pengeluaran dicatat minggu ini.</span>
          </div>
        ) : (
          <div className="relative pt-2">
            <svg className="w-full overflow-visible" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="10" y1={svgHeight - 15} x2={svgWidth - 10} y2={svgHeight - 15} stroke="#f1f5f9" strokeWidth="1" />
              <line x1="10" y1={svgHeight / 2 + 5} x2={svgWidth - 10} y2={svgHeight / 2 + 5} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="10" y1="15" x2={svgWidth - 10} y2="15" stroke="#f1f5f9" strokeWidth="1" />

              {areaPathStr && <path d={areaPathStr} fill="url(#chartGradient)" />}
              {pathStr && (
                <path 
                  d={pathStr} 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {chartPoints.map((pt, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    fill="#ffffff" 
                    stroke="#6366f1" 
                    strokeWidth="2.5" 
                  />
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="10" 
                    fill="transparent" 
                    className="hover:fill-indigo-500/10 transition-colors"
                  />
                </g>
              ))}
            </svg>

            <div className="flex justify-between px-2 mt-1">
              {chartData.map((d, idx) => (
                <div key={idx} className="text-center w-[40px]">
                  <span className="text-[9px] font-semibold text-slate-400 block">{d.day}</span>
                  <span className="text-[7.5px] font-bold text-slate-600 block truncate">
                    {d.amount > 0 ? (d.amount >= 1000 ? `${Math.round(d.amount/1000)}k` : d.amount) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Budgets Overviews */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-[13px] font-bold text-slate-800">Status Anggaran</h3>
          <button 
            onClick={() => setCurrentTab('budgets')} 
            className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 flex items-center"
          >
            <span>Semua</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {loadingBudgets ? (
          <div className="space-y-2">
            {[1, 2].map(n => (
              <div key={n} className="h-14 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-4 rounded-xl bg-white border border-slate-100 text-center text-xs text-slate-400">
            Belum ada anggaran bulanan dibuat.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {budgets.slice(0, 2).map(b => {
              const cat = CATEGORIES.find(c => c.id === b.categoryId);
              const percent = Math.min(Math.round((b.spent / b.limit) * 100), 100);
              const isNearLimit = percent >= 80;
              
              return (
                <div key={b.categoryId} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className={`w-8 h-8 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                      {cat && <DynamicIcon name={cat.icon} size={15} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-700 truncate">{cat?.name}</h4>
                      <span className="text-[9px] text-slate-400">
                        {formatRupiah(b.spent)} dari {formatRupiah(b.limit)}
                      </span>
                    </div>
                  </div>

                  <div className="w-1/3 flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold ${isNearLimit ? 'text-rose-500' : 'text-slate-500'}`}>
                      {percent}%
                    </span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-rose-400' : 'bg-indigo-400'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-[13px] font-bold text-slate-800">Transaksi Terakhir</h3>
          <button 
            onClick={() => setCurrentTab('transactions')} 
            className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 flex items-center"
          >
            <span>Lihat Riwayat</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {loadingTxs ? (
          <div className="space-y-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-[52px] bg-white border border-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white border border-slate-100 text-center">
            <Sparkles className="mx-auto text-indigo-300 mb-2 animate-bounce" size={24} />
            <p className="text-xs text-slate-500 font-semibold">Mulai catat transaksi Anda hari ini!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Semua data tersimpan otomatis di perangkat.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 3).map(tx => {
              const cat = CATEGORIES.find(c => c.id === tx.categoryId);
              return (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTxDetail(tx)}
                  className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-2xs hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                      {cat && <DynamicIcon name={cat.icon} size={15} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-700 truncate">{tx.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {formatShortDate(tx.date)} {tx.notes && `• ${tx.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <span className={`text-xs font-bold block ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-700'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                    <span className="text-[8.5px] font-semibold text-slate-400 block uppercase">
                      {cat?.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
