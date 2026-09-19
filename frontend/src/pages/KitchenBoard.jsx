import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Flame,
  Check,
  X,
} from 'lucide-react';
import { kitchenApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusBadge } from '../components/StatusBadge';

export function KitchenBoard() {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [delayModalOrder, setDelayModalOrder] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [delayReason, setDelayReason] = useState('High kitchen volume & freshly baking bread');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await kitchenApi.getQueue();
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch kitchen queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Listen to kitchen websocket channel
  useWebSocket('kitchen', (msg) => {
    if (
      msg.event === 'order_created' ||
      msg.event === 'order_status_updated' ||
      msg.event === 'order_delayed'
    ) {
      fetchQueue();
    }
  });

  const handleAccept = async (orderId) => {
    setIsSubmittingAction(true);
    try {
      await kitchenApi.acceptOrder(orderId);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to accept order:', err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleMarkDone = async (orderId) => {
    setIsSubmittingAction(true);
    try {
      await kitchenApi.doneOrder(orderId);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to mark order done:', err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmDelay = async () => {
    if (!delayModalOrder) return;
    setIsSubmittingAction(true);
    try {
      await kitchenApi.delayOrder(delayModalOrder.id, delayMinutes, delayReason);
      setDelayModalOrder(null);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to report delay:', err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getTimeElapsed = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
            <ChefHat size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Kitchen Order Board</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Live cooking queue • {queue.length} ticket(s) active
            </span>
          </div>
        </div>

        <button onClick={fetchQueue} className="btn btn-outline" title="Refresh Board">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ marginBottom: '12px', color: 'var(--accent-gold)' }} />
          <p>Connecting to kitchen dispatch...</p>
        </div>
      ) : queue.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <ChefHat size={60} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>
            Kitchen Queue Clear!
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            All incoming orders have been accepted and dispatched.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {queue.map((order) => {
            const isAccepted = order.status === 'accepted' || order.status === 'preparing';
            return (
              <div
                key={order.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px',
                  border: order.is_delayed
                    ? '1px solid rgba(244, 63, 94, 0.5)'
                    : isAccepted
                    ? '1px solid var(--border-accent)'
                    : '1px solid rgba(14, 165, 233, 0.4)',
                  boxShadow: order.is_delayed
                    ? '0 0 20px rgba(244, 63, 94, 0.15)'
                    : 'var(--shadow-md)',
                }}
              >
                {/* Header info */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        Table #{order.table_no}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        #{order.id}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <Clock size={12} /> {getTimeElapsed(order.created_at)}
                    </div>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* Delay badge if any */}
                {order.is_delayed && (
                  <div
                    style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: '#fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '14px',
                    }}
                  >
                    <AlertTriangle size={16} color="#f43f5e" />
                    <span>Delay: +{order.delay_minutes}m ({order.delay_reason})</span>
                  </div>
                )}

                {/* Items */}
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--accent-gold)', marginRight: '8px' }}>
                          {item.quantity}×
                        </span>
                        <span style={{ color: '#fff', fontWeight: 500 }}>
                          {item.dish_name}
                        </span>
                        {item.note && (
                          <div style={{ fontSize: '0.78rem', color: '#fb923c', fontStyle: 'italic', marginTop: '2px' }}>
                            Note: {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kitchen actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isAccepted ? (
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={isSubmittingAction}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <Flame size={16} /> Accept Ticket
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkDone(order.id)}
                      disabled={isSubmittingAction}
                      className="btn btn-success"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <Check size={16} /> Mark Done (Ready)
                    </button>
                  )}

                  <button
                    onClick={() => setDelayModalOrder(order)}
                    className="btn btn-danger"
                    style={{ padding: '10px 14px' }}
                    title="Report Delay"
                  >
                    <AlertTriangle size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delay Modal */}
      {delayModalOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={22} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                  Report Kitchen Delay (Table #{delayModalOrder.table_no})
                </h3>
              </div>
              <button
                onClick={() => setDelayModalOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Pushes an instant live status update to the guest and floor staff with updated ETA.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                ESTIMATED MINUTES ADDED
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[5, 10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDelayMinutes(mins)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      background: delayMinutes === mins ? 'var(--accent-rose)' : 'rgba(255,255,255,0.05)',
                      color: delayMinutes === mins ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                REASON / CUSTOMER NOTE
              </label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDelayModalOrder(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelay}
                disabled={isSubmittingAction}
                className="btn btn-danger"
                style={{ flex: 2 }}
              >
                {isSubmittingAction ? 'Broadcasting...' : 'Broadcast Delay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
