import React, { useState } from 'react';
import { Lock, User, Key, X, Shield, ChefHat, Receipt, Utensils } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store/useAuthStore';

const DEMO_PRESETS = [
  { label: 'Admin', name: 'admin', pass: 'admin123', role: 'admin', icon: Shield, desc: 'Analytics & AI Insights' },
  { label: 'Kitchen', name: 'kitchen', pass: 'kitchen123', role: 'kitchen', icon: ChefHat, desc: 'Live Prep Queue & Delays' },
  { label: 'Waiter', name: 'waiter', pass: 'waiter123', role: 'waiter', icon: Utensils, desc: 'Floor Calls & Orders' },
  { label: 'Billing', name: 'billing', pass: 'billing123', role: 'billing', icon: Receipt, desc: 'Order Settlement & Receipts' },
];

export function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const login = useAuthStore((state) => state.login);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.login(name, password);
      const { access_token, user_id, name: userName, role } = res.data;
      login(access_token, { id: user_id, name: userName, role });
      onClose();
      if (onLoginSuccess) onLoginSuccess(role);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = async (preset) => {
    setName(preset.name);
    setPassword(preset.pass);
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.login(preset.name, preset.pass);
      const { access_token, user_id, name: userName, role } = res.data;
      login(access_token, { id: user_id, name: userName, role });
      onClose();
      if (onLoginSuccess) onLoginSuccess(role);
    } catch (err) {
      console.error('Quick fill login error:', err);
      setErrorMsg('Failed to login with preset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px', maxWidth: '460px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Staff Portal Login</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Demo Fast Login Pills */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            One-Click Demo Roles
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            {DEMO_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => handleQuickFill(preset)}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                    e.currentTarget.style.borderColor = 'var(--border-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Icon size={16} />
                    <span>{preset.label}</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or enter credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '14px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. admin, kitchen..."
                required
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px 10px 36px',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px 10px 36px',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            {isLoading ? 'Signing In...' : 'Authenticate & Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
