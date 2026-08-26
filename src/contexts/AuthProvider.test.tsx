import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, AppRole } from '@/types/database';

// --- Modül mock'ları ---------------------------------------------------------

// Supabase client'ı tamamen mock'la: gerçek ağ/db yok.
const authChangeHandler = vi.fn<(event: string, session: Session | null) => void>();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb: typeof authChangeHandler) => {
        authChangeHandler.mockImplementation(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  captureError: vi.fn(),
}));

import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';

// --- Yardımcılar -------------------------------------------------------------

const TEST_USER_ID = 'u-1';

function makeSession(userId: string = TEST_USER_ID): Session {
  return {
    user: { id: userId, email: 'test@example.com' } as unknown as User,
  } as unknown as Session;
}

function makeProfile(userId: string = TEST_USER_ID): Profile {
  return {
    id: 'p-1',
    user_id: userId,
    username: 'testuser',
    full_name: 'Test Kullanıcı',
    avatar_url: null,
    bio: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * profiles / user_roles tabloları için zincirlenebilir query-builder mock'u.
 * AuthProvider şu iki şekli kullanır:
 *   .from('profiles').select('*').eq('user_id', id).maybeSingle()
 *   .from('user_roles').select('role').eq('user_id', id)          (await edilir)
 */
function mockDb(opts: {
  profile?: Profile | null;
  roles?: AppRole[];
  rejectRoles?: boolean;
} = {}) {
  const { profile = null, roles = [], rejectRoles = false } = opts;

  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: profile, error: null }),
          }),
        }),
      };
    }
    // user_roles
    return {
      select: () => ({
        eq: () =>
          rejectRoles
            ? Promise.reject(new Error('db down'))
            : Promise.resolve({
                data: roles.map((role) => ({ role })),
                error: null,
              }),
      }),
    };
  }) as unknown as typeof supabase.from);
}

function mountProvider() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    ),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Testler -----------------------------------------------------------------

describe('AuthProvider — başlangıç yüklemesi', () => {
  it('oturum yokken isLoading tamamlanır ve kullanıcı null kalır', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    const { result } = mountProvider();

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.roles).toEqual([]);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isModerator).toBe(false);
  });

  it('mevcut oturumda profil ve roller yüklenir; admin rolü doğru çözümlenir', async () => {
    mockDb({ profile: makeProfile(), roles: ['admin'] });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() },
      error: null,
    } as never);

    const { result } = mountProvider();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user?.id).toBe(TEST_USER_ID);
    expect(result.current.profile?.username).toBe('testuser');
    expect(result.current.roles).toEqual(['admin']);
    expect(result.current.isAdmin).toBe(true);
    // admin dolaylı olarak moderator yetkisine de sahiptir
    expect(result.current.isModerator).toBe(true);
  });

  it('moderator rolü isAdmin=false, isModerator=true verir', async () => {
    mockDb({ profile: makeProfile(), roles: ['moderator'] });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() },
      error: null,
    } as never);

    const { result } = mountProvider();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isModerator).toBe(true);
  });

  it('roller yüklenemezse isLoading yine de false olur ve hata loglanır', async () => {
    mockDb({ profile: makeProfile(), rejectRoles: true });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() },
      error: null,
    } as never);

    const { result } = mountProvider();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({ feature: 'auth', action: 'fetch-roles' }),
      }),
    );
  });
});

describe('AuthProvider — signIn', () => {
  it('başarılı girişte hata dönmez ve doğru argümanlarla çağrılır', async () => {
    mockDb();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let res: { error: unknown };
    await act(async () => {
      res = await result.current.signIn('test@example.com', 'parola123');
    });

    expect(res!.error).toBeNull();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'parola123',
    });
  });

  it('bilinen hata mesajlarını Türkçeye çevirir ve kodu korur', async () => {
    mockDb();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
    } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let res: { error: { message: string; code?: string } | null };
    await act(async () => {
      res = await result.current.signIn('test@example.com', 'yanlis');
    });

    expect(res!.error).not.toBeNull();
    expect(res!.error!.message).toBe('E-posta veya şifre hatalı.');
    expect(res!.error!.code).toBe('invalid_credentials');
  });

  it('bilinmeyen hata mesajını olduğu gibi bırakır', async () => {
    mockDb();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Some unexpected failure' },
    } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let res: { error: { message: string } | null };
    await act(async () => {
      res = await result.current.signIn('test@example.com', 'x');
    });

    expect(res!.error!.message).toBe('Some unexpected failure');
  });
});

describe('AuthProvider — signUp', () => {
  it('metadata ve emailRedirectTo ile kayıt isteği gönderir', async () => {
    mockDb();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signUp('yeni@example.com', 'parola123', {
        username: 'yenikullanici',
        full_name: 'Yeni Kullanıcı',
      });
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'yeni@example.com',
        password: 'parola123',
        options: expect.objectContaining({
          data: { username: 'yenikullanici', full_name: 'Yeni Kullanıcı' },
          emailRedirectTo: expect.stringContaining('/giris'),
        }),
      }),
    );
  });
});

describe('AuthProvider — signOut', () => {
  it('oturumu kapatır; SIGNED_OUT eventi profil/rolleri temizler', async () => {
    mockDb({ profile: makeProfile(), roles: ['admin'] });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(true);

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

    // Supabase auth state change eventini tetikler; provider bunu dinliyor olmalı
    await act(async () => {
      authChangeHandler('SIGNED_OUT', null);
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.profile).toBeNull();
    expect(result.current.roles).toEqual([]);
    expect(result.current.isAdmin).toBe(false);
  });
});

describe('AuthProvider — auth state değişimi', () => {
  it('SIGNED_IN eventi sonrası kullanıcı verisi yüklenir', async () => {
    mockDb({ profile: makeProfile(), roles: ['user'] });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();

    await act(async () => {
      authChangeHandler('SIGNED_IN', makeSession());
    });

    await waitFor(() => expect(result.current.user?.id).toBe(TEST_USER_ID));
    expect(result.current.profile?.username).toBe('testuser');
    expect(result.current.roles).toEqual(['user']);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isModerator).toBe(false);
  });

  it('aynı kullanıcı için tekrarlanan SIGNED_IN yeniden fetch tetiklemez (race guard)', async () => {
    mockDb({ profile: makeProfile(), roles: ['admin'] });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: makeSession() },
      error: null,
    } as never);

    const { result } = mountProvider();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsAfterInitialLoad = vi.mocked(supabase.from).mock.calls.length;
    expect(callsAfterInitialLoad).toBeGreaterThan(0);

    await act(async () => {
      authChangeHandler('SIGNED_IN', makeSession());
    });

    // Aynı userId → loadUserData no-op dönmeli, yeni sorgu açılmamalı
    expect(vi.mocked(supabase.from).mock.calls.length).toBe(callsAfterInitialLoad);
  });
});
