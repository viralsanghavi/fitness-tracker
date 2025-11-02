const baseClasses =
  'flex-1 cursor-pointer select-none rounded-md border border-border px-4 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const ToggleSwitch = ({ value = false, onChange, yesLabel = 'Yes', noLabel = 'No' }) => (
  <div className="flex gap-2">
    <button
      type="button"
      className={`${baseClasses} ${value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}
      onClick={() => onChange?.(true)}
    >
      {yesLabel}
    </button>
    <button
      type="button"
      className={`${baseClasses} ${!value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}
      onClick={() => onChange?.(false)}
    >
      {noLabel}
    </button>
  </div>
);

export default ToggleSwitch;
