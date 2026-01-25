interface RememberMeProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function RememberMe({ checked, onChange }: RememberMeProps) {
  return (
    <div className="flex items-center">
      <input
        id="remember-me"
        name="remember-me"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-royal-purple focus:ring-royal-purple border-gray-300 rounded"
      />
      <label htmlFor="remember-me" className="ml-2 block text-sm text-charcoal">
        Remember me
      </label>
    </div>
  );
}
