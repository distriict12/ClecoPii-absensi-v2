import { useState, useContext } from 'react';
import { Store, AlertTriangle, Delete, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import Cookies from 'js-cookie';

import { useLogin } from '../hooks/auth/useLogin';
import { AuthContext } from '../context/AuthContext';

export default function LoginView() {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { setIsAuthenticated, setUser } = authContext!;

  const { mutate: login, isPending } = useLogin();

  const handleKeyPress = (num: string) => {
    if (isPending) return;
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 6) {
        login(
          { pin: newPin },
          {
            onSuccess: (res) => {
              const { token, user } = res.data;
              Cookies.set('token', token, { expires: 1 });
              Cookies.set('user', JSON.stringify(user), { expires: 1 });
              setIsAuthenticated(true);
              setUser(user);
              navigate('/dashboard');
            },
            onError: (err: any) => {
              const message = err.response?.data?.message || 'PIN Salah. Coba lagi.';
              setErrorMsg(message);
              setTimeout(() => setPin(''), 500);
            }
          }
        );
      }
    }
  };

  const handleBackspace = () => {
    if (isPending) return;
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      {/* max-w-[480px]→max-w-[400px], pt-10→pt-8, pb-6→pb-5, px-6→px-5 */}
      <main className="w-full max-w-[400px] bg-surface-container-lowest border-4 border-on-surface shadow-hard-lg flex flex-col items-center pt-8 pb-5 px-5 sm:px-8 relative overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-2 bg-primary-fixed"></div>
        <div className="absolute top-2 left-0 w-full h-2 bg-secondary-fixed"></div>

        {/* Logo — mb-10→mb-7, w-16→w-14, ikon w-10→w-8, text-3xl→text-2xl, mb-4→mb-3 */}
        <div className="flex flex-col items-center mb-7 mt-2">
          <div className="w-14 h-14 bg-primary-container border-4 border-on-surface shadow-hard flex items-center justify-center mb-3 transform -rotate-6">
            <Store className="w-8 h-8 text-on-surface" />
          </div>
          <h1 className="text-2xl font-black text-on-surface text-center mb-1 uppercase tracking-tight">ClecoPii</h1>
          <p className="text-xs font-bold text-on-surface-variant text-center tracking-[0.2em] uppercase">Outlet Access</p>
        </div>

        {/* PIN display — mb-10→mb-7, h-28→h-24, mb-6→mb-4, dot w-6→w-5 h-6→h-5 */}
        <div className="w-full flex flex-col items-center mb-7 h-24">
          <h2 className="text-base font-medium text-on-surface mb-4 text-center">Masukkan PIN Anda</h2>

          <div className="flex gap-3 mb-4 justify-center w-full">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: pin.length > i ? 1.1 : 1 }}
                className={cn(
                  "w-5 h-5 rounded-full border-4 border-on-surface transition-colors",
                  pin.length > i ? "bg-on-surface" : "bg-surface",
                  isPending && "animate-pulse opacity-50 bg-on-surface"
                )}
              />
            ))}
          </div>

          <div className="flex justify-center w-full">
            {isPending ? (
              <div className="flex items-center gap-2 bg-secondary-container border-2 border-on-surface px-4 py-1.5 shadow-[4px_4px_0px_0px_#000]">
                <Loader2 className="w-4 h-4 animate-spin text-on-surface" />
                <span className="text-xs font-bold uppercase tracking-wider">Memverifikasi...</span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: errorMsg ? 1 : 0, y: errorMsg ? 0 : 10 }}
                className={cn(
                  "bg-error-container border-2 border-error px-4 py-1.5 shadow-[4px_4px_0px_0px_#ba1a1a] flex items-center gap-2 transform rotate-1",
                  !errorMsg && "hidden"
                )}
              >
                <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                <span className="text-sm font-bold text-error">{errorMsg}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Numpad — gap-4→gap-3, h-16→h-14, text-xl tetap, max-w-[320px]→max-w-[280px], mb-4→mb-3 */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={isPending}
              className="bg-surface-container h-14 border-4 border-on-surface shadow-hard flex items-center justify-center text-xl font-bold text-on-surface hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard transition-all focus:outline-none focus:bg-primary-container active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <div className="h-14"></div>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isPending}
            className="bg-surface-container h-14 border-4 border-on-surface shadow-hard flex items-center justify-center text-xl font-bold text-on-surface hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard transition-all focus:outline-none focus:bg-primary-container active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            aria-label="Delete"
            disabled={isPending}
            className="bg-surface-variant h-14 border-4 border-on-surface shadow-hard flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard transition-all focus:outline-none focus:bg-error-container group active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
          >
            <Delete className="w-5 h-5 text-on-surface group-focus:text-error" />
          </button>
        </div>
      </main>
    </div>
  );
}