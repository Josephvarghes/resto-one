import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Check,
} from 'lucide-react';
import { waiterApi, guestApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusBadge } from '../components/StatusBadge';

export function WaiterDashboard() {
  const [calls, setCalls] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedTable, setSelectedTable] = useState(1);
  const [selectedDishId, setSelectedDishId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [callsRes, ordersRes, dishesRes] = await Promise.all([
        waiterApi.getCalls(),
        waiterApi.getOrders(),
        guestApi.getDishes(),
      ]);
      setCalls(callsRes.data);
      setOrders(ordersRes.data);
      setDishes(dishesRes.data);
      if (dishesRes.data.length > 0 && !selectedDishId) {
        setSelectedDishId(dishesRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch waiter data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useWebSocket('waiter', (msg) => {
    if (
      msg.event === 'waiter_called' ||
      msg.event === 'waiter_call_acknowledged' ||
      msg.event === 'order_created' ||
      msg.event === 'order_status_updated' ||
      msg.event === 'order_delayed'
    ) {
      fetchData();
    }
  });

  const handleAckCall = async (callId) => {
    try {
      await waiterApi.ackCall(callId);
      await fetchData();
    } catch (err) {
      console.error('Failed to acknowledge call:', err);
    }
  };

  const handleAddToCart = () => {
    const dish = dishes.find((d) => d.id === parseInt(selectedDishId, 10));
    if (!dish) return;
    setCartItems((prev) => [...prev, { dish, quantity, note }]);
    setNote('');
    setQuantity(1);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const items = cartItems.map((it) => ({
        dish_id: it.dish.id,
        quantity: it.quantity,
        note: it.note || null,
      }));
      await waiterApi.placeOrder(items, selectedTable);
      setCartItems([]);
      await fetchData();
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Header */}
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
            <Bell size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Floor Server Dashboard</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Live table calls, fast order punching, and floor status
            </span>
          </div>
        </div>

        <button onClick={fetchData} className="btn btn-outline" title="Refresh">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Pending Calls Banner */}
      {calls.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent-gold)',
                display: 'inline-block',
                boxShadow: '0 0 10px var(--accent-gold)',
              }}
            />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              Incoming Guest Calls ({calls.length})
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {calls.map((call) => (
              <div
                key={call.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(26, 34, 52, 0.9) 100%)',
                  border: '1px solid var(--border-accent)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                    Table #{call.table_no}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                    Needs assistance • {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <button
                  onClick={() => handleAckCall(call.id)}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                >
                  <Check size={14} /> Attending
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Fast Order Entry + Active Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '28px' }}>
        {/* Fast Order Entry Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Utensils size={20} color="var(--accent-gold)" /> Take Order for Table
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                TABLE NUMBER
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '10px',
                  fontSize: '0.92rem',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num} style={{ background: '#1e293b' }}>
                    Table #{num}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                SELECT DISH
              </label>
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '10px',
                  fontSize: '0.92rem',
                }}
              >
                {dishes.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: '#1e293b' }}>
                    {d.name} ({d.category}) — ₹{d.price}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  QTY
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    padding: '10px',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  KITCHEN NOTE
                </label>
                <input
                  type="text"
                  placeholder="e.g. less salt..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    padding: '10px',
                    fontSize: '0.92rem',
                  }}
                />
              </div>
            </div>

            <button onClick={handleAddToCart} className="btn btn-outline" style={{ marginTop: '6px' }}>
              <Plus size={16} /> Add Dish to Ticket
            </button>
          </div>

          {/* Staged Items */}
          {cartItems.length > 0 && (
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                STAGED COURSES FOR TABLE #{selectedTable}
              </div>
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    marginBottom: '4px',
                  }}
                >
                  <span>
                    {item.quantity}× {item.dish.name}
                  </span>
                  <span style={{ color: 'var(--accent-gold)' }}>
                    ₹{item.dish.price * item.quantity}
                  </span>
                </div>
              ))}

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '14px' }}
              >
                {isSubmittingOrder ? 'Transmitting...' : `Send Ticket to Kitchen`}
              </button>
            </div>
          )}
        </div>

        {/* Live Table Orders Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="var(--accent-gold)" /> Active Floor Orders
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '560px', overflowY: 'auto' }}>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                No active orders on the floor.
              </p>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      Table #{o.table_no} (Order #{o.id})
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {o.items.map((i) => `${i.quantity}× ${i.dish_name}`).join(', ')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600, marginTop: '6px' }}>
                    Total: ₹{o.total_amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
