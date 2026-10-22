import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';

/** Runs an async loader and tracks loading/error state. Ignores out-of-date responses. */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const counter = useRef(0);

  const run = useCallback(async () => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await loader();
      if (id === counter.current) setState({ data, loading: false, error: '' });
    } catch (err) {
      if (id === counter.current) setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);

  return { ...state, reload: run, setData };
}
