import { useCallback, useRef, useState } from "react";

/**
 * Confirm dialog baseado em Promise: `const ok = await ask("mensagem")`.
 * O componente ConfirmModal consome `state` e chama `resolve(bool)`.
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, message: "", anim: "bounce" });
  const resolver = useRef(null);

  const ask = useCallback((message) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({ open: true, message: message || "tem certeza?", anim: "bounce" });
    });
  }, []);

  const resolve = useCallback((result) => {
    setState((s) => ({ ...s, anim: "shake" }));
    setTimeout(() => {
      setState((s) => ({ ...s, open: false }));
      resolver.current?.(result);
      resolver.current = null;
    }, 280);
  }, []);

  return { state, ask, resolve };
}
