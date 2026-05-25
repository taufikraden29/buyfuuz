import type { Transaction, Category, Budget, SavingsGoal, Bill, Account } from '../types/finance';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-makanan', name: 'Makanan & Minuman', icon: 'Utensils', color: 'bg-orange-50 text-orange-500 border border-orange-200', hexColor: '#f97316', type: 'expense' },
  { id: 'cat-belanja', name: 'Belanja', icon: 'ShoppingBag', color: 'bg-purple-50 text-purple-500 border border-purple-200', hexColor: '#a855f7', type: 'expense' },
  { id: 'cat-transport', name: 'Transportasi', icon: 'Car', color: 'bg-blue-50 text-blue-500 border border-blue-200', hexColor: '#3b82f6', type: 'expense' },
  { id: 'cat-hiburan', name: 'Hiburan', icon: 'Sparkles', color: 'bg-pink-50 text-pink-500 border border-pink-200', hexColor: '#ec4899', type: 'expense' },
  { id: 'cat-tagihan', name: 'Tagihan', icon: 'Receipt', color: 'bg-amber-50 text-amber-500 border border-amber-200', hexColor: '#f59e0b', type: 'expense' },
  { id: 'cat-kesehatan', name: 'Kesehatan', icon: 'HeartPulse', color: 'bg-rose-50 text-rose-500 border border-rose-200', hexColor: '#f43f5e', type: 'expense' },
  { id: 'cat-gaji', name: 'Gaji Bulanan', icon: 'Coins', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200', hexColor: '#10b981', type: 'income' },
  { id: 'cat-investasi', name: 'Investasi', icon: 'TrendingUp', color: 'bg-indigo-50 text-indigo-500 border border-indigo-200', hexColor: '#6366f1', type: 'both' },
  { id: 'cat-lainnya', name: 'Lain-lain', icon: 'HelpCircle', color: 'bg-slate-50 text-slate-500 border border-slate-200', hexColor: '#64748b', type: 'both' },
];

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-tunai', name: 'Tunai (Cash)', type: 'cash', icon: 'Wallet' },
  { id: 'acc-bank', name: 'Rekening Bank', type: 'bank', icon: 'CreditCard' },
  { id: 'acc-gopay', name: 'GoPay', type: 'wallet', icon: 'Smartphone' },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Export CATEGORIES as a dynamic array initialized from Local Storage or defaults
export let CATEGORIES: Category[] = getStorageItem<Category[]>('finance_categories', INITIAL_CATEGORIES);

const getNextMonthDate = (dateStr: string): string => {
  const cleanDateStr = (dateStr || '').slice(0, 10);
  const [yearStr, monthStr, dayStr] = cleanDateStr.split('-');
  let year = Number(yearStr);
  let month = Number(monthStr); // 1-12
  let day = Number(dayStr);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 1);
    return fallback.toISOString().split('T')[0];
  }
  
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  
  const lastDayOfNextMonth = new Date(year, month, 0).getDate();
  if (day > lastDayOfNextMonth) {
    day = lastDayOfNextMonth;
  }
  
  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

