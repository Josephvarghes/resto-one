import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { adminApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

export function AdminDashboard() {
  const [range, setRange] = useState('daily'); // daily | weekly | monthly
  const [analytics, setAnalytics] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await adminApi.getAnalytics(range);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await adminApi.getInsights();
      setInsightsData(res.data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAnalytics(), fetchInsights()]).finally(() => setIsLoading(false));
  }, [range]);

  useWebSocket('admin', () => {
    fetchAnalytics();
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#0b0f19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Shield size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Executive Intelligence</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Operational analytics, financial metrics, and Groq 120B strategic insights
            </span>
          </div>
        </div>

        {/* Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['daily', 'weekly', 'monthly'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`btn ${range === r ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => {
              fetchAnalytics();
              fetchInsights();
            }}
            className="btn btn-outline"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading && !analytics ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ marginBottom: '12px', color: 'var(--accent-gold)' }} />
          <p>Compiling restaurant performance data...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '28px',
            }}
          >
            {/* Total Revenue */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</span>
                <TrendingUp size={18} color="var(--accent-gold)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{analytics?.total_revenue?.toLocaleString() || 0}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                Across {analytics?.range} cycle
              </span>
            </div>

            {/* Total Orders */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</span>
                <ShoppingBag size={18} color="var(--accent-sky)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {analytics?.total_orders || 0}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Avg ticket: ₹{analytics?.avg_order_value || 0}
              </span>
            </div>

            {/* Kitchen Delays */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delayed Tickets</span>
                <AlertTriangle size={18} color="var(--accent-rose)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: analytics?.delayed_orders_count > 0 ? '#fda4af' : 'var(--text-primary)' }}>
                {analytics?.delayed_orders_count || 0}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Station hold incidents
              </span>
            </div>

            {/* Avg Prep Time */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Prep Time</span>
                <Clock size={18} color="var(--accent-emerald)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {analytics?.avg_prep_time_minutes || 14}m
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Turnaround efficiency
              </span>
            </div>
          </div>

          {/* AI Insights Card */}
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              marginBottom: '28px',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(26, 34, 52, 0.9) 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                      AI Executive Insights
                    </h2>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: 'var(--accent-gold)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                      }}
                    >
                      Groq 120B
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Computed on login • Cached for 15 minutes
                  </span>
                </div>
              </div>

              <button
                onClick={fetchInsights}
                disabled={isLoadingInsights}
                className="btn btn-outline"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                <RefreshCw size={14} className={isLoadingInsights ? 'animate-spin' : ''} />
                Refresh AI
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {insightsData?.insights?.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--accent-gold)',
                      color: '#0b0f19',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <p style={{ fontSize: '0.92rem', color: '#f8fafc', lineHeight: 1.5, margin: 0 }}>
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Grid: Top Selling Dishes + Orders By Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
            {/* Top Dishes */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="var(--accent-gold)" /> Top Selling Dishes
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics?.top_selling_dishes?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No sales logged for this timeframe.</p>
                ) : (
                  analytics?.top_selling_dishes?.map((dish, idx) => (
                    <div
                      key={dish.dish_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 600 }}>{dish.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                          ₹{dish.revenue}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {dish.quantity} orders
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
                Orders by Lifecycle Status
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics?.orders_by_status &&
                  Object.entries(analytics.orders_by_status).map(([st, count]) => (
                    <div
                      key={st}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                        {st.replace('_', ' ')}
                      </span>
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-gold)',
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
