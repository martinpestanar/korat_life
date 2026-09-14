export interface AppItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  tag: string;
  tagColor?: string;
  isExternal?: boolean;
}

export const INITIAL_APPS: AppItem[] = [
  {
    id: 'korat-flow',
    name: 'Korat Flow Live',
    description: 'Rutina diaria, pilares, recreo mental y finanzas.',
    path: '/app',
    icon: '⚡',
    tag: 'Principal',
    tagColor: '#104D30'
  },
  {
    id: 'sandbox-lab',
    name: 'Sandbox & Pruebas',
    description: 'Laboratorio para probar componentes y código en sucio.',
    path: '/sandbox',
    icon: '🧪',
    tag: 'Lab',
    tagColor: '#D46A43'
  }
];

const STORAGE_KEY = 'korat_lab_registered_apps';

export function getRegisteredApps(): AppItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_APPS;
    const customApps = JSON.parse(stored);
    return [...INITIAL_APPS, ...customApps];
  } catch {
    return INITIAL_APPS;
  }
}

export function saveCustomApp(app: Omit<AppItem, 'id'>): AppItem {
  const newApp: AppItem = {
    ...app,
    id: 'custom-' + Date.now()
  };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customApps: AppItem[] = stored ? JSON.parse(stored) : [];
    customApps.push(newApp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customApps));
  } catch (e) {
    console.error('Error guardando app en Korat Lab:', e);
  }
  return newApp;
}

export function removeCustomApp(id: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const customApps: AppItem[] = JSON.parse(stored);
    const filtered = customApps.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error borrando app en Korat Lab:', e);
  }
}
