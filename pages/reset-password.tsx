import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { resetPassword } from '../lib/api';

export default function ResetPassword() {
  const router = useRouter();
  const token = (router.query.token as string) || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
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
      
      <h2>Reset Password</h2>

      {success ? (
        <div style={{ padding: 16, background: '#d1fae5', color: '#065f46', borderRadius: 8, marginBottom: 24 }}>
          <p style={{ margin: 0 }}>
            Your password has been reset successfully! Redirecting to login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
              New Password
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
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: 4 }}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: '100%', padding: 10, fontSize: 16 }}
              placeholder="Confirm your password"
            />
          </div>
          {error && (
            <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 4 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !token}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              background: loading || !token ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !token ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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

