import { MOODS } from '../../utils/tracking.js';

const MoodSelector = ({ value = 0, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {MOODS.map((moodEmoji, index) => {
      const moodValue = index + 1;
      const isSelected = moodValue === value;
      return (
        <button
          key={moodEmoji}
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background'
          }`}
          onClick={() => onChange?.(moodValue)}
        >
          {moodEmoji}
        </button>
      );
    })}
  </div>
);

export default MoodSelector;
