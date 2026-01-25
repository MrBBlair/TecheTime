import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { Location } from '@techetime/shared';
import Logo from '../components/Logo';

interface PayPeriodSummary {
  payPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: Array<{
    date: string;
    entries: Array<{
      id: string;
      clockInAt: string;
      clockOutAt: string | null;
      hours: number | null;
      locationId: string;
    }>;
    totalHours: number;
  }>;
  totalHours: number;
}

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
}

export default function KioskMode() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [showCheckHours, setShowCheckHours] = useState(false);
  const [isCheckHoursMode, setIsCheckHoursMode] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [payPeriodSummary, setPayPeriodSummary] = useState<PayPeriodSummary | null>(null);
  const [checkHoursPin, setCheckHoursPin] = useState('');
  const [clockAction, setClockAction] = useState<'clock-in' | 'clock-out' | null>(null);
  const [messageType, setMessageType] = useState<'initial' | 'break' | 'end-of-day' | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitEmail, setExitEmail] = useState('');
  const [exitPassword, setExitPassword] = useState('');
  const [exitError, setExitError] = useState('');
  const [exitLoading, setExitLoading] = useState(false);
  const pinInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    const sessionId = localStorage.getItem('deviceSessionId');
    if (!sessionId) {
      setMessage({ type: 'error', text: 'Kiosk mode not enabled' });
      setLoadingLocations(false);
      return;
    }

    try {
      const res = await fetch('/api/time-entries/kiosk/locations', {
        headers: {
          'x-device-session-id': sessionId,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load locations');
      }

      const data = await res.json();
      setLocations(data);
      
      // If only one location, auto-select it
      if (data.length === 1) {
        setSelectedLocation(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      setMessage({ type: 'error', text: 'Failed to load locations' });
    } finally {
      setLoadingLocations(false);
    }
  }

  const loadPayPeriodSummary = useCallback(async (userId: string) => {
    const sessionId = localStorage.getItem('deviceSessionId');
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/time-entries/kiosk/pay-period-summary/${userId}`, {
        headers: {
          'x-device-session-id': sessionId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPayPeriodSummary(data);
      }
    } catch (error) {
      console.error('Failed to load pay period summary:', error);
    }
  }, []);

  const handlePinInput = useCallback((digit: string) => {
    setPin((currentPin) => {
      if (currentPin.length < 4) {
        return currentPin + digit;
      }
      return currentPin;
    });
  }, []);

  const handleCheckHoursPinInput = useCallback((digit: string) => {
    setCheckHoursPin((currentPin) => {
      if (currentPin.length < 4) {
        return currentPin + digit;
      }
      return currentPin;
    });
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setMessage(null);
  }, []);

  const handleCheckHoursClear = useCallback(() => {
    setCheckHoursPin('');
    setMessage(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4) return;

    // Require location selection if multiple locations exist
    if (locations.length > 1 && !selectedLocation) {
      setMessage({ type: 'error', text: 'Please select a location' });
      return;
    }

    const sessionId = localStorage.getItem('deviceSessionId');
    if (!sessionId) {
      setMessage({ type: 'error', text: 'Kiosk mode not enabled' });
      return;
    }

    try {
      const res = await fetch('/api/time-entries/pin-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-session-id': sessionId,
        },
        body: JSON.stringify({ 
          pin,
          locationId: selectedLocation || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Store action and message type for context-based messaging
        setClockAction(data.action);
        setMessageType(data.isInitialClockIn ? 'initial' : (data.messageType || null));
        
        // Store user info and show acknowledgment
        if (data.user) {
          setUserInfo(data.user);
          await loadPayPeriodSummary(data.user.id);
          setShowAcknowledgment(true);
          
          // Hide acknowledgment after 6 seconds
          setTimeout(() => {
            setShowAcknowledgment(false);
            setUserInfo(null);
            setPayPeriodSummary(null);
            setClockAction(null);
            setMessageType(null);
            setPin('');
            setMessage(null);
          }, 6000);
        } else {
          // Fallback if user info not available
          const action = data.action === 'clock-in' ? 'Clocked in' : 'Clocked out';
          setMessage({ type: 'success', text: `${action} successfully!` });
          setTimeout(() => {
            setPin('');
            setMessage(null);
          }, 3000);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid PIN' });
        setTimeout(() => {
          setPin('');
          setMessage(null);
        }, 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clock in/out' });
    }
  }, [pin, selectedLocation, locations.length]);

  // Show location selection if multiple locations exist
  const showLocationSelect = locations.length > 1;
  const canProceedToPin = !showLocationSelect || (showLocationSelect && selectedLocation);

  const handleCheckHours = useCallback(async () => {
    if (checkHoursPin.length !== 4) return;

    const sessionId = localStorage.getItem('deviceSessionId');
    if (!sessionId) {
      setMessage({ type: 'error', text: 'Kiosk mode not enabled' });
      return;
    }

    try {
      // Verify PIN without clocking in/out
      const res = await fetch('/api/time-entries/kiosk/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-session-id': sessionId,
        },
        body: JSON.stringify({ 
          pin: checkHoursPin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        // Load pay period summary
        await loadPayPeriodSummary(data.user.id);
        setUserInfo(data.user);
        setShowCheckHours(false);
        setIsCheckHoursMode(true);
        setShowAcknowledgment(true);
        setCheckHoursPin('');
        
        // Hide acknowledgment after 6 seconds
        setTimeout(() => {
          setShowAcknowledgment(false);
          setUserInfo(null);
          setPayPeriodSummary(null);
          setIsCheckHoursMode(false);
        }, 6000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid PIN' });
        setTimeout(() => {
          setCheckHoursPin('');
          setMessage(null);
        }, 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check hours' });
    }
  }, [checkHoursPin, loadPayPeriodSummary]);

  async function handleExitKiosk() {
    setExitError('');
    if (!exitEmail.trim() || !exitPassword) {
      setExitError('Please enter your admin email and password.');
      return;
    }
    const sessionId = localStorage.getItem('deviceSessionId');
    if (!sessionId) {
      setExitError('Kiosk session not found.');
      return;
    }
    setExitLoading(true);
    try {
      const res = await fetch('/api/time-entries/kiosk/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-session-id': sessionId,
        },
        body: JSON.stringify({ email: exitEmail.trim(), password: exitPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('deviceSessionId');
        setShowExitModal(false);
        setExitEmail('');
        setExitPassword('');
        navigate('/dashboard');
        return;
      }
      
      // Provide more helpful error messages
      if (res.status === 503) {
        setExitError(data.message || data.error || 'Kiosk exit is currently unavailable. Please contact support.');
      } else if (res.status === 403 && data.error?.includes('admin email')) {
        setExitError('This kiosk session was created before admin email tracking was added. Please disable and re-enable kiosk mode.');
      } else {
        setExitError(data.error || data.message || 'Invalid credentials. Could not leave Kiosk mode.');
      }
    } catch (err: any) {
      console.error('Kiosk exit error:', err);
      setExitError('Unable to verify credentials. Please try again.');
    } finally {
      setExitLoading(false);
    }
  }

  // Keyboard event listener for PIN entry
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle if showing exit modal - let input fields handle keyboard events
      if (showExitModal) return;
      
      // Don't handle if showing acknowledgment
      if (showAcknowledgment) return;

      // Handle for check hours mode
      if (showCheckHours) {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          handleCheckHoursPinInput(e.key);
        } else if (e.key === 'Enter' && checkHoursPin.length === 4) {
          e.preventDefault();
          handleCheckHours();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          handleCheckHoursClear();
        }
        return;
      }

      // Handle for normal clock in/out mode
      if (!canProceedToPin) return;

      // Handle numeric keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinInput(e.key);
      }
      // Handle Enter key
      else if (e.key === 'Enter' && pin.length === 4) {
        e.preventDefault();
        handleSubmit();
      }
      // Handle Backspace/Delete to clear
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pin, checkHoursPin, canProceedToPin, showAcknowledgment, showCheckHours, showExitModal, handlePinInput, handleCheckHoursPinInput, handleSubmit, handleClear, handleCheckHoursClear, handleCheckHours, selectedLocation]);

  // Generate random positions for clocks and logos (stable across renders)
  const clockPositions = useRef(
    Array.from({ length: 15 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 120 + Math.random() * 120, // Even larger clocks: 120-240px
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      type: Math.random() > 0.5 ? 'clock' : 'logo', // Randomly assign clock or logo
      color: Math.random() > 0.5 ? 'purple' : 'gold', // Randomly assign purple or gold
    }))
  ).current;

  useEffect(() => {
    // Prevent body scroll and ensure proper viewport constraints for kiosk mode
    // Reset all layout styles to ensure full-screen kiosk mode
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.maxWidth = '100%';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.maxWidth = '100%';
    
    // Ensure root element is also full screen
    const root = document.getElementById('root');
    if (root) {
      root.style.margin = '0';
      root.style.padding = '0';
      root.style.width = '100%';
      root.style.height = '100%';
      root.style.maxWidth = '100%';
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.right = '0';
      root.style.bottom = '0';
    }
    
    return () => {
      // Cleanup on unmount - restore default styles
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.maxWidth = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      
      document.documentElement.style.overflow = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.documentElement.style.maxWidth = '';
      
      if (root) {
        root.style.margin = '';
        root.style.padding = '';
        root.style.width = '';
        root.style.height = '';
        root.style.maxWidth = '';
        root.style.position = '';
        root.style.top = '';
        root.style.left = '';
        root.style.right = '';
        root.style.bottom = '';
      }
    };
  }, []);

  return (
    <div 
      className="bg-white flex flex-col relative overflow-hidden" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'hidden',
        margin: 0,
        padding: 0,
        zIndex: 9999
      }}
    >
      {/* Header */}
      <header className="bg-royal-purple shadow-md sticky top-0 z-50 w-full" role="banner" style={{ color: '#C9A227' }}>
        <div className="w-full max-w-full px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-old-gold/20 transition-all focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple shrink-0"
              aria-label="Leave Kiosk mode"
                style={{ color: '#C9A227' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <Logo variant="kioskHeader" alt="Tech eTime" className="shrink-0" />
              <span className="text-lg font-bold whitespace-nowrap shrink-0" style={{ color: '#C9A227' }}>
                Tech eTime
              </span>
            </div>
            <span className="text-base font-semibold whitespace-nowrap shrink-0" style={{ color: '#C9A227' }}>
              Kiosk Mode
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative w-full max-w-full overflow-x-hidden min-w-0">
      {/* Animated background clocks and logos */}
      {clockPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
            animation: `float-clock-${i % 5} ${pos.duration}s ease-in-out infinite`,
            animationDelay: `${pos.delay}s`,
            opacity: pos.type === 'logo' ? 0.2 : 0.18,
          }}
        >
          {pos.type === 'logo' ? (
            <img
              src="/logo.png"
              alt="Tech eTime Logo"
              style={{
                width: `${pos.size}px`,
                height: 'auto',
                filter: pos.color === 'purple'
                  ? 'drop-shadow(0 0 12px rgba(75, 46, 131, 0.6)) drop-shadow(0 0 6px rgba(201, 162, 39, 0.5))'
                  : 'drop-shadow(0 0 12px rgba(201, 162, 39, 0.6)) drop-shadow(0 0 6px rgba(75, 46, 131, 0.5))',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: `${pos.size}px`,
                color: pos.color === 'purple' ? '#4B2E83' : '#C9A227',
                textShadow: pos.color === 'purple'
                  ? '0 0 12px rgba(75, 46, 131, 0.6), 0 0 6px rgba(201, 162, 39, 0.5), 3px 3px 6px rgba(75, 46, 131, 0.4)'
                  : '0 0 12px rgba(201, 162, 39, 0.6), 0 0 6px rgba(75, 46, 131, 0.5), 3px 3px 6px rgba(201, 162, 39, 0.4)',
                filter: 'drop-shadow(0 0 8px currentColor)',
              }}
            >
              🕐
            </span>
          )}
        </div>
      ))}
      
      <style>{`
        @keyframes float-clock-0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(90deg); }
          50% { transform: translate(-15px, 20px) rotate(180deg); }
          75% { transform: translate(30px, 10px) rotate(270deg); }
        }
        @keyframes float-clock-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-25px, 25px) rotate(120deg); }
          66% { transform: translate(25px, -20px) rotate(240deg); }
        }
        @keyframes float-clock-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(15px, -25px) rotate(72deg); }
          40% { transform: translate(-20px, 15px) rotate(144deg); }
          60% { transform: translate(25px, 20px) rotate(216deg); }
          80% { transform: translate(-15px, -10px) rotate(288deg); }
        }
        @keyframes float-clock-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -30px) rotate(180deg); }
        }
        @keyframes float-clock-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-30px, 20px) rotate(90deg); }
          50% { transform: translate(20px, 30px) rotate(180deg); }
          75% { transform: translate(-20px, -25px) rotate(270deg); }
        }
      `}</style>

      {/* Large static logo above kiosk box */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-center pointer-events-none z-0 pt-8">
        <Logo variant="kioskBackground" alt="Tech eTime Background" />
      </div>

      <div className="max-w-5xl w-full relative z-10 mx-auto min-w-0 px-4">

        {/* Acknowledgment Popup */}
        {showAcknowledgment && userInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-3xl font-bold text-royal-purple mb-2 text-center">
                  {isCheckHoursMode 
                    ? `Welcome, ${userInfo.firstName} ${userInfo.lastName}!`
                    : clockAction === 'clock-in' && messageType === 'initial'
                    ? `Welcome, ${userInfo.firstName}!`
                    : clockAction === 'clock-out' && messageType === 'break'
                    ? `Enjoy your break, ${userInfo.firstName}!`
                    : clockAction === 'clock-out' && messageType === 'end-of-day'
                    ? `Goodbye, ${userInfo.firstName}!`
                    : `Welcome, ${userInfo.firstName} ${userInfo.lastName}!`}
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  {isCheckHoursMode 
                    ? 'Your current pay period hours:' 
                    : clockAction === 'clock-in'
                    ? `${userInfo.firstName} has been clocked in successfully`
                    : `${userInfo.firstName} has been clocked out successfully`}
                </p>

                {/* Pay Period Summary */}
                {payPeriodSummary && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-royal-purple mb-4">Current Pay Period</h3>
                    <div className="text-sm text-gray-600 mb-4">
                      {format(parseISO(payPeriodSummary.payPeriod.startDate), 'MMM d')} - {format(parseISO(payPeriodSummary.payPeriod.endDate), 'MMM d, yyyy')}
                    </div>
                    {payPeriodSummary.summary.length > 0 ? (
                      <>
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                          {payPeriodSummary.summary.map((day) => (
                            <div key={day.date} className="border-b border-gray-200 pb-3 last:border-0">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-charcoal">
                                  {format(parseISO(day.date), 'EEEE, MMM d')}
                                </span>
                                <span className="text-sm text-old-gold font-medium">
                                  {day.totalHours.toFixed(2)} hrs
                                </span>
                              </div>
                              <div className="space-y-1 ml-2">
                                {day.entries.map((entry) => (
                                  <div key={entry.id} className="text-sm text-gray-600 flex justify-between">
                                    <span>
                                      {format(parseISO(entry.clockInAt), 'h:mm a')}
                                      {entry.clockOutAt && ` - ${format(parseISO(entry.clockOutAt), 'h:mm a')}`}
                                      {!entry.clockOutAt && <span className="text-old-gold ml-1">(In Progress)</span>}
                                    </span>
                                    {entry.hours && (
                                      <span className="text-gray-500">{entry.hours.toFixed(2)}h</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg text-charcoal">Total Hours</span>
                            <span className="font-bold text-lg text-old-gold">
                              {payPeriodSummary.totalHours.toFixed(2)} hrs
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No time entries for this pay period
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exit Kiosk modal - admin email + password required */}
        {showExitModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              // Close modal if clicking backdrop
              if (e.target === e.currentTarget) {
                setShowExitModal(false);
                setExitEmail('');
                setExitPassword('');
                setExitError('');
              }
            }}
            onKeyDown={(e) => {
              // Stop keyboard events from propagating to kiosk handler
              e.stopPropagation();
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-royal-purple mb-2">Leave Kiosk Mode</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Enter your admin email and password to leave Kiosk mode and return to the dashboard.
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExitKiosk();
                  }}
                  className="space-y-4"
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-1">Admin email</label>
                    <input
                      type="email"
                      value={exitEmail}
                      onChange={(e) => { 
                        e.stopPropagation();
                        setExitEmail(e.target.value); 
                        setExitError(''); 
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="you@example.com"
                      className="w-full"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-1">Admin password</label>
                    <input
                      type="password"
                      value={exitPassword}
                      onChange={(e) => { 
                        e.stopPropagation();
                        setExitPassword(e.target.value); 
                        setExitError(''); 
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="••••••••"
                      className="w-full"
                      autoComplete="current-password"
                    />
                  </div>
                  {exitError && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                      {exitError}
                    </div>
                  )}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowExitModal(false);
                        setExitEmail('');
                        setExitPassword('');
                        setExitError('');
                      }}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={exitLoading}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {exitLoading ? 'Verifying…' : 'Leave Kiosk'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {message && !showAcknowledgment && (
          <div className={`mb-6 md:mb-8 p-5 md:p-6 rounded-xl text-center text-lg md:text-xl ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {loadingLocations ? (
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12 text-center border border-gray-200 shadow-lg">
            <p className="text-charcoal text-xl md:text-2xl">Loading...</p>
          </div>
        ) : !showAcknowledgment && (
          <div className="bg-gray-50 rounded-2xl p-6 md:p-12 lg:p-16 space-y-8 md:space-y-10 border border-gray-200 shadow-lg">
            {/* Logo inside the box */}
            <div className="text-center mb-8 md:mb-10">
              <Logo variant="kioskBox" alt="Tech eTime" />
            </div>

            {/* Location Selection - Only show if multiple locations */}
            {showLocationSelect && (
              <div className="mb-8 md:mb-10">
                <label className="block text-charcoal text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-center">
                  Select Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-6 py-4 md:py-5 text-xl md:text-2xl rounded-lg border-2 border-gray-300 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-royal-purple focus:border-royal-purple"
                >
                  <option value="">Choose a location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* PIN Pad - Show clock in/out or check hours mode */}
            {canProceedToPin && (
              <>
                {showCheckHours ? (
                  <>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-charcoal mb-6 md:mb-8 text-center">Check My Hours</h3>
                    <div className="flex justify-center gap-4 md:gap-6 mb-8 md:mb-10">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl border-2 flex items-center justify-center text-3xl md:text-4xl lg:text-5xl font-bold ${
                            checkHoursPin.length > i
                              ? 'border-old-gold bg-old-gold text-charcoal'
                              : 'border-gray-300 bg-white text-gray-400'
                          }`}
                        >
                          {checkHoursPin.length > i ? '•' : ''}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-2xl mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleCheckHoursPinInput(num.toString())}
                          className="bg-white border-2 border-gray-300 text-charcoal text-3xl md:text-4xl lg:text-5xl font-bold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-gray-50 active:scale-95 transition shadow-md"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={handleCheckHoursClear}
                        className="bg-red-500 text-white text-xl md:text-2xl font-semibold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-red-600 active:scale-95 transition shadow-md"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => handleCheckHoursPinInput('0')}
                        className="bg-white border-2 border-gray-300 text-charcoal text-3xl md:text-4xl lg:text-5xl font-bold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-gray-50 active:scale-95 transition shadow-md"
                      >
                        0
                      </button>
                      <button
                        onClick={handleCheckHours}
                        disabled={checkHoursPin.length !== 4}
                        className="bg-old-gold text-charcoal text-xl md:text-2xl font-semibold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-opacity-90 active:scale-95 transition disabled:opacity-50 shadow-md"
                      >
                        Enter
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setShowCheckHours(false);
                          setCheckHoursPin('');
                        }}
                        className="flex-1 bg-gray-200 text-charcoal text-sm font-semibold py-2 rounded-lg hover:bg-gray-300 active:scale-95 transition"
                      >
                        Back to Clock In/Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center gap-4 md:gap-6 mb-8 md:mb-10" ref={pinInputRef}>
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl border-2 flex items-center justify-center text-3xl md:text-4xl lg:text-5xl font-bold ${
                            pin.length > i
                              ? 'border-old-gold bg-old-gold text-charcoal'
                              : 'border-gray-300 bg-white text-gray-400'
                          }`}
                        >
                          {pin.length > i ? '•' : ''}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-2xl mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => handlePinInput(num.toString())}
                          className="bg-white border-2 border-gray-300 text-charcoal text-3xl md:text-4xl lg:text-5xl font-bold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-gray-50 active:scale-95 transition shadow-md"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => handleClear()}
                        className="bg-red-500 text-white text-xl md:text-2xl font-semibold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-red-600 active:scale-95 transition shadow-md"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => handlePinInput('0')}
                        className="bg-white border-2 border-gray-300 text-charcoal text-3xl md:text-4xl lg:text-5xl font-bold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-gray-50 active:scale-95 transition shadow-md"
                      >
                        0
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={pin.length !== 4}
                        className="bg-old-gold text-charcoal text-xl md:text-2xl font-semibold py-6 md:py-8 lg:py-10 rounded-xl hover:bg-opacity-90 active:scale-95 transition disabled:opacity-50 shadow-md"
                      >
                        Enter
                      </button>
                    </div>
                    <p className="text-center text-gray-600 text-base md:text-lg mt-6 md:mt-8">
                      You can also type your PIN using the keyboard
                    </p>
                  </>
                )}

                {/* Check Hours Button - Moved to bottom */}
                {!showCheckHours && (
                  <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-gray-300 max-w-2xl mx-auto">
                    <button
                      onClick={() => {
                        setShowCheckHours(true);
                        setPin('');
                        setMessage(null);
                        setIsCheckHoursMode(false);
                      }}
                      className="w-full bg-royal-purple text-white text-xl md:text-2xl font-semibold py-5 md:py-6 lg:py-8 rounded-xl hover:bg-royal-purple/90 active:scale-95 transition shadow-md"
                    >
                      Check My Hours
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
