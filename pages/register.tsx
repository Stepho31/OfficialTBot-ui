import { useState } from 'react';
import { useRouter } from 'next/router';
import { register } from '../lib/api';
import { startCheckout } from '../lib/api';
import { useAuthData } from '../lib/auth-context';

export default function Register() {
  const router = useRouter();
  const { setToken } = useAuthData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oandaAccountId, setOandaAccountId] = useState('');
  const [oandaApiKey, setOandaApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await register(
        email,
        password,
        oandaAccountId || undefined,
        oandaApiKey || undefined
      );
      
      // Save token and refresh auth context
      setToken(response.access_token);
      
      // If user can access dashboard, redirect there
      if (response.can_access_dashboard) {
        router.push('/dashboard');
      } else {
        // Otherwise, redirect to checkout
        await startCheckout('TIER1');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #5b8cff 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Autopip AI
        </h1>
        <p style={{ marginTop: 8, color: '#9aa3b2', fontSize: '1rem' }}>
          Trade Less, Live More
        </p>
      </div>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label htmlFor="oanda_account_id" style={{ display: 'block', marginBottom: 4 }}>
            OANDA Account ID
          </label>
          <input
            id="oanda_account_id"
            type="text"
            value={oandaAccountId}
            onChange={(e) => setOandaAccountId(e.target.value)}
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
            placeholder="e.g., 101-004-1234567-001"
          />
        </div>
        <div>
          <label htmlFor="oanda_api_key" style={{ display: 'block', marginBottom: 4 }}>
            OANDA API Key
          </label>
          <input
            id="oanda_api_key"
            type="password"
            value={oandaApiKey}
            onChange={(e) => setOandaApiKey(e.target.value)}
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
            placeholder="Your OANDA API key"
          />
        </div>
        {error && (
          <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 4 }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p style={{ marginTop: 24, textAlign: 'center' }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}

