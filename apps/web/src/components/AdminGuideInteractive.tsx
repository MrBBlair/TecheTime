/**
 * Admin Guide (Interactive)
 * - Stepper + checklist
 * - Persist completion to localStorage
 * - “Next step” focuses the next incomplete item
 */
 
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MapPin,
  RotateCcw,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Building2,
  Bell,
  Clock,
} from 'lucide-react';
 
type StepId =
  | 'business'
  | 'locations'
  | 'staff'
  | 'kiosk'
  | 'security'
  | 'payroll'
  | 'notifications';
 
interface GuideStep {
  id: StepId;
  title: string;
  summary: string;
  detail: string;
  action?: { label: string; path: string };
  icon: React.ReactNode;
  recommended?: boolean;
}
 
const STORAGE_KEY = 'admin_guide_completed_v1';
 
const STEPS: GuideStep[] = [
  {
    id: 'business',
    title: 'Business profile',
    summary: 'Confirm your business name and contact details.',
    detail:
      'Your business name is used across the app (dashboard, exports, and future notifications). Keep it consistent with payroll/accounting.',
    action: { label: 'Edit business profile', path: '/settings#business' },
    icon: <Building2 className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: 'locations',
    title: 'Locations & timezones',
    summary: 'Add each worksite and verify its timezone.',
    detail:
      'Timezones are critical: we store timestamps in UTC and convert using the Location timezone for display and payroll integrity.',
    action: { label: 'Manage locations', path: '/settings#locations' },
    icon: <MapPin className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: 'staff',
    title: 'Staff & PINs',
    summary: 'Create staff and assign 4–8 digit PINs for kiosk use.',
    detail:
      'Workers can punch via PIN. Managers should also have a PIN so they can exit kiosk mode when needed.',
    action: { label: 'Go to staff list', path: '/dashboard' },
    icon: <Users className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: 'kiosk',
    title: 'Provision kiosk device',
    summary: 'Register a shared device and open kiosk mode on it.',
    detail:
      'Provisioning stores a device secret in the browser. For a real kiosk tablet, provision directly on that device.',
    action: { label: 'Provision kiosk from dashboard', path: '/dashboard' },
    icon: <Smartphone className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: 'security',
    title: 'Kiosk exit security',
    summary: 'Verify admins can exit kiosk mode with their PIN.',
    detail:
      'To exit kiosk mode: hold Exit for 3 seconds, then enter an Owner/Manager PIN. This keeps the kiosk locked for staff use.',
    action: { label: 'Review security settings', path: '/settings#security' },
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'payroll',
    title: 'Time & payroll defaults',
    summary: 'Set pay period and overtime threshold for reporting.',
    detail:
      'These settings drive reporting/export behavior. (Advanced payroll rules will expand in later phases.)',
    action: { label: 'Configure time & payroll', path: '/settings#time' },
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Decide how you want alerts delivered.',
    detail:
      'Email summaries and push alerts help reduce missed punches. Push requires browser permission.',
    action: { label: 'Notification settings', path: '/settings#notifications' },
    icon: <Bell className="w-5 h-5" />,
  },
];
 
function loadCompleted(): Record<StepId, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as any;
    return JSON.parse(raw);
  } catch {
    return {} as any;
  }
}
 
function saveCompleted(value: Record<StepId, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
 
export function AdminGuideInteractive() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<StepId | null>('business');
  const [completed, setCompleted] = useState<Record<StepId, boolean>>(() => loadCompleted());
 
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
 
  const total = STEPS.length;
  const doneCount = useMemo(
    () => STEPS.reduce((acc, s) => acc + (completed[s.id] ? 1 : 0), 0),
    [completed]
  );
  const progressPct = Math.round((doneCount / total) * 100);
 
  const nextStep = useMemo(() => STEPS.find((s) => !completed[s.id]) ?? null, [completed]);
 
  useEffect(() => {
    saveCompleted(completed);
  }, [completed]);
 
  const toggleComplete = (id: StepId) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };
 
  const reset = () => {
    if (!confirm('Reset guide progress?')) return;
    setCompleted({} as any);
    setExpandedId('business');
  };
 
  const focusStep = (id: StepId) => {
    setExpandedId(id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-brand-purple/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-brand-purple">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-semibold tracking-wide uppercase">Admin Guide</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Get set up in minutes</h2>
            <p className="mt-2 text-sm text-gray-600">
              A guided checklist for admins — with progress tracking and “do it now” shortcuts.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
 
        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              Progress: <span className="font-semibold">{doneCount}</span> / {total}
            </span>
            <span className="text-gray-600">{progressPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-purple transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
 
          {nextStep && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700">
                Next up: <span className="font-semibold">{nextStep.title}</span>
              </div>
              <button
                type="button"
                onClick={() => focusStep(nextStep.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
              >
                Go to next step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
 
      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const isOpen = expandedId === step.id;
          const isDone = !!completed[step.id];
          return (
            <div
              key={step.id}
              ref={(el) => {
                cardRefs.current[step.id] = el;
              }}
              className={`rounded-2xl border transition-colors ${
                isDone ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : step.id)}
                className="w-full px-5 py-4 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">{idx + 1}</span>
                      <h3 className="font-semibold text-gray-900 truncate">{step.title}</h3>
                      {step.recommended && (
                        <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{step.summary}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${isDone ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-green-600' : 'text-gray-300'}`} />
                      {isDone ? 'Done' : 'Not yet'}
                    </span>
                    <span className="text-gray-400">
                      {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </span>
                  </div>
                </div>
              </button>
 
              {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{step.detail}</p>
 
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <button
                        type="button"
                        onClick={() => toggleComplete(step.id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                          isDone
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isDone ? 'Mark as not done' : 'Mark as done'}
                      </button>
 
                      {step.action && (
                        <button
                          type="button"
                          onClick={() => {
                            // Close accordion so the navigation feels immediate
                            setExpandedId(step.id);
                            navigate(step.action!.path);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-purple hover:bg-gray-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {step.action.label}
                        </button>
                      )}
                    </div>
 
                    <div className="text-xs text-gray-500">
                      Tip: You can come back later — progress is saved on this browser.
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
 
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">What’s next?</h3>
            <p className="mt-1 text-sm text-gray-600">
              After setup, you’ll use the dashboard daily. Next phases add payroll exports, super admin tools, and automated notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

