import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Info,
  AlertCircle,
  Coins,
  Settings,
  CheckCircle2,
  Wallet,
  Home,
  Receipt,
  BarChart3,
  Target
} from 'lucide-react';
import { api } from './services/api';
import type { SavingsGoal, Transaction, Bill, Account } from './types/finance';
import { formatRupiah } from './utils/financeHelpers';

// Tab Components
import HomeTab from './components/tabs/HomeTab';
import HistoryTab from './components/tabs/HistoryTab';
import BudgetTab from './components/tabs/BudgetTab';
import SavingsTab from './components/tabs/SavingsTab';
import BillsTab from './components/tabs/BillsTab';

// Modal Components
import AddTxModal from './components/modals/AddTxModal';
import AddGoalModal from './components/modals/AddGoalModal';
import GoalFundModal from './components/modals/GoalFundModal';
import SettingsModal from './components/modals/SettingsModal';
import TxDetailDrawer from './components/modals/TxDetailDrawer';
import AddBillModal from './components/modals/AddBillModal';
import BillDetailDrawer from './components/modals/BillDetailDrawer';
import ManageCategoriesModal from './components/modals/ManageCategoriesModal';
import ManageAccountsModal from './components/modals/ManageAccountsModal';
import OnboardingModal from './components/modals/OnboardingModal';

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

  // Modal Visibility States
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [fundType, setFundType] = useState<'add' | 'withdraw'>('add');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('finance_username') || '');
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('finance_username'));
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [selectedBillDetail, setSelectedBillDetail] = useState<Bill | null>(null);
  const [showManageAccountsModal, setShowManageAccountsModal] = useState(false);

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

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: api.getAccounts,
  });

  const notifiedBillsRef = React.useRef(false);

  useEffect(() => {
    if (bills.length > 0 && !notifiedBillsRef.current) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const approachingBills = bills.filter(b => {
        if (b.status === 'paid') return false;
        const dueDate = new Date(b.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= -7 && diffDays <= 2;
      });

      if (approachingBills.length > 0) {
        approachingBills.forEach((b, idx) => {
          const dueDate = new Date(b.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let msg = '';
          if (diffDays === 0) {
            msg = `⚠️ Hari ini jatuh tempo: "${b.title}" (${formatRupiah(b.amount)})!`;
          } else if (diffDays === 1) {
            msg = `⚠️ Besok jatuh tempo: "${b.title}" (${formatRupiah(b.amount)})!`;
          } else if (diffDays === 2) {
            msg = `⏰ 2 hari lagi jatuh tempo: "${b.title}" (${formatRupiah(b.amount)})!`;
          } else {
            msg = `🚨 TERLAMBAT ${Math.abs(diffDays)} hari: "${b.title}" (${formatRupiah(b.amount)})!`;
          }

          setTimeout(() => {
            showToast(msg, diffDays <= 0 ? 'error' : 'info');
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('UangKu - Pengingat Tagihan', {
                  body: msg
                });
              } catch (e) {
                console.warn('Native notification failed:', e);
              }
            }
          }, idx * 1200);
        });
      }
      notifiedBillsRef.current = true;
    }
  }, [bills]);

  // --- React Query Mutations ---
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

  // --- Reset & Developer Seeding Actions ---
  const handleResetData = (seed: boolean) => {
    if (seed) {
      localStorage.removeItem('finance_transactions');
      localStorage.removeItem('finance_budgets');
      localStorage.removeItem('finance_savings_goals');
      localStorage.removeItem('finance_bills');
      localStorage.removeItem('finance_categories');
      localStorage.removeItem('finance_accounts');
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

  return (
    <div className="w-full min-h-screen bg-slate-50/50">

      {/* Dynamic Toast System */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-55 pointer-events-none max-w-[340px] w-full px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 pointer-events-auto transform translate-y-0 animate-scale-in text-xs font-semibold ${toast.type === 'success'
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200/50'
              : toast.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-white shadow-slate-955/20'
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
          <div className="bg-white rounded-[24px] p-5 max-w-[320px] w-full text-center space-y-4 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-888">{confirmDialog.title}</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{confirmDialog.message}</p>
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
      <div className="w-full sm:max-w-md mx-auto h-dvh sm:h-[90vh] bg-[#f8fafc] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200 flex flex-col relative overflow-hidden sm:my-8">

        {/* FIXED HEADER TOPBAR */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center z-30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100/70 flex items-center justify-center flex-shrink-0">
              {currentTab === 'home' && <Coins className="text-indigo-600 animate-float" size={18} />}
              {currentTab === 'transactions' && <Receipt className="text-indigo-600 animate-float" size={18} />}
              {currentTab === 'budgets' && <BarChart3 className="text-indigo-600 animate-float" size={18} />}
              {currentTab === 'bills' && <Wallet className="text-indigo-600 animate-float" size={18} />}
              {currentTab === 'goals' && <Target className="text-indigo-600 animate-float" size={18} />}
            </div>
            <div>
              <h1 className="text-[15px] font-black text-slate-800 leading-tight">
                {currentTab === 'home' && 'UangKu'}
                {currentTab === 'transactions' && 'Riwayat Transaksi'}
                {currentTab === 'budgets' && 'Anggaran Bulanan'}
                {currentTab === 'bills' && 'Tagihan & Piutang'}
                {currentTab === 'goals' && 'Target Tabungan'}
              </h1>
              <p className="text-[10px] text-slate-555 font-bold">
                {currentTab === 'home' && 'Pencatat Finansial Pribadi'}
                {currentTab === 'transactions' && `Temukan dan atur pengeluaran ${userName || 'Kak'}`}
                {currentTab === 'budgets' && 'Bantu kontrol pengeluaran per kategori'}
                {currentTab === 'bills' && 'Pantau hutang piutang jatuh tempo'}
                {currentTab === 'goals' && `Rencanakan masa depan keuangan ${userName || 'Kak'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-7.5 h-7.5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-250/20 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all cursor-pointer flex-shrink-0"
              title="Pengaturan Developer / Reset"
            >
              <Settings size={14} />
            </button>

            {currentTab === 'bills' ? (
              <button
                onClick={() => setShowAddBillModal(true)}
                className="px-3 py-1.5 rounded-full bg-indigo-650 hover:bg-indigo-750 active:scale-95 text-white text-[10.5px] font-extrabold flex items-center gap-1 shadow-md shadow-indigo-150 border border-indigo-700 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus size={12} strokeWidth={2.5} />
                <span>Tagihan</span>
              </button>
            ) : currentTab === 'goals' ? (
              <button
                onClick={() => setShowAddGoalModal(true)}
                className="px-3 py-1.5 rounded-full bg-indigo-650 hover:bg-indigo-750 active:scale-95 text-white text-[10.5px] font-extrabold flex items-center gap-1 shadow-md shadow-indigo-150 border border-indigo-700 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus size={12} strokeWidth={2.5} />
                <span>Target</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddTxModal(true)}
                className="px-3 py-1.5 rounded-full bg-indigo-650 hover:bg-indigo-750 active:scale-95 text-white text-[10.5px] font-extrabold flex items-center gap-1 shadow-md shadow-indigo-150 border border-indigo-700 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus size={12} strokeWidth={2.5} />
                <span>Transaksi</span>
              </button>
            )}
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(76px+env(safe-area-inset-bottom,0px))] scroll-smooth">

          {/* TAB 1: HOME/DASHBOARD */}
          {currentTab === 'home' && (
            <HomeTab
              transactions={transactions}
              budgets={budgets}
              accounts={accounts}
              loadingTxs={loadingTxs}
              loadingBudgets={loadingBudgets}
              setCurrentTab={(tab) => setCurrentTab(tab as 'home' | 'transactions' | 'budgets' | 'goals' | 'bills')}
              setSelectedTxDetail={setSelectedTxDetail}
              userName={userName}
            />
          )}

          {/* TAB 2: TRANSACTIONS LIST */}
          {currentTab === 'transactions' && (
            <HistoryTab
              transactions={transactions}
              accounts={accounts}
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
              setFundAmount={() => {}}
              openConfirm={openConfirm}
              onDeleteGoal={(id) => deleteGoalMutation.mutate(id)}
              userName={userName}
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
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] px-4 flex justify-around items-center z-30">

          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'home' ? 'text-indigo-650 font-black scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Home size={20} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
            <span className="text-[10.5px] font-black tracking-wide">Ringkasan</span>
          </button>

          <button
            onClick={() => setCurrentTab('transactions')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'transactions' ? 'text-indigo-650 font-black scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Receipt size={20} strokeWidth={currentTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10.5px] font-black tracking-wide">Riwayat</span>
          </button>

          <button
            onClick={() => setCurrentTab('budgets')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'budgets' ? 'text-indigo-650 font-black scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BarChart3 size={20} strokeWidth={currentTab === 'budgets' ? 2.5 : 2} />
            <span className="text-[10.5px] font-black tracking-wide">Anggaran</span>
          </button>

          <button
            onClick={() => setCurrentTab('bills')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'bills' ? 'text-indigo-650 font-black scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Wallet size={20} strokeWidth={currentTab === 'bills' ? 2.5 : 2} />
            <span className="text-[10.5px] font-black tracking-wide">Tagihan</span>
          </button>

          <button
            onClick={() => setCurrentTab('goals')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${currentTab === 'goals' ? 'text-indigo-650 font-black scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Target size={20} strokeWidth={currentTab === 'goals' ? 2.5 : 2} />
            <span className="text-[10.5px] font-black tracking-wide">Target</span>
          </button>

        </div>

        {/* MODAL 1: ADD TRANSACTION */}
        <AddTxModal
          isOpen={showAddTxModal}
          onClose={() => setShowAddTxModal(false)}
          accounts={accounts}
          showToast={showToast}
        />

        {/* MODAL 4: ADD SAVINGS GOAL */}
        <AddGoalModal
          isOpen={showAddGoalModal}
          onClose={() => setShowAddGoalModal(false)}
          userName={userName}
          showToast={showToast}
        />

        {/* MODAL 4.5: GOAL FUND ACTION */}
        <GoalFundModal
          isOpen={selectedGoal !== null}
          onClose={() => setSelectedGoal(null)}
          selectedGoal={selectedGoal}
          fundType={fundType}
          showToast={showToast}
        />

        {/* MODAL 5.5: SETTINGS */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          userName={userName}
          setUserName={setUserName}
          showToast={showToast}
          openConfirm={openConfirm}
          handleResetData={handleResetData}
          onOpenManageCategories={() => setShowManageCategoriesModal(true)}
          onOpenManageAccounts={() => setShowManageAccountsModal(true)}
        />

        {/* DRAWER 6: TRANSACTION DETAIL */}
        <TxDetailDrawer
          isOpen={selectedTxDetail !== null}
          onClose={() => setSelectedTxDetail(null)}
          selectedTx={selectedTxDetail}
          userName={userName}
          openConfirm={openConfirm}
          showToast={showToast}
        />

        {/* MODAL 6.5: ADD BILL */}
        <AddBillModal
          isOpen={showAddBillModal}
          onClose={() => setShowAddBillModal(false)}
          userName={userName}
          showToast={showToast}
        />

        {/* DRAWER 6.5: BILL DETAIL */}
        <BillDetailDrawer
          isOpen={selectedBillDetail !== null}
          onClose={() => setSelectedBillDetail(null)}
          selectedBillDetail={selectedBillDetail}
          accounts={accounts}
          transactions={transactions}
          userName={userName}
          openConfirm={openConfirm}
          showToast={showToast}
        />

        {/* MODAL 7: MANAGE CATEGORIES */}
        <ManageCategoriesModal
          isOpen={showManageCategoriesModal}
          onClose={() => setShowManageCategoriesModal(false)}
          userName={userName}
          showToast={showToast}
        />

        {/* MODAL 8: MANAGE ACCOUNTS */}
        <ManageAccountsModal
          isOpen={showManageAccountsModal}
          onClose={() => setShowManageAccountsModal(false)}
          accounts={accounts}
          userName={userName}
          showToast={showToast}
        />

        {/* MODAL 10: ONBOARDING */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          setUserName={setUserName}
          showToast={showToast}
        />

      </div>
    </div>
  );
}
