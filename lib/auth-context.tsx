import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getEntitlements, getMe, getSubscription } from './api';

type Me = {
  id: number;
  email: string;
  role: string;
  hasTier1: boolean;
  stripeCustomerId?: string | null;
};

type Subscription = {
  plan?: string | null;
  status?: string | null;
  currentPeriodEnd?: string | null;
  isRecurring?: boolean;
  stripeSubscriptionId?: string | null;
};

type Entitlements = {
  canTrade: boolean;
  canReceiveEmailSignals: boolean;
  canAccessDashboard: boolean;
  tier1: boolean;
  tier2Status?: string | null;
  tier2Active?: boolean;
  betaApplied?: boolean;
};

type AuthContextValue = {
  loading: boolean;
  error: string | null;
  me: Me | null;
  subscription: Subscription | null;
  entitlements: Entitlements | null;
  jwt: string | null;
  refresh: () => Promise<void>;
  setToken: (token: string) => void;
  logout: () => void;
  canAccessDashboard: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('autopip_jwt');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextValue, 'refresh' | 'setToken' | 'logout' | 'canAccessDashboard'>>({
    loading: true,
    error: null,
    me: null,
    subscription: null,
    entitlements: null,
    jwt: null,
  });

  const refresh = useCallback(async () => {
    const token = readJwt();
    if (!token) {
      setState({
        loading: false,
        error: null,
        me: null,
        subscription: null,
        entitlements: null,
        jwt: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, jwt: token }));

    try {
      const [meRespRaw, subResp, entResp] = await Promise.all([
        getMe(token),
        getSubscription(token),
        getEntitlements(token),
      ]);

      const meResp = {
        ...meRespRaw,
        role: (meRespRaw.role || 'USER').toUpperCase(),
      };

      setState({
        loading: false,
        error: null,
        me: meResp,
        subscription: subResp,
        entitlements: entResp,
        jwt: token,
      });
    } catch (err: any) {
      // Handle 402 Payment Required specially
      const errorMsg = err?.message || 'Failed to load account data';
      const isPaymentRequired = err?.status === 402 || errorMsg.includes('PAYMENT_REQUIRED') || errorMsg.includes('402');
      
      setState({
        loading: false,
        error: isPaymentRequired ? 'PAYMENT_REQUIRED' : errorMsg,
        me: null,
        subscription: null,
        entitlements: null,
        jwt: token,
      });
    }
  }, []);

  const setToken = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autopip_jwt', token);
    }

    // Immediately update auth context state with the JWT
    setState((prev) => ({ ...prev, jwt: token }));

    // Then refresh user, subscription, and entitlement data
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('autopip_jwt');
    }
    setState({
      loading: false,
      error: null,
      me: null,
      subscription: null,
      entitlements: null,
      jwt: null,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    refresh();
  }, [refresh]);

  const canAccessDashboard = useMemo(() => {
    // Trust the backend's canAccessDashboard field from entitlements
    // Backend enforces: Tier-2 + Admin => true, Tier-1/waitlist/free => false
    if (!state.me || !state.entitlements) return false;
    const isAdmin = (state.me.role || '').toUpperCase() === 'ADMIN';
    // Admin always has access, otherwise use the backend's decision
    return isAdmin || (state.entitlements.canAccessDashboard ?? false);
  }, [state.me, state.entitlements]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refresh,
      setToken,
      logout,
      canAccessDashboard,
    }),
    [state, refresh, setToken, logout, canAccessDashboard]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthData(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthData must be used within an AuthProvider');
  }
  return ctx;
}




