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
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

export function AdminDashboard() {
  const [range, setRange] = useState('daily'); // daily | weekly | monthly
  const [analytics, setAnalytics] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [recentLiveEvent, setRecentLiveEvent] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await adminApi.getAnalytics(range);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchInsights = async (force = false) => {
    setIsLoadingInsights(true);
    try {
      const res = await adminApi.getInsights(force);
      setInsightsData(res.data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const [isRefreshingSales, setIsRefreshingSales] = useState(false);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAnalytics(), fetchInsights(false)]).finally(() => setIsLoading(false));
  }, []);

  // Update sales analytics when range filter changes (without disturbing AI Insights)
  useEffect(() => {
    if (!analytics) return; // avoid duplicate initial fetch
    setIsRefreshingSales(true);
    fetchAnalytics().finally(() => setIsRefreshingSales(false));
  }, [range]);

  // Real-time WebSocket connection to admin channel
  useWebSocket('admin', (msg) => {
    // Re-fetch analytics immediately on any order event
    fetchAnalytics();

    if (msg && msg.event) {
      let label = 'Real-time order update received';
      if (msg.event === 'order_created') {
        label = `New Order #${msg.order?.id} Placed (Table #${msg.order?.table_no}) — ₹${msg.order?.total_amount}`;
      } else if (msg.event === 'order_status_updated') {
        label = `Order #${msg.order?.id} status updated to: ${msg.order?.status?.replace('_', ' ')}`;
      } else if (msg.event === 'order_delayed') {
        label = `Kitchen delay (+${msg.order?.delay_minutes}m) logged for Order #${msg.order?.id}`;
      }

      setRecentLiveEvent({
        label,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Clear after 6 seconds
      setTimeout(() => {
        setRecentLiveEvent(null);
      }, 6000);
    }
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px 80px 16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
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
              flexShrink: 0,
            }}
          >
            <Shield size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', margin: 0 }}>
                Executive Intelligence
              </h1>
              {/* Real-time Live Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                LIVE REALTIME SYNC
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Operational analytics, financial metrics, and Groq 120B strategic insights
            </span>
          </div>
        </div>

        {/* Range Selector & Manual Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['daily', 'weekly', 'monthly'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`btn ${range === r ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize', padding: '8px 14px', fontSize: '0.84rem' }}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => {
              setIsRefreshingSales(true);
              fetchAnalytics().finally(() => setIsRefreshingSales(false));
            }}
            disabled={isRefreshingSales}
            className="btn btn-outline"
            title="Refresh Sales Data"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={16} className={isRefreshingSales ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Live Event Ticker (Real-Time Animation) */}
      {recentLiveEvent && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={18} color="#34d399" className="pulse-glow" />
            <span style={{ fontSize: '0.88rem', color: '#f8fafc', fontWeight: 600 }}>
              {recentLiveEvent.label}
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {recentLiveEvent.timestamp}
          </span>
        </div>
      )}

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
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
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

          {/* AI Insights Card with Real Working Refresh AI Button */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(26, 34, 52, 0.9) 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
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
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    {insightsData?.cached && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        Cached
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Generated at {insightsData?.generated_at ? new Date(insightsData.generated_at).toLocaleTimeString() : 'now'}
                  </span>
                </div>
              </div>

              {/* Working Refresh AI button with fixed min-width to prevent jitter */}
              <button
                onClick={() => fetchInsights(true)}
                disabled={isLoadingInsights}
                className="btn btn-primary"
                style={{
                  fontSize: '0.85rem',
                  padding: '8px 16px',
                  minWidth: '145px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} className={isLoadingInsights ? 'animate-spin' : ''} />
                {isLoadingInsights ? 'Regenerating AI...' : 'Refresh AI'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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

          {/* Bottom Grid: Top Selling Dishes + Orders By Status (Responsive) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
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
