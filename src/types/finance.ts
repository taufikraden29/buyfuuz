export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class name (e.g. 'bg-rose-100 text-rose-500')
  hexColor: string; // CSS color code for chart / styling
  type: TransactionType | 'both';
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface Budget {
  categoryId: string;
  limit: number;
  spent: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  targetDate?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  type: 'debt' | 'receivable'; // debt = hutang, receivable = piutang
  dueDate: string; // YYYY-MM-DD
  contactName: string;
  status: 'unpaid' | 'paid';
  notes?: string;
  isRecurring?: boolean;
  isInstallment?: boolean;
  installmentCount?: number;
  installmentNumber?: number;
  parentBillId?: string;
}
