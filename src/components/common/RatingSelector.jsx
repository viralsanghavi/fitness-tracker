const RatingSelector = ({ value = 0, onChange, count = 10 }) => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: count }, (_, index) => {
      const ratingValue = index + 1;
      const isSelected = ratingValue <= value;
      return (
        <button
          key={ratingValue}
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors ${
            isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
          }`}
          onClick={() => onChange?.(ratingValue)}
        >
          {ratingValue}
        </button>
      );
    })}
  </div>
);

export default RatingSelector;
