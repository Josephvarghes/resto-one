import React, { useState, useEffect, useRef } from 'react';
import { Server, Sparkles, CheckCircle2, RefreshCw, X } from 'lucide-react';
import axios from 'axios';

export function ServerWakeOverlay() {
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const pollIntervalRef = useRef(null);
  const timerRef = useRef(null);

  // Derive health check URL from API baseURL
  const getHealthUrl = () => {
    const rawUrl =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? 'https://resto-one-backend.onrender.com' : 'http://localhost:8000');
    // Normalize to root URL
    return rawUrl.replace(/\/api\/?$/, '');
  };

  const healthUrl = getHealthUrl();

  useEffect(() => {
    let isMounted = true;
    let coldStartTriggered = false;

    // Check if server is already awake or sleeping
    const checkServer = async () => {
      try {
        await axios.get(`${healthUrl}/`, { timeout: 3000 });
        if (isMounted) {
          if (coldStartTriggered) {
            setIsReady(true);
            setTimeout(() => {
              if (isMounted) setIsWaking(false);
            }, 1200);
          } else {
            setIsWaking(false);
          }
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (err) {
        // Server did not respond in 3s -> cold start or waking up
        if (isMounted && !coldStartTriggered) {
          coldStartTriggered = true;
          setIsWaking(true);

          // Start elapsed counter
          timerRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
          }, 1000);

          // Poll every 3 seconds until server responds
          pollIntervalRef.current = setInterval(async () => {
            try {
              await axios.get(`${healthUrl}/`, { timeout: 5000 });
              if (isMounted) {
                setIsReady(true);
                clearInterval(pollIntervalRef.current);
                clearInterval(timerRef.current);
                setTimeout(() => {
                  if (isMounted) setIsWaking(false);
                }, 1200);
              }
            } catch {
              // Still spinning up, continue polling
            }
          }, 3000);
        }
      }
    };

    // Initial check
    checkServer();

    // Active Window In-Tab Keepalive:
    // If between 8:00 AM and 8:00 PM local time, ping every 10 minutes to maintain active instance
    const keepaliveInterval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 8 && currentHour < 20) {
        axios.get(`${healthUrl}/`, { timeout: 10000 }).catch(() => {});
      }
    }, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(keepaliveInterval);
    };
  }, [healthUrl]);

  if (!isWaking || isDismissed) return null;

  const estimatedTotalSeconds = 45;
  const progressPercent = Math.min(95, Math.round((elapsed / estimatedTotalSeconds) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 14, 23, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '28px 24px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'linear-gradient(135deg, rgba(26, 34, 52, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
          position: 'relative',
        }}
      >
        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Dismiss overlay"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          {/* Animated Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isReady
                ? 'rgba(16, 185, 129, 0.2)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
              border: isReady ? '1px solid #10b981' : '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              boxShadow: isReady ? '0 0 20px rgba(16, 185, 129, 0.4)' : '0 0 20px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.4s ease',
            }}
          >
            {isReady ? (
              <CheckCircle2 size={32} color="#10b981" />
            ) : (
              <Server size={30} color="var(--accent-gold)" className="animate-spin" style={{ animationDuration: '4s' }} />
            )}
          </div>

          {/* Heading & Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 10px', borderRadius: 'var(--radius-full)', marginBottom: '12px' }}>
            <Sparkles size={13} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.04em' }}>
              RENDER FREE-TIER SPINNING UP
            </span>
          </div>

          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>
            {isReady ? 'Connected to Cloud Server!' : 'Waking Up Resto-One Server'}
          </h2>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            {isReady
              ? 'Database and real-time services are operational. Loading dishes and orders now...'
              : 'Render free-tier instances sleep after 15 minutes of inactivity. This initial spin-up takes ~30–45s only on the first visit.'}
          </p>

          {/* Progress Bar & Timer */}
          {!isReady && (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 1s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Elapsed: {elapsed}s</span>
                <span>Auto-connecting...</span>
              </div>
            </div>
          )}

          {/* Status footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} className={!isReady ? 'animate-spin' : ''} />
            <span>{isReady ? 'Success! Redirecting...' : 'Pinging backend health endpoint...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
