import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChefHat,
  Bell,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { guestApi } from '../api';
import { useSessionStore } from '../store/useSessionStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusBadge } from '../components/StatusBadge';

const STEPS = [
  { id: 'placed', label: 'Placed' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'ready_to_serve', label: 'Ready' },
  { id: 'served', label: 'Served' },
  { id: 'paid', label: 'Paid' },
];

function getStepIndex(status) {
  const s = status ? status.toLowerCase() : 'placed';
  if (s === 'confirmed') return 0;
  const idx = STEPS.findIndex((st) => st.id === s);
  return idx >= 0 ? idx : 0;
}

export function OrderStatusPage({ onBackToMenu, onOpenWaiterCall }) {
  const { sessionToken, tableNo } = useSessionStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await guestApi.getOrderHistory();
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [sessionToken]);

  // WebSocket live updates for this guest session
  const guestChannel = sessionToken ? `guest:${sessionToken}` : null;
  useWebSocket(guestChannel, (msg) => {
    if (msg.event === 'order_created' || msg.event === 'order_status_updated' || msg.event === 'order_delayed') {
      fetchOrders();
    }
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToMenu}
            className="btn btn-outline"
            style={{ padding: '8px 12px' }}
          >
            <ArrowLeft size={16} /> Menu
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Live Order Tracker</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Real-time synchronization for Table #{tableNo}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchOrders} className="btn btn-outline" title="Refresh">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onOpenWaiterCall} className="btn btn-accent-glow">
            <Bell size={16} /> Call Server
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ marginBottom: '12px', color: 'var(--accent-gold)' }} />
          <p>Syncing table tickets...</p>
        </div>
      ) : orders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <ShoppingBag size={54} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>
            No Active Orders Yet
          </h3>
          <p style={{ fontSize: '0.92rem', marginBottom: '24px' }}>
            Explore our curated menu and send your first course to the kitchen.
          </p>
          <button onClick={onBackToMenu} className="btn btn-primary">
            Explore Menu
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const isCompleted = order.status === 'paid';

            return (
              <div
                key={order.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  border: order.is_delayed
                    ? '1px solid rgba(244, 63, 94, 0.4)'
                    : '1px solid var(--border-subtle)',
                  background: order.is_delayed
                    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(26, 34, 52, 0.8) 100%)'
                    : 'var(--bg-surface-card)',
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--accent-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ChefHat size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                        Order #{order.id}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Table #{order.table_no}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={order.status} />
                    <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--accent-gold)' }}>
                      ₹{order.total_amount}
                    </span>
                  </div>
                </div>

                {/* Kitchen Delay Banner */}
                {order.is_delayed && !isCompleted && (
                  <div
                    style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    <AlertTriangle size={20} color="#f43f5e" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fda4af' }}>
                        Kitchen Delay Update (+{order.delay_minutes} mins)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#fecdd3' }}>
                        {order.delay_reason || 'Chef is perfecting your course for optimal quality.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Stepper Timeline */}
                <div style={{ margin: '24px 0 28px 0', padding: '0 8px' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
                      position: 'relative',
                    }}
                  >
                    {/* Connecting Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '8%',
                        right: '8%',
                        height: '2px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        zIndex: 0,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '8%',
                        width: `${(currentStepIdx / (STEPS.length - 1)) * 84}%`,
                        height: '2px',
                        background: 'var(--accent-gold)',
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)',
                        transition: 'width 0.4s ease',
                        zIndex: 0,
                      }}
                    />

                    {STEPS.map((step, idx) => {
                      const isDone = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div
                          key={step.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: isDone
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : '#1e293b',
                              border: isCurrent
                                ? '2px solid #fff'
                                : isDone
                                ? '1px solid var(--accent-gold)'
                                : '1px solid var(--border-subtle)',
                              color: isDone ? '#000' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              boxShadow: isCurrent ? '0 0 14px rgba(245, 158, 11, 0.7)' : 'none',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                          </div>
                          <span
                            style={{
                              marginTop: '8px',
                              fontSize: '0.76rem',
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent
                                ? 'var(--accent-gold)'
                                : isDone
                                ? 'var(--text-primary)'
                                : 'var(--text-muted)',
                              textAlign: 'center',
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ordered Items List */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    Itemized Courses
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.92rem',
                          padding: '4px 0',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.quantity}× {item.dish_name}
                          </span>
                          {item.note && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.78rem',
                                color: 'var(--accent-gold)',
                                fontStyle: 'italic',
                              }}
                            >
                              Note: {item.note}
                            </span>
                          )}
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ₹{item.item_total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
