import { useEffect, useState } from 'preact/hooks';

/** Router minimale a hash: "#/esercizi/abc" -> ['esercizi', 'abc'] */
export function useRoute(): string[] {
  const read = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => { location.hash = '/' + path; };
export const back = () => (history.length > 1 ? history.back() : go(''));
