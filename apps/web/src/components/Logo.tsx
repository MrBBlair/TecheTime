export type LogoVariant =
  | 'header'
  | 'footer'
  | 'kioskHeader'
  | 'kioskBox'
  | 'kioskBackground'
  | 'landing'
  | 'adminLogin'
  | 'onboarding'
  | 'floatingSmall'
  | 'floatingLarge';

const VARIANT_CLASSES: Record<LogoVariant, string> = {
  header: 'h-20 sm:h-[5.5rem] w-auto',
  footer: 'h-16 sm:h-[4.5rem] w-auto',
  kioskHeader: 'h-20 sm:h-[5.5rem] w-auto',
  kioskBox: 'h-[26rem] md:h-[32rem] w-auto mx-auto',
  kioskBackground: 'w-auto max-w-[98vw] max-h-[50vh] object-contain opacity-5',
  landing: 'h-56 md:h-80 w-auto',
  adminLogin: 'h-48 md:h-64 w-auto',
  onboarding: 'h-48 md:h-64 w-auto',
  floatingSmall: 'h-10 w-auto md:h-12',
  floatingLarge: 'w-full h-full max-w-[280px] max-h-[280px] object-contain opacity-5',
};

interface LogoProps {
  variant: LogoVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export default function Logo({
  variant,
  className = '',
  alt = 'Tech eTime',
  priority = false,
}: LogoProps) {
  const sizeClass = VARIANT_CLASSES[variant];
  const combined = className ? `${sizeClass} ${className}`.trim() : sizeClass;

  return (
    <img
      src="/logo.png"
      alt={alt}
      className={combined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      aria-hidden={alt === '' ? true : undefined}
    />
  );
}
