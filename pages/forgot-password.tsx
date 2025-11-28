import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { forgotPassword } from '../lib/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
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
      
      <h2>Forgot Password</h2>
      <p style={{ color: '#9aa3b2', marginBottom: 24 }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {success ? (
        <div style={{ padding: 16, background: '#d1fae5', color: '#065f46', borderRadius: 8, marginBottom: 24 }}>
          <p style={{ margin: 0 }}>
            If an account with that email exists, a password reset link has been sent. 
            Please check your email and click the link to reset your password.
          </p>
        </div>
      ) : (
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/login" style={{ color: '#5b8cff', textDecoration: 'none' }}>
          ← Back to Login
        </Link>
      </p>
    </main>
  );
}

