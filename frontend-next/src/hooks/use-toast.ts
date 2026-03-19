import { useState } from 'react';

type ToastProps = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    setToasts((prev) => [...prev, props]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
    
    if (typeof window !== 'undefined') {
      alert(`${props.title}${props.description ? ': ' + props.description : ''}`);
    }
  };

  return { toast, toasts };
}
