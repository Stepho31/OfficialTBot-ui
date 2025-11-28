import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export type EquityPoint = { taken_at: string; equity: number };

export default function EquityChart({ data }: { data: EquityPoint[] }) {
  const formatted = (data || []).map(p => ({
    time: new Date(p.taken_at).toLocaleDateString(),
    equity: typeof p.equity === 'number' ? p.equity : Number(p.equity ?? 0)
  }));

  return (
    <div style={{ width: '100%', height: 300 }} className="card">
      <div className="card-title">Account Equity</div>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b8cff" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#5b8cff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 12 }} />
            <Line type="monotone" dataKey="equity" stroke="url(#equity)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
