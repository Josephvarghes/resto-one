import React, { useState } from 'react';
import { Bell, X, CheckCircle, Droplets, Sparkles, Receipt, HelpCircle } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';
import { guestApi } from '../api';

const QUICK_REASONS = [
  { label: 'Drinking Water', icon: Droplets },
  { label: 'Fresh Napkins & Cutlery', icon: Sparkles },
  { label: 'Check / Bill', icon: Receipt },
  { label: 'General Assistance', icon: HelpCircle },
];

export function WaiterCallModal({ isOpen, onClose }) {
  const { tableNo } = useSessionStore();
  const [selectedTable, setSelectedTable] = useState(tableNo);
  const [isCalling, setIsCalling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCall = async () => {
    setIsCalling(true);
    try {
      await guestApi.callWaiter(selectedTable);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsCalling(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Failed to call waiter:', err);
      setIsCalling(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Call Server to Table</h3>
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

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>
              Server Notified!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              A team member is on their way to Table #{selectedTable}.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Need assistance, fresh water, or your bill? Tap below to alert the floor team in real-time.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                CONFIRM TABLE NUMBER
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num} style={{ background: '#1e293b' }}>
                    Table #{num}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {QUICK_REASONS.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Icon size={16} color="var(--accent-gold)" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCall}
                disabled={isCalling}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                <Bell size={16} />
                {isCalling ? 'Alerting...' : `Ring Table #${selectedTable}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
