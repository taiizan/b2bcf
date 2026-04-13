'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MarketPage() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [demand, setDemand] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/ai/forecasts', { headers }).then(r => r.json()),
      fetch('/api/ai/insights', { headers }).then(r => r.json()),
      fetch('/api/ai/demand', { headers }).then(r => r.json()),
    ]).then(([fc, ins, dm]) => {
      if (fc.success) setForecasts(fc.data);
      if (ins.success) setInsights(ins.data);
      if (dm.success) setDemand(dm.data);
    }).catch(() => {});
  }, []);

  const trendColors: Record<string, string> = { up: '#22c55e', down: '#ef4444', stable: '#f59e0b' };
  const trendIcons: Record<string, string> = { up: '📈', down: '📉', stable: '➡️' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>🧠 Dự báo thị trường</h1>
          <p>Phân tích AI về biến động giá cà phê và xu hướng nhu cầu</p>
        </div>
      </div>

      {/* Price Forecast Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {forecasts.map((fc: any) => (
          <div key={fc.variety} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {fc.variety?.replace('_', ' ')}
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, marginTop: 4 }}>
                  ${fc.currentPrice}
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/kg</span>
                </div>
              </div>
              <div style={{
                padding: '6px 12px', borderRadius: 8,
                background: `${trendColors[fc.trend]}15`, color: trendColors[fc.trend],
                fontSize: 13, fontWeight: 700,
              }}>
                {trendIcons[fc.trend]} {fc.trend === 'up' ? '+' : fc.trend === 'down' ? '' : ''}
                {((fc.predictedPrice - fc.currentPrice) / fc.currentPrice * 100).toFixed(1)}%
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              <span>Dự báo: <strong style={{ color: trendColors[fc.trend] }}>${fc.predictedPrice}</strong></span>
              <span>Độ tin cậy: {(fc.confidence * 100).toFixed(0)}%</span>
            </div>

            {/* Mini chart */}
            {fc.priceHistory && (
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={fc.priceHistory}>
                  <defs>
                    <linearGradient id={`grad-${fc.variety}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={trendColors[fc.trend]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={trendColors[fc.trend]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="price" stroke={trendColors[fc.trend]}
                    fill={`url(#grad-${fc.variety})`} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>

      {/* Demand Forecast */}
      {demand.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <h3>📊 Dự báo nhu cầu thị trường (kg/tháng)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demand}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,127,26,0.1)" />
              <XAxis dataKey="month" stroke="#8b7355" fontSize={11} />
              <YAxis stroke="#8b7355" fontSize={11} />
              <Tooltip contentStyle={{ background: '#271d11', border: '1px solid rgba(196,127,26,0.2)', borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="arabica" fill="#e5b96e" radius={[4, 4, 0, 0]} name="Arabica" />
              <Bar dataKey="robusta" fill="#c47f1a" radius={[4, 4, 0, 0]} name="Robusta" />
              <Bar dataKey="fineRobusta" fill="#854c12" radius={[4, 4, 0, 0]} name="Fine Robusta" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Market Insights */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          📰 Tin tức & Phân tích thị trường
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          {insights.map((insight: any) => (
            <div key={insight.id} style={{
              padding: 16, background: 'var(--bg-secondary)', borderRadius: 12,
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: insight.impact === 'high' ? 'rgba(232,69,69,0.15)' : 'rgba(245,158,11,0.15)',
                  color: insight.impact === 'high' ? '#e84545' : '#f59e0b',
                  textTransform: 'uppercase',
                }}>
                  {insight.impact === 'high' ? '🔴 Cao' : '🟡 Trung bình'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{insight.variety} • {insight.region}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{insight.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{insight.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
