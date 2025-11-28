import { useState } from 'react';
import { connectOanda } from '../lib/api';

export default function Connect() {
  const [accountId, setAccountId] = useState("");
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const onConnect = async () => {
    try {
      const jwt = localStorage.getItem("autopip_jwt") || "";
      const res = await connectOanda({account_id: accountId, token: token || undefined, label: label || undefined}, jwt);
      setStatus(`Connected: ${JSON.stringify(res)}`);
    } catch (e:any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <main style={{maxWidth: 720, margin: "60px auto", fontFamily: "Inter, system-ui, Arial"}}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #5b8cff 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Autopip AI
        </h1>
        <p style={{ marginTop: 8, color: '#9aa3b2', fontSize: '1rem' }}>
          Trade Less, Live More
        </p>
      </div>
      <h2>Connect OANDA</h2>
      <p>Paste your Account ID and (optionally for MVP) a Personal Access Token.</p>
      <div style={{display: "grid", gap: 8}}>
        <input placeholder="Account ID" value={accountId} onChange={e=>setAccountId(e.target.value)} />
        <input placeholder="Token (optional if your bot doesn't need it)" value={token} onChange={e=>setToken(e.target.value)} />
        <input placeholder="Label (optional)" value={label} onChange={e=>setLabel(e.target.value)} />
      </div>
      <button onClick={onConnect} style={{marginTop: 12, padding: "10px 16px"}}>Save & Test</button>
      {status && <p style={{marginTop: 12}}>{status}</p>}
      <p style={{marginTop: 24}}><a href="/dashboard">Go to Dashboard</a></p>
    </main>
  );
}
