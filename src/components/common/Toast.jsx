import { useEffect } from 'react';
import useTrackerStore from '../../store/useTrackerStore.js';

const Toast = () => {
  const toast = useTrackerStore((state) => state.toast);
  const clearToast = useTrackerStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => {
      clearToast();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div className="fixed right-6 top-6 z-50 min-w-[240px] rounded-md border border-primary/40 bg-background px-4 py-3 text-sm font-medium shadow-lg">
      {toast}
    </div>
  );
};

export default Toast;
