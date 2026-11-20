import { computed, inject, Injectable, signal } from '@angular/core';
import { categories } from './event-types';
import { CanActivateFn, Router } from '@angular/router';

export interface Preferences {
  interests: string[];
  city: string;
  completed: boolean;
}
export type AccountRole = 'person' | 'company' | 'validator';
export interface Account {
  role: AccountRole;
  companyName: string;
  companyId: string;
  assignedEventIds: string[];
  enabled: boolean;
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  preferences: Preferences;
}
interface StoredAccounts { accounts: Account[]; activeId: string | null; }
const key = 'que-surge:accounts:v1';
const blank: StoredAccounts = { accounts: [], activeId: null };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function load(): StoredAccounts {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!value || !Array.isArray(value.accounts)) return blank;
    const accounts = value.accounts.filter((item: Account) =>
      item && typeof item.id === 'string' && typeof item.name === 'string' &&
      typeof item.email === 'string' && typeof item.salt === 'string' &&
      typeof item.passwordHash === 'string' && item.preferences &&
      Array.isArray(item.preferences.interests) &&
      item.preferences.interests.every(interest => typeof interest === 'string') &&
      typeof item.preferences.city === 'string' && typeof item.preferences.completed === 'boolean')
      .map((item: Account) => ({
        ...item, role: item.role === 'company' ? 'company' as const : item.role === 'validator' ? 'validator' as const : 'person' as const,
        companyName: typeof item.companyName === 'string' ? item.companyName : '',
        companyId: typeof item.companyId === 'string' ? item.companyId : '',
        assignedEventIds: Array.isArray(item.assignedEventIds) ? item.assignedEventIds.filter(id => typeof id === 'string') : [],
        enabled: item.enabled !== false
      }));
    return { accounts, activeId: typeof value.activeId === 'string' ? value.activeId : null };
  } catch { return blank; }
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 210000, hash: 'SHA-256'
  }, material, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly state = signal<StoredAccounts>(load());
  readonly user = computed(() => this.state().accounts.find(account => account.id === this.state().activeId) ?? null);
  readonly needsPreferences = computed(() => this.user()?.role === 'person' &&
    !this.user()?.preferences.completed);
  readonly validators = computed(() => this.state().accounts.filter(account =>
    account.role === 'validator' && account.companyId === this.user()?.id));
  currentAccount() { return load().accounts.find(account => account.id === this.user()?.id) ?? null; }
  refreshAccounts() { this.state.update(state => ({ ...state, accounts: load().accounts })); }
  private busy = false;

  private persist(next: StoredAccounts) {
    localStorage.setItem(key, JSON.stringify(next));
    this.state.set(next);
  }

  async enter(register: boolean, name: string, email: string, password: string, role: AccountRole = 'person', companyName = '') {
    if (this.busy) throw new Error('Esperá a que termine la solicitud.');
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) throw new Error('Ingresá un correo válido.');
    if (register && (!name.trim() || name.trim().length > 80)) throw new Error('Ingresá un nombre de hasta 80 caracteres.');
    if (register && password.length < 8) throw new Error('Usá una contraseña de al menos 8 caracteres.');
    if (register && !['person', 'company'].includes(role)) throw new Error('Elegí un tipo de cuenta válido.');
    if (register && role === 'company' && (!companyName.trim() || companyName.trim().length > 100)) throw new Error('Ingresá el nombre de tu empresa, hasta 100 caracteres.');
    this.busy = true;
    try {
      if (!crypto.subtle) throw new Error('Abrí la aplicación en localhost o mediante HTTPS.');
      let account = this.state().accounts.find(item => item.email === normalizedEmail);
      if (register && account) throw new Error('Ya existe una cuenta con ese correo en este navegador.');
      if (!register && (!account || !account.enabled)) throw new Error('El correo o la contraseña son incorrectos.');
      const salt = account?.salt ?? crypto.randomUUID();
      const passwordHash = await hashPassword(password, salt);
      if (!register && account?.passwordHash !== passwordHash) throw new Error('El correo o la contraseña son incorrectos.');
      if (register) {
        account = {
          id: crypto.randomUUID(), role, companyId: '', assignedEventIds: [], enabled: true, companyName: role === 'company' ? companyName.trim() : '', name: name.trim(), email: normalizedEmail, salt, passwordHash,
          preferences: { interests: [], city: '', completed: false }
        };
      }
      const current = this.state();
      if (register && current.accounts.some(item => item.email === normalizedEmail)) throw new Error('Ese correo ya está registrado.');
      this.persist({
        accounts: register ? [...current.accounts, account!] : current.accounts,
        activeId: account!.id
      });
    } finally { this.busy = false; }
  }

  async createValidator(name: string, email: string, password: string, eventIds: string[]) {
    const company = this.user();
    if (company?.role !== 'company') throw new Error('Ingresá con una cuenta de empresa.');
    if (!name.trim() || name.trim().length > 80 || !emailPattern.test(email.trim())) throw new Error('Completá nombre y correo válidos.');
    if (password.length < 8) throw new Error('Usá una contraseña de al menos 8 caracteres.');
    if (!eventIds.length) throw new Error('Asigná al menos un evento.');
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    if (this.user()?.id !== company.id) throw new Error('La sesión cambió. Intentá nuevamente.');
    const accounts = load().accounts;
    const normalizedEmail = email.trim().toLowerCase();
    if (accounts.some(account => account.email === normalizedEmail)) throw new Error('Ese correo ya está registrado. Usá un correo individual para el validador.');
    const validator: Account = {
      id: crypto.randomUUID(), role: 'validator', name: name.trim(), email: normalizedEmail, salt, passwordHash,
      companyName: company.companyName, companyId: company.id, assignedEventIds: [...new Set(eventIds)], enabled: true,
      preferences: { interests: [], city: '', completed: false }
    };
    this.persist({ accounts: [...accounts, validator], activeId: company.id });
  }

  setValidator(id: string, assignedEventIds: string[], enabled: boolean) {
    const company = this.user();
    if (company?.role !== 'company') throw new Error('Ingresá con una cuenta de empresa.');
    const accounts = load().accounts;
    if (!accounts.some(account => account.id === id && account.role === 'validator' && account.companyId === company.id)) throw new Error('No se encontró el validador de tu empresa.');
    this.persist({ activeId: company.id, accounts: accounts.map(account =>
      account.id === id ? { ...account, assignedEventIds: [...new Set(assignedEventIds)], enabled } : account) });
  }

  addDemoAccounts(accounts: Account[]) {
    const current = load();
    const merged = [...current.accounts];
    for (const account of accounts) {
      if (!account.id.startsWith('qs-demo-v1-') || !account.email.endsWith('@demo.quesurge.test')) throw new Error('Cuenta de ejemplo inválida.');
      if (merged.some(item => item.id === account.id)) continue;
      if (merged.some(item => item.email === account.email)) throw new Error('El correo de una cuenta de ejemplo ya está en uso.');
      merged.push(account);
    }
    this.persist({ accounts: merged, activeId: this.state().activeId });
  }

  openDemoAccount(id: string) {
    const current = load();
    const account = current.accounts.find(item => item.id === id &&
      item.id.startsWith('qs-demo-v1-') && item.email.endsWith('@demo.quesurge.test'));
    if (!account || !account.enabled) throw new Error('Esta cuenta de ejemplo no está disponible. Revisá sus permisos desde la empresa.');
    this.persist({ accounts: current.accounts, activeId: account.id });
  }

  updateProfile(name: string) {
    if (!name.trim() || name.trim().length > 80) throw new Error('Ingresá un nombre de hasta 80 caracteres.');
    this.update({ name: name.trim() });
  }

  updateCompany(name: string, companyName: string) {
    if (this.user()?.role !== 'company') throw new Error('Ingresá con una cuenta de empresa.');
    if (!name.trim() || name.trim().length > 80 || !companyName.trim() || companyName.trim().length > 100) {
      throw new Error('Completá el nombre de empresa y la persona de contacto.');
    }
    this.update({ name: name.trim(), companyName: companyName.trim() });
  }

  savePreferences(interests: string[], city: string) {
    if (!interests.length || interests.some(interest => !categories.some(category => category === interest)) || !city.trim()) throw new Error('Elegí al menos un interés y una ciudad.');
    this.update({ preferences: { interests: [...new Set(interests)], city: city.trim(), completed: true } });
  }

  private update(changes: Partial<Pick<Account, 'name' | 'preferences' | 'companyName'>>) {
    const user = this.user();
    if (!user) throw new Error('Iniciá sesión para guardar tus cambios.');
    this.persist({
      ...this.state(),
      accounts: this.state().accounts.map(account => account.id === user.id ? { ...account, ...changes } : account)
    });
  }

  logout() {
    this.persist({ ...this.state(), activeId: null });
  }
}

