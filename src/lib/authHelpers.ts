export const ADMIN_EMAIL = 'zohaibdigiforge@gmail.com';

export const isUserAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export const getMasterAdminProfile = () => ({
  uid: 'zdf-master-admin',
  name: 'Zohaib (Owner)',
  displayName: 'Zohaib DigiForge Admin',
  email: ADMIN_EMAIL,
  role: 'admin' as const,
  photoURL: '',
  membershipStatus: 'pro' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
  ordersCount: 0,
  loggedInAt: new Date().toISOString()
});

