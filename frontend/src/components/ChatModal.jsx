import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from 'lucide-react';
import { chatApi } from '../api';
import { useSessionStore } from '../store/useSessionStore';
import { DishCard } from './DishCard';

const QUICK_PROMPTS = [
  'Something spicy but not too heavy 🌶️',
  'Chef special signature main course 🥘',
  'Decadent dessert to finish 🍰',
  'Refreshing drink pairing 🍹',
];

export function ChatModal({ isOpen, onClose }) {
  const { sessionToken, initSession, tableNo } = useSessionStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const loadChat = async () => {
    setIsLoadingHistory(true);
    try {
      if (!sessionToken) {
        await initSession(tableNo);
      }
      const res = await chatApi.getHistory();
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text || !text.trim() || isSending) return;

    const userMessageText = text.trim();
    setInputText('');

    // Optimistically append user message
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      message: userMessageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await chatApi.sendMessage(userMessageText);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          message: "I'm having a little trouble connecting to the chef's kitchen right now. Please try again!",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          height: '680px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#0d1322',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0a0e17',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                AI Culinary Concierge
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--accent-gold)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                  }}
                >
                  Groq 120B
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Personalized dishes curated for your palate
              </div>
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
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Feed */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
              <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '0.88rem' }}>Summoning your dining concierge...</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '10px',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--accent-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.2) 100%)'
                        : 'var(--bg-surface-elevated)',
                      border: isUser
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      borderTopRightRadius: isUser ? 2 : 'var(--radius-md)',
                      borderTopLeftRadius: !isUser ? 2 : 'var(--radius-md)',
                      padding: '12px 16px',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>{msg.message}</div>

                    {/* Render Interactive Dish Recommendation Card */}
                    {msg.dish_recommendation && (
                      <DishCard dish={msg.dish_recommendation} compact={true} />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                alignSelf: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <span>Curating recommendation</span>
                <span className="pulse-glow">...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            background: 'rgba(10, 14, 23, 0.6)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '14px 16px',
            background: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tell me what you feel like having..."
            disabled={isSending}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '10px 14px',
              fontSize: '0.92rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="btn btn-primary"
            style={{ padding: '10px 16px' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
