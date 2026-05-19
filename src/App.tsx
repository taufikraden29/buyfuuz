import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  X, 
  Info,
  AlertCircle,
  Coins,
  Settings,
  RefreshCw,
  CheckCircle2,
  Wallet,
  Home,
  Receipt,
  BarChart3,
  Target,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { api, CATEGORIES } from './services/api';
import DynamicIcon from './components/DynamicIcon';
import type { SavingsGoal, Transaction, Bill } from './types/finance';
// Shared Utilities & Templates
import { 
  formatRupiah, 
  getLivePreviewText, 
  TITLE_TEMPLATES, 
  BILL_TEMPLATES, 
  GOAL_TEMPLATES
} from './utils/financeHelpers';


// Tab Components
import HomeTab from './components/tabs/HomeTab';
import HistoryTab from './components/tabs/HistoryTab';
import BudgetTab from './components/tabs/BudgetTab';
import SavingsTab from './components/tabs/SavingsTab';
import BillsTab from './components/tabs/BillsTab';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState<'home' | 'transactions' | 'budgets' | 'goals' | 'bills'>('home');
  
  // Custom Toast Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };


  // Add Transaction Modal State
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('cat-makanan');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');

  // Add Savings Goal Modal State
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalColor, setGoalColor] = useState('bg-emerald-500');

  // Goal Fund Action Modal State
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundType, setFundType] = useState<'add' | 'withdraw'>('add');


  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Transaction Detail Drawer State
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  // Bills & Receivables State
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billType, setBillType] = useState<'debt' | 'receivable'>('debt');
  const [billContact, setBillContact] = useState('');
  const [billDueDate, setBillDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNotes, setBillNotes] = useState('');
  const [selectedBillDetail, setSelectedBillDetail] = useState<Bill | null>(null);
  const [billIsRecurring, setBillIsRecurring] = useState(false);
  const [billIsInstallment, setBillIsInstallment] = useState(false);
  const [billInstallmentsCount, setBillInstallmentsCount] = useState('3');
  const [drawerPayMonthsCount, setDrawerPayMonthsCount] = useState(1);

  useEffect(() => {
    setDrawerPayMonthsCount(1);
  }, [selectedBillDetail]);

  // --- React Query Queries ---
  const { data: transactions = [], isLoading: loadingTxs } = useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: api.getBudgets,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: api.getSavingsGoals,
  });

  const { data: bills = [], isLoading: loadingBills } = useQuery({
    queryKey: ['bills'],
    queryFn: api.getBills,
  });

  // --- React Query Mutations ---
  const addTxMutation = useMutation({
    mutationFn: api.addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      resetTxForm();
      setShowAddTxModal(false);
      showToast('Transaksi berhasil dicatat! 📝', 'success');
    },
    onError: () => {
      showToast('Gagal menambahkan transaksi.', 'error');
    }
  });

  const deleteTxMutation = useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setSelectedTxDetail(null);
      showToast('Transaksi berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus transaksi.', 'error');
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ categoryId, limit }: { categoryId: string; limit: number }) => 
      api.updateBudget(categoryId, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('Batas anggaran bulanan diperbarui! 🎯', 'success');
    },
    onError: () => {
      showToast('Gagal memperbarui anggaran.', 'error');
    }
  });

  const addGoalMutation = useMutation({
    mutationFn: api.addSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowAddGoalModal(false);
      setGoalTitle('');
      setGoalTarget('');
      showToast('Target tabungan baru ditambahkan! 🏆', 'success');
    },
    onError: () => {
      showToast('Gagal membuat target tabungan.', 'error');
    }
  });

  const updateGoalProgressMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => 
      api.addSavingsProgress(id, amount),
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setSelectedGoal(null);
      setFundAmount('');
      const dirText = fundType === 'add' ? 'ditabung' : 'ditarik';
      showToast(`Dana berhasil ${dirText}! 💰`, 'success');
      
      // If 100% completed, celebrate
      if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
        showToast(`Selamat! Target "${updatedGoal.title}" tercapai! 🎉`, 'success');
      }
    },
    onError: () => {
      showToast('Gagal memperbarui dana tabungan.', 'error');
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: api.deleteSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setSelectedGoal(null);
      showToast('Target tabungan berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus target tabungan.', 'error');
    }
  });

  const addBillMutation = useMutation({
    mutationFn: api.addBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setShowAddBillModal(false);
      resetBillForm();
      showToast('Tagihan berhasil dicatat! 💸', 'success');
    },
    onError: () => {
      showToast('Gagal mencatat tagihan.', 'error');
    }
  });

  const updateBillStatusMutation = useMutation({
    mutationFn: ({ id, status, payMonthsCount }: { id: string; status: 'unpaid' | 'paid'; payMonthsCount?: number }) => 
      api.updateBillStatus(id, status, payMonthsCount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('Status tagihan diperbarui! 🎯', 'success');
    },
    onError: () => {
      showToast('Gagal memperbarui status tagihan.', 'error');
    }
  });

  const deleteBillMutation = useMutation({
    mutationFn: api.deleteBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setSelectedBillDetail(null);
      showToast('Catatan tagihan berhasil dihapus! 🗑️', 'info');
    },
    onError: () => {
      showToast('Gagal menghapus tagihan.', 'error');
    }
  });

  const resetBillForm = () => {
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

  // --- Reset & Developer Seeding Actions ---
  const handleResetData = (seed: boolean) => {
    if (seed) {
      localStorage.removeItem('finance_transactions');
      localStorage.removeItem('finance_budgets');
      localStorage.removeItem('finance_savings_goals');
      localStorage.removeItem('finance_bills');
      // Reload pages to re-trigger API seeding
      window.location.reload();
    } else {
      localStorage.setItem('finance_transactions', JSON.stringify([]));
      localStorage.setItem('finance_budgets', JSON.stringify([]));
      localStorage.setItem('finance_savings_goals', JSON.stringify([]));
      localStorage.setItem('finance_bills', JSON.stringify([]));
      queryClient.setQueryData(['transactions'], []);
      queryClient.setQueryData(['budgets'], []);
      queryClient.setQueryData(['goals'], []);
      queryClient.setQueryData(['bills'], []);
      setShowSettingsModal(false);
      showToast('Semua data berhasil dibersihkan! 🧹', 'info');
    }
  };

  // --- Form Reset Helpers ---
  const resetTxForm = () => {
    setTxTitle('');
    setTxAmount('');
    setTxType('expense');
    setTxCategory('cat-makanan');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
  };


  // --- Handlers ---
  const handleAddTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount) return;

    addTxMutation.mutate({
      title: txTitle,
      amount: Math.abs(Number(txAmount)),
      type: txType,
      categoryId: txCategory,
      date: txDate,
      notes: txNotes || undefined,
    });
  };

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget) return;

    addGoalMutation.mutate({
      title: goalTitle,
      targetAmount: Math.abs(Number(goalTarget)),
      color: goalColor,
    });
  };

  const handleGoalFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !fundAmount) return;

    const amt = Math.abs(Number(fundAmount)) * (fundType === 'add' ? 1 : -1);
    
    // Validation: make sure withdraw amount doesn't exceed current amount
    if (fundType === 'withdraw' && Math.abs(amt) > selectedGoal.currentAmount) {
      showToast('Penarikan dana melebihi tabungan saat ini!', 'error');
      return;
    }

    updateGoalProgressMutation.mutate({
      id: selectedGoal.id,
      amount: amt
    });
  };


  return (
    // Outer frame device emulator for desktop, standard mobile fit on touch devices
    <div className="w-full min-h-screen bg-slate-50/50">
      
      {/* Dynamic Toast System */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-55 pointer-events-none max-w-[340px] w-full px-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 pointer-events-auto transform translate-y-0 animate-scale-in text-xs font-semibold ${
              toast.type === 'success' 
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200/50' 
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-white shadow-slate-950/20'
                : 'bg-rose-500 border-rose-400 text-white shadow-rose-200/50'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-white shrink-0" />}
            {toast.type === 'info' && <Info size={16} className="text-slate-300 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-white shrink-0" />}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Popup Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-55 p-6">
          <div className="bg-white rounded-[24px] p-5 max-w-[320px] w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{confirmDialog.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Responsive Web Container */}
      <div className="w-full sm:max-w-md mx-auto h-dvh sm:h-[90vh] bg-[#fafaff] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-100/80 flex flex-col relative overflow-hidden sm:my-8">


        {/* Dynamic Screen View Container */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 scroll-smooth">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9.5 h-9.5 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                {currentTab === 'home' && <Coins className="text-indigo-500 animate-float" size={19} />}
                {currentTab === 'transactions' && <Receipt className="text-indigo-500 animate-float" size={19} />}
                {currentTab === 'budgets' && <BarChart3 className="text-indigo-500 animate-float" size={19} />}
                {currentTab === 'bills' && <Wallet className="text-indigo-500 animate-float" size={19} />}
                {currentTab === 'goals' && <Target className="text-indigo-500 animate-float" size={19} />}
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold text-slate-800 leading-tight">
                  {currentTab === 'home' && 'UangKu'}
                  {currentTab === 'transactions' && 'Riwayat Transaksi'}
                  {currentTab === 'budgets' && 'Anggaran Bulanan'}
                  {currentTab === 'bills' && 'Tagihan & Piutang'}
                  {currentTab === 'goals' && 'Target Tabungan'}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  {currentTab === 'home' && 'Pencatat Finansial Pribadi'}
                  {currentTab === 'transactions' && 'Temukan dan atur pengeluaran Anda'}
                  {currentTab === 'budgets' && 'Bantu kontrol pengeluaran per kategori'}
                  {currentTab === 'bills' && 'Pantau hutang piutang jatuh tempo'}
                  {currentTab === 'goals' && 'Rencanakan masa depan keuangan Anda'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer flex-shrink-0"
                title="Pilihan Developer / Reset"
              >
                <Settings size={15} />
              </button>

              {currentTab === 'bills' ? (
                <button 
                  onClick={() => setShowAddBillModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-150 transition-all cursor-pointer flex-shrink-0"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Tagihan</span>
                </button>
              ) : currentTab === 'goals' ? (
                <button 
                  onClick={() => setShowAddGoalModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-150 transition-all cursor-pointer flex-shrink-0"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Target</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    resetTxForm();
                    setShowAddTxModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-150 transition-all cursor-pointer flex-shrink-0"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Transaksi</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: HOME/DASHBOARD */}
          {currentTab === 'home' && (
            <HomeTab
              transactions={transactions}
              budgets={budgets}
              loadingTxs={loadingTxs}
              loadingBudgets={loadingBudgets}
              setCurrentTab={(tab) => setCurrentTab(tab as any)}
              setSelectedTxDetail={setSelectedTxDetail}
            />
          )}

          {/* TAB 2: TRANSACTIONS LIST */}
          {currentTab === 'transactions' && (
            <HistoryTab
              transactions={transactions}
              loadingTxs={loadingTxs}
              setSelectedTxDetail={setSelectedTxDetail}
            />
          )}

          {/* TAB 3: BUDGETS */}
          {currentTab === 'budgets' && (
            <BudgetTab
              budgets={budgets}
              loadingBudgets={loadingBudgets}
              onUpdateBudget={(categoryId, limit) => updateBudgetMutation.mutate({ categoryId, limit })}
            />
          )}

          {/* TAB 4: SAVINGS GOALS */}
          {currentTab === 'goals' && (
            <SavingsTab
              goals={goals}
              loadingGoals={loadingGoals}
              setSelectedGoal={setSelectedGoal}
              setFundType={setFundType}
              setFundAmount={setFundAmount}
              openConfirm={openConfirm}
              onDeleteGoal={(id) => deleteGoalMutation.mutate(id)}
            />
          )}

          {/* TAB 5: BILLS & RECEIVABLES */}
          {currentTab === 'bills' && (
            <BillsTab
              bills={bills}
              loadingBills={loadingBills}
              setSelectedBillDetail={setSelectedBillDetail}
            />
          )}

        </div>

        {/* BOTTOM NAVIGATION TAB BAR */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] px-4 flex justify-around items-center z-30">
          
          <button 
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'home' ? 'text-indigo-650 scale-105 animate-pulse-slow' : 'text-slate-450 hover:text-slate-600'}`}
          >
            <Home size={20} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
            <span className="text-[10.5px] font-extrabold tracking-wide">Ringkasan</span>
          </button>

          <button 
            onClick={() => setCurrentTab('transactions')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'transactions' ? 'text-indigo-650 scale-105 animate-pulse-slow' : 'text-slate-450 hover:text-slate-600'}`}
          >
            <Receipt size={20} strokeWidth={currentTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10.5px] font-extrabold tracking-wide">Riwayat</span>
          </button>

          <button 
            onClick={() => setCurrentTab('budgets')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'budgets' ? 'text-indigo-650 scale-105 animate-pulse-slow' : 'text-slate-450 hover:text-slate-600'}`}
          >
            <BarChart3 size={20} strokeWidth={currentTab === 'budgets' ? 2.5 : 2} />
            <span className="text-[10.5px] font-extrabold tracking-wide">Anggaran</span>
          </button>

          <button 
            onClick={() => setCurrentTab('bills')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'bills' ? 'text-indigo-650 scale-105 animate-pulse-slow' : 'text-slate-450 hover:text-slate-600'}`}
          >
            <Wallet size={20} strokeWidth={currentTab === 'bills' ? 2.5 : 2} />
            <span className="text-[10.5px] font-extrabold tracking-wide">Tagihan</span>
          </button>

          <button 
            onClick={() => setCurrentTab('goals')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'goals' ? 'text-indigo-650 scale-105 animate-pulse-slow' : 'text-slate-450 hover:text-slate-600'}`}
          >
            <Target size={20} strokeWidth={currentTab === 'goals' ? 2.5 : 2} />
            <span className="text-[10.5px] font-extrabold tracking-wide">Target</span>
          </button>

        </div>

        {/* MODAL 1: ADD TRANSACTION */}
        {showAddTxModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Catat Transaksi Baru</h3>
                  <p className="text-xs text-slate-400">Atur uang masuk dan keluar dengan cermat</p>
                </div>
                <button 
                  onClick={() => setShowAddTxModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddTransactionSubmit} className="space-y-3.5">
                {/* Transaction Type Tab */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      setTxCategory('cat-makanan');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      txType === 'expense' 
                        ? 'bg-white text-rose-500 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Pengeluaran (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income');
                      setTxCategory('cat-gaji');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      txType === 'income' 
                        ? 'bg-white text-emerald-600 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Pemasukan (+)
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Jumlah Uang</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                       type="number"
                       required
                       placeholder="0"
                       value={txAmount}
                       onChange={(e) => setTxAmount(e.target.value)}
                       className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-bold text-slate-700"
                    />
                  </div>
                  {/* Dynamic Rupiah Preview */}
                  {txAmount && (
                    <div className="text-xs text-indigo-500 font-bold mt-1 text-right animate-scale-in">
                      Format: {getLivePreviewText(txAmount)}
                    </div>
                  )}
                </div>

                {/* Title Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Judul / Keperluan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makan Ramen, Gaji Pokok, dst."
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-medium text-slate-700"
                  />
                  {/* Title Templates */}
                  <div className="flex flex-wrap gap-1.5 mt-2 animate-scale-in">
                    {(TITLE_TEMPLATES[txCategory] || []).map((tpl) => (
                      <button
                        type="button"
                        key={tpl}
                        onClick={() => setTxTitle(tpl)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 text-[11px] font-bold text-indigo-650 transition-all cursor-pointer hover:scale-102 active:scale-95"
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Grid Picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Kategori</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.filter(c => txType === 'income' ? c.type === 'income' || c.type === 'both' : c.type === 'expense' || c.type === 'both').map(c => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setTxCategory(c.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          txCategory === c.id 
                            ? 'bg-indigo-50 border-indigo-200 scale-102 ring-1 ring-indigo-100' 
                            : 'bg-white border-slate-100 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-8.5 h-8.5 rounded-lg ${c.color} flex items-center justify-center flex-shrink-0`}>
                          <DynamicIcon name={c.icon} size={15} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-650 truncate max-w-full">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Tanggal</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                  <textarea
                    placeholder="Tambahkan detail catatan kecil..."
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-medium text-slate-700 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={addTxMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-98 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-indigo-150 transition-all cursor-pointer"
                >
                  {addTxMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* MODAL 2: ADD SAVINGS GOAL */}
        {showAddGoalModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Buat Target Tabungan</h3>
                  <p className="text-xs text-slate-400">Sisihkan dana untuk mimpi Anda</p>
                </div>
                <button 
                  onClick={() => setShowAddGoalModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddGoalSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Nama Target / Rencana</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beli Laptop Baru, Liburan Jepang"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-medium text-slate-700"
                  />
                  {/* Goal Title Templates */}
                  <div className="flex flex-wrap gap-1.5 mt-2 animate-scale-in">
                    {GOAL_TEMPLATES.map((tpl) => (
                      <button
                        type="button"
                        key={tpl}
                        onClick={() => setGoalTitle(tpl)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 text-[11px] font-bold text-indigo-650 transition-all cursor-pointer hover:scale-102 active:scale-95"
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Target Nominal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-bold text-slate-700"
                    />
                  </div>
                  {/* Dynamic Preview */}
                  {goalTarget && (
                    <div className="text-xs text-indigo-550 font-bold mt-1 text-right animate-scale-in">
                      Format: {getLivePreviewText(goalTarget)}
                    </div>
                  )}
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Pilih Warna Aksen</label>
                  <div className="flex gap-3">
                    {[
                      { class: 'bg-emerald-500', name: 'Emerald' },
                      { class: 'bg-indigo-500', name: 'Indigo' },
                      { class: 'bg-pink-500', name: 'Pink' },
                      { class: 'bg-amber-500', name: 'Amber' },
                      { class: 'bg-purple-500', name: 'Purple' }
                    ].map(c => (
                      <button
                        type="button"
                        key={c.class}
                        onClick={() => setGoalColor(c.class)}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${c.class} ${
                          goalColor === c.class ? 'ring-3 ring-indigo-200 scale-110' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addGoalMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-98 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-indigo-150 transition-all cursor-pointer"
                >
                  {addGoalMutation.isPending ? 'Membuat...' : 'Buat Target'}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* MODAL 3: SAVINGS ACTION (ADD/WITHDRAW PROGRESS) */}
        {selectedGoal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {fundType === 'add' ? 'Tabung Uang' : 'Tarik Uang'}
                  </h3>
                  <p className="text-xs text-slate-400">Target: {selectedGoal.title}</p>
                </div>
                <button 
                  onClick={() => setSelectedGoal(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleGoalFundSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Nominal Uang</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-200 transition-colors font-bold text-slate-700"
                    />
                  </div>
                  {/* Dynamic Preview */}
                  {fundAmount && (
                    <div className="text-xs text-indigo-500 font-bold mt-1 text-right animate-scale-in">
                      Format: {getLivePreviewText(fundAmount)}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    Saldo tabungan saat ini: <span className="font-bold text-slate-650">{formatRupiah(selectedGoal.currentAmount)}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={updateGoalProgressMutation.isPending}
                  className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                    fundType === 'add' 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-150' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-150'
                  }`}
                >
                  {updateGoalProgressMutation.isPending 
                    ? 'Memproses...' 
                    : fundType === 'add' ? 'Konfirmasi Tabung' : 'Konfirmasi Tarik'
                  }
                </button>
              </form>

            </div>
          </div>
        )}

        {/* MODAL 4: DEVELOPER SETTINGS MODAL */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pengaturan Aplikasi</h3>
                  <p className="text-[10px] text-slate-400">Atur database lokal aplikasi UangKu</p>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl">
                  <div className="flex gap-2">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider">Penyimpanan Lokal (Local Storage)</h4>
                      <p className="text-[10px] text-indigo-600 mt-1 leading-relaxed">
                        Seluruh data pencatatan Anda tersimpan aman di dalam browser perangkat ini dan dapat di-reset kembali ke demo awal kapan saja.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (confirm('Muat ulang data demo awal? Semua modifikasi saat ini akan ditimpa.')) {
                        handleResetData(true);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw size={14} className="text-indigo-500 animate-spin-slow" />
                      Reset Data ke Demo Awal
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      openConfirm(
                        'Bersihkan Semua Data',
                        'Apakah Anda yakin ingin menghapus seluruh transaksi, anggaran, dan target tabungan Anda? Data tidak dapat dikembalikan.',
                        () => handleResetData(false)
                      );
                    }}
                    className="w-full p-3 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 size={14} className="text-rose-500" />
                      Kosongkan Seluruh Database
                    </span>
                    <ChevronRight size={14} className="text-rose-400" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 5: TRANSACTION DETAIL DRAWER */}
        {selectedTxDetail && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Transaksi</h3>
                  <p className="text-[10px] text-slate-400">Informasi lengkap transaksi Anda</p>
                </div>
                <button 
                  onClick={() => setSelectedTxDetail(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {(() => {
                const category = CATEGORIES.find(c => c.id === selectedTxDetail.categoryId);
                return (
                  <div className="space-y-4">
                    <div className="space-y-3.5 text-xs text-slate-700">
                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-400">Kategori</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`w-2.5 h-2.5 rounded-full ${category?.color.split(' ')[0] || 'bg-slate-200'}`}></span>
                          <span>{category?.name || 'Lain-lain'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-400">Nominal Uang</span>
                        <span className={`font-black text-sm ${selectedTxDetail.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {selectedTxDetail.type === 'income' ? '+' : '-'}{formatRupiah(selectedTxDetail.amount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-400">Waktu Pencatatan</span>
                        <span className="font-bold text-slate-600">
                          {new Date(selectedTxDetail.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <span className="text-slate-400 block mb-1">Catatan Kecil</span>
                      <p className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
                        {selectedTxDetail.notes || 'Tidak ada catatan tambahan untuk transaksi ini.'}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setSelectedTxDetail(null)}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                      <button 
                        onClick={() => {
                          openConfirm(
                            'Hapus Transaksi',
                            `Apakah Anda yakin ingin menghapus pencatatan "${selectedTxDetail.title}" sebesar ${formatRupiah(selectedTxDetail.amount)}? Tindakan ini tidak dapat dibatalkan.`,
                            () => deleteTxMutation.mutate(selectedTxDetail.id)
                          );
                        }}
                        className="py-2.5 px-4 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                        Hapus Transaksi
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* MODAL 6: ADD BILL */}
        {showAddBillModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Catat Tagihan / Piutang</h3>
                  <p className="text-[10px] text-slate-400">Kelola kewajiban bayar dan hak tagih Anda</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddBillModal(false);
                    resetBillForm();
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!billTitle.trim() || !billAmount || !billContact.trim()) return;
                  addBillMutation.mutate({
                    title: billTitle,
                    amount: Math.abs(Number(billAmount)),
                    type: billType,
                    contactName: billContact,
                    dueDate: billDueDate,
                    status: 'unpaid',
                    isRecurring: billIsRecurring,
                    isInstallment: billIsInstallment,
                    installmentCount: billIsInstallment ? Number(billInstallmentsCount) : undefined,
                    notes: billNotes || undefined
                  });
                }} 
                className="space-y-3.5"
              >
                {/* Bill Type Selector */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBillType('debt')}
                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      billType === 'debt' 
                        ? 'bg-white text-amber-600 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Hutang (Saya Berhutang)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillType('receivable')}
                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      billType === 'receivable' 
                        ? 'bg-white text-emerald-600 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Piutang (Teman Berhutang)
                  </button>
                </div>

                {/* Contact Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Nama Kontak (Orang / Lembaga)</label>
                  <input 
                    type="text"
                    required
                    placeholder={billType === 'debt' ? 'Contoh: Bu Kos, Indihome' : 'Contoh: Andi, Rian'}
                    value={billContact}
                    onChange={(e) => setBillContact(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors font-semibold"
                  />
                </div>

                {/* Title Templates Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Template Judul</label>
                  <div className="flex flex-wrap gap-1.5">
                    {BILL_TEMPLATES[billType].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBillTitle(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          billTitle === t
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-600 font-extrabold shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100/50 border-slate-100 text-slate-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Keterangan / Deskripsi</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Bayar Listrik Bulanan"
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors font-semibold"
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Jumlah Nominal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors font-bold text-slate-700"
                    />
                  </div>
                  {/* Live Rupiah Preview */}
                  {billAmount && (
                    <span className="text-xs text-indigo-550 font-extrabold mt-1 block px-1 animate-scale-in">
                      {getLivePreviewText(billAmount)}
                    </span>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Tanggal Jatuh Tempo</label>
                  <input 
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors font-bold text-slate-600"
                  />
                </div>

                {/* Recurring Monthly Toggler */}
                {!billIsInstallment && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/70">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Ulangi Setiap Bulan</span>
                      <span className="text-[11px] text-slate-400">Tagihan baru otomatis terbit untuk bulan depan setelah lunas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBillIsRecurring(!billIsRecurring)}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
                        billIsRecurring ? 'bg-indigo-500' : 'bg-slate-200'
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
                  <div className="space-y-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Angsuran / Cicilan (Paylater)</span>
                        <span className="text-[11px] text-slate-400">Pecah nominal menjadi beberapa cicilan bulanan</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBillIsInstallment(!billIsInstallment)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
                          billIsInstallment ? 'bg-indigo-500' : 'bg-slate-200'
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
                      <div className="pt-2 border-t border-slate-200/50 space-y-2 animate-scale-in">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Jumlah Angsuran (Bulan)</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['3', '6', '12', '24'].map(months => (
                              <button
                                key={months}
                                type="button"
                                onClick={() => setBillInstallmentsCount(months)}
                                className={`py-1 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                                  billInstallmentsCount === months
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-650 font-extrabold shadow-2xs'
                                    : 'bg-white hover:bg-slate-50 border-slate-200/60 text-slate-500'
                                }`}
                              >
                                {months}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5">
                          <span>Estimasi Angsuran / Bulan:</span>
                          <span className="font-extrabold text-indigo-600">
                            {billAmount ? formatRupiah(Math.round(Number(billAmount) / Number(billInstallmentsCount))) : 'Rp 0'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                  <textarea 
                    placeholder="Tulis detail tambahan jika diperlukan..."
                    value={billNotes}
                    onChange={(e) => setBillNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-slate-100 focus:border-indigo-100 transition-colors font-semibold"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={addBillMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {addBillMutation.isPending ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DRAWER: BILL DETAIL */}
        {selectedBillDetail && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-100/80 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase inline-block mb-1.5 ${
                    selectedBillDetail.status === 'paid'
                      ? 'bg-slate-100 text-slate-500'
                      : selectedBillDetail.type === 'debt'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100/30'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100/30'
                  }`}>
                    {selectedBillDetail.type === 'debt' ? 'Hutang Saya' : 'Piutang Saya'}
                  </span>
                  <h3 className="text-sm font-black text-slate-800">{selectedBillDetail.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedBillDetail(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Status Pembayaran</span>
                  <span className={`font-black uppercase text-[10px] ${selectedBillDetail.status === 'paid' ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                    {selectedBillDetail.status === 'paid' ? 'Lunas 🎉' : 'Belum Lunas'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Nominal Uang</span>
                  <span className="font-extrabold text-sm text-slate-800">{formatRupiah(selectedBillDetail.amount)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Kontak</span>
                  <span className="font-bold text-slate-600">{selectedBillDetail.contactName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Tanggal Jatuh Tempo</span>
                  <span className="font-bold text-slate-600">
                    {new Date(selectedBillDetail.dueDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {selectedBillDetail.isRecurring && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">Tipe Pengulangan</span>
                    <span className="font-extrabold text-indigo-650 flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin-slow" />
                      Berulang Bulanan
                    </span>
                  </div>
                )}

                {selectedBillDetail.isInstallment && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">Tipe Pembayaran</span>
                    <span className="font-extrabold text-indigo-650">
                      Angsuran ({selectedBillDetail.installmentNumber}/{selectedBillDetail.installmentCount})
                    </span>
                  </div>
                )}

                <div className="py-1">
                  <span className="text-slate-400 block mb-1 font-semibold">Catatan Kecil</span>
                  <p className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
                    {selectedBillDetail.notes || 'Tidak ada catatan tambahan untuk tagihan ini.'}
                  </p>
                </div>

                {selectedBillDetail.isInstallment && selectedBillDetail.status === 'unpaid' && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5 my-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Jumlah Bulan yang Dibayar</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: selectedBillDetail.installmentCount! - selectedBillDetail.installmentNumber! + 1 }, (_, index) => index + 1).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDrawerPayMonthsCount(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            drawerPayMonthsCount === m
                              ? 'bg-indigo-55 border-indigo-100 text-indigo-650 font-extrabold shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200/60 text-slate-500'
                          }`}
                        >
                          {m === (selectedBillDetail.installmentCount! - selectedBillDetail.installmentNumber! + 1) ? `Semua (${m} Bln)` : `${m} Bulan`}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold">Total Pembayaran:</span>
                      <span className="font-extrabold text-indigo-650 text-xs">
                        {formatRupiah(selectedBillDetail.amount * drawerPayMonthsCount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => {
                    const newStatus = selectedBillDetail.status === 'paid' ? 'unpaid' : 'paid';
                    updateBillStatusMutation.mutate({ 
                      id: selectedBillDetail.id, 
                      status: newStatus,
                      payMonthsCount: newStatus === 'paid' ? drawerPayMonthsCount : undefined
                    });
                    setSelectedBillDetail(null);
                  }}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedBillDetail.status === 'paid'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {selectedBillDetail.status === 'paid' ? 'Tandai Belum Lunas' : 'Tandai Lunas & Selesai'}
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedBillDetail(null)}
                    className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button 
                    onClick={() => {
                      openConfirm(
                        'Hapus Catatan',
                        `Apakah Anda yakin ingin menghapus catatan tagihan "${selectedBillDetail.title}"?`,
                        () => deleteBillMutation.mutate(selectedBillDetail.id)
                      );
                    }}
                    className="py-2.5 px-4 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
