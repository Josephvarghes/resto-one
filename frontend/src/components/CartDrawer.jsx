import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, MessageSquare, CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useSessionStore } from '../store/useSessionStore';
import { guestApi } from '../api';

export function CartDrawer({ isOpen, onClose, onOrderPlaced }) {
  const { items, updateQuantity, updateNote, removeItem, clearCart, getSubtotal } = useCartStore();
  const { tableNo, sessionToken, initSession } = useSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + tax;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Ensure session is initialized
      if (!sessionToken) {
        await initSession(tableNo);
      }

      const orderPayload = {
        table_no: tableNo,
        items: items.map((i) => ({
          dish_id: i.dish.id,
          quantity: i.quantity,
          note: i.note || null,
        })),
      };

      const res = await guestApi.placeOrder(orderPayload.items, orderPayload.table_no);
      clearCart();
      setOrderSuccess(res.data);
      setTimeout(() => {
        setOrderSuccess(null);
        onClose();
        if (onOrderPlaced) onOrderPlaced(res.data.order_id);
      }, 1500);
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.7)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Drawer content */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#111827',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          animation: 'fadeIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
                Your Order
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Table #{tableNo}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Order success notification overlay */}
        {orderSuccess ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <CheckCircle size={42} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>
              Order Placed!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Order #{orderSuccess.order_id} sent to the kitchen.
            </p>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {items.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Your cart is empty
                  </p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Browse our gourmet menu and add your favorite dishes.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {items.map(({ dish, quantity, note }) => (
                    <div
                      key={dish.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>{dish.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                            ₹{dish.price} × {quantity} = ₹{dish.price * quantity}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(dish.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Quantity row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(dish.id, -1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '0 8px', fontSize: '0.88rem', fontWeight: 600 }}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(dish.id, 1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Note toggle */}
                        <input
                          type="text"
                          placeholder="Special request (e.g. extra spicy)..."
                          value={note || ''}
                          onChange={(e) => updateNote(dish.id, e.target.value)}
                          style={{
                            flex: 1,
                            marginLeft: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div
                style={{
                  padding: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              >
                {errorMsg && (
                  <div
                    style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#fda4af',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      marginBottom: '12px',
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Restaurant GST (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span>Grand Total</span>
                    <span style={{ color: 'var(--accent-gold)' }}>₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                  {isSubmitting ? (
                    'Sending to Kitchen...'
                  ) : (
                    <>
                      Confirm & Place Order <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
