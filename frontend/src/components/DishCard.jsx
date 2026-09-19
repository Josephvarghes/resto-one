import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export function DishCard({ dish, compact = false }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(dish, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  if (compact) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginTop: '10px',
        }}
      >
        {dish.image_url && (
          <img
            src={dish.image_url}
            alt={dish.name}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-sm)',
              objectFit: 'cover',
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
            {dish.name}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
            ₹{dish.price}
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          className="btn btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          {justAdded ? <Check size={14} /> : <Plus size={14} />}
          {justAdded ? 'Added' : 'Add'}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--border-accent)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '60%', overflow: 'hidden' }}>
        <img
          src={dish.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600'}
          alt={dish.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10, 14, 23, 0.9) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(10, 14, 23, 0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid var(--border-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {dish.category}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
            }}
          >
            {dish.name}
          </h3>
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--accent-gold)',
              marginLeft: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            ₹{dish.price}
          </span>
        </div>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            marginBottom: '18px',
            flex: 1,
            lineHeight: 1.45,
          }}
        >
          {dish.description}
        </p>

        {/* Action bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '2px 6px',
            }}
          >
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Minus size={14} />
            </button>
            <span style={{ padding: '0 8px', fontWeight: 600, fontSize: '0.9rem' }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className={`btn ${justAdded ? 'btn-success' : 'btn-primary'}`}
            style={{ flex: 1 }}
          >
            {justAdded ? (
              <>
                <Check size={16} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
