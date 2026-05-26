
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  Info, 
  Lightbulb, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '../../services/api';
import DynamicIcon from '../DynamicIcon';
import { formatRupiah, formatShortDate } from '../../utils/financeHelpers';
import type { Transaction, Budget, Account } from '../../types/finance';

interface HomeTabProps {
  transactions: Transaction[];
  budgets: Budget[];
  accounts: Account[];
  loadingTxs: boolean;
  loadingBudgets: boolean;
  setCurrentTab: (tab: string) => void;
  setSelectedTxDetail: (tx: Transaction | null) => void;
  userName: string;
}

const FINANCIAL_TIPS = [
  "Membeli barang diskon yang sebenarnya tidak dibutuhkan tetap merupakan pemborosan uang! 💸",
  "Gunakan rumus 50-30-20: 50% untuk kebutuhan utama, 30% keinginan, dan 20% tabungan/investasi. 📊",
  "Catat setiap pengeluaran kecil, karena tetesan air kecil pun bisa menenggelamkan kapal besar! 💧",
  "Sebelum membeli barang non-primer, tunggu 24 jam untuk memastikan Anda benar-benar membutuhkannya. ⏱️",
  "Kunci kaya bukan seberapa besar gaji Anda, tapi seberapa pintar Anda mempertahankan dan mengalokasikannya. 🗝️"
];

