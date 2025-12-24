import { useCallback, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return { toast, show, dismiss };
}
