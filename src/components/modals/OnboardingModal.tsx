import React from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  setUserName: (name: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  setUserName,
  showToast
}: OnboardingModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const nameInput = target.elements.namedItem('nickname') as HTMLInputElement;
    const nameVal = nameInput.value.trim();
    if (!nameVal) return;

    localStorage.setItem('finance_username', nameVal);
    setUserName(nameVal);
    onClose();
    showToast(`Selamat datang, Kak ${nameVal}! 👋`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-scale-in">

        {/* Character Illustration */}
        <div className="w-36 h-36 bg-indigo-50/50 rounded-full flex items-center justify-center relative overflow-hidden border border-indigo-100/50 shadow-inner">
          <img
            src="/character-open.svg"
            alt="Karakter Asisten Finansial"
            className="w-36 h-36 object-contain translate-y-8 scale-145"
          />
        </div>

        {/* Welcoming Text */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-850 tracking-tight">Selamat Datang di UangKu!</h3>
          <p className="text-xs text-slate-555 font-semibold leading-relaxed">
            Halo! Aku asisten finansial pribadimu. Untuk memulai perjalanan hemat kita, siapa nama panggilanmu?
          </p>
        </div>

        {/* Name Input Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <input
              type="text"
              name="nickname"
              required
              maxLength={15}
              placeholder="Contoh: Raden, Taufik, Budi"
              className="w-full bg-slate-55 hover:bg-slate-100/50 focus:bg-white text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 transition-colors font-bold text-slate-800 text-center shadow-3xs"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold text-xs shadow-md shadow-indigo-150 border border-indigo-700 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            Mulai Sekarang
          </button>
        </form>

      </div>
    </div>
  );
}
