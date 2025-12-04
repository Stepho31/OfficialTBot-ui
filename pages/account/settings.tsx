import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getUserSettings, updateUserSettings } from '../../lib/api';
import { useAuthData } from '../../lib/auth-context';

type UserSettings = {
  trade_allocation: number;
};

const MIN_TRADE_ALLOCATION = 0.01;
const MAX_TRADE_ALLOCATION = 200.0;
const STEP = 0.01;

export default function UserSettingsPage() {
  const { loading: authLoading, jwt } = useAuthData();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tradeAllocation, setTradeAllocation] = useState<number>(10.0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!jwt) {
      router.replace('/login');
      return;
    }
    const load = async () => {
      try {
        const userSettings = await getUserSettings(jwt);
        setSettings(userSettings);
        setTradeAllocation(userSettings.trade_allocation);
      } catch (err: any) {
        setError(err?.message || 'Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, jwt, router]);

  useEffect(() => {
    if (settings) {
      setHasChanges(Math.abs(tradeAllocation - settings.trade_allocation) > 0.001);
    }
  }, [tradeAllocation, settings]);

  const handleSave = async () => {
    if (!jwt) {
      router.replace('/login');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateUserSettings({ trade_allocation: tradeAllocation }, jwt);
      setSettings(updated);
      setHasChanges(false);
      setSuccess('Trade allocation updated successfully.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTradeAllocation(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      const clampedValue = Math.max(MIN_TRADE_ALLOCATION, Math.min(MAX_TRADE_ALLOCATION, value));
      setTradeAllocation(clampedValue);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
        Loading…
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Trade Settings</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="button-outline"
            onClick={() => router.push('/account/broker')}
            style={{ fontSize: '0.9rem', padding: '8px 12px' }}
          >
            Broker Settings
          </button>
          <button
            className="button-outline"
            onClick={() => router.push('/dashboard')}
            style={{ fontSize: '0.9rem', padding: '8px 12px' }}
          >
            Dashboard
          </button>
        </div>
      </div>
      <p style={{ marginTop: 8, color: 'var(--subtle)' }}>
        Control how much of your account balance the bot allocates per trade position.
      </p>

      <div style={{ marginTop: 32 }}>
        <label className="subtle" style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>Trade Allocation</span>
            <span style={{ fontWeight: 600, fontSize: '1.1em', color: 'var(--primary)' }}>{tradeAllocation.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min={MIN_TRADE_ALLOCATION}
            max={MAX_TRADE_ALLOCATION}
            step={STEP}
            value={tradeAllocation}
            onChange={handleSliderChange}
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: 'var(--border)',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
            }}
            onInput={handleSliderChange}
          />
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: linear-gradient(180deg, #6ea0ff, #4c78ff);
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: linear-gradient(180deg, #6ea0ff, #4c78ff);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            input[type="range"]::-webkit-slider-runnable-track {
              height: 8px;
              border-radius: 4px;
              background: var(--border);
            }
            input[type="range"]::-moz-range-track {
              height: 8px;
              border-radius: 4px;
              background: var(--border);
            }
          `}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: 'var(--subtle)' }}>
            <span>{MIN_TRADE_ALLOCATION}%</span>
            <span>{MAX_TRADE_ALLOCATION}%</span>
          </div>
        </label>

        <label className="subtle" style={{ display: 'block', marginTop: 16 }}>
          <span>Manual Entry</span>
          <input
            type="number"
            min={MIN_TRADE_ALLOCATION}
            max={MAX_TRADE_ALLOCATION}
            step={STEP}
            value={tradeAllocation}
            onChange={handleInputChange}
            style={{ width: '100%', marginTop: 8, padding: '10px' }}
          />
        </label>
      </div>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-elev)', borderRadius: 8, fontSize: 14, color: 'var(--muted)', border: '1px solid var(--border)' }}>
        <p style={{ margin: 0 }}>
          <strong>How it works:</strong> This percentage determines how much of your account balance will be allocated to each trade position. 
          The bot calculates the position size (units/margin) based on this allocation and the current market price.
        </p>
        <p style={{ margin: '8px 0 0 0' }}>
          Example: With a $10,000 balance and 10% allocation, each trade will use approximately $1,000 worth of your account.
        </p>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--danger)', color: 'white', borderRadius: 8 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--success)', color: 'white', borderRadius: 8 }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          className="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {hasChanges && (
          <button
            className="button-outline"
            type="button"
            onClick={() => {
              if (settings) {
                setTradeAllocation(settings.trade_allocation);
                setHasChanges(false);
              }
            }}
            disabled={saving}
          >
            Reset
          </button>
        )}
      </div>
    </main>
  );
}