export default function HomeTab({
  transactions,
  budgets,
  accounts = [],
  loadingTxs,
  loadingBudgets,
  setCurrentTab,
  setSelectedTxDetail,
  userName
}: HomeTabProps) {
  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Calculate balances per account dynamically
  const getAccountBalances = () => {
    return accounts.map(acc => {
      const accountTxs = transactions.filter(t => t.accountId === acc.id || (!t.accountId && acc.id === 'acc-tunai'));
      const income = accountTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = accountTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { ...acc, balance: income - expense };
    });
  };

  const accountBalances = getAccountBalances();

  // Weekly Unusual Spendings Anomaly Detection helper
  const getUnusualSpendings = () => {
    const expenseTxs = transactions.filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer');
    if (expenseTxs.length < 3) return []; // need baseline data points to establish standard deviation

    const totalAmt = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
    const avgAmt = totalAmt / expenseTxs.length;

    // Filter transactions in the last 7 days (current week)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentExpenses = expenseTxs.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= sevenDaysAgo && tDate <= today;
    });

    // Unusual if it exceeds 2.0x baseline average AND is greater than Rp 100k, OR is single huge purchase >= Rp 500k
    const unusual = recentExpenses.filter(t => 
      (t.amount > avgAmt * 2.0 && t.amount > 100000) || t.amount >= 500000
    );

    return unusual.sort((a, b) => b.amount - a.amount);
  };

  const unusualSpendings = getUnusualSpendings();

  // Active Slide Index for dynamic horizontal insights carousel
  const [activeSlide, setActiveSlide] = useState(0);

  // Assistant Speech Mode: 'status' (Financial State Review), 'mission' (Weekly Quest), 'tip' (Motivating Tip)
  const [speechMode, setSpeechMode] = useState<'status' | 'mission' | 'tip'>('status');



  // Get premium structural advice when budgets are exceeded or critical
  const getBudgetAdvice = () => {
    const activeBudgets = budgets.filter(b => b.limit > 0);
    const overBudgets = activeBudgets.filter(b => b.spent >= b.limit);
    const warningBudgets = activeBudgets.filter(b => b.spent >= b.limit * 0.8 && b.spent < b.limit);

    if (overBudgets.length > 0) {
      const firstOver = overBudgets[0];
      const cat = CATEGORIES.find(c => c.id === firstOver.categoryId);
      return {
        type: 'danger',
        categoryName: cat?.name || 'Kategori',
        limit: firstOver.limit,
        spent: firstOver.spent,
        overAmount: firstOver.spent - firstOver.limit,
        title: 'Darurat Anggaran! 🚨',
        message: `Anggaran ${cat?.name || 'Kategori'} ${userName || 'Kak'} bocor ${formatRupiah(firstOver.spent - firstOver.limit)}. Hentikan segera belanja impulsif pada pos ini!`,
        advice: '💡 Tindakan Mandiri: Tutup deficit dengan cara memindahkan sisa alokasi kuota dari pos belanja lain yang masih hijau, atau tunda belanja hingga awal bulan depan.'
      };
    }

    if (warningBudgets.length > 0) {
      const firstWarn = warningBudgets[0];
      const cat = CATEGORIES.find(c => c.id === firstWarn.categoryId);
      return {
        type: 'warning',
        categoryName: cat?.name || 'Kategori',
        limit: firstWarn.limit,
        spent: firstWarn.spent,
        remaining: firstWarn.limit - firstWarn.spent,
        title: 'Limit Anggaran Tipis! 🔔',
        message: `Dompet kategori ${cat?.name || 'Kategori'} sudah terpakai ${Math.round((firstWarn.spent / firstWarn.limit) * 100)}%. Sisa saku aman ${userName || 'Kak'} hanya ${formatRupiah(firstWarn.limit - firstWarn.spent)}.`,
        advice: '💡 Tindakan Mandiri: Aktifkan rem belanja. Gunakan pilihan alternatif hemat, dan prioritaskan kebutuhan primer saja hingga siklus anggaran berganti.'
      };
    }

    return null;
  };

  const budgetAdvice = getBudgetAdvice();

  // 1. Calculate Companion Financial Expression
  const companionStatus = useMemo<'happy' | 'worried' | 'normal'>(() => {
    if (budgetAdvice?.type === 'danger') return 'worried';
    if (savingRate >= 40 && totalIncome > 0) return 'happy';
    return 'normal';
  }, [budgetAdvice, savingRate, totalIncome]);

  // 2. Generate Active Weekly Mission (Evaluated dynamically over the last 7 days)
  const activeMission = useMemo(() => {
    const today = new Date();
    // Get week number of the year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today.getTime() - startOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

    // Pick mission index based on week number
    const missionIndex = weekNumber % 3;

    // Range for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    if (missionIndex === 0) {
      // Mission 1: Belanja Hemat
      const spent = transactions
        .filter(t => t.type === 'expense' && t.categoryId === 'cat-belanja' && new Date(t.date) >= sevenDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);
      const target = 150000;
      return {
        id: 'mission-belanja',
        title: 'Misi Belanja Hemat 🎯',
        description: 'Batasi pengeluaran kategori Belanja maksimal Rp 150.000 dalam 7 hari terakhir.',
        spent,
        target,
        isSuccess: spent <= target,
        categoryName: 'Belanja'
      };
    } else if (missionIndex === 1) {
      // Mission 2: Kurangi Jajan
      const spent = transactions
        .filter(t => t.type === 'expense' && t.categoryId === 'cat-makanan' && new Date(t.date) >= sevenDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);
      const target = 250000;
      return {
        id: 'mission-jajan',
        title: 'Misi Kurangi Jajan 🍔',
        description: 'Batasi jajan makanan & minuman maksimal Rp 250.000 dalam 7 hari terakhir.',
        spent,
        target,
        isSuccess: spent <= target,
        categoryName: 'Makanan & Minuman'
      };
    } else {
      // Mission 3: Disiplin Pengeluaran
      const spent = transactions
        .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer' && new Date(t.date) >= sevenDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);
      const target = 750000;
      return {
        id: 'mission-total',
        title: 'Misi Disiplin Saku 🛡️',
        description: 'Batasi pengeluaran total (selain transfer) maksimal Rp 750.000 dalam 7 hari terakhir.',
        spent,
        target,
        isSuccess: spent <= target,
        categoryName: 'Semua Kategori'
      };
    }
  }, [transactions]);



  // Pick tip based on day of month to keep it stable per day
  const dailyTip = useMemo(() => {
    const day = new Date().getDate();
    return FINANCIAL_TIPS[day % FINANCIAL_TIPS.length];
  }, []);

  const cycleSpeechMode = () => {
    setSpeechMode(prev => {
      if (prev === 'status') return 'mission';
      if (prev === 'mission') return 'tip';
      return 'status';
    });
  };

  // --- CALCULATE WEEKLY TRENDS ---
  const getWeeklyComparisonInsight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const thisWeek = transactions
      .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer')
      .filter(t => {
        const d = new Date(t.date);
        return d >= sevenDaysAgo && d <= today;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const lastWeek = transactions
      .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer')
      .filter(t => {
        const d = new Date(t.date);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return { thisWeek, lastWeek };
  };

  const { thisWeek: thisWeekExpenses, lastWeek: lastWeekExpenses } = getWeeklyComparisonInsight();

  // Dynamically assemble Carousel slides if anomalies, budget advice, or trends exist
  const carouselSlides: { id: string; element: React.ReactNode }[] = [];

  // Slide 1: Anomaly
  if (unusualSpendings.length > 0) {
    carouselSlides.push({
      id: 'anomaly',
      element: (
        <div className="p-4 rounded-[22px] bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-850/30 text-white shadow-md relative overflow-hidden h-[185px] flex flex-col justify-between transition-all duration-300">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-12 -translate-y-12 blur-xl"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-purple-500/10 rounded-full blur-md"></div>
          
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles size={13} className="animate-pulse" />
                </div>
                <h3 className="text-[10px] font-black tracking-wide uppercase text-indigo-300">Analisis Anomali Mingguan</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/20 text-[8px] font-black text-indigo-300 uppercase tracking-wider">
                Unusual Spendings
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-snug">
              Ada <span className="text-indigo-200 font-extrabold">{unusualSpendings.length} transaksi tidak biasa</span> yang jauh melebihi pengeluaran rata-rata {userName || 'Kak'}:
            </p>

            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {unusualSpendings.slice(0, 1).map(tx => {
                const cat = CATEGORIES.find(c => c.id === tx.categoryId);
                return (
                  <div key={tx.id} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${cat?.color || 'bg-slate-800 text-slate-400'} flex items-center justify-center flex-shrink-0 text-xs`}>
                        {cat && <DynamicIcon name={cat.icon} size={12} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white truncate">{tx.title}</h4>
                        <span className="text-[9px] text-slate-300 block mt-0.5">{formatShortDate(tx.date)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-black text-rose-355 block">-{formatRupiah(tx.amount)}</span>
                      <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-wide">
                        {tx.amount >= 500000 ? 'Skala Besar 🚨' : 'Lonjakan 2x ⚡'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <p className="text-[9px] text-slate-300 italic leading-snug pt-1.5 border-t border-white/[0.05]">
            💡 Tip: Rem pembelian impulsif besar di luar anggaran mingguan {userName || 'Kak'}.
          </p>
        </div>
      )
    });
  }

  // Slide 2: Budget Overrun
  if (budgetAdvice) {
    carouselSlides.push({
      id: 'budget-overrun',
      element: (
        <div className="p-4 rounded-[22px] bg-gradient-to-br from-rose-900 via-rose-955 to-slate-900 border border-rose-850/30 text-white shadow-md relative overflow-hidden h-[185px] flex flex-col justify-between transition-all duration-300">
          <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 rounded-full translate-x-12 -translate-y-12 blur-xl"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-pink-500/10 rounded-full blur-md"></div>
          
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertCircle size={13} className="animate-bounce" />
                </div>
                <h3 className="text-[10px] font-black tracking-wide uppercase text-rose-200">{budgetAdvice.title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/25 border border-rose-400/20 text-[8px] font-black text-rose-355 uppercase tracking-wider">
                Budget Advice
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-snug">
              {budgetAdvice.message}
            </p>
          </div>
          
          <p className="text-[9.5px] text-rose-200 font-semibold leading-snug pt-1.5 border-t border-white/[0.05] italic">
            {budgetAdvice.advice}
          </p>
        </div>
      )
    });
  }

  // Slide 3: Weekly Trend Comparison
  if (transactions.filter(t => t.type === 'expense').length > 0) {
    const percentDiff = lastWeekExpenses > 0 
      ? Math.round(((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100)
      : 0;

    const isIncrease = thisWeekExpenses > lastWeekExpenses;
    
    carouselSlides.push({
      id: 'weekly-compare',
      element: (
        <div className={`p-4 rounded-[22px] bg-gradient-to-br ${
          isIncrease 
            ? 'from-amber-900 via-amber-950 to-slate-900 border-amber-900/30' 
            : 'from-emerald-900 via-emerald-950 to-slate-900 border-emerald-900/30'
        } text-white shadow-md relative overflow-hidden h-[185px] flex flex-col justify-between transition-all duration-300`}>
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12 blur-xl"></div>
          
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg ${isIncrease ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'} flex items-center justify-center`}>
                  <Lightbulb size={13} />
                </div>
                <h3 className="text-[10px] font-black tracking-wide uppercase text-slate-350">Tren Belanja Mingguan</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                isIncrease ? 'bg-amber-500/25 border border-amber-400/20 text-amber-300' : 'bg-emerald-500/25 border border-emerald-400/20 text-emerald-300'
              }`}>
                {isIncrease ? 'Naik 📈' : 'Hemat 📉'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-snug">
              Pengeluaran minggu ini sebesar <span className="font-extrabold text-white">{formatRupiah(thisWeekExpenses)}</span>.
              {lastWeekExpenses > 0 ? (
                <span>
                  {' '}Dibandingkan minggu lalu ({formatRupiah(lastWeekExpenses)}), belanja {userName || 'Kak'}{' '}
                  <span className={`font-black ${isIncrease ? 'text-rose-250' : 'text-emerald-250'}`}>
                    {isIncrease ? `meningkat ${percentDiff}%` : `menghemat ${Math.abs(percentDiff)}%`}
                  </span>.
                </span>
              ) : (
                ` Mulai pertahankan pengeluaran agar tetap seimbang dengan pemasukan ${userName || 'Kak'}.`
              )}
            </p>
          </div>
          
          <p className="text-[9.5px] text-slate-300 font-semibold leading-snug pt-1.5 border-t border-white/[0.05] italic">
            {isIncrease 
              ? `💡 Tip: Telusuri riwayat belanja ${userName || 'Kak'} minggu ini dan batasi transaksi non-primer agar saldo stabil.`
              : `💡 Tip: Bagus sekali! Penghematan minggu ini bisa dialokasikan untuk menambah target tabungan ${userName || 'Kak'}.`
            }
          </p>
        </div>
      )
    });
  }

  // Slide 4: Welcome / Fallback Slide
  if (carouselSlides.length === 0) {
    carouselSlides.push({
      id: 'welcome',
      element: (
        <div className="p-4 rounded-[22px] bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-850/30 text-white shadow-md relative overflow-hidden h-[185px] flex flex-col justify-between transition-all duration-300">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-12 -translate-y-12 blur-xl"></div>
          
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
                <h3 className="text-[10px] font-black tracking-wide uppercase text-indigo-300">Tips Finansial UangKu</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/20 text-[8px] font-black text-indigo-300 uppercase tracking-wider">
                Tips
              </span>
            </div>
            
            <p className="text-[11.5px] text-slate-300 leading-snug">
              Selamat datang, Kak {userName || 'Kawan'}! Mulai catat pemasukan bulanan dan pengeluaran harian secara rutin untuk mengaktifkan grafik mingguan dan analisis keuangan otomatis.
            </p>
          </div>
          
          <p className="text-[9.5px] text-indigo-200 font-semibold leading-snug pt-1.5 border-t border-white/[0.05] italic">
            💡 Tip: Atur anggaran batas per kategori belanja di tab Anggaran agar pengeluaran {userName || 'Kak'} tetap terkontrol.
          </p>
        </div>
      )
    });
  }

  // Auto-scroll/Auto-play horizontal sliding interval
  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  // Insights helper
  const getInsights = () => {
    const activeBudgets = budgets.filter(b => b.limit > 0);
    const overBudgets = activeBudgets.filter(b => b.spent >= b.limit);
    const warningBudgets = activeBudgets.filter(b => b.spent >= b.limit * 0.8 && b.spent < b.limit);

    if (totalExpense > totalIncome && totalIncome > 0) {
      return {
        title: 'Dompet Defisit! ⚠️',
        message: `Pengeluaran ${userName || 'Kak'} melebihi pemasukan sebesar ${formatRupiah(totalExpense - totalIncome)}. Coba batasi belanja non-primer dan amankan pos pengeluaran.`,
        color: 'bg-rose-50 border-rose-200 text-rose-700',
        icon: AlertCircle
      };
    }

    if (overBudgets.length > 0) {
      const catNames = overBudgets.map(b => CATEGORIES.find(c => c.id === b.categoryId)?.name || '').filter(Boolean);
      return {
        title: 'Anggaran Melampaui Batas! 🚨',
        message: `${userName || 'Kak'} telah melebihi batas anggaran untuk kategori: ${catNames.join(', ')}. Tunda pengeluaran ini hingga bulan berikutnya.`,
        color: 'bg-pink-50 border-pink-200 text-pink-700',
        icon: AlertCircle
      };
    }

    if (warningBudgets.length > 0) {
      const catName = CATEGORIES.find(c => c.id === warningBudgets[0].categoryId)?.name || '';
      return {
        title: 'Mendekati Batas Anggaran 🔔',
        message: `Anggaran kategori ${catName} sudah terpakai lebih dari 80%. Rem belanja untuk kategori ini agar saldo bulanan tetap aman.`,
        color: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: Info
      };
    }

    if (savingRate >= 40 && totalIncome > 0) {
      return {
        title: 'Kesehatan Dompet: Sangat Sehat! 🌟',
        message: `Hebat! ${userName || 'Kak'} berhasil menabung ${Math.round(savingRate)}% dari pemasukan. Teruskan performa luar biasa ini untuk dana darurat ${userName || 'Kak'}.`,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: Lightbulb
      };
    }

    if (savingRate > 0 && totalIncome > 0) {
      return {
        title: 'Kondisi Keuangan: Stabil 📈',
        message: `${userName || 'Kak'} menyisihkan ${Math.round(savingRate)}% dari pemasukan. Tingkatkan porsi tabungan dengan mengurangi jajan atau pengeluaran impulsif.`,
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: Lightbulb
      };
    }

    return {
      title: `Catat Pemasukan ${userName || 'Kak'} 💵`,
      message: 'Belum ada pemasukan yang dicatat. Masukkan pemasukan bulanan agar analisis rasio tabungan dapat berfungsi.',
      color: 'bg-slate-50 border-slate-200 text-slate-650',
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
        .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer' && t.date === dateStr)
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
      {/* Greeting Header with Onboarding Character & Speech Bubble */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-3xs overflow-hidden transition-all duration-300">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            {/* Avatar container with animation */}
            <div 
              onClick={cycleSpeechMode}
              className={`w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 relative cursor-pointer active:scale-95 transition-all overflow-hidden ${
                companionStatus === 'happy' 
                  ? 'animate-bounce-gentle' 
                  : companionStatus === 'worried' 
                  ? 'animate-wiggle' 
                  : ''
              }`}
            >
              <img src="/character-open.svg" alt="Asisten Finansial" className="w-14 h-14 object-contain translate-y-3 scale-135" />
              {companionStatus === 'worried' && (
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[8px] font-black text-white">!</span>
                </div>
              )}
              {companionStatus === 'happy' && (
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                  <span className="text-[8px] font-black text-white">✨</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Halo, Kak</h3>
              <h2 className="text-[15px] font-black text-slate-800 leading-none mt-0.5">{userName || 'Kawan'} 👋</h2>
            </div>
          </div>

          {/* Quick status pill */}
          <button
            onClick={cycleSpeechMode}
            className={`px-3 py-1.5 rounded-xl border text-[9.5px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
              companionStatus === 'happy'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : companionStatus === 'worried'
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-indigo-50 border-indigo-100 text-indigo-700'
            }`}
          >
            <Sparkles size={11} />
            <span>Mode: {speechMode === 'status' ? 'Status' : speechMode === 'mission' ? 'Misi' : 'Tips'}</span>
          </button>
        </div>

        {/* Speech Bubble / Interactive Area */}
        <div className="p-4 bg-white relative">
          {/* Triangular pointer */}
          <div className="absolute -top-1.5 left-8 w-3 h-3 bg-white border-t border-l border-slate-100 rotate-45"></div>

          <div className="space-y-2.5">
            {/* Mode Content */}
            {speechMode === 'status' && (
              <div className="animate-scale-in">
                {companionStatus === 'happy' ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      "Wah hebat sekali, <span className="font-extrabold text-emerald-650">{userName || 'Kak'}</span>! Rasio tabungan Kakak bulan ini sehat sekali mencapai <span className="font-black">{savingRate.toFixed(0)}%</span>! Dompet aman terkendali. Pertahankan terus kebiasaan hemat ini ya! 🌟"
                    </p>
                  </div>
                ) : companionStatus === 'worried' ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      "Aduh gawat, <span className="font-extrabold text-rose-650">{userName || 'Kak'}</span>! Anggaran pos <span className="font-black text-rose-700 underline">{budgetAdvice?.categoryName}</span> jebol sebesar <span className="font-black">{formatRupiah(budgetAdvice?.overAmount || 0)}</span>! Yuk tunda belanja di pos ini dulu. ⚠️"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      "Halo <span className="font-extrabold text-indigo-650">{userName || 'Kak'}</span>, keuanganmu hari ini berada di posisi seimbang. Pastikan setiap pengeluaran kecil dicatat secara rapi agar tidak bocor ya! 📝"
                    </p>
                  </div>
                )}
              </div>
            )}

            {speechMode === 'mission' && (
              <div className="space-y-2 animate-scale-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-850">{activeMission.title}</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    activeMission.isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {activeMission.isSuccess ? 'Aman ✅' : 'Bocor ⚠️'}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-555 leading-snug">
                  {activeMission.description}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Terpakai: {formatRupiah(activeMission.spent)}</span>
                    <span>Batas: {formatRupiah(activeMission.target)}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeMission.isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (activeMission.spent / activeMission.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {speechMode === 'tip' && (
              <div className="animate-scale-in">
                <div className="flex items-center gap-1.5 text-indigo-850 font-black text-xs mb-1">
                  <Lightbulb size={13} className="text-amber-500" />
                  <span>Tips Hemat Hari Ini</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 italic leading-relaxed">
                  "{dailyTip}"
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-2.5">
              <span className="text-[10px] text-slate-400 font-extrabold">
                {speechMode === 'status' ? '1 dari 3: Status' : speechMode === 'mission' ? '2 dari 3: Misi' : '3 dari 3: Tips'}
              </span>
              <button 
                type="button"
                onClick={cycleSpeechMode}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[10.5px] font-black text-indigo-700 cursor-pointer active:scale-95 transition-all flex items-center gap-1 shadow-3xs"
              >
                <span>Lanjut</span>
                <ChevronRight size={11} strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-100/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 -translate-y-8 blur-xl"></div>
        <div className="absolute left-0 bottom-0 w-24 h-24 bg-purple-500/20 rounded-full -translate-x-6 translate-y-6 blur-lg"></div>

        <div className="relative z-10">
          <span className="text-xs font-bold tracking-wider uppercase opacity-90">Total Saldo {userName || 'Kak'}</span>
          <h2 className="text-3xl font-extrabold mt-1 tracking-tight">
            {loadingTxs ? (
              <span className="inline-block w-40 h-8 bg-white/20 animate-pulse rounded"></span>
            ) : (
              formatRupiah(currentBalance)
            )}
          </h2>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowUpRight size={17} className="text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] text-white/80 block uppercase tracking-wider font-bold">Pemasukan</span>
                <span className="text-[13px] font-black block">
                  {loadingTxs ? (
                    <span className="inline-block w-16 h-4 bg-white/20 animate-pulse rounded"></span>
                  ) : (
                    formatRupiah(totalIncome)
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowDownRight size={17} className="text-rose-300" />
              </div>
              <div>
                <span className="text-[10px] text-white/80 block uppercase tracking-wider font-bold">Pengeluaran</span>
                <span className="text-[13px] font-black block text-rose-100">
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

      {/* Accounts Balances Bar */}
      {accountBalances.filter(acc => acc.balance !== 0).length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block px-1">Dompet & Rekening</span>
          <div className="flex gap-2.5 overflow-x-auto pb-1 px-0.5 -mx-4 px-4 no-scrollbar">
            {accountBalances.filter(acc => acc.balance !== 0).map(acc => (
              <div 
                key={acc.id}
                className="p-3.5 bg-white border border-slate-200 rounded-2xl min-w-[125px] flex flex-col justify-between shadow-3xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center flex-shrink-0 shadow-3xs">
                    <DynamicIcon name={acc.icon} size={13} />
                  </div>
                  <span className="text-[10.5px] font-black text-slate-700 truncate leading-none">{acc.name}</span>
                </div>
                <span className="text-xs font-black text-slate-850 block mt-2.5">{formatRupiah(acc.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Financial Insights Panel */}
      <div className={`p-4 rounded-[22px] border ${insight.color} flex gap-3 transition-colors shadow-2xs`}>
        <div className="p-2 rounded-xl bg-white/50 backdrop-blur-xs flex-shrink-0 flex items-center justify-center self-start mt-0.5 animate-pulse">
          <insight.icon size={16} className="text-inherit" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">{insight.title}</h4>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 leading-relaxed">{insight.message}</p>
        </div>
      </div>

      {/* Chart Card */}
      <div className="p-4 rounded-[22px] bg-white border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Tren Pengeluaran</h3>
            <p className="text-xs text-slate-500 font-medium">Analisis pengeluaran 7 hari terakhir</p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-extrabold">
            Grafik Mingguan
          </div>
        </div>

        {loadingTxs ? (
          <div className="h-[120px] flex items-center justify-center bg-slate-50/50 rounded-lg">
            <span className="text-xs text-slate-500 animate-pulse">Menghitung tren keuangan...</span>
          </div>
        ) : transactions.filter(t => t.type === 'expense').length === 0 ? (
          <div className="h-[120px] flex flex-col items-center justify-center bg-slate-50/50 rounded-lg p-4 text-center">
            <Info size={18} className="text-slate-400 mb-1" />
            <span className="text-[11px] text-slate-550 font-bold">Belum ada pengeluaran dicatat minggu ini.</span>
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

              <line x1="10" y1={svgHeight - 15} x2={svgWidth - 10} y2={svgHeight - 15} stroke="#e2e8f0" strokeWidth="1" />
              <line x1="10" y1={svgHeight / 2 + 5} x2={svgWidth - 10} y2={svgHeight / 2 + 5} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="10" y1="15" x2={svgWidth - 10} y2="15" stroke="#e2e8f0" strokeWidth="1" />

              {areaPathStr && <path d={areaPathStr} fill="url(#chartGradient)" />}
              {pathStr && (
                <path 
                  d={pathStr} 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {chartPoints.map((pt, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="5" 
                    fill="#ffffff" 
                    stroke="#6366f1" 
                    strokeWidth="3" 
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
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 block">{d.day}</span>
                  <span className="text-[10px] font-black text-slate-700 block truncate">
                    {d.amount > 0 ? (d.amount >= 1000 ? `${Math.round(d.amount/1000)}k` : d.amount) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Slideable Insights Carousel (Anomaly & Budget Overruns) */}
      {carouselSlides.length > 0 && (
        <div className="relative group overflow-hidden">
          {/* Active Insight Card */}
          <div className="transition-all duration-500 ease-in-out">
            {carouselSlides[activeSlide].element}
          </div>

          {/* Indicator Dots for slide control */}
          {carouselSlides.length > 1 && (
            <div className="absolute bottom-2.5 right-4 flex gap-1.5 z-20">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx 
                      ? 'bg-white w-3' 
                      : 'bg-white/45 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Budgets Overviews */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Status Anggaran</h3>
          <button 
            onClick={() => setCurrentTab('budgets')} 
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center"
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
                <div key={b.categoryId} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className={`w-8.5 h-8.5 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                      {cat && <DynamicIcon name={cat.icon} size={15} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-800 truncate">{cat?.name}</h4>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatRupiah(b.spent)} dari {formatRupiah(b.limit)}
                      </span>
                    </div>
                  </div>

                  <div className="w-1/3 flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-extrabold ${isNearLimit ? 'text-rose-600' : 'text-indigo-650'}`}>
                      {percent}%
                    </span>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-rose-500' : 'bg-indigo-500'}`}
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
          <h3 className="text-sm font-bold text-slate-800">Transaksi Terakhir</h3>
          <button 
            onClick={() => setCurrentTab('transactions')} 
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center"
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
            <p className="text-xs text-slate-550 font-semibold">Mulai catat transaksi {userName || 'Kak'} hari ini!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Semua data tersimpan otomatis di perangkat.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 3).map(tx => {
              const cat = CATEGORIES.find(c => c.id === tx.categoryId);
              const acc = accounts.find(a => a.id === tx.accountId) || accounts.find(a => a.id === 'acc-tunai');
              return (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTxDetail(tx)}
                  className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm hover:bg-slate-50/70 transition-all cursor-pointer hover:translate-x-0.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8.5 h-8.5 rounded-xl ${cat?.color || 'bg-slate-50 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                      {cat && <DynamicIcon name={cat.icon} size={15} />}
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

                  <div className="text-right flex-shrink-0 pl-2">
                    <span className={`text-xs font-extrabold block ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
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
    </div>
  );
}