export const requirePerson: CanActivateFn = () => {
  const user = inject(Auth).user();
  const router = inject(Router);
  if (!user) return router.parseUrl('/ingresar');
  if (user.role === 'company') return router.parseUrl('/empresa');
  if (user.role === 'validator') return router.parseUrl('/validar');
  return inject(Auth).needsPreferences() ? router.parseUrl('/gustos') : true;
};

export const requireAccount: CanActivateFn = () => {
  const user = inject(Auth).user();
  const router = inject(Router);
  if (!user) return router.parseUrl('/ingresar');
  return user.role === 'person' ? true : router.parseUrl(user.role === 'validator' ? '/validar' : '/empresa');
};

export const requireCompany: CanActivateFn = () => {
  const user = inject(Auth).user();
  const router = inject(Router);
  if (!user) return router.parseUrl('/ingresar');
  return user.role === 'company' ? true : router.parseUrl(user.role === 'validator' ? '/validar' : inject(Auth).needsPreferences() ? '/gustos' : '/inicio');
};


export const requireValidator: CanActivateFn = () => {
  const user = inject(Auth).user();
  const router = inject(Router);
  if (!user || !user.enabled) return router.parseUrl('/ingresar');
  return user.role === 'validator' ? true : router.parseUrl(user.role === 'company' ? '/empresa' : '/inicio');
};
