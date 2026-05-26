import { X, Info, Shield, Bell, Settings, Wallet, RefreshCw, Trash2, ChevronRight, Download, Upload } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  handleResetData: (loadDemo: boolean) => void;
  onOpenManageCategories: () => void;
  onOpenManageAccounts: () => void;
  onTriggerDailyReminder?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  userName,
  setUserName,
  showToast,
  openConfirm,
  handleResetData,
  onOpenManageCategories,
  onOpenManageAccounts,
  onTriggerDailyReminder
}: SettingsModalProps) {
  const handleExportData = () => {
    const data = {
      transactions: JSON.parse(localStorage.getItem('finance_transactions') || '[]'),
      budgets: JSON.parse(localStorage.getItem('finance_budgets') || '[]'),
      goals: JSON.parse(localStorage.getItem('finance_savings_goals') || '[]'),
      bills: JSON.parse(localStorage.getItem('finance_bills') || '[]'),
      categories: JSON.parse(localStorage.getItem('finance_categories') || '[]'),
      accounts: JSON.parse(localStorage.getItem('finance_accounts') || '[]'),
      username: localStorage.getItem('finance_username') || ''
    };
    
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `uangku_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Data berhasil diekspor! 📥', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          
          if (
            !parsed ||
            typeof parsed !== 'object' ||
            !('transactions' in parsed) ||
            !('budgets' in parsed) ||
            !('goals' in parsed) ||
            !('bills' in parsed)
          ) {
            throw new Error('Format file tidak valid.');
          }

          localStorage.setItem('finance_transactions', JSON.stringify(parsed.transactions || []));
          localStorage.setItem('finance_budgets', JSON.stringify(parsed.budgets || []));
          localStorage.setItem('finance_savings_goals', JSON.stringify(parsed.goals || []));
          localStorage.setItem('finance_bills', JSON.stringify(parsed.bills || []));
          
          if (parsed.categories) {
            localStorage.setItem('finance_categories', JSON.stringify(parsed.categories));
          }
          if (parsed.accounts) {
            localStorage.setItem('finance_accounts', JSON.stringify(parsed.accounts));
          }
          if (parsed.username) {
            localStorage.setItem('finance_username', parsed.username);
          }

          showToast('Data berhasil diimpor! 📤', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch {
          showToast('Gagal mengimpor data. Pastikan format file JSON sesuai!', 'error');
        }
      };
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4 animate-fade-in">
      {/* Floating Close Button above the card */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-955/85 border border-white/10 shadow-lg text-white flex items-center justify-center transition-all active:scale-90 z-55 cursor-pointer"
        title="Tutup"
      >
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[82vh] overflow-y-auto animate-slide-up sm:my-auto">

        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-850">Pengaturan Aplikasi</h3>
            <p className="text-xs text-slate-500 font-medium">Atur database lokal aplikasi UangKu</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl shadow-3xs">
            <div className="flex gap-2">
              <Info size={16} className="shrink-0 mt-0.5 text-indigo-600" />
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-indigo-700">Penyimpanan Lokal (Local Storage)</h4>
                <p className="text-[11px] text-indigo-650 mt-1 leading-relaxed font-medium">
                  Seluruh data pencatatan {userName || 'Kak'} tersimpan aman di dalam browser perangkat ini dan dapat di-reset kembali ke demo awal kapan saja.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-3xs">
            <div className="flex gap-2">
              <Shield size={16} className="shrink-0 mt-0.5 text-emerald-650" />
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Komitmen Privasi & Keamanan</h4>
                <p className="text-[11px] text-emerald-650 mt-1 leading-relaxed font-medium">
                  Aplikasi ini <strong>tidak mengumpulkan data pribadi {userName || 'Kak'}</strong>. Seluruh data keuangan {userName || 'Kak'} diolah secara offline dan hanya tersimpan secara lokal di perangkat {userName || 'Kak'} sendiri.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-55 border border-slate-200 rounded-2xl shadow-3xs space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block px-0.5">Nama Panggilan {userName || 'Kak'}</label>
            <input
              type="text"
              maxLength={15}
              value={userName}
              onChange={(e) => {
                const val = e.target.value;
                setUserName(val);
                localStorage.setItem('finance_username', val);
              }}
              placeholder="Masukkan nama panggilan..."
              className="w-full bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-bold text-slate-700 shadow-2xs"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (typeof window === 'undefined' || !('Notification' in window)) {
                  alert('Browser Anda tidak mendukung notifikasi.');
                  return;
                }
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    showToast('Notifikasi berhasil diaktifkan! 🔔', 'success');
                    try {
                      new Notification('UangKu', { body: 'Notifikasi sistem UangKu telah aktif!' });
                    } catch (e) {
                      console.warn('Native notification trigger failed:', e);
                    }
                  } else {
                    showToast('Gagal mengaktifkan notifikasi.', 'error');
                  }
                });
              }}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Bell size={14} className="text-indigo-650" />
                Aktifkan Notifikasi Browser
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            {onTriggerDailyReminder && (
              <button
                onClick={() => {
                  onClose();
                  onTriggerDailyReminder();
                }}
                className="w-full p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/50 text-indigo-750 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs active:scale-99"
              >
                <span className="flex items-center gap-2">
                  <Bell size={14} className="text-indigo-600 animate-bounce" />
                  Test Modal Pengingat Harian (Asisten)
                </span>
                <ChevronRight size={14} className="text-indigo-400" />
              </button>
            )}

            <button
              onClick={onOpenManageCategories}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Settings size={14} className="text-indigo-650" />
                Kelola Kategori Transaksi
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={onOpenManageAccounts}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Wallet size={14} className="text-indigo-650" />
                Kelola Dompet & Rekening
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={handleExportData}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Download size={14} className="text-indigo-650" />
                Ekspor Seluruh Data (.json)
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => document.getElementById('import-file-input')?.click()}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Upload size={14} className="text-indigo-650" />
                Impor Data Cadangan (.json)
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />

            <button
              onClick={() => {
                if (confirm('Muat ulang data demo awal? Semua modifikasi saat ini akan ditimpa.')) {
                  handleResetData(true);
                }
              }}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="text-indigo-600 animate-spin-slow" />
                Reset Data ke Demo Awal
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                openConfirm(
                  'Bersihkan Semua Data',
                  `Apakah ${userName || 'Kak'} yakin ingin menghapus seluruh transaksi, anggaran, dan target tabungan ${userName || 'Kak'}? Data tidak dapat dikembalikan.`,
                  () => handleResetData(false)
                );
              }}
              className="w-full p-3.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Trash2 size={14} className="text-rose-600" />
                Kosongkan Seluruh Database
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