// Seed initial data if empty
const seedData = () => {
  const transactionsKey = 'finance_transactions';
  const budgetsKey = 'finance_budgets';
  const savingsGoalsKey = 'finance_savings_goals';
  const billsKey = 'finance_bills';
  const categoriesKey = 'finance_categories';
  const accountsKey = 'finance_accounts';

  const today = new Date();
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  if (!localStorage.getItem(categoriesKey)) {
    setStorageItem(categoriesKey, INITIAL_CATEGORIES);
  }

  if (!localStorage.getItem(accountsKey)) {
    setStorageItem(accountsKey, INITIAL_ACCOUNTS);
  }

  if (!localStorage.getItem(transactionsKey)) {
    const initialTransactions: Transaction[] = [
      { id: 't1', title: 'Gaji Bulanan', amount: 9500000, type: 'income', categoryId: 'cat-gaji', accountId: 'acc-bank', date: getPastDateStr(5), notes: 'Gaji pokok bulan Mei' },
      { id: 't2', title: 'Makan Siang Ramen', amount: 65000, type: 'expense', categoryId: 'cat-makanan', accountId: 'acc-tunai', date: getPastDateStr(0), notes: 'Makan ramen bersama teman' },
      { id: 't3', title: 'Kopi Susu Senja', amount: 28000, type: 'expense', categoryId: 'cat-makanan', accountId: 'acc-gopay', date: getPastDateStr(0) },
      { id: 't4', title: 'Bensin Motor', amount: 50000, type: 'expense', categoryId: 'cat-transport', accountId: 'acc-tunai', date: getPastDateStr(1), notes: 'Pertalite full tank' },
      { id: 't5', title: 'Beli Kemeja Baru', amount: 249000, type: 'expense', categoryId: 'cat-belanja', accountId: 'acc-bank', date: getPastDateStr(2), notes: 'Kemeja untuk meeting' },
      { id: 't6', title: 'Nonton Bioskop', amount: 80000, type: 'expense', categoryId: 'cat-hiburan', accountId: 'acc-gopay', date: getPastDateStr(3), notes: 'Tiket bioskop + popcorn' },
      { id: 't7', title: 'Bayar Listrik & Wifi', amount: 485000, type: 'expense', categoryId: 'cat-tagihan', accountId: 'acc-bank', date: getPastDateStr(4), notes: 'Tagihan bulanan' },
      { id: 't8', title: 'Beli Vitamin C', amount: 75000, type: 'expense', categoryId: 'cat-kesehatan', accountId: 'acc-tunai', date: getPastDateStr(4) },
      { id: 't9', title: 'Dividen Reksa Dana', amount: 350000, type: 'income', categoryId: 'cat-investasi', accountId: 'acc-bank', date: getPastDateStr(3), notes: 'Dividen bulanan' },
      { id: 't10', title: 'Gopay Topup Transport', amount: 30000, type: 'expense', categoryId: 'cat-transport', accountId: 'acc-gopay', date: getPastDateStr(0) },
    ];
    setStorageItem(transactionsKey, initialTransactions);
  }

  if (!localStorage.getItem(budgetsKey)) {
    const initialBudgets: Budget[] = [
      { categoryId: 'cat-makanan', limit: 1500000, spent: 0 },
      { categoryId: 'cat-belanja', limit: 1000000, spent: 0 },
      { categoryId: 'cat-transport', limit: 500000, spent: 0 },
      { categoryId: 'cat-hiburan', limit: 600000, spent: 0 },
      { categoryId: 'cat-tagihan', limit: 1200000, spent: 0 },
    ];
    setStorageItem(budgetsKey, initialBudgets);
  }

  if (!localStorage.getItem(savingsGoalsKey)) {
    const initialGoals: SavingsGoal[] = [
      { id: 'g1', title: 'Dana Darurat', targetAmount: 10000000, currentAmount: 3500000, color: 'bg-emerald-500' },
      { id: 'g2', title: 'Beli Macbook M3', targetAmount: 22000000, currentAmount: 8000000, color: 'bg-indigo-500' },
      { id: 'g3', title: 'Liburan Akhir Tahun', targetAmount: 5000000, currentAmount: 1500000, color: 'bg-pink-500' },
    ];
    setStorageItem(savingsGoalsKey, initialGoals);
  }

  if (!localStorage.getItem(billsKey)) {
    const initialBills: Bill[] = [
      { id: 'b1', title: 'Bayar Tagihan Wifi', amount: 350000, type: 'debt', dueDate: getPastDateStr(-5), contactName: 'Indihome', status: 'unpaid', notes: 'Tagihan bulanan internet' },
      { id: 'b2', title: 'Patungan Uang Futsal', amount: 75000, type: 'receivable', dueDate: getPastDateStr(-2), contactName: 'Rian Futsal', status: 'unpaid' },
      { id: 'b3', title: 'Bayar Uang Kos', amount: 1500000, type: 'debt', dueDate: getPastDateStr(-9), contactName: 'Bu Kos', status: 'unpaid' },
      { id: 'b4', title: 'Kembalian Makan Siang', amount: 120000, type: 'receivable', dueDate: getPastDateStr(3), contactName: 'Sarah', status: 'paid', notes: 'Makan ramen kemarin' },
      { id: 'b5', title: 'Bayar Iuran Kebersihan', amount: 50000, type: 'debt', dueDate: getPastDateStr(6), contactName: 'Pak RT', status: 'paid' }
    ];
    setStorageItem(billsKey, initialBills);
  }
};

seedData();
// Make sure CATEGORIES is loaded after potential seeding
CATEGORIES = getStorageItem<Category[]>('finance_categories', INITIAL_CATEGORIES);

