import { useEffect, useState } from 'react';
import { loadCatalog } from '../lib/catalog';

export function useCatalog() {
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => {
    let active = true;
    loadCatalog().then(() => { if (active) setState({ loading: false, error: '' }); })
      .catch(() => { if (active) setState({ loading: false, error: 'Catalog unavailable. You can still enter custom details.' }); });
    return () => { active = false; };
  }, []);
  return state;
}
