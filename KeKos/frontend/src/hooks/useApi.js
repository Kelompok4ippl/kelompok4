import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";

// Ambil data dari backend: const { data, error, loading, reload } = useApi("/kos")
// path null = belum mengambil apa pun. Saat reload, data lama tetap tampil sampai data baru datang.
export function useApi(path) {
  const [version, setVersion] = useState(0);
  const key = path ? `${path}#${version}` : null;
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api(path)
      .then((data) => !cancelled && setResult({ key, data, error: "" }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const done = result.key === key;
  return {
    data: result.data,
    error: done ? result.error : "",
    loading: Boolean(key) && !done && result.data == null,
    reload,
  };
}