export const api = {
  getTransactions: async (): Promise<Transaction[]> => {
    await sleep(400);
    return getStorageItem<Transaction[]>('finance_transactions', []);
  },

  addTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    await sleep(400);
    const transactions = getStorageItem<Transaction[]>('finance_transactions', []);
    const newTransaction: Transaction = {
      ...transaction,
      accountId: transaction.accountId || 'acc-tunai',
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    transactions.unshift(newTransaction);
    setStorageItem('finance_transactions', transactions);
    return newTransaction;
  },

  deleteTransaction: async (id: string): Promise<boolean> => {
    await sleep(400);
    const transactions = getStorageItem<Transaction[]>('finance_transactions', []);
    const txToDelete = transactions.find(t => t.id === id);

    if (txToDelete && txToDelete.billId) {
      const bills = getStorageItem<Bill[]>('finance_bills', []);
      const billExists = bills.some(b => b.id === txToDelete.billId);
      if (billExists) {
        // Revert the bill status. This will also handle recurring/installment reverts
        // and delete the transaction from storage automatically.
        await api.updateBillStatus(txToDelete.billId, 'unpaid');
        return true;
      }
    }

    const filtered = transactions.filter(t => t.id !== id);
    setStorageItem('finance_transactions', filtered);
    return true;
  },

  getBudgets: async (): Promise<Budget[]> => {
    await sleep(400);
    const budgets = getStorageItem<Budget[]>('finance_budgets', []);
    const transactions = getStorageItem<Transaction[]>('finance_transactions', []);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const updatedBudgets = budgets.map(budget => {
      const spent = transactions
        .filter(t => {
          if (t.categoryId !== budget.categoryId || t.type !== 'expense') return false;
          const tDate = new Date(t.date);
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...budget,
        spent,
      };
    });

    return updatedBudgets;
  },

  updateBudget: async (categoryId: string, limit: number): Promise<Budget> => {
    await sleep(400);
    const budgets = getStorageItem<Budget[]>('finance_budgets', []);
    const index = budgets.findIndex(b => b.categoryId === categoryId);

    let updatedBudget: Budget;
    if (index !== -1) {
      budgets[index].limit = limit;
      updatedBudget = budgets[index];
    } else {
      updatedBudget = { categoryId, limit, spent: 0 };
      budgets.push(updatedBudget);
    }

    setStorageItem('finance_budgets', budgets);
    return updatedBudget;
  },

  getSavingsGoals: async (): Promise<SavingsGoal[]> => {
    await sleep(400);
    return getStorageItem<SavingsGoal[]>('finance_savings_goals', []);
  },

  addSavingsGoal: async (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>): Promise<SavingsGoal> => {
    await sleep(400);
    const goals = getStorageItem<SavingsGoal[]>('finance_savings_goals', []);
    const newGoal: SavingsGoal = {
      ...goal,
      id: `g-${Date.now()}`,
      currentAmount: 0,
    };
    goals.push(newGoal);
    setStorageItem('finance_savings_goals', goals);
    return newGoal;
  },

  addSavingsProgress: async (id: string, amount: number): Promise<SavingsGoal> => {
    await sleep(400);
    const goals = getStorageItem<SavingsGoal[]>('finance_savings_goals', []);
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Goal not found');

    goals[index].currentAmount = Math.max(0, goals[index].currentAmount + amount);
    setStorageItem('finance_savings_goals', goals);
    return goals[index];
  },

  deleteSavingsGoal: async (id: string): Promise<boolean> => {
    await sleep(400);
    const goals = getStorageItem<SavingsGoal[]>('finance_savings_goals', []);
    const filtered = goals.filter(g => g.id !== id);
    setStorageItem('finance_savings_goals', filtered);
    return true;
  },

  getBills: async (): Promise<Bill[]> => {
    await sleep(400);
    return getStorageItem<Bill[]>('finance_bills', []);
  },

  addBill: async (bill: Omit<Bill, 'id'>): Promise<Bill> => {
    await sleep(400);
    const bills = getStorageItem<Bill[]>('finance_bills', []);

    if (bill.isInstallment && bill.installmentCount && bill.installmentCount > 1) {
      const count = bill.installmentCount;
      const perInstallmentAmount = Math.round(bill.amount / count);
      const parentId = `inst-${Date.now()}`;
      
      const firstBill: Bill = {
        id: `b-${Date.now()}-1-${Math.random().toString(36).substr(2, 5)}`,
        title: `${bill.title} (Cicilan 1/${count})`,
        amount: perInstallmentAmount,
        type: bill.type,
        contactName: bill.contactName,
        dueDate: bill.dueDate,
        status: 'unpaid',
        notes: bill.notes || undefined,
        isRecurring: false,
        isInstallment: true,
        installmentCount: count,
        installmentNumber: 1,
        parentBillId: parentId
      };
      
      bills.unshift(firstBill);
      setStorageItem('finance_bills', bills);
      return firstBill;
    } else {
      const newBill: Bill = {
        ...bill,
        id: `b-${Date.now()}`
      };
      bills.unshift(newBill);
      setStorageItem('finance_bills', bills);
      return newBill;
    }
  },

  updateBillStatus: async (id: string, status: 'unpaid' | 'paid', payMonthsCount: number = 1, accountId?: string): Promise<Bill> => {
    await sleep(400);
    const bills = getStorageItem<Bill[]>('finance_bills', []);
    const idx = bills.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Bill not found');
    
    const oldStatus = bills[idx].status;
    bills[idx].status = status;
    
    if (status === 'paid' && oldStatus === 'unpaid') {
      if (bills[idx].isRecurring) {
        const nextDueDate = getNextMonthDate(bills[idx].dueDate);
        const nextBill: Bill = {
          id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: bills[idx].title,
          amount: bills[idx].amount,
          type: bills[idx].type,
          dueDate: nextDueDate,
          contactName: bills[idx].contactName,
          status: 'unpaid',
          notes: bills[idx].notes,
          isRecurring: true
        };
        bills.unshift(nextBill);
      } else if (bills[idx].isInstallment && bills[idx].installmentNumber && bills[idx].installmentCount) {
        const currentNum = bills[idx].installmentNumber!;
        const totalCount = bills[idx].installmentCount!;
        
        const baseTitle = bills[idx].title.replace(/\s*\(Cicilan\s+\d+(?:-\d+)?\/\d+\)$/i, '');
        const singleAmount = bills[idx].amount;
        
        if (payMonthsCount > 1) {
          bills[idx].amount = singleAmount * payMonthsCount;
          const endNum = Math.min(totalCount, currentNum + payMonthsCount - 1);
          bills[idx].title = `${baseTitle} (Cicilan ${currentNum}-${endNum}/${totalCount})`;
        }
        
        const nextNumber = currentNum + payMonthsCount;
        if (nextNumber <= totalCount) {
          let nextDueDate = bills[idx].dueDate;
          for (let m = 0; m < payMonthsCount; m++) {
            nextDueDate = getNextMonthDate(nextDueDate);
          }
          
          const nextBill: Bill = {
            id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `${baseTitle} (Cicilan ${nextNumber}/${totalCount})`,
            amount: singleAmount,
            type: bills[idx].type,
            dueDate: nextDueDate,
            contactName: bills[idx].contactName,
            status: 'unpaid',
            notes: bills[idx].notes,
            isRecurring: false,
            isInstallment: true,
            installmentNumber: nextNumber,
            installmentCount: totalCount,
            parentBillId: bills[idx].parentBillId
          };
          bills.unshift(nextBill);
        }
      }

      const transactions = getStorageItem<Transaction[]>('finance_transactions', []);
      const newTransaction: Transaction = {
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: bills[idx].title,
        amount: bills[idx].amount,
        type: bills[idx].type === 'debt' ? 'expense' : 'income',
        categoryId: bills[idx].type === 'debt' ? 'cat-tagihan' : 'cat-lainnya',
        accountId: accountId || 'acc-bank', // default bills payments use Bank Account
        date: new Date().toISOString().split('T')[0],
        notes: `Pelunasan otomatis dari menu Tagihan & Piutang`,
        billId: bills[idx].id
      };
      transactions.unshift(newTransaction);
      setStorageItem('finance_transactions', transactions);
    }
    
    else if (status === 'unpaid' && oldStatus === 'paid') {
      if (bills[idx].isRecurring) {
        const nextDueDate = getNextMonthDate(bills[idx].dueDate);
        const nextBillIdx = bills.findIndex(b => 
          b.title === bills[idx].title && 
          b.type === bills[idx].type && 
          b.dueDate === nextDueDate && 
          b.status === 'unpaid' && 
          b.isRecurring
        );
        if (nextBillIdx !== -1) {
          bills.splice(nextBillIdx, 1);
        }
      } 
      else if (bills[idx].isInstallment && bills[idx].installmentNumber && bills[idx].installmentCount) {
        const currentNum = bills[idx].installmentNumber!;
        const totalCount = bills[idx].installmentCount!;
        
        const titleMatch = bills[idx].title.match(/\(Cicilan\s+(\d+)-(\d+)\/(\d+)\)$/i);
        let paidMonthsCount = 1;
        let singleAmount = bills[idx].amount;
        
        if (titleMatch) {
          const startNum = Number(titleMatch[1]);
          const endNum = Number(titleMatch[2]);
          paidMonthsCount = endNum - startNum + 1;
          singleAmount = bills[idx].amount / paidMonthsCount;
        }
        
        const baseTitle = bills[idx].title.replace(/\s*\(Cicilan\s+\d+(?:-\d+)?\/\d+\)$/i, '');
        
        bills[idx].amount = singleAmount;
        bills[idx].title = `${baseTitle} (Cicilan ${currentNum}/${totalCount})`;
        
        const nextNumber = currentNum + paidMonthsCount;
        const nextBillIdx = bills.findIndex(b => 
          b.parentBillId === bills[idx].parentBillId && 
          b.installmentNumber === nextNumber && 
          b.status === 'unpaid'
        );
        if (nextBillIdx !== -1) {
          bills.splice(nextBillIdx, 1);
        }
      }

      const transactions = getStorageItem<Transaction[]>('finance_transactions', []);
      const txIdx = transactions.findIndex(t => t.billId === id);
      if (txIdx !== -1) {
        transactions.splice(txIdx, 1);
        setStorageItem('finance_transactions', transactions);
      }
    }
    
    setStorageItem('finance_bills', bills);
    return bills[idx];
  },

  deleteBill: async (id: string): Promise<boolean> => {
    await sleep(400);
    const bills = getStorageItem<Bill[]>('finance_bills', []);
    const filtered = bills.filter(b => b.id !== id);
    setStorageItem('finance_bills', filtered);

    // Also delete any associated automatic settlement transactions
    const transactions = getStorageItem<Transaction[]>('finance_transactions', []);
    const filteredTxs = transactions.filter(t => t.billId !== id);
    setStorageItem('finance_transactions', filteredTxs);

    return true;
  },

  // Account Management API
  getAccounts: async (): Promise<Account[]> => {
    await sleep(300);
    return getStorageItem<Account[]>('finance_accounts', INITIAL_ACCOUNTS);
  },

  addAccount: async (account: Omit<Account, 'id'>): Promise<Account> => {
    await sleep(300);
    const accounts = getStorageItem<Account[]>('finance_accounts', INITIAL_ACCOUNTS);
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}`
    };
    accounts.push(newAccount);
    setStorageItem('finance_accounts', accounts);
    return newAccount;
  },

  deleteAccount: async (id: string): Promise<boolean> => {
    await sleep(300);
    const accounts = getStorageItem<Account[]>('finance_accounts', INITIAL_ACCOUNTS);
    const filtered = accounts.filter(a => a.id !== id);
    setStorageItem('finance_accounts', filtered);
    return true;
  },

  // Custom Categories API
  getCategories: async (): Promise<Category[]> => {
    await sleep(300);
    return getStorageItem<Category[]>('finance_categories', INITIAL_CATEGORIES);
  },

  addCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    await sleep(300);
    const categories = getStorageItem<Category[]>('finance_categories', INITIAL_CATEGORIES);
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`
    };
    categories.push(newCategory);
    setStorageItem('finance_categories', categories);
    // Sync the synchronous in-memory export
    CATEGORIES.push(newCategory);
    return newCategory;
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    await sleep(300);
    const categories = getStorageItem<Category[]>('finance_categories', INITIAL_CATEGORIES);
    const filtered = categories.filter(c => c.id !== id);
    setStorageItem('finance_categories', filtered);
    // Sync the synchronous in-memory export
    const idx = CATEGORIES.findIndex(c => c.id === id);
    if (idx !== -1) {
      CATEGORIES.splice(idx, 1);
    }
    return true;
  }
};
