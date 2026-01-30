/**
 * Kiosk Mode - Time Clock Interface
 * Offline-first with optimistic UI and background sync
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { Logo } from '../components/Logo';
import { FloatingBackground } from '../components/FloatingBackground';

interface PendingPunch {
  id: string;
  pin: string;
  type: 'clock-in' | 'clock-out';
  timestamp: string;
  synced: boolean;
}

export function Kiosk() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingPunches, setPendingPunches] = useState<PendingPunch[]>([]);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout>();

  // Load pending punches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kiosk_pending_punches');
    if (stored) {
      try {
        setPendingPunches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load pending punches:', e);
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending punches when online
  useEffect(() => {
    if (isOnline && pendingPunches.length > 0) {
      syncPendingPunches();
    }
  }, [isOnline]);

  // Auto-focus PIN input
  useEffect(() => {
    if (pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [status, isVerifyingAdmin]);

  // Track if we're exiting to allow navigation
  const isExitingRef = useRef(false);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (exitIntervalRef.current) {
        clearInterval(exitIntervalRef.current);
      }
    };
  }, []);

  // Prevent navigation away (kiosk trap)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isExitingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = () => {
      if (!isExitingRef.current) {
        window.history.pushState(null, '', '/kiosk');
      }
    };

    window.history.pushState(null, '', '/kiosk');
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Long press (3 seconds) to exit kiosk mode
  const exitPressStartRef = useRef<number | null>(null);
  const exitIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [exitProgress, setExitProgress] = useState(0);

  const handleExitPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't prevent default for mouse events to allow focus, but do for touch
    if ('touches' in e) {
      e.preventDefault();
    }
    e.stopPropagation();
    
    console.log('Exit press started', e.type);
    
    // Clear any existing interval
    if (exitIntervalRef.current) {
      clearInterval(exitIntervalRef.current);
      exitIntervalRef.current = null;
    }
    
    exitPressStartRef.current = Date.now();
    setExitProgress(0);
    
    exitIntervalRef.current = setInterval(() => {
      if (exitPressStartRef.current) {
        const elapsed = Date.now() - exitPressStartRef.current;
        const progress = Math.min((elapsed / 3000) * 100, 100);
        setExitProgress(progress);
        console.log('Exit progress:', progress);

        if (elapsed >= 3000) {
          console.log('Exit threshold reached');
          // Clear interval before exiting
          if (exitIntervalRef.current) {
            clearInterval(exitIntervalRef.current);
            exitIntervalRef.current = null;
          }
          exitPressStartRef.current = null;
          setExitProgress(0);
          handleExitKiosk();
        }
      }
    }, 50);
  };

  const handleExitPressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('Exit press ended', e.type);
    // Don't prevent default here to allow normal event flow
    e.stopPropagation();
    
    // Clear interval if user releases before 3 seconds
    if (exitIntervalRef.current) {
      clearInterval(exitIntervalRef.current);
      exitIntervalRef.current = null;
    }
    
    exitPressStartRef.current = null;
    setExitProgress(0);
  };

  const handleExitKiosk = () => {
    console.log('handleExitKiosk called');
    // Show Admin PIN prompt instead of exiting immediately
    setIsVerifyingAdmin(true);
    setAdminPin('');
    setStatus('idle');
    setStatusMessage('');
  };

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin || adminPin.length < 4) return;

    setLoading(true);
    setError('');

    try {
      console.log('Verifying admin PIN...');
      const result = await api.kioskVerifyAdmin(adminPin);
      console.log('Verification result:', result);
      
      if (result.success) {
        console.log('Admin verified, exiting kiosk...');
        // Mark as exiting to allow navigation
        isExitingRef.current = true;
        
        // Clear any running intervals
        if (exitIntervalRef.current) {
          clearInterval(exitIntervalRef.current);
          exitIntervalRef.current = null;
        }
        
        // Clear kiosk credentials
        localStorage.removeItem('kiosk_device_id');
        localStorage.removeItem('kiosk_secret');
        
        // Navigate to dashboard
        console.log('Navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Admin verification failed:', err);
      setError(err.message || 'Invalid Admin PIN');
      setAdminPin('');
      // Reset error after delay
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const savePendingPunch = (punch: PendingPunch) => {
    const updated = [...pendingPunches, punch];
    setPendingPunches(updated);
    localStorage.setItem('kiosk_pending_punches', JSON.stringify(updated));
  };

  const removePendingPunch = (id: string) => {
    const updated = pendingPunches.filter((p) => p.id !== id);
    setPendingPunches(updated);
    localStorage.setItem('kiosk_pending_punches', JSON.stringify(updated));
  };

  const syncPendingPunches = async () => {
    const current = JSON.parse(localStorage.getItem('kiosk_pending_punches') || '[]') as PendingPunch[];
    const unsynced = current.filter((p) => !p.synced);
    if (unsynced.length === 0) return;

    for (const punch of unsynced) {
      try {
        if (punch.type === 'clock-in') {
          await api.kioskClockIn(punch.pin);
        } else {
          await api.kioskClockOut(punch.pin);
        }

        // Mark as synced
        const updated = current.map((p) =>
          p.id === punch.id ? { ...p, synced: true } : p
        );
        setPendingPunches(updated);
        localStorage.setItem('kiosk_pending_punches', JSON.stringify(updated));

        // Remove synced punches after a delay
        setTimeout(() => {
          removePendingPunch(punch.id);
        }, 5000);
      } catch (error) {
        console.error('Failed to sync punch:', error);
        // Keep in pending list for retry
      }
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Don't submit if exit is in progress
    if (exitPressStartRef.current !== null) {
      return;
    }

    if (!pin || pin.length < 4) {
      setStatus('error');
      setStatusMessage('PIN must be at least 4 digits');
      setTimeout(() => {
        setStatus('idle');
        setPin('');
      }, 2000);
      return;
    }

    // Determine action: if user has active entry, clock out; otherwise clock in
    // For now, we'll try clock-in first, then clock-out if that fails
    const punchId = `punch_${Date.now()}_${Math.random()}`;
    const timestamp = new Date().toISOString();

    // Store PIN value before clearing (state updates are async)
    const pinValue = pin;

    // Optimistic UI: Store immediately in localStorage
    const pendingPunch: PendingPunch = {
      id: punchId,
      pin: pinValue,
      type: 'clock-in', // We'll determine this based on response
      timestamp,
      synced: false,
    };

    savePendingPunch(pendingPunch);

    // Show success immediately (optimistic)
    setStatus('success');
    // Determine message based on action (will be updated after API call if needed)
    setStatusMessage('Clocked in successfully');
    setPin(''); // Clear PIN input
    
    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Try to sync if online
    if (isOnline) {
      try {
        // Double-check PIN format before API call
        if (!pinValue || pinValue.length < 4 || !/^\d{4,8}$/.test(pinValue)) {
          throw new Error('Invalid PIN format');
        }
        
            await api.kioskClockIn(pinValue);
        // Mark as synced
        const updated = pendingPunches.map((p) =>
          p.id === punchId ? { ...p, synced: true } : p
        );
        setPendingPunches(updated);
        localStorage.setItem('kiosk_pending_punches', JSON.stringify(updated));
        // Update success message
        setStatusMessage('✓ Clocked in successfully');
      } catch (error: any) {
        // If clock-in fails, try clock-out
        if (error.message?.includes('already clocked in')) {
          try {
            await api.kioskClockOut(pinValue);
            const updated: PendingPunch[] = pendingPunches.map((p) =>
              p.id === punchId ? { ...p, type: 'clock-out' as const, synced: true } : p
            );
            setPendingPunches(updated);
            localStorage.setItem('kiosk_pending_punches', JSON.stringify(updated));
            setStatusMessage('✓ Clocked out successfully');
          } catch (outError) {
            setStatus('error');
            setStatusMessage('Failed to clock out');
          }
        } else {
          setStatus('error');
          setStatusMessage(error.message || 'Failed to clock in');
          // Keep in pending for retry
        }
      }
    } else {
      setStatusMessage('Saved offline - will sync when online');
    }

    // Reset status after delay
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    statusTimeoutRef.current = setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
      if (pinInputRef.current) {
        pinInputRef.current.focus();
      }
    }, 3000);
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container-padding py-4">
            <div className="flex items-center justify-between">
              <Logo variant="kioskBackground" className="w-16 h-16" />
              <div className="flex items-center gap-4">
                {/* Online/Offline Status */}
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {/* Pending Sync Count */}
                {pendingPunches.filter((p) => !p.synced).length > 0 && (
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {pendingPunches.filter((p) => !p.synced).length} pending
                  </div>
                )}
                {/* Exit Button (Long Press) */}
                <button
                  type="button"
                  onMouseDown={handleExitPressStart}
                  onMouseUp={handleExitPressEnd}
                  onMouseLeave={handleExitPressEnd}
                  onTouchStart={handleExitPressStart}
                  onTouchEnd={handleExitPressEnd}
                  disabled={isVerifyingAdmin}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all relative overflow-hidden z-50 ${
                    exitProgress > 0
                      ? 'text-white bg-red-500'
                      : isVerifyingAdmin
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {exitProgress > 0 && (
                    <>
                      <div
                        className="absolute inset-0 bg-red-600 transition-all duration-50"
                        style={{ width: `${exitProgress}%` }}
                      />
                      <span className="relative z-10">
                        Exiting... {Math.round(exitProgress)}%
                      </span>
                    </>
                  )}
                  {exitProgress === 0 && <span>Exit</span>}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center container-padding">
          <div className="w-full max-w-md">
            {isVerifyingAdmin ? (
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                    Admin Exit
                  </h1>
                  <p className="text-gray-600">Enter Admin PIN to exit kiosk mode</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center animate-shake">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAdminPinSubmit}>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Admin PIN"
                    maxLength={8}
                    className="w-full px-6 py-4 text-3xl text-center tracking-widest border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all"
                    autoFocus
                  />

                  <div className="flex gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsVerifyingAdmin(false)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adminPin.length < 4 || loading}
                      className="flex-1 px-6 py-4 bg-red-500 text-white rounded-xl font-semibold shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Exit Kiosk'}
                    </button>
                  </div>
                </form>

                {/* PIN Pad for Admin */}
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdminPin((prev) => (prev + num).slice(0, 8))}
                      className="touch-target aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-2xl text-gray-900 transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAdminPin('')}
                    className="touch-target aspect-square bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-lg text-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPin((prev) => prev + '0')}
                    className="touch-target aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-2xl text-gray-900 transition-colors"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPin((prev) => prev.slice(0, -1))}
                    className="touch-target aspect-square bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-lg text-gray-700 transition-colors"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Status Message with Animation */}
                {status !== 'idle' && (
                  <div
                    className={`mb-8 p-8 rounded-2xl text-center transition-all duration-500 ease-out ${
                      status === 'success'
                        ? 'bg-green-50 border-2 border-green-300 shadow-lg shadow-green-200/50'
                        : 'bg-red-50 border-2 border-red-300 shadow-lg shadow-red-200/50'
                    }`}
                    style={{
                      animation: 'fadeIn 0.5s ease-out, slideUp 0.5s ease-out',
                    }}
                  >
                    {status === 'success' ? (
                      <div className="relative inline-block">
                        <CheckCircle 
                          className="w-24 h-24 text-green-500 mx-auto mb-4" 
                          style={{
                            animation: 'scaleIn 0.3s ease-out, pulse 2s ease-in-out infinite',
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div 
                            className="w-24 h-24 rounded-full bg-green-500/20"
                            style={{
                              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <XCircle 
                        className="w-24 h-24 text-red-500 mx-auto mb-4" 
                        style={{
                          animation: 'scaleIn 0.3s ease-out',
                        }}
                      />
                    )}
                    <p
                      className={`text-2xl font-bold mb-2 transition-opacity duration-500 ${
                        status === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}
                      style={{
                        animation: 'fadeIn 0.5s ease-out 0.2s both',
                      }}
                    >
                      {statusMessage}
                    </p>
                    {status === 'success' && (
                      <p 
                        className="text-sm text-green-600 transition-opacity duration-500"
                        style={{
                          animation: 'fadeIn 0.5s ease-out 0.4s both',
                        }}
                      >
                        {isOnline ? '✓ Synced with server' : '💾 Saved offline - will sync when online'}
                      </p>
                    )}
                  </div>
                )}

                {/* PIN Entry Form */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                  <div className="text-center mb-8">
                    <Clock className="w-20 h-20 text-brand-purple mx-auto mb-4" />
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                      Time Clock
                    </h1>
                    <p className="text-gray-600">Enter your PIN to clock in or out</p>
                  </div>

                  <form 
                    onSubmit={handlePinSubmit} 
                    onKeyDown={(e) => {
                      // Prevent form submission on Escape key (which might be used to exit)
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        // Clear PIN and reset status
                        setPin('');
                        setStatus('idle');
                        setStatusMessage('');
                      }
                      // Prevent Enter key submission if exit is in progress
                      if (e.key === 'Enter' && exitPressStartRef.current !== null) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <div className="relative">
                      <input
                        ref={pinInputRef}
                        type="password"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Enter PIN"
                        maxLength={8}
                        disabled={status === 'success'}
                        className={`w-full px-6 py-4 text-3xl text-center tracking-widest border-2 rounded-xl transition-all duration-300 ${
                          status === 'success'
                            ? 'border-green-400 bg-green-50'
                            : status === 'error'
                            ? 'border-red-400 bg-red-50 animate-shake'
                            : 'border-gray-300 focus:ring-4 focus:ring-brand-purple focus:border-brand-purple'
                        }`}
                        autoFocus
                      />
                      {/* PIN dots indicator */}
                      {pin.length > 0 && status === 'idle' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="flex gap-2">
                            {Array.from({ length: Math.min(pin.length, 8) }).map((_, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full bg-brand-purple"
                                style={{ 
                                  animation: `scaleIn 0.2s ease-out ${i * 50}ms both`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Success checkmark overlay */}
                      {status === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div 
                            className="text-green-500"
                            style={{
                              animation: 'scaleIn 0.3s ease-out',
                            }}
                          >
                            <CheckCircle className="w-16 h-16" />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={pin.length < 4 || status === 'success'}
                      className="touch-target w-full mt-6 px-6 py-4 bg-brand-purple text-white rounded-xl font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit
                    </button>
                  </form>

                  {/* PIN Pad (Optional - for touch devices) */}
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => setPin((prev) => (prev + num).slice(0, 8))}
                        className="touch-target aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-2xl text-gray-900 transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setPin('')}
                      className="touch-target aspect-square bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-lg text-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setPin((prev) => prev + '0')}
                      className="touch-target aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-2xl text-gray-900 transition-colors"
                    >
                      0
                    </button>
                    <button
                      onClick={() => setPin((prev) => prev.slice(0, -1))}
                      className="touch-target aspect-square bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-lg text-gray-700 transition-colors"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
