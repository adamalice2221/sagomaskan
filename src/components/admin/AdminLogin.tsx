import React, { useState } from 'react';
import { Lock, ShieldAlert, Sparkles, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth, ADMIN_EMAILS } from '../../context/AuthContext';

interface AdminLoginProps {
  onBackToShop: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToShop }) => {
  const { signInWithGoogle, user, isAdmin, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError('Inloggningen misslyckades. Kontrollera att popup-fönster tillåts och försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-8 sm:p-10 shadow-xs space-y-6 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F3EFE8] border border-[#E6DFD3] mx-auto text-[#6B8E7B]">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Sagomaskan Admin
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium">
            Privat inloggning
          </h1>
          <p className="text-sm text-[#66726A] font-light leading-relaxed">
            Denna sektion är reserverad för administration av produkter, förfrågningar och butiksinställningar.
          </p>
        </div>

        {user && !isAdmin && (
          <div className="p-4 rounded-2xl bg-[#F8EFEF] border border-[#E4C9C9] text-left text-xs text-[#8C5248] space-y-2">
            <div className="flex items-start gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-[#8C5248] shrink-0 mt-0.5" />
              <span>Ej behörigt administratörskonto</span>
            </div>
            <p>
              Inloggad som <strong>{user.email}</strong>. Detta konto har inte administratörsrättigheter.
            </p>
            <p className="text-[11px] text-[#8C5248]/80">
              Behörig administratör: {ADMIN_EMAILS.join(', ')}
            </p>
            <button
              onClick={logout}
              className="mt-2 text-xs text-[#8C5248] underline hover:text-[#5E3029]"
            >
              Logga ut och byt konto
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[#F8EFEF] border border-[#E4C9C9] text-xs text-[#8C5248]">
            {error}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            id="admin-google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-[#242D27] text-[#FAF8F5] text-sm font-medium hover:bg-[#344038] active:scale-[0.99] transition-all disabled:opacity-60 shadow-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#FAF8F5]" />
            <span>{loading ? 'Loggar in...' : 'Logga in med Google'}</span>
          </button>

          <button
            onClick={onBackToShop}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-[#66726A] hover:text-[#242D27] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tillbaka till butiken</span>
          </button>
        </div>

        <div className="pt-4 border-t border-[#E6DFD3] text-[11px] text-[#66726A] font-light">
          Sagomaskan hantverksadministration &bull; Säkrad med Firebase
        </div>

      </div>
    </div>
  );
};
