import React, { useState, useEffect, useMemo } from 'react';
import { X, Coins, Receipt, BarChart3, Target, Wallet, Settings, Sparkles, MessageCircle } from 'lucide-react';
import type { Transaction, Budget } from '../types/finance';

interface FloatingAssistantProps {
  transactions: Transaction[];
  budgets: Budget[];
  userName: string;
  showOnboarding: boolean;
  onOpenAddTx: () => void;
  onOpenSettings: () => void;
  setCurrentTab: (tab: 'home' | 'transactions' | 'budgets' | 'goals' | 'bills') => void;
  currentTab: string;
}

export default function FloatingAssistant({
  transactions,
  budgets,
  userName,
  showOnboarding,
  onOpenAddTx,
  onOpenSettings,
  setCurrentTab,
  currentTab
}: FloatingAssistantProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Calculate Companion Financial Expression
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const isBudgetLeaked = useMemo(() => {
    const activeBudgets = budgets.filter(b => b.limit > 0);
    return activeBudgets.some(b => b.spent >= b.limit);
  }, [budgets]);

  const companionStatus = useMemo<'happy' | 'worried' | 'normal'>(() => {
    if (isBudgetLeaked) return 'worried';
    if (savingRate >= 40 && totalIncome > 0) return 'happy';
    return 'normal';
  }, [isBudgetLeaked, savingRate, totalIncome]);

  // 2. Trigger smart prompt today check
  useEffect(() => {
    if (!showOnboarding) {
      const todayStr = new Date().toISOString().split('T')[0];
      const hasTxToday = transactions.some(t => t.date === todayStr);
      const lastDismissed = localStorage.getItem('last_dismissed_daily_reminder');
      const isAlreadyDismissedToday = lastDismissed === todayStr;

      if (!hasTxToday && !isAlreadyDismissedToday) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setShowPrompt(false);
      }
    }
  }, [transactions, showOnboarding]);

  const handleDismissPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('last_dismissed_daily_reminder', todayStr);
    setShowPrompt(false);
  };

  const handleOpenMenu = () => {
    setIsExpanded(true);
    setShowPrompt(false);
  };

  const handleSelectShortcut = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  if (showOnboarding) return null;

  return (
    <div className="absolute bottom-24 left-4 z-40 flex flex-col items-start gap-2 select-none">
      
      {/* 1. Speech Prompt (Floating just above the avatar) */}
      {showPrompt && !isExpanded && (
        <div 
          onClick={handleOpenMenu}
          className="bg-white border border-indigo-150 p-2.5 rounded-2xl shadow-lg text-[11px] font-semibold text-slate-700 max-w-[170px] animate-scale-in cursor-pointer hover:bg-slate-50 transition-colors relative flex flex-col gap-1 pb-1.5"
        >
          {/* Triangular pointer */}
          <div className="absolute -bottom-1.5 left-5 w-2.5 h-2.5 bg-white border-b border-r border-indigo-150/40 rotate-45"></div>
          
          {/* Close button inside prompt */}
          <button
            onClick={handleDismissPrompt}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={10} strokeWidth={3} />
          </button>

          <p className="leading-snug pr-2">Sudah catat transaksi hari ini? 📝</p>
          <span className="text-[9px] text-indigo-650 font-black uppercase tracking-wider mt-0.5 animate-pulse">
            Klik untuk catat →
          </span>
        </div>
      )}

      {/* 2. Expanded Shortcut Assistant Panel */}
      {isExpanded && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4.5 shadow-2xl w-60 max-w-[80vw] animate-scale-in flex flex-col gap-3 relative">
          {/* Triangular pointer pointing to the avatar */}
          <div className="absolute -bottom-1.5 left-5 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>

          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600 animate-pulse" />
              <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">Asisten Finansial</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>

          {/* Welcome Text */}
          <p className="text-[11.5px] font-semibold text-slate-700 leading-normal">
            Halo Kak <span className="font-extrabold text-indigo-650">{userName || 'Kawan'}</span>! Apa yang bisa aku bantu sekarang?
          </p>

          {/* Action List (Shortcuts) */}
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => handleSelectShortcut(onOpenAddTx)}
              className="w-full p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-[10.5px] font-black text-indigo-700 flex items-center gap-2 cursor-pointer transition-all active:scale-97 text-left"
            >
              <Coins size={13} />
              <span>Catat Transaksi Baru</span>
            </button>

            <button
              onClick={() => handleSelectShortcut(() => setCurrentTab('home'))}
              className={`w-full p-2 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-97 text-left ${
                currentTab === 'home' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <BarChart3 size={13} />
              <span>Lihat Ringkasan & Tren</span>
            </button>

            <button
              onClick={() => handleSelectShortcut(() => setCurrentTab('transactions'))}
              className={`w-full p-2 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-97 text-left ${
                currentTab === 'transactions' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Receipt size={13} />
              <span>Riwayat Transaksi</span>
            </button>

            <button
              onClick={() => handleSelectShortcut(() => setCurrentTab('goals'))}
              className={`w-full p-2 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-97 text-left ${
                currentTab === 'goals' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Target size={13} />
              <span>Target Tabungan</span>
            </button>

            <button
              onClick={() => handleSelectShortcut(() => setCurrentTab('bills'))}
              className={`w-full p-2 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-97 text-left ${
                currentTab === 'bills' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Wallet size={13} />
              <span>Tagihan & Cicilan</span>
            </button>

            <button
              onClick={() => handleSelectShortcut(onOpenSettings)}
              className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10.5px] font-extrabold text-slate-600 flex items-center gap-2 cursor-pointer transition-all active:scale-97 text-left"
            >
              <Settings size={13} />
              <span>Buka Pengaturan</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Floating Circle Assistant Avatar */}
      <div 
        onClick={isExpanded ? () => setIsExpanded(false) : handleOpenMenu}
        className={`w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-108 active:scale-90 relative overflow-hidden z-40 select-none ${
          isExpanded 
            ? 'bg-slate-900 border-slate-800' 
            : companionStatus === 'happy'
            ? 'bg-indigo-50 border-indigo-200 animate-bounce-gentle'
            : companionStatus === 'worried'
            ? 'bg-rose-50 border-rose-200 animate-wiggle'
            : 'bg-indigo-50 border-indigo-150 animate-float'
        }`}
        title="Tanya Asisten"
      >
        {isExpanded ? (
          <MessageCircle size={20} className="text-white animate-pulse" />
        ) : (
          <>
            <img 
              src="/character-open.svg" 
              alt="Karakter Asisten Finansial" 
              className="w-14 h-14 object-contain translate-y-3.5 scale-135" 
            />
            {companionStatus === 'worried' && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border border-white flex items-center justify-center">
                <span className="text-[7px] font-black text-white">!</span>
              </div>
            )}
            {companionStatus === 'happy' && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                <span className="text-[7px] font-black text-white">✨</span>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
