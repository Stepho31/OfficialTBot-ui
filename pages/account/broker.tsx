import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getBrokerStatus, saveBrokerCredentials, startCheckout } from '../../lib/api';
import { useAuthData } from '../../lib/auth-context';

type BrokerStatus = {
  hasBrokerCreds: boolean;
  oandaAccountId?: string | null;
  updatedAt?: string | null;
};

export default function BrokerSettings() {
  const { loading: authLoading, entitlements, me, jwt } = useAuthData();
  const router = useRouter();
  const [status, setStatus] = useState<BrokerStatus | null>(null);
  const [accountId, setAccountId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canTrade = entitlements?.canTrade ?? false;
  const isAdmin = me?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (authLoading) return;
    if (!jwt) {
      router.replace('/login');
      return;
    }
    const load = async () => {
      try {
        const broker = await getBrokerStatus(jwt);
        setStatus(broker);
        if (broker?.oandaAccountId) setAccountId(broker.oandaAccountId);
      } catch (err: any) {
        setError(err?.message || 'Failed to load broker settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, jwt, router]);

  const handleSave = async () => {
    if (!jwt) {
      router.replace('/login');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveBrokerCredentials({ oandaAccountId: accountId, oandaApiKey: apiKey }, jwt);
      setSuccess('Broker credentials saved successfully.');
      setApiKey('');
      const refreshed = await getBrokerStatus(jwt);
      setStatus(refreshed);
    } catch (err: any) {
      setError(err?.message || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = (tier: 'TIER1' | 'TIER2') => {
    startCheckout(tier).catch((err) => {
      setError(err?.message || 'Unable to start checkout right now.');
    });
  };

  if (authLoading || loading) {
    return (
      <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
        Loading…
      </main>
    );
  }

  if (!canTrade && !isAdmin) {
    return (
      <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
        <h2>Broker Settings</h2>
        <p style={{ marginTop: 16 }}>
          Your current plan does not include automated trading. Upgrade to Tier-2 to unlock broker integration.
        </p>
        <button className="button" style={{ marginTop: 24 }} onClick={() => handleCheckout('TIER2')}>
          Upgrade to Automation (Tier-2)
        </button>
        {!entitlements?.canReceiveEmailSignals && (
          <div style={{ marginTop: 32 }}>
            <p>Want lifetime email signals? Grab the Signals Forever plan.</p>
            <button className="button-outline" onClick={() => handleCheckout('TIER1')}>
              Get Signals Forever (Tier-1)
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
      <h2>Broker Settings</h2>
      <p style={{ marginTop: 8 }}>
        Connect your OANDA account so the automation agent can trade on your behalf.
      </p>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <label className="subtle">
          OANDA Account ID
          <input
            style={{ width: '100%', marginTop: 8, padding: '10px' }}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="101-001-1234567-001"
          />
        </label>
        <label className="subtle">
          OANDA API Key
          <input
            type="password"
            style={{ width: '100%', marginTop: 8, padding: '10px' }}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Personal Access Token"
          />
        </label>
      </div>

      {status?.hasBrokerCreds && (
        <div style={{ marginTop: 12, fontSize: 14, color: 'var(--subtle)' }}>
          Last saved: {status.updatedAt ? new Date(status.updatedAt).toLocaleString() : 'Unknown'}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: 16, color: 'var(--success)' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="button" onClick={handleSave} disabled={saving || !accountId || !apiKey}>
          {saving ? 'Saving…' : 'Save Broker Credentials'}
        </button>
        <button
          className="button-outline"
          type="button"
          onClick={() => alert('Connection test will be implemented in a later release.')}
          disabled={saving}
        >
          Test Connection
        </button>
      </div>
    </main>
  );
}

