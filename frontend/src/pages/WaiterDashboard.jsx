import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Minus,
  RefreshCw,
  Utensils,
  Check,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { waiterApi, guestApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusBadge } from '../components/StatusBadge';

const PRESET_NOTES = ['Mild / Less Spicy', 'Extra Spicy', 'No Onion & Garlic', 'Less Salt', 'Serve Fast'];
const TABLE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

  // Mobile / layout navigation: 'calls' | 'order' | 'active'
  const [activeTab, setActiveTab] = useState('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterTable, setFilterTable] = useState('all');

  const fetchData = async () => {
    try {
      const [callsRes, ordersRes, dishesRes] = await Promise.all([
        waiterApi.getCalls(),
        waiterApi.getOrders(),
        guestApi.getDishes(),
      ]);
      setCalls(callsRes.data || []);
      setOrders(ordersRes.data || []);
      setDishes(dishesRes.data || []);
      if (dishesRes.data && dishesRes.data.length > 0 && !selectedDishId) {
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

  // Real-time synchronization
  useWebSocket('waiter', (msg) => {
    if (
      msg.event === 'waiter_called' ||
      msg.event === 'waiter_call_acknowledged' ||
      msg.event === 'order_created' ||
      msg.event === 'order_status_updated' ||
      msg.event === 'order_delayed'
    ) {
      fetchData();
      // If a new call arrives and user is on mobile, switch or alert
      if (msg.event === 'waiter_called' && calls.length === 0) {
        setActiveTab('calls');
      }
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

  // Dish categories for quick filters
  const categories = useMemo(() => {
    const cats = ['All'];
    dishes.forEach((d) => {
      if (d.category && !cats.includes(d.category)) {
        cats.push(d.category);
      }
    });
    return cats;
  }, [dishes]);

  // Filtered dishes for fast mobile selection
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, selectedCategory, searchQuery]);

  const handleSelectDish = (dish) => {
    setSelectedDishId(dish.id);
  };

  const handleAddToCart = () => {
    const dish = dishes.find((d) => d.id === parseInt(selectedDishId, 10));
    if (!dish) return;

    setCartItems((prev) => {
      // If same dish and note exists, increment quantity
      const existingIdx = prev.findIndex(
        (it) => it.dish.id === dish.id && (it.note || '') === (note || '')
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { dish, quantity, note }];
    });

    setNote('');
    setQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, idx) => idx !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (it.dish?.price || 0) * it.quantity, 0);
  }, [cartItems]);

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
      setActiveTab('active'); // switch to active orders to confirm
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Filtered orders for active list
  const displayedOrders = useMemo(() => {
    if (filterTable === 'all') return orders;
    return orders.filter((o) => o.table_no === parseInt(filterTable, 10));
  }, [orders, filterTable]);

  const selectedDish = dishes.find((d) => d.id === parseInt(selectedDishId, 10));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 14px 80px 14px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#0b0f19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
              flexShrink: 0,
            }}
          >
            <Utensils size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', margin: 0, lineHeight: 1.2 }}>
              Floor Server Station
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Instant table calls & touch-speed ordering
            </span>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-outline"
          title="Refresh Station"
          style={{ padding: '8px 12px', height: '40px' }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span className="waiter-mobile-only" style={{ display: 'none' }}>Refresh</span>
        </button>
      </div>

      {/* Segmented Touch Tab Bar (Optimized for Mobile Floor Operation) */}
      <div className="waiter-tabs-container">
        <button
          onClick={() => setActiveTab('calls')}
          className={`waiter-tab-btn ${activeTab === 'calls' ? 'active' : ''}`}
        >
          <Bell size={18} />
          <span>Table Calls</span>
          {calls.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
              }}
            >
              {calls.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('order')}
          className={`waiter-tab-btn ${activeTab === 'order' ? 'active' : ''}`}
        >
          <Plus size={18} />
          <span>Punch Order</span>
          {cartItems.length > 0 && (
            <span
              style={{
                background: 'var(--accent-gold)',
                color: '#0b0f19',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {cartItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`waiter-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
        >
          <Clock size={18} />
          <span>Active Orders</span>
          {orders.length > 0 && (
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: TABLE CALLS */}
      {activeTab === 'calls' && (
        <div>
          {calls.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                textAlign: 'center',
                padding: '50px 20px',
                color: 'var(--text-muted)',
              }}
            >
              <CheckCircle2 size={44} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                All Tables Attended
              </h3>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>
                No active guest assistance requests on the floor.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="glass-panel"
                  style={{
                    padding: '18px 20px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(26, 34, 52, 0.95) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                        Table #{call.table_no}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            boxShadow: '0 0 8px #ef4444',
                            display: 'inline-block',
                          }}
                        />
                        Waiting for server • {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTable(call.table_no);
                        setActiveTab('order');
                      }}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      title="Take order for this table"
                    >
                      <Utensils size={14} /> Punch
                    </button>
                  </div>

                  <button
                    onClick={() => handleAckCall(call.id)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      minHeight: '48px',
                    }}
                  >
                    <Check size={18} /> Attend & Clear Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PUNCH ORDER (Optimized Mobile Floor Order Entry) */}
      {activeTab === 'order' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Table Selector Ribbon */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Table for Ticket
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                Selected: Table #{selectedTable}
              </span>
            </div>

            <div className="table-selector-scroll">
              {TABLE_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedTable(num)}
                  className={`table-pill-btn ${selectedTable === num ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>TBL</span>
                  <span>#{num}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dish Picker & Stepper */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils size={18} color="var(--accent-gold)" /> Select & Add Dishes
            </h2>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Dish Search Bar */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search dish name (e.g. Biryani, Tikka)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px 10px 38px',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Dish Quick Selection List */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '10px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '4px',
                marginBottom: '16px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {filteredDishes.map((d) => {
                const isSelected = selectedDishId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDish(d)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(26, 34, 52, 0.9) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '62px',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isSelected ? 'var(--accent-gold)' : '#fff', lineHeight: 1.2 }}>
                      {d.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {d.category}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        ₹{d.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Stepper & Quick Notes */}
            {selectedDish && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                    {selectedDish.name} (₹{selectedDish.price * quantity})
                  </span>

                  {/* 44px Touch Steppers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="stepper-btn"
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="stepper-btn"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Quick Kitchen Notes */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    QUICK KITCHEN INSTRUCTIONS
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {PRESET_NOTES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNote((prev) => (prev ? `${prev}, ${preset}` : preset))}
                        style={{
                          fontSize: '0.74rem',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: note.includes(preset) ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: note.includes(preset) ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          color: note.includes(preset) ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Custom instruction (e.g. no coriander)..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '44px', fontSize: '0.92rem', fontWeight: 700 }}
                >
                  <Plus size={16} /> Add to Table #{selectedTable} Ticket
                </button>
              </div>
            )}
          </div>

          {/* Staged Ticket Panel (Cart) */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                  Table #{selectedTable} Ticket
                </h3>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} staged
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Select a table and add dishes above to stage this order.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        gap: '10px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>
                          {item.dish.name}
                        </div>
                        {item.note && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>
                            Note: {item.note}
                          </div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          ₹{item.dish.price} × {item.quantity} = ₹{item.dish.price * item.quantity}
                        </div>
                      </div>

                      {/* Stepper & Trash */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, -1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '22px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '4px',
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket Total and Transmit Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Total Order Value
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-gold)' }}>
                    ₹{cartTotal}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmittingOrder}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Transmitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Send Ticket to Kitchen (₹{cartTotal})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE FLOOR ORDERS */}
      {activeTab === 'active' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--accent-gold)" /> Live Floor Orders ({orders.length})
            </h2>

            {/* Quick Filter by Table */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter Table:</span>
              <select
                value={filterTable}
                onChange={(e) => setFilterTable(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  fontSize: '0.84rem',
                }}
              >
                <option value="all" style={{ background: '#1e293b' }}>All Tables</option>
                {TABLE_NUMBERS.map((num) => (
                  <option key={num} value={num} style={{ background: '#1e293b' }}>
                    Table #{num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 10px', color: 'var(--text-muted)' }}>
                No active orders found for this selection.
              </div>
            ) : (
              displayedOrders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-gold)',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Table #{o.table_no}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        Order #{o.id}
                      </span>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {o.items?.map((i, idx) => (
                      <span key={idx}>
                        <strong style={{ color: '#fff' }}>{i.quantity}×</strong> {i.dish_name}
                        {i.note ? ` (${i.note})` : ''}
                        {idx < o.items.length - 1 ? ' • ' : ''}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <span>
                      {o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.9rem' }}>
                      Total: ₹{o.total_amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
