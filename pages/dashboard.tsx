import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { getAccountSummary, getPerformanceSummary, getTrades, startCheckout, getPrimaryAccount, getDashboardOpenTrades, getDashboardTrades, getDashboardEquitySeries } from '../lib/api';
import { useAuthData } from '../lib/auth-context';
import Tabs from '../components/Tabs';
import LearningTab from '../components/LearningTab';

const EquityChart = dynamic(() => import('../components/EquityChart'), { ssr: false });

type TradeRow = {
  id?: string;
  trade_id?: string | null;
  instrument?: string | null;
  side?: string | null;
  size?: number | null;
  units?: number | null;
  entry?: number | null;
  entry_price?: number | null;
  exit?: number | null;
  exit_price?: number | null;
  pnl?: number | null;
  pnl_net?: number | null;
  unrealized_pnl?: number | null;
  status?: string | null;
  openedAt?: string | null;
  opened_at?: string | null;
  closedAt?: string | null;
  closed_at?: string | null;
};

type PerformanceSummary = {
  totalPnL: number;
  winRate: number;
  avgR: number;
  tradesCount: number;
  periodStart: string | null;
  periodEnd: string | null;
};

type AccountSummary = {
  balance: number;
  equity: number | null;
  marginAvailable: number | null;
  currency: string;
};

