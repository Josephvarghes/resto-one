import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  Bell,
  Sparkles,
  Clock,
  Shield,
  ChefHat,
  Receipt,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthStore } from '../store/useAuthStore';

export function Navbar({
  currentView,
  setCurrentView,
  onOpenCart,
  onOpenChat,
  onOpenWaiterCall,
  onOpenStaffLogin,
}) {
  const itemCount = useCartStore((state) => state.getItemCount());
  const { tableNo, setTableNo } = useSessionStore();
  const { user, logout } = useAuthStore();
  const [showTableSelect, setShowTableSelect] = useState(false);

  const handleRoleLogout = () => {
    logout();
    setCurrentView('guest');
  };

  return (
    <header
      className="glass-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => setCurrentView(user ? user.role : 'guest')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#0b0f19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Utensils size={22} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                background: 'linear-gradient(to right, #ffffff, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              RestoOne
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-gold)',
                fontWeight: 600,
              }}
            >
              Luxury Dining Experience
            </div>
          </div>
        </div>

        {/* Center navigation for Guest or Staff Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Guest Navigation */}
          {(!user || user.role === 'waiter') && (
            <>
              <button
                onClick={() => setCurrentView('guest')}
                className={`btn ${currentView === 'guest' ? 'btn-accent-glow' : 'btn-outline'}`}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Menu
              </button>
              <button
                onClick={() => setCurrentView('orders')}
                className={`btn ${currentView === 'orders' ? 'btn-accent-glow' : 'btn-outline'}`}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <Clock size={16} /> My Orders
              </button>
            </>
          )}

          {/* Role specific quick switches */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.role === 'kitchen' && (
                <button
                  onClick={() => setCurrentView('kitchen')}
                  className="btn btn-accent-glow"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <ChefHat size={16} /> Kitchen Board
                </button>
              )}
              {user.role === 'billing' && (
                <button
                  onClick={() => setCurrentView('billing')}
                  className="btn btn-accent-glow"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <Receipt size={16} /> Billing Board
                </button>
              )}
              {user.role === 'waiter' && (
                <button
                  onClick={() => setCurrentView('waiter')}
                  className="btn btn-accent-glow"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <Bell size={16} /> Waiter Floor
                </button>
              )}
              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`btn ${currentView === 'admin' ? 'btn-accent-glow' : 'btn-outline'}`}
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    <Shield size={16} /> Admin Analytics
                  </button>
                  <button
                    onClick={() => setCurrentView('kitchen')}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Kitchen
                  </button>
                  <button
                    onClick={() => setCurrentView('billing')}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Billing
                  </button>
                  <button
                    onClick={() => setCurrentView('waiter')}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Waiter
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Table Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTableSelect(!showTableSelect)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ color: 'var(--accent-gold)' }}>Table</span> #{tableNo}
              <ChevronDown size={14} />
            </button>

            {showTableSelect && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#151d2f',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 60,
                  width: '180px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setTableNo(num);
                      setShowTableSelect(false);
                    }}
                    style={{
                      background: tableNo === num ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.04)',
                      color: tableNo === num ? '#000' : 'var(--text-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    #{num}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Call Waiter */}
          <button
            onClick={onOpenWaiterCall}
            title="Ring Waiter"
            className="btn btn-outline"
            style={{ padding: '8px 12px' }}
          >
            <Bell size={17} color="var(--accent-gold)" />
            <span style={{ display: 'none', md: 'inline' }}>Server</span>
          </button>

          {/* AI Concierge */}
          <button
            onClick={onOpenChat}
            className="btn btn-accent-glow pulse-glow"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Sparkles size={16} />
            <span>AI Concierge</span>
          </button>

          {/* Cart Trigger with Count Badge */}
          <button
            onClick={onOpenCart}
            className="btn btn-primary"
            style={{ padding: '8px 16px', position: 'relative' }}
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            {itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Staff Auth Button */}
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleRoleLogout}
                title="Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenStaffLogin}
              className="btn btn-outline"
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              Staff Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
