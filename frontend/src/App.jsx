import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { KitchenBoard } from './pages/KitchenBoard';
import { BillingBoard } from './pages/BillingBoard';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { ChatModal } from './components/ChatModal';
import { WaiterCallModal } from './components/WaiterCallModal';
import { StaffLoginModal } from './components/StaffLoginModal';
import { useAuthStore } from './store/useAuthStore';
import { useSessionStore } from './store/useSessionStore';
import { useWebSocket } from './hooks/useWebSocket';
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

export function App() {
  const { user } = useAuthStore();
  const { sessionToken, initSession } = useSessionStore();
  const [currentView, setCurrentView] = useState('guest'); // guest | orders | kitchen | billing | waiter | admin
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWaiterCallOpen, setIsWaiterCallOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!sessionToken) {
      initSession();
    }
  }, [sessionToken]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen to waiter calls if user is waiter or admin
  const isFloorStaff = user && (user.role === 'waiter' || user.role === 'admin');
  useWebSocket(isFloorStaff ? 'waiter' : null, (msg) => {
    if (msg.event === 'waiter_called') {
      addToast({
        title: `Table #${msg.call.table_no} Calling!`,
        message: 'Guest requested server assistance at their table.',
        type: 'call',
      });
    }
  });

  // Listen to guest channel for order updates
  const guestChannel = sessionToken ? `guest:${sessionToken}` : null;
  useWebSocket(guestChannel, (msg) => {
    if (msg.event === 'order_status_updated') {
      addToast({
        title: `Order #${msg.order.id} Updated`,
        message: `Status is now: ${msg.order.status.replace('_', ' ')}`,
        type: 'status',
      });
    } else if (msg.event === 'order_delayed') {
      addToast({
        title: `Order #${msg.order.id} Delayed`,
        message: `Kitchen reports +${msg.order.delay_minutes}m: ${msg.order.delay_reason}`,
        type: 'delay',
      });
    }
  });

  const handleLoginSuccess = (role) => {
    setCurrentView(role);
    addToast({
      title: 'Authenticated',
      message: `Welcome to the ${role.toUpperCase()} workspace.`,
      type: 'success',
    });
  };

  const handleOrderPlaced = (orderId) => {
    setCurrentView('orders');
    addToast({
      title: 'Order Transmitted!',
      message: `Order #${orderId} sent to kitchen. Tracking live.`,
      type: 'success',
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenWaiterCall={() => setIsWaiterCallOpen(true)}
        onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'guest' && (
          <LandingPage onOpenChat={() => setIsChatOpen(true)} />
        )}

        {currentView === 'orders' && (
          <OrderStatusPage
            onBackToMenu={() => setCurrentView('guest')}
            onOpenWaiterCall={() => setIsWaiterCallOpen(true)}
          />
        )}

        {currentView === 'kitchen' && <KitchenBoard />}

        {currentView === 'billing' && <BillingBoard />}

        {currentView === 'waiter' && <WaiterDashboard />}

        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          background: 'rgba(10, 14, 23, 0.9)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>RestoOne Platform</span> — Multi-Role Realtime Restaurant Experience • Powered by FastAPI & Groq 120B
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <WaiterCallModal
        isOpen={isWaiterCallOpen}
        onClose={() => setIsWaiterCallOpen(false)}
      />

      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Global Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-card">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  t.type === 'call'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : t.type === 'delay'
                    ? 'rgba(244, 63, 94, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                color:
                  t.type === 'call'
                    ? 'var(--accent-gold)'
                    : t.type === 'delay'
                    ? 'var(--accent-rose)'
                    : 'var(--accent-emerald)',
              }}
            >
              {t.type === 'call' ? (
                <Bell size={16} />
              ) : t.type === 'delay' ? (
                <AlertTriangle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{t.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default App;
