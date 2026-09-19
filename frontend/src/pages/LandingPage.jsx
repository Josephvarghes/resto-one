import React, { useState, useEffect } from 'react';
import { Search, Sparkles, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { guestApi } from '../api';
import { DishCard } from '../components/DishCard';
import { useSessionStore } from '../store/useSessionStore';

const CATEGORIES = ['All', 'Starters', 'Mains', 'Breads', 'Desserts', 'Beverages'];

export function LandingPage({ onOpenChat }) {
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { tableNo, initSession, sessionToken } = useSessionStore();

  useEffect(() => {
    if (!sessionToken) {
      initSession(tableNo);
    }
    fetchDishes();
  }, [sessionToken, tableNo]);

  const fetchDishes = async () => {
    setIsLoading(true);
    try {
      const res = await guestApi.getDishes();
      setDishes(res.data);
    } catch (err) {
      console.error('Failed to load dishes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      dish.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Luxury Hero Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '36px 40px',
          marginBottom: '36px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(26, 34, 52, 0.8) 0%, rgba(17, 24, 39, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--border-accent)',
              color: 'var(--accent-gold)',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '14px',
            }}
          >
            <Sparkles size={14} /> Seated at Table #{tableNo}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.1rem)',
              color: '#fff',
              marginBottom: '14px',
              lineHeight: 1.15,
            }}
          >
            Artisanal Dining, <br />
            <span
              style={{
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Crafted in Real-Time
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            Explore our chef's hand-curated menu. Add items to your table's cart, place your order with a tap, and watch your dishes progress live from kitchen to table.
          </p>

          <button
            onClick={onOpenChat}
            className="btn btn-primary pulse-glow"
            style={{ padding: '12px 24px', fontSize: '0.96rem' }}
          >
            <Sparkles size={18} /> Ask AI Concierge for Recommendations
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            maxWidth: '100%',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#0b0f19' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flavors or dishes..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
              padding: '9px 14px 9px 36px',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-gold)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
          />
        </div>
      </div>

      {/* Dish Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ marginBottom: '14px', color: 'var(--accent-gold)' }} />
          <p style={{ fontSize: '1.05rem' }}>Preparing the seasonal menu...</p>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <UtensilsCrossed size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>No dishes found</h3>
          <p style={{ fontSize: '0.92rem' }}>
            Try tweaking your search or browsing a different category.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