export default function Dashboard() {
  const router = useRouter();
  const { loading: authLoading, error: authError, entitlements, subscription, me, jwt, canAccessDashboard, logout } = useAuthData();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [openTrades, setOpenTrades] = useState<TradeRow[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [equitySeries, setEquitySeries] = useState<{ taken_at: string; equity: number | null }[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [accountSummaryError, setAccountSummaryError] = useState<string | null>(null);
  const [loadingAccountSummary, setLoadingAccountSummary] = useState(false);
  const [primaryAccountId, setPrimaryAccountId] = useState<number | null>(null);
  const [loadingAccountId, setLoadingAccountId] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('trading');

  const loadPrimaryAccount = useCallback(async () => {
    // Fallback to localStorage if context jwt is not ready yet
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token) return;
    setLoadingAccountId(true);
    try {
      const account = await getPrimaryAccount(token);
      setPrimaryAccountId(account.account_id);
    } catch (err: any) {
      console.error('Failed to load primary account:', err);
      // Fallback: try to load trades without account_id (using /v1/trades)
      setPrimaryAccountId(null);
    } finally {
      setLoadingAccountId(false);
    }
  }, [jwt]);

  const loadOpenTrades = useCallback(async () => {
    // Fallback to localStorage if context jwt is not ready yet
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token || !primaryAccountId) return;
    try {
      const trades = await getDashboardOpenTrades(primaryAccountId, token);
      setOpenTrades(trades as TradeRow[]);
    } catch (err: any) {
      console.error('Failed to load open trades:', err);
      setTradesError(err?.message || 'Failed to load open trades');
    }
  }, [jwt, primaryAccountId]);

  const loadRecentTrades = useCallback(async () => {
    // Fallback to localStorage if context jwt is not ready yet
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token || !primaryAccountId) return;
    try {
      const trades = await getDashboardTrades(primaryAccountId, undefined, undefined, token);
      setRecentTrades(trades as TradeRow[]);
    } catch (err: any) {
      console.error('Failed to load recent trades:', err);
      setTradesError(err?.message || 'Failed to load recent trades');
    }
  }, [jwt, primaryAccountId]);

  const loadEquitySeries = useCallback(async () => {
    // Fallback to localStorage if context jwt is not ready yet
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token || !primaryAccountId) return;
    try {
      const series = await getDashboardEquitySeries(primaryAccountId, '30d', token);
      setEquitySeries(series as { taken_at: string; equity: number | null }[]);
    } catch (err: any) {
      console.error('Failed to load equity series:', err);
    }
  }, [jwt, primaryAccountId]);

  const loadTrades = useCallback(
    async (cursor?: string) => {
      // Fallback to localStorage if context jwt is not ready yet
      const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
      if (!token) return;
      setLoadingTrades(true);
      setTradesError(null);
      try {
        const res = await getTrades({ cursor, limit: 25 }, token);
        const items = (res.items || []) as TradeRow[];
        setTrades((prev) => (cursor ? [...prev, ...items] : items));
        setNextCursor(res.nextCursor || null);
      } catch (err: any) {
        setTradesError(err?.message || 'Failed to load trades');
      } finally {
        setLoadingTrades(false);
      }
    },
    [jwt]
  );

  const loadPerformance = useCallback(async () => {
    // Fallback to localStorage if context jwt is not ready yet
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token) return;
    try {
      const summary = await getPerformanceSummary(token);
      setPerformance(summary);
    } catch (err: any) {
      setPerformanceError(err?.message || 'Failed to load performance');
    }
  }, [jwt]);

  const loadAccountSummary = useCallback(async () => {
    // Fallback to localStorage if context jwt is not ready yet
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (!token) return;
    setLoadingAccountSummary(true);
    setAccountSummaryError(null);
    try {
      const summary = await getAccountSummary(token);
      setAccountSummary(summary);
    } catch (err: any) {
      // Handle different error cases gracefully
      const errorMessage = err?.message || 'Failed to load account summary';
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      
      // Check for specific error cases
      if (errorText.includes('404') || errorText.includes('not configured') || errorText.includes('Broker credentials')) {
        setAccountSummaryError('Broker account not connected');
      } else if (errorText.includes('401') || errorText.includes('403') || errorText.includes('unauthorized') || errorText.includes('Invalid or unauthorized')) {
        setAccountSummaryError('Invalid broker credentials');
      } else if (errorText.includes('503') || errorText.includes('timeout') || errorText.includes('Unable to fetch')) {
        setAccountSummaryError('Unable to load account summary');
      } else {
        setAccountSummaryError('Unable to load account summary');
      }
    } finally {
      setLoadingAccountSummary(false);
    }
  }, [jwt]);

  useEffect(() => {
    // Ensure we have a valid token before making any API calls
    // Fallback to localStorage if context jwt is not ready yet (race condition fix)
    const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
    if (authLoading || !token) return;
    
    loadPrimaryAccount();
    loadPerformance();
    loadAccountSummary();
    // Fallback: load trades from /v1/trades if account_id not available
    loadTrades();
  }, [authLoading, jwt, loadPrimaryAccount, loadPerformance, loadAccountSummary, loadTrades]);

  useEffect(() => {
    if (primaryAccountId && jwt) {
      loadOpenTrades();
      loadRecentTrades();
      loadEquitySeries();
    }
  }, [primaryAccountId, jwt, loadOpenTrades, loadRecentTrades, loadEquitySeries]);

  // Fallback: use trades from /v1/trades if dashboard endpoints not available
  const openTradesDisplay = useMemo(() => {
    if (openTrades.length > 0) {
      return openTrades.map(t => ({
        id: t.trade_id || t.id || '',
        instrument: t.instrument || '',
        side: t.side || '',
        size: t.units || t.size || 0,
        entry: t.entry_price || t.entry || null,
        exit: t.exit_price || t.exit || null,
        pnl: t.unrealized_pnl || t.pnl_net || t.pnl || null,
        status: t.status || 'OPEN',
        openedAt: t.opened_at || t.openedAt || null,
        closedAt: t.closed_at || t.closedAt || null,
      }));
    }
    // Fallback to filtered trades
    return trades.filter((t) => (t.status || '').toUpperCase() === 'OPEN').map(t => ({
      id: t.id || t.trade_id || '',
      instrument: t.instrument || '',
      side: t.side || '',
      size: t.size || t.units || 0,
      entry: t.entry || t.entry_price || null,
      exit: t.exit || t.exit_price || null,
      pnl: t.pnl || t.pnl_net || null,
      status: t.status || 'OPEN',
      openedAt: t.openedAt || t.opened_at || null,
      closedAt: t.closedAt || t.closed_at || null,
    }));
  }, [openTrades, trades]);

  const closedTradesDisplay = useMemo(() => {
    if (recentTrades.length > 0) {
      return recentTrades.map(t => ({
        id: t.trade_id || t.id || '',
        instrument: t.instrument || '',
        side: t.side || '',
        size: t.units || t.size || 0,
        entry: t.entry_price || t.entry || null,
        exit: t.exit_price || t.exit || null,
        pnl: t.pnl_net || t.pnl || null,
        status: t.status || 'CLOSED',
        openedAt: t.opened_at || t.openedAt || null,
        closedAt: t.closed_at || t.closedAt || null,
      }));
    }
    // Fallback to filtered trades
    return trades.filter((t) => (t.status || '').toUpperCase() !== 'OPEN').map(t => ({
      id: t.id || t.trade_id || '',
      instrument: t.instrument || '',
      side: t.side || '',
      size: t.size || t.units || 0,
      entry: t.entry || t.entry_price || null,
      exit: t.exit || t.exit_price || null,
      pnl: t.pnl || t.pnl_net || null,
      status: t.status || 'CLOSED',
      openedAt: t.openedAt || t.opened_at || null,
      closedAt: t.closedAt || t.closed_at || null,
    }));
  }, [recentTrades, trades]);

  const isAdmin = (me?.role || '').toUpperCase() === 'ADMIN';
  const canTrade = (entitlements?.canTrade ?? false) || isAdmin;
  const canReceiveSignals = (entitlements?.canReceiveEmailSignals ?? false) || isAdmin;

  const planLabel = useMemo(() => {
    if (isAdmin) return 'Admin';
    if (subscription?.plan === 'TIER2' && entitlements?.tier2Active) return 'Automation (Tier-2)';
    if (entitlements?.tier1) return 'Signals Forever (Tier-1)';
    return 'Free';
  }, [isAdmin, subscription, entitlements]);

  const handleTierCheckout = (tier: 'TIER1' | 'TIER2') => {
    startCheckout(tier).catch((err) => {
      alert(err?.message || 'Unable to start checkout.');
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <main className="container">
        <p>Loading your dashboard…</p>
      </main>
    );
  }

  if (!jwt) {
    // Redirect to login if no token
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
      <main className="container">
        <p>Redirecting to login…</p>
      </main>
    );
  }

  if (authError) {
    // If unauthorized, redirect to login
    if (authError.includes('unauthorized') || authError.includes('401')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('autopip_jwt');
        router.push('/login');
      }
      return (
        <main className="container">
          <p>Redirecting to login…</p>
        </main>
      );
    }
    // If payment required, show upgrade prompt
    if (authError === 'PAYMENT_REQUIRED' || authError.includes('PAYMENT_REQUIRED') || authError.includes('402')) {
      return (
        <main className="container" style={{ maxWidth: 600, margin: '60px auto' }}>
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #5b8cff 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Autopip AI
              </h1>
              <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.9rem' }}>
                Trade Less, Live More
              </p>
            </div>
            <h2 style={{ margin: 0 }}>Subscription Required</h2>
            <p style={{ marginTop: 16, marginBottom: 24 }}>
              You need an active subscription to access the dashboard. Please upgrade to continue.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="button-outline" onClick={() => handleTierCheckout('TIER1')}>
                Get Signals Forever
              </button>
              <button className="button" onClick={() => handleTierCheckout('TIER2')}>
                Automate My Trading
              </button>
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className="container">
        <h2>Trading Dashboard</h2>
        <p style={{ color: 'var(--danger)' }}>{authError}</p>
      </main>
    );
  }

  // Check if user can access dashboard - only Tier-2 and Admins allowed
  if (!canAccessDashboard && !authLoading) {
    const hasTier1 = entitlements?.tier1 ?? false;
    const hasSignals = entitlements?.canReceiveEmailSignals ?? false;
    
    return (
      <main className="container" style={{ maxWidth: 600, margin: '60px auto' }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #5b8cff 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Autopip AI
            </h1>
            <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.9rem' }}>
              Automated Forex Trading Intelligence
            </p>
          </div>
          <h2 style={{ margin: 0 }}>Dashboard Access Required</h2>
          {hasTier1 || hasSignals ? (
            <>
              <p style={{ marginTop: 16, marginBottom: 24 }}>
                You have access to email signals, but the automation dashboard requires a Tier-2 (Automation) subscription.
              </p>
              <p style={{ marginTop: 8, marginBottom: 24, fontSize: '0.9em', color: '#666' }}>
                Upgrade to Tier-2 to access the full trading dashboard and automated trading features.
              </p>
            </>
          ) : (
            <p style={{ marginTop: 16, marginBottom: 24 }}>
              You need an active Tier-2 (Automation) subscription to access the dashboard. Please upgrade to continue.
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {!hasTier1 && (
              <button className="button-outline" onClick={() => handleTierCheckout('TIER1')}>
                Get Signals Forever
              </button>
            )}
            <button className="button" onClick={() => handleTierCheckout('TIER2')}>
              Automate My Trading
            </button>
          </div>
        </div>
      </main>
    );
  }

  const tradingTabContent = (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Account Balance Card */}
      <section className="card" style={{ padding: 24 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Account Balance</div>
        {loadingAccountSummary ? (
          <div className="subtle">Loading account summary…</div>
        ) : accountSummaryError ? (
          <div className="subtle" style={{ color: 'var(--danger)' }}>
            {accountSummaryError}
          </div>
        ) : accountSummary ? (
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 8 }}>
              {accountSummary.balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} {accountSummary.currency}
            </div>
            {(accountSummary.equity !== null || accountSummary.marginAvailable !== null) && (
              <div className="subtle" style={{ fontSize: '0.9rem', marginTop: 4 }}>
                {accountSummary.equity !== null && (
                  <span>Equity: {accountSummary.equity.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} {accountSummary.currency}</span>
                )}
                {accountSummary.equity !== null && accountSummary.marginAvailable !== null && (
                  <span> • </span>
                )}
                {accountSummary.marginAvailable !== null && (
                  <span>Margin Available: {accountSummary.marginAvailable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} {accountSummary.currency}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="subtle">No account data available</div>
        )}
      </section>
      
      <section className="grid" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-title">Total Trades</div>
          <div className="card-value">{performance?.tradesCount?.toLocaleString?.() ?? '—'}</div>
        </div>
        <div className="card">
          <div className="card-title">Total P&amp;L</div>
          <div
            className="card-value"
            style={{ color: (performance?.totalPnL ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {performance?.totalPnL?.toLocaleString?.() ?? '—'}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Win Rate</div>
          <div className="card-value">
            {performance?.winRate !== undefined ? `${performance.winRate.toFixed(1)}%` : '—'}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Avg R</div>
          <div className="card-value">{performance?.avgR !== undefined ? performance.avgR.toFixed(2) : '—'}</div>
        </div>
      </section>
      {performanceError && (
        <div className="card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', padding: 12 }}>
          {performanceError}
        </div>
      )}

      {canTrade ? (
        <>
          <section className="card">
            <div className="card-title">Open Trades</div>
            {tradesError && <p className="subtle" style={{ color: 'var(--danger)' }}>{tradesError}</p>}
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Opened</th>
                    <th>Instrument</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {openTradesDisplay.map((t) => (
                    <tr key={t.id}>
                      <td>{t.openedAt ? new Date(t.openedAt).toLocaleString() : '—'}</td>
                      <td>{t.instrument}</td>
                      <td>
                        <span className={`badge ${t.side === 'BUY' ? 'success' : 'danger'}`}>
                          <span className="dot" />
                          {t.side}
                        </span>
                      </td>
                      <td>{t.size?.toLocaleString?.() ?? '—'}</td>
                      <td>{t.entry ?? '—'}</td>
                    </tr>
                  ))}
                  {openTradesDisplay.length === 0 && (
                    <tr>
                      <td colSpan={5} className="subtle">
                        No open trades.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-title">Recent Trades</div>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Closed</th>
                    <th>Instrument</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTradesDisplay.map((t) => (
                    <tr key={t.id}>
                      <td>{t.closedAt ? new Date(t.closedAt).toLocaleString() : '—'}</td>
                      <td>{t.instrument}</td>
                      <td>{t.side}</td>
                      <td>{t.size?.toLocaleString?.() ?? '—'}</td>
                      <td>{t.entry ?? '—'}</td>
                      <td>{t.exit ?? '—'}</td>
                      <td style={{ color: (t.pnl ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {t.pnl?.toFixed(2) ?? '—'}
                      </td>
                    </tr>
                  ))}
                  {closedTradesDisplay.length === 0 && (
                    <tr>
                      <td colSpan={7} className="subtle">
                        No past trades yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {nextCursor && (
              <div style={{ marginTop: 16 }}>
                <button className="button-outline" onClick={() => loadTrades(nextCursor)} disabled={loadingTrades}>
                  {loadingTrades ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-title">Equity Trend (Preview)</div>
            <EquityChart data={equitySeries as any} />
          </section>
        </>
      ) : (
        <section className="card" style={{ padding: 32, textAlign: 'center' }}>
          <h3 style={{ margin: 0 }}>Unlock Automation</h3>
          <p style={{ marginTop: 12 }}>
            Connect your broker and let AutoPip execute trades for you. Upgrade to Tier-2 to unlock automation features.
          </p>
          <button className="button" onClick={() => handleTierCheckout('TIER2')}>
            Upgrade to Tier-2 Automation
          </button>
        </section>
      )}
    </div>
  );

  const tabs = [
    {
      id: 'trading',
      label: 'Trading',
      content: tradingTabContent,
    },
    {
      id: 'learning',
      label: 'Learning',
      content: <LearningTab jwt={jwt} />,
    },
  ];

  return (
    <main className="container" style={{ display: 'grid', gap: 24 }}>
      <header className="card" style={{ padding: 24 }}>
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #5b8cff 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                Autopip AI
              </h1>
              <span style={{ marginLeft: 12, fontSize: '1.25rem', color: 'var(--muted)' }}>Trading Dashboard</span>
            </div>
            <div className="hstack" style={{ gap: 8, alignItems: 'center' }}>
              <p className="subtle" style={{ marginTop: 4 }}>
                Plan: <strong>{planLabel}</strong>
              </p>
              {isAdmin && (
                <span className="badge info">
                  <span className="dot" />
                  Admin
                </span>
              )}
            </div>
            {subscription?.currentPeriodEnd && (
              <p className="subtle">
                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* RIGHT SIDE: upgrade buttons + settings + logout */}
          <div className="hstack" style={{ gap: 12, alignItems: 'center' }}>
            {(!canReceiveSignals && !isAdmin) && (
              <button className="button-outline" onClick={() => handleTierCheckout('TIER1')}>
                Get Signals Forever
              </button>
            )}
            {(!canTrade && !isAdmin) && (
              <button className="button" onClick={() => handleTierCheckout('TIER2')}>
                Automate My Trading
              </button>
            )}

            {/* Settings links - show for all Tier 2 users (canAccessDashboard) or admins */}
            {(canAccessDashboard || isAdmin) && (
              <div className="hstack" style={{ gap: 8, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
                <button
                  className="button-outline"
                  onClick={() => router.push('/account/settings')}
                  style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                >
                  Trade Settings
                </button>
                <button
                  className="button-outline"
                  onClick={() => router.push('/account/broker')}
                  style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                >
                  Broker
                </button>
              </div>
            )}

            {jwt && (
              <button
                className="button-outline"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
