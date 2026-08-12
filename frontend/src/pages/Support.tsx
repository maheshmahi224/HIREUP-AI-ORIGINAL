import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Shell } from '../components/Shell.js';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  ticketCreated?: { ticketId: string; subject: string; status: string };
  time: string;
}

interface Ticket {
  ticketId: string;
  subject: string;
  message: string;
  aiResponse?: string;
  status: 'open' | 'in-progress' | 'resolved';
  adminNotes?: string;
  createdAt: string;
}

export function Support() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: '👋 Hello! I am HireUp AI’s 24/7 Smart Support Assistant. How can I help you with your resumes, orders, or downloads today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');

  // Manual ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // Fetch user tickets
  const ticketsQuery = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => api<{ tickets: Ticket[] }>('/support/tickets'),
  });

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setSending(true);

    try {
      const res = await api<{ response: string; ticketCreated?: any }>('/support/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.response || 'I have recorded your request. Our support team will assist you shortly.',
        ticketCreated: res.ticketCreated,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (res.ticketCreated) {
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'I had trouble connecting to support servers, but I have logged a support ticket for our Admin team to inspect.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleManualTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg || submittingTicket) return;

    setSubmittingTicket(true);
    setTicketSuccess(null);
    try {
      const res = await api<{ ticket: Ticket }>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject: ticketSubject, message: ticketMsg }),
      });
      setTicketSuccess(`Ticket #${res.ticket.ticketId} submitted successfully!`);
      setTicketSubject('');
      setTicketMsg('');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch (err: any) {
      alert(err?.message || 'Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <Shell>
      <div className="v2-support-container">
        {/* Support Header */}
        <div className="v2-support-header">
          <div className="v2-support-badge">24/7 AI Support & Admin Escalation</div>
          <h1>HireUp Support & Help Center</h1>
          <p>Get instant answers about orders, payments, and PDF exports, or email us directly at <strong>support.hireupai@gmail.com</strong>.</p>
        </div>

        {/* Tab Navigation */}
        <div className="v2-support-tabs">
          <button
            type="button"
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            💬 Smart AI Support Chat
          </button>
          <button
            type="button"
            className={activeTab === 'tickets' ? 'active' : ''}
            onClick={() => setActiveTab('tickets')}
          >
            📋 My Support Tickets ({ticketsQuery.data?.tickets?.length || 0})
          </button>
        </div>

        {activeTab === 'chat' && (
          <div className="v2-chat-section">
            {/* Quick Question Chips */}
            <div className="v2-quick-chips">
              <span>Quick Help:</span>
              <button type="button" onClick={() => sendMessage('Where is my downloaded PDF?')}>
                📥 Download PDF Issue
              </button>
              <button type="button" onClick={() => sendMessage('Why is payment showing pending?')}>
                💳 Payment Status
              </button>
              <button type="button" onClick={() => sendMessage('I want to request a refund for order')}>
                💰 Refund Request
              </button>
              <button type="button" onClick={() => sendMessage('How does AI Resume Extractor work?')}>
                ⚡ AI Extractor Help
              </button>
            </div>

            {/* Chat Messages Box */}
            <div className="v2-chat-box">
              <div className="v2-chat-thread">
                {messages.map((m) => (
                  <div key={m.id} className={`v2-chat-msg-row ${m.sender}`}>
                    <div className="v2-chat-avatar">{m.sender === 'ai' ? '🤖' : '👤'}</div>
                    <div className="v2-chat-bubble">
                      <p>{m.text}</p>
                      {m.ticketCreated && (
                        <div className="v2-ticket-alert-badge">
                          <strong>🎟️ Ticket Created: #{m.ticketCreated.ticketId}</strong>
                          <p>Sent to Admin Panel for review.</p>
                        </div>
                      )}
                      <span className="v2-chat-time">{m.time}</span>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="v2-chat-msg-row ai">
                    <div className="v2-chat-avatar">🤖</div>
                    <div className="v2-chat-bubble typing">AI is typing...</div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form
                className="v2-chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <input
                  type="text"
                  placeholder="Ask a question or describe an issue..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button type="submit" disabled={sending || !inputMessage.trim()}>
                  Send ➔
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="v2-tickets-section">
            {/* Direct Ticket Submission Form */}
            <div className="v2-ticket-form-card">
              <h3>Submit a Support Ticket</h3>
              <p>Can’t resolve your issue with the bot? Submit a direct ticket to our Admin Support team.</p>

              {ticketSuccess && <div className="v2-ticket-success">{ticketSuccess}</div>}

              <form onSubmit={handleManualTicketSubmit}>
                <label className="v2-input-field">
                  <span>Subject</span>
                  <input
                    type="text"
                    placeholder="e.g. Payment verified but download button didn't trigger"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    required
                  />
                </label>
                <label className="v2-input-field" style={{ marginTop: 10 }}>
                  <span>Issue Description</span>
                  <textarea
                    rows={4}
                    placeholder="Provide details about your order ID, email, or issue..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="v2-btn-pink" style={{ marginTop: 12 }} disabled={submittingTicket}>
                  {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            {/* User Tickets List */}
            <div className="v2-tickets-list-card">
              <h3>My Submitted Tickets</h3>
              {ticketsQuery.isLoading ? (
                <p>Loading your tickets...</p>
              ) : !ticketsQuery.data?.tickets?.length ? (
                <p className="v2-empty-tickets">No support tickets submitted yet.</p>
              ) : (
                <div className="v2-tickets-grid">
                  {ticketsQuery.data.tickets.map((t) => (
                    <div key={t.ticketId} className="v2-ticket-item">
                      <div className="v2-ticket-item-top">
                        <strong>#{t.ticketId} — {t.subject}</strong>
                        <span className={`v2-status-pill ${t.status}`}>{t.status.toUpperCase()}</span>
                      </div>
                      <p className="v2-ticket-item-msg">{t.message}</p>

                      {t.aiResponse && (
                        <div className="v2-ticket-response-box">
                          <small>🤖 AI Note:</small>
                          <p>{t.aiResponse}</p>
                        </div>
                      )}

                      {t.adminNotes && (
                        <div className="v2-admin-response-box">
                          <small>👑 Admin Note:</small>
                          <p>{t.adminNotes}</p>
                        </div>
                      )}

                      <span className="v2-ticket-date">{new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
