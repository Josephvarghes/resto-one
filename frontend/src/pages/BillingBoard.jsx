import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  RefreshCw,
  CreditCard,
  Utensils,
  DollarSign,
  Search,
} from 'lucide-react';
import { billingApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusBadge } from '../components/StatusBadge';

export function BillingBoard() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('unpaid'); // unpaid | paid
  const [isLoading, setIsLoading] = useState(true);
  const [searchTable, setSearchTable] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchOrders = async () => {
    try {
      const isPaid = activeTab === 'paid';
      const res = await billingApi.getOrders(isPaid);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch billing orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useWebSocket('billing', (msg) => {
    if (
      msg.event === 'order_created' ||
      msg.event === 'order_status_updated' ||
      msg.event === 'order_delayed'
    ) {
      fetchOrders();
    }
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    setIsProcessing(true);
    try {
      await billingApi.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTable) return true;
    return o.table_no.toString().includes(searchTable) || o.id.toString().includes(searchTable);
  });

  const totalOutstanding = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#0b0f19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Receipt size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Billing & Settlement</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Real-time checkout, receipts, and table settlement
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {activeTab === 'unpaid' ? 'Active Volume:' : 'Settled Total:'}
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
              ₹{Math.round(totalOutstanding)}
            </span>
          </div>

          <button onClick={fetchOrders} className="btn btn-outline" title="Refresh">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`btn ${activeTab === 'unpaid' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 20px' }}
          >
            Active / Unpaid Bills ({activeTab === 'unpaid' ? orders.length : '...'})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`btn ${activeTab === 'paid' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 20px' }}
          >
            Settled History
          </button>
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            placeholder="Search Table # or Order ID..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
              padding: '8px 14px 8px 36px',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ marginBottom: '12px', color: 'var(--accent-emerald)' }} />
          <p>Loading table bills...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Receipt size={54} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>
            No records found
          </h3>
          <p style={{ fontSize: '0.9rem' }}>
            {activeTab === 'unpaid' ? 'All active tables are fully settled!' : 'No historical paid orders match.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredOrders.map((order) => {
            const isReady = order.status === 'ready_to_serve';
            const isServed = order.status === 'served';
            const isPaid = order.status === 'paid';

            return (
              <div
                key={order.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isPaid
                    ? '1px solid var(--border-subtle)'
                    : isReady
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid var(--border-accent)',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      Table #{order.table_no}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Ticket #{order.id} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    marginBottom: '16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.88rem',
                      }}
                    >
                      <span>
                        {it.quantity}× {it.dish_name}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        ₹{it.item_total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderTop: '1px solid var(--border-subtle)',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>Total Due</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    ₹{order.total_amount}
                  </span>
                </div>

                {/* Actions */}
                {!isPaid && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        disabled={isProcessing}
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                      >
                        <Utensils size={15} /> Mark Served
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'paid')}
                      disabled={isProcessing}
                      className="btn btn-success"
                      style={{ flex: 2 }}
                    >
                      <CreditCard size={15} /> Settle Bill (Paid)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
