import type { Transaction } from '../types/finance';

// Helper to format currency
export const formatRupiah = (value: number) => {
  return `Rp ${value.toLocaleString('id-ID')}`;
};

// Helper to format currency prefix for live inputs
export const getLivePreviewText = (value: string) => {
  const num = Number(value);
  if (!value || isNaN(num)) return '';
  return formatRupiah(num);
};

// Helper to format short date
export const formatShortDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hari Ini';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  } else {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
};

export const groupTransactionsByMonth = (txs: Transaction[]) => {
  const groups: Record<string, { monthYear: string; income: number; expense: number; list: Transaction[] }> = {};
  
  txs.forEach(tx => {
    const [year, month] = tx.date.split('-');
    const key = `${year}-${month}`;
    
    if (!groups[key]) {
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const label = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      groups[key] = {
        monthYear: label,
        income: 0,
        expense: 0,
        list: []
      };
    }
    
    groups[key].list.push(tx);
    if (tx.type === 'income') {
      groups[key].income += tx.amount;
    } else {
      groups[key].expense += tx.amount;
    }
  });
  
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, data]) => ({
      key,
      ...data,
    }));
};

export const formatCalendarAmt = (amt: number) => {
  if (amt >= 1000000) {
    return `${(amt / 1000000).toFixed(amt % 1000000 === 0 ? 0 : 1)}jt`;
  }
  if (amt >= 1000) {
    return `${Math.round(amt / 1000)}rb`;
  }
  return amt.toString();
};

export const TITLE_TEMPLATES: Record<string, string[]> = {
  'cat-makanan': ['Makan Siang 🍛', 'Kopi Susu ☕', 'Jajan Cemilan 🍰', 'Makan Malam 🍜'],
  'cat-transportasi': ['Bensin Motor ⛽', 'Ojek Online 🛵', 'Tiket Kereta 🎫', 'Tarif Parkir 🚗'],
  'cat-belanja': ['Belanja Bulanan 🛒', 'Baju Baru 👕', 'Kebutuhan Rumah 🏠', 'Skincare 🧴'],
  'cat-hiburan': ['Nonton Bioskop 🎬', 'Streaming Netflix 🍿', 'Top Up Game 🎮', 'Konser Musik 🎸'],
  'cat-tagihan': ['Listrik PLN ⚡', 'Wi-Fi Bulanan 🌐', 'Pulsa & Data 📱', 'Uang Kos 🏠'],
  'cat-gaji': ['Gaji Utama 💵', 'Bonus Projek 🎁', 'Uang Lembur 💰'],
  'cat-investasi': ['Beli Reksa Dana 📈', 'Investasi Saham 📊', 'Tabungan Emas 🪙'],
  'cat-lainnya': ['Uang Saku 💵', 'Kembalian Belanja 🪙', 'Hadiah Cash 🎁']
};

export const BILL_TEMPLATES = {
  debt: ['Bayar Wifi 🌐', 'Bayar Listrik ⚡', 'Sewa Kos 🏠', 'Iuran Bulanan 📋', 'Bayar Pinjaman 💵'],
  receivable: ['Uang Patungan 🍜', 'Kembalian Belanja 🪙', 'Sewa Kamera 📷', 'Pinjaman Teman 💵', 'Jasa / Freelance 💼']
};

export const GOAL_TEMPLATES = [
  'Dana Darurat 🛡️',
  'Beli Laptop Baru 💻',
  'Liburan Akhir Tahun ✈️',
  'Beli Gadget Baru 📱',
  'DP Rumah / Kos 🏠',
  'Investasi Masa Depan 📈'
];
