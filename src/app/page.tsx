'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  Vote as VoteIcon,
  Trophy,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trash2,
  X,
  HelpCircle,
  Database,
  Star,
  Globe,
  RefreshCw,
  LogOut,
  Lock,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { User, Suggestion, VotingSession, LeaderboardItem, Comment } from '@/lib/types';

export default function HomePage() {
  // Auth State
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // App Data State
  const [users, setUsers] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [dbStatus, setDbStatus] = useState<{
    type: string;
    connected: boolean;
    connectionString: string;
    instructions: string;
  } | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'suggestions' | 'leaderboard' | 'guide'>('suggestions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState<Suggestion | null>(null);
  const [showDbGuideModal, setShowDbGuideModal] = useState(false);

  // Form State: Add Suggestion
  const [newSugName, setNewSugName] = useState('');
  const [newSugMeaning, setNewSugMeaning] = useState('');
  const [newSugTagline, setNewSugTagline] = useState('');
  const [newSugTags, setNewSugTags] = useState('');
  const [newSugDomain, setNewSugDomain] = useState<'available' | 'taken' | 'unknown'>('available');
  const [submittingSug, setSubmittingSug] = useState(false);

  // Form State: Start Session
  const [newSessionTitle, setNewSessionTitle] = useState('1. Tur İsim Oylaması');
  const [newSessionDesc, setNewSessionDesc] = useState('Tüm isim önerilerini 1-10 puanlayarak finale kalacak ismi seçiyoruz.');
  const [submittingSession, setSubmittingSession] = useState(false);

  // Form State: Voting Ballot
  const [ballotScores, setBallotScores] = useState<Record<string, { score: number; note: string }>>({});
  const [submittingVotes, setSubmittingVotes] = useState(false);

  // Form State: Comments
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Check auth on load
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setAuthenticatedUser(data.user);
      } else {
        // Check localStorage fallback if cookie is unavailable
        const stored = localStorage.getItem('isim_auth_user');
        if (stored) {
          try {
            setAuthenticatedUser(JSON.parse(stored));
          } catch {
            setAuthenticatedUser(null);
          }
        }
      }
    } catch (e) {
      console.error('Auth check error:', e);
    } finally {
      setAuthChecking(false);
    }
  };

  // Fetch app data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [usersRes, sugsRes, sessionsRes, dbRes] = await Promise.all([
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/suggestions').then((r) => r.json()),
        fetch('/api/sessions').then((r) => r.json()),
        fetch('/api/db-status').then((r) => r.json()),
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (sugsRes.success) setSuggestions(sugsRes.suggestions);
      if (dbRes.success) setDbStatus(dbRes.status);

      if (sessionsRes.success) {
        setActiveSession(sessionsRes.activeSession);
        if (sessionsRes.activeSession) {
          const lbRes = await fetch(`/api/sessions/${sessionsRes.activeSession.id}`).then((r) => r.json());
          if (lbRes.success) setLeaderboard(lbRes.leaderboard);
        } else if (sessionsRes.sessions.length > 0) {
          const lbRes = await fetch(`/api/sessions/${sessionsRes.sessions[0].id}`).then((r) => r.json());
          if (lbRes.success) setLeaderboard(lbRes.leaderboard);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  // Handle Login Submit
  const handleLogin = async (e?: React.FormEvent, directUsername?: string, directPassword?: string) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    const uName = directUsername || loginUsername;
    const uPass = directPassword || loginPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uName, password: uPass }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setAuthenticatedUser(data.user);
        localStorage.setItem('isim_auth_user', JSON.stringify(data.user));
        fetchData();
      } else {
        setLoginError(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Bağlantı hatası oluştu.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Quick select user on Login Screen
  const handleQuickLogin = (uname: string) => {
    setLoginUsername(uname);
    setLoginPassword('12345678');
    handleLogin(undefined, uname, '12345678');
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('isim_auth_user');
    setAuthenticatedUser(null);
    setLoginUsername('');
    setLoginPassword('');
  };

  // Filtered Suggestions
  const allTags = useMemo(() => {
    const set = new Set<string>();
    suggestions.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [suggestions]);

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tagline && s.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.created_by_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = selectedTag === 'all' || (s.tags && s.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [suggestions, searchQuery, selectedTag]);

  // Handle Confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#EAB308', '#FFFFFF'],
      });
    } catch (e) {
      console.log(e);
    }
  };

  // Add Suggestion Submit
  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedUser || !newSugName.trim() || !newSugMeaning.trim()) return;

    try {
      setSubmittingSug(true);
      const tagsArray = newSugTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSugName.trim(),
          meaning: newSugMeaning.trim(),
          tagline: newSugTagline.trim(),
          domain_status: newSugDomain,
          tags: tagsArray,
          created_by_id: authenticatedUser.id,
          created_by_name: authenticatedUser.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuggestions([data.suggestion, ...suggestions]);
        setShowAddModal(false);
        setNewSugName('');
        setNewSugMeaning('');
        setNewSugTagline('');
        setNewSugTags('');
      } else {
        alert(data.error || 'Öneri eklenirken hata oluştu.');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata meydana geldi.');
    } finally {
      setSubmittingSug(false);
    }
  };

  // Delete Suggestion
  const handleDeleteSuggestion = async (id: string, name: string) => {
    if (!confirm(`"${name}" isim önerisini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuggestions(suggestions.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start Voting Session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedUser || !newSessionTitle.trim()) return;

    try {
      setSubmittingSession(true);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSessionTitle.trim(),
          description: newSessionDesc.trim(),
          created_by_id: authenticatedUser.id,
          created_by_name: authenticatedUser.name,
          max_score: 10,
          included_suggestion_ids: suggestions.map((s) => s.id),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        setShowStartSessionModal(false);
        setActiveTab('leaderboard');
        triggerConfetti();
        fetchData();
      } else {
        alert(data.error || 'Oylama başlatılamadı.');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata meydana geldi.');
    } finally {
      setSubmittingSession(false);
    }
  };

  // Complete Session
  const handleCompleteSession = async () => {
    if (!activeSession) return;
    if (!confirm(`"${activeSession.title}" oylamasını tamamlamak ve sıralamayı netleştirmek istiyor musunuz?`)) return;

    try {
      const res = await fetch(`/api/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success) {
        setActiveSession(null);
        setLeaderboard(data.leaderboard);
        setActiveTab('leaderboard');
        triggerConfetti();
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Vote Modal
  const openVoteModal = () => {
    if (!activeSession) return;
    const initial: Record<string, { score: number; note: string }> = {};
    suggestions.forEach((s) => {
      initial[s.id] = ballotScores[s.id] || { score: 8, note: '' };
    });
    setBallotScores(initial);
    setShowVoteModal(true);
  };

  // Submit Votes
  const handleSubmitVotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !authenticatedUser) return;

    try {
      setSubmittingVotes(true);
      const votesPayload = Object.entries(ballotScores).map(([suggestion_id, val]) => ({
        suggestion_id,
        score: val.score,
        note: val.note,
      }));

      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.id,
          user_id: authenticatedUser.id,
          user_name: authenticatedUser.name,
          votes: votesPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowVoteModal(false);
        triggerConfetti();
        fetchData();
      } else {
        alert(data.error || 'Oylar gönderilemedi.');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata meydana geldi.');
    } finally {
      setSubmittingVotes(false);
    }
  };

  // Comments
  const openComments = async (sug: Suggestion) => {
    setShowCommentsModal(sug);
    try {
      const res = await fetch(`/api/comments?suggestion_id=${sug.id}`).then((r) => r.json());
      if (res.success) {
        setCommentsList(res.comments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCommentsModal || !authenticatedUser || !newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_id: showCommentsModal.id,
          user_id: authenticatedUser.id,
          user_name: authenticatedUser.name,
          text: newCommentText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCommentsList([...commentsList, data.comment]);
        setNewCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const hasAuthenticatedUserVoted = useMemo(() => {
    if (!activeSession || !authenticatedUser) return false;
    return activeSession.user_voted_ids?.includes(authenticatedUser.id) || false;
  }, [activeSession, authenticatedUser]);

  // Top 3 for Podium
  const podiumTop3 = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  // Loading Screen while verifying session
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Yükleniyor...</div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: AUTHENTICATION / LOGIN SCREEN
  // ==========================================
  if (!authenticatedUser) {
    return (
      <div className="login-screen-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">IP</div>
            <h1 className="login-title">Proje İsim Oylama</h1>
            <p className="login-subtitle">
              Yeni proje ismi belirleme ve oylama platformu
            </p>
          </div>

          {/* Quick Select for the 3 partners */}
          <div className="quick-users-label">Hızlı Kullanıcı Seçimi (3 Ortak)</div>
          <div className="quick-users-grid">
            <button
              type="button"
              id="quick-login-gokhan"
              onClick={() => handleQuickLogin('gökhan')}
              className={`quick-user-btn ${loginUsername.toLowerCase() === 'gökhan' ? 'active' : ''}`}
            >
              <div className="quick-user-avatar" style={{ background: '#2563EB' }}>G</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Gökhan</span>
            </button>

            <button
              type="button"
              id="quick-login-alperen"
              onClick={() => handleQuickLogin('alperen')}
              className={`quick-user-btn ${loginUsername.toLowerCase() === 'alperen' ? 'active' : ''}`}
            >
              <div className="quick-user-avatar" style={{ background: '#10B981' }}>A</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Alperen</span>
            </button>

            <button
              type="button"
              id="quick-login-cagatay"
              onClick={() => handleQuickLogin('çağatay')}
              className={`quick-user-btn ${loginUsername.toLowerCase() === 'çağatay' ? 'active' : ''}`}
            >
              <div className="quick-user-avatar" style={{ background: '#D97706' }}>Ç</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Çağatay</span>
            </button>
          </div>

          {loginError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              {loginError}
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleLogin}>
            <div className="field-group">
              <label className="field-label" htmlFor="username-input">
                Kullanıcı Adı
              </label>
              <input
                id="username-input"
                type="text"
                required
                placeholder="gökhan, alperen veya çağatay"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="field-input"
                autoFocus
              />
            </div>

            <div className="field-group" style={{ marginBottom: '1.5rem' }}>
              <label className="field-label" htmlFor="password-input">
                Şifre
              </label>
              <input
                id="password-input"
                type="password"
                required
                placeholder="12345678"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="field-input"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loggingIn}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {loggingIn ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              textAlign: 'center',
            }}
          >
            3 ortak da eşit yetkilerle isim önerebilir ve oylama başlatabilir.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED MAIN APPLICATION
  // ==========================================
  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header" id="main-header">
        <div className="header-container">
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-badge">IP</div>
            <div>
              <h1 className="brand-title">İsim Portalı</h1>
              <p className="brand-subtitle">Yeni Proje İsim Önerileri & Oylama</p>
            </div>
          </div>

          {/* User Session & Header Actions */}
          <div className="user-session-bar">
            {/* Database indicator */}
            <button
              id="db-status-btn"
              onClick={() => setShowDbGuideModal(true)}
              className="btn btn-outline btn-sm"
              title="Veritabanı Durumu"
            >
              <Database size={13} color={dbStatus?.type === 'postgres' ? '#10B981' : '#EAB308'} />
              <span>{dbStatus?.type === 'postgres' ? 'Postgres' : 'Yerel DB'}</span>
            </button>

            {/* Authenticated user chip */}
            <div className="current-user-chip" id="user-profile-chip">
              <div
                className="user-avatar-circle"
                style={{ background: authenticatedUser.color || '#2563EB' }}
              >
                {authenticatedUser.avatar || authenticatedUser.name.charAt(0)}
              </div>
              <span className="user-display-name">{authenticatedUser.name}</span>
            </div>

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Çıkış Yap"
            >
              <LogOut size={13} />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-container">
        {/* Active Voting Banner (Clean & Non-cheesy) */}
        {activeSession ? (
          <section className="voting-banner" id="active-voting-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(37, 99, 235, 0.15)',
                    color: '#93C5FD',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                  }}
                >
                  Aktif Oylama
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Başlatan: {activeSession.created_by_name}
                </span>
              </div>
              <h2 className="voting-banner-title">{activeSession.title}</h2>
              <p className="voting-banner-desc">{activeSession.description}</p>

              {/* Voter status badges for the 3 partners */}
              <div className="voting-participants-row">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Katılım ({activeSession.total_participants_voted || 0}/3):
                </span>
                {users.map((u) => {
                  const hasVoted = activeSession.user_voted_ids?.includes(u.id);
                  return (
                    <span
                      key={u.id}
                      className={`participant-pill ${hasVoted ? 'voted' : 'pending'}`}
                    >
                      {hasVoted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      <span>{u.name}</span>
                      <span>{hasVoted ? 'Oy Kullandı' : 'Bekleniyor'}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Voting Actions */}
            <div className="voting-banner-actions">
              <button
                id="open-ballot-btn"
                onClick={openVoteModal}
                className="btn btn-primary"
              >
                <Star size={15} />
                <span>{hasAuthenticatedUserVoted ? 'Oylarımı Düzenle' : 'Oyumu Kullan (1-10 Puan)'}</span>
              </button>

              <button
                id="finish-session-btn"
                onClick={handleCompleteSession}
                className="btn btn-secondary"
                title="Oylamayı tamamlar ve kazananı netleştirir"
              >
                <span>Oylamayı Tamamla</span>
              </button>
            </div>
          </section>
        ) : (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem 1.5rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>
                Şu anda aktif bir oylama turu yok
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                3 ortaktan herhangi biri yeni bir tur başlatarak puanlamayı açabilir.
              </div>
            </div>

            <button
              id="start-voting-banner-btn"
              onClick={() => setShowStartSessionModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <VoteIcon size={14} />
              <span>Oylama Başlat</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <div className="nav-tabs-left">
            <button
              id="tab-suggestions"
              onClick={() => setActiveTab('suggestions')}
              className={`nav-tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
            >
              <span>İsim Önerileri</span>
              <span className="counter-badge">{suggestions.length}</span>
            </button>

            <button
              id="tab-leaderboard"
              onClick={() => setActiveTab('leaderboard')}
              className={`nav-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            >
              <span>Sonuçlar & Sıralama</span>
            </button>

            <button
              id="tab-guide"
              onClick={() => setActiveTab('guide')}
              className={`nav-tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            >
              <span>Vercel & Kurulum Rehberi</span>
            </button>
          </div>

          <div className="nav-tabs-actions">
            <button
              id="add-sug-btn"
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>Yeni İsim Öner</span>
            </button>

            <button
              id="refresh-btn"
              onClick={fetchData}
              disabled={refreshing}
              className="btn btn-outline btn-sm"
              title="Yenile"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* TAB 1: SUGGESTIONS */}
        {activeTab === 'suggestions' && (
          <section id="suggestions-tab-content">
            <div className="search-filter-row">
              <div className="search-box">
                <Search size={14} className="search-icon-inside" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="İsim, anlam veya öneren kişi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-tags-scroll">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`filter-chip-btn ${selectedTag === 'all' ? 'active' : ''}`}
                >
                  Tümü ({suggestions.length})
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`filter-chip-btn ${selectedTag === t ? 'active' : ''}`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {filteredSuggestions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Kriterlere uygun öneri bulunamadı.
                </p>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
                  Yeni İsim Ekle
                </button>
              </div>
            ) : (
              <div className="cards-grid">
                {filteredSuggestions.map((sug) => (
                  <div key={sug.id} className="clean-card" id={`card-${sug.id}`}>
                    <div>
                      <div className="card-header-row">
                        <div>
                          <h3 className="name-heading">{sug.name}</h3>
                          {sug.tagline && <p className="tagline-text">&ldquo;{sug.tagline}&rdquo;</p>}
                        </div>

                        <span
                          className={`status-badge ${
                            sug.domain_status === 'available' ? 'status-available' : ''
                          }`}
                        >
                          {sug.domain_status === 'available' ? '.com Müsait' : 'Alan Adı'}
                        </span>
                      </div>

                      {/* Meaning description */}
                      <div className="meaning-block" style={{ marginTop: '0.85rem' }}>
                        <div className="meaning-title">Ne Anlama Geliyor?</div>
                        <p className="meaning-desc">{sug.meaning}</p>
                      </div>

                      {sug.tags && sug.tags.length > 0 && (
                        <div className="card-tags">
                          {sug.tags.map((t) => (
                            <span key={t} className="clean-tag">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card-meta-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <UserIcon size={13} color="var(--text-dim)" />
                        <span>{sug.created_by_name}</span>
                        <span style={{ color: 'var(--text-dim)' }}>·</span>
                        <span style={{ color: 'var(--text-dim)' }}>
                          {new Date(sug.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => openComments(sug)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <MessageSquare size={12} />
                          <span>Yorum</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSuggestion(sug.id, sug.name)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="Öneriyi Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: LEADERBOARD & RESULTS */}
        {activeTab === 'leaderboard' && (
          <section id="leaderboard-tab-content">
            {leaderboard.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <Trophy size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Henüz bir oylama sonucu kaydedilmedi
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Üst kısımdan &ldquo;Oylama Başlat&rdquo; diyerek 3 ortağın katılacağı ilk oylama turunu başlatabilirsiniz.
                </p>
                <button
                  onClick={() => setShowStartSessionModal(true)}
                  className="btn btn-primary btn-sm"
                >
                  Oylama Başlat
                </button>
              </div>
            ) : (
              <div>
                {/* Clean Top 3 Podium */}
                <div className="clean-podium">
                  {/* Rank 2 */}
                  {podiumTop3[1] && (
                    <div className="podium-card">
                      <div>
                        <div className="podium-rank-tag" style={{ color: 'var(--silver)' }}>
                          2. Sırada
                        </div>
                        <h4 className="podium-name-text">{podiumTop3[1].suggestion.name}</h4>
                        <div className="podium-points">{podiumTop3[1].total_score} Puan</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Ortalama: {podiumTop3[1].average_score} / 10 ({podiumTop3[1].vote_count} oy)
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
                        {podiumTop3[1].suggestion.meaning.substring(0, 70)}...
                      </p>
                    </div>
                  )}

                  {/* Rank 1 (Leader) */}
                  {podiumTop3[0] && (
                    <div className="podium-card rank-1">
                      <div>
                        <div className="podium-rank-tag" style={{ color: 'var(--gold)' }}>
                          ★ 1. Lider İsim ★
                        </div>
                        <h3 className="podium-name-text" style={{ fontSize: '1.5rem' }}>
                          {podiumTop3[0].suggestion.name}
                        </h3>
                        <div className="podium-points" style={{ color: 'var(--gold)', fontSize: '1.3rem' }}>
                          {podiumTop3[0].total_score} Puan
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Ortalama: {podiumTop3[0].average_score} / 10 ({podiumTop3[0].vote_count} oy)
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.45 }}>
                        {podiumTop3[0].suggestion.meaning.substring(0, 90)}...
                      </p>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {podiumTop3[2] && (
                    <div className="podium-card">
                      <div>
                        <div className="podium-rank-tag" style={{ color: 'var(--bronze)' }}>
                          3. Sırada
                        </div>
                        <h4 className="podium-name-text">{podiumTop3[2].suggestion.name}</h4>
                        <div className="podium-points">{podiumTop3[2].total_score} Puan</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Ortalama: {podiumTop3[2].average_score} / 10 ({podiumTop3[2].vote_count} oy)
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
                        {podiumTop3[2].suggestion.meaning.substring(0, 70)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Complete Table */}
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#FFFFFF' }}>
                  Puan Detayları ve Ortakların Oyları
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {leaderboard.map((item) => (
                    <div key={item.suggestion.id} className="leaderboard-row-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: item.rank === 1 ? 'var(--gold)' : 'var(--text-muted)',
                            width: '20px',
                            flexShrink: 0,
                          }}
                        >
                          #{item.rank}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', wordBreak: 'break-word' }}>
                            {item.suggestion.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                            {item.suggestion.meaning.substring(0, 80)}...
                          </div>
                        </div>
                      </div>

                      <div className="leaderboard-right-meta">
                        {/* Break down per voter */}
                        <div className="leaderboard-voters-wrap">
                          {item.voters.map((v) => (
                            <span
                              key={v.user_id}
                              style={{
                                fontSize: '0.72rem',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-subtle)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-xs)',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                              }}
                              title={v.note ? `${v.user_name} notu: "${v.note}"` : `${v.user_name} puanı: ${v.score}`}
                            >
                              <strong>{v.user_name}:</strong> {v.score}/10
                            </span>
                          ))}
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '70px', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>
                            {item.total_score} Puan
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            Ort: {item.average_score} ({item.vote_count} oy)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: GUIDE & VERCEL */}
        {activeTab === 'guide' && (
          <section id="guide-tab-content">
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                3 Kullanıcı & Giriş Bilgileri
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Sistemde tanımlı 3 eşit ortak kullanıcı bulunmaktadır:
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>Gökhan</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Kullanıcı Adı: <code style={{ color: '#93C5FD' }}>gökhan</code>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Şifre: <code style={{ color: '#93C5FD' }}>12345678</code>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>Alperen</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Kullanıcı Adı: <code style={{ color: '#93C5FD' }}>alperen</code>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Şifre: <code style={{ color: '#93C5FD' }}>12345678</code>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>Çağatay</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Kullanıcı Adı: <code style={{ color: '#93C5FD' }}>çağatay</code>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Şifre: <code style={{ color: '#93C5FD' }}>12345678</code>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
                  Vercel & PostgreSQL Dağıtım Rehberi
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                  Vercel Dashboard üzerinde projenize <strong>Vercel Postgres (Neon)</strong> bağlayabilir veya harici veritabanınızı ekleyebilirsiniz:
                </p>
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#93C5FD',
                    overflowX: 'auto',
                  }}
                >
                  DATABASE_URL=&quot;postgres://kullanici:sifre@host:port/veritabani?sslmode=require&quot;
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: ADD SUGGESTION */}
      {showAddModal && (
        <div className="modal-backdrop" id="add-modal">
          <div className="modal-box">
            <div className="modal-title-row">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                Yeni İsim Önerisi Ekle
              </h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-outline btn-sm">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddSuggestion}>
              <div className="field-group">
                <label className="field-label" htmlFor="input-name">
                  Proje / Marka İsmi *
                </label>
                <input
                  id="input-name"
                  type="text"
                  required
                  placeholder="Örn: Vera, Pusula, Zemin..."
                  value={newSugName}
                  onChange={(e) => setNewSugName(e.target.value)}
                  className="field-input"
                  autoFocus
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="input-meaning">
                  Ne Anlama Geliyor? (Açıklama / Köken) *
                </label>
                <textarea
                  id="input-meaning"
                  required
                  rows={4}
                  placeholder="Kelimenin anlamı, kökeni ve projenin vizyonuyla uyumu..."
                  value={newSugMeaning}
                  onChange={(e) => setNewSugMeaning(e.target.value)}
                  className="field-textarea"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="input-tagline">
                  Slogan / Kısa Açıklama (İsteğe Bağlı)
                </label>
                <input
                  id="input-tagline"
                  type="text"
                  placeholder="Örn: Doğru ve sağlam temeller üzerinde"
                  value={newSugTagline}
                  onChange={(e) => setNewSugTagline(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="input-tags">
                  Etiketler (Virgülle ayırın)
                </label>
                <input
                  id="input-tags"
                  type="text"
                  placeholder="Türkçe, Minimal, Evrensel, Kurumsal"
                  value={newSugTags}
                  onChange={(e) => setNewSugTags(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="input-domain">
                  Alan Adı (.com) Durumu
                </label>
                <select
                  id="input-domain"
                  value={newSugDomain}
                  onChange={(e) => setNewSugDomain(e.target.value as any)}
                  className="field-select"
                >
                  <option value="available">Müsait / Satın Alınabilir</option>
                  <option value="unknown">Henüz Kontrol Edilmedi</option>
                  <option value="taken">Dolu / Alternatif Gerekir</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">
                  Vazgeç
                </button>
                <button type="submit" disabled={submittingSug} className="btn btn-primary">
                  {submittingSug ? 'Kaydediliyor...' : 'Öneriyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: START VOTING */}
      {showStartSessionModal && (
        <div className="modal-backdrop" id="start-session-modal">
          <div className="modal-box">
            <div className="modal-title-row">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                Yeni Oylama Turu Başlat
              </h3>
              <button onClick={() => setShowStartSessionModal(false)} className="btn btn-outline btn-sm">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleStartSession}>
              <div className="field-group">
                <label className="field-label" htmlFor="session-title">
                  Oylama Başlığı *
                </label>
                <input
                  id="session-title"
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="session-desc">
                  Oylama Açıklaması
                </label>
                <textarea
                  id="session-desc"
                  rows={2}
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                  className="field-textarea"
                />
              </div>

              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1.25rem',
                }}
              >
                Sistemdeki tüm <strong>{suggestions.length}</strong> isim önerisi oylamaya dahil edilecektir. 3 ortak da 1-10 arası puan verecektir.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowStartSessionModal(false)} className="btn btn-outline">
                  İptal
                </button>
                <button type="submit" disabled={submittingSession} className="btn btn-primary">
                  {submittingSession ? 'Başlatılıyor...' : 'Oylamayı Başlat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VOTING BALLOT (1-10 SCORE) */}
      {showVoteModal && activeSession && (
        <div className="modal-backdrop" id="ballot-modal">
          <div className="modal-box" style={{ maxWidth: '680px' }}>
            <div className="modal-title-row">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Oy Kullan (1 - 10 Puan)
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Oy veren: <strong style={{ color: '#FFFFFF' }}>{authenticatedUser.name}</strong>
                </p>
              </div>
              <button onClick={() => setShowVoteModal(false)} className="btn btn-outline btn-sm">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitVotes}>
              <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
                {suggestions.map((sug, index) => {
                  const currentScore = ballotScores[sug.id]?.score ?? 8;
                  const currentNote = ballotScores[sug.id]?.note ?? '';

                  return (
                    <div
                      key={sug.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF' }}>
                          #{index + 1} {sug.name}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Öneren: {sug.created_by_name}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                        {sug.meaning}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Puanınız:
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {currentScore} / 10
                        </span>
                      </div>

                      <div className="score-pill-row">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() =>
                              setBallotScores({
                                ...ballotScores,
                                [sug.id]: { score, note: currentNote },
                              })
                            }
                            className={`score-pill ${currentScore === score ? 'active' : ''}`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="İsteğe bağlı görüş veya eleştiri notu..."
                        value={currentNote}
                        onChange={(e) =>
                          setBallotScores({
                            ...ballotScores,
                            [sug.id]: { score: currentScore, note: e.target.value },
                          })
                        }
                        className="field-input"
                        style={{ marginTop: '0.5rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowVoteModal(false)} className="btn btn-outline">
                  İptal
                </button>
                <button type="submit" disabled={submittingVotes} className="btn btn-primary">
                  {submittingVotes ? 'Kaydediliyor...' : 'Oylarımı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: COMMENTS */}
      {showCommentsModal && (
        <div className="modal-backdrop" id="comments-modal">
          <div className="modal-box">
            <div className="modal-title-row">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                  &ldquo;{showCommentsModal.name}&rdquo; Görüşleri
                </h3>
              </div>
              <button onClick={() => setShowCommentsModal(null)} className="btn btn-outline btn-sm">
                <X size={14} />
              </button>
            </div>

            <div style={{ maxHeight: '35vh', overflowY: 'auto', marginBottom: '1rem' }}>
              {commentsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Henüz yorum yapılmadı. İlk düşüncenizi paylaşın.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {commentsList.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#FFFFFF' }}>{c.user_name}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <div className="field-group">
                <input
                  type="text"
                  required
                  placeholder={`${authenticatedUser.name} olarak yorum yazın...`}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="field-input"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowCommentsModal(null)} className="btn btn-outline btn-sm">
                  Kapat
                </button>
                <button type="submit" disabled={submittingComment} className="btn btn-primary btn-sm">
                  {submittingComment ? 'Gönderiliyor...' : 'Yorum Yaz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DB STATUS */}
      {showDbGuideModal && (
        <div className="modal-backdrop" id="db-guide-modal">
          <div className="modal-box">
            <div className="modal-title-row">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                Veritabanı Durumu
              </h3>
              <button onClick={() => setShowDbGuideModal(false)} className="btn btn-outline btn-sm">
                <X size={14} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aktif Motor:</span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: dbStatus?.type === 'postgres' ? '#34D399' : '#FBBF24',
                    }}
                  >
                    {dbStatus?.type === 'postgres' ? 'PostgreSQL (Vercel / Neon)' : 'Yerel Veritabanı (.data/db.json)'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Vercel ortamında kalıcı veritabanı için projenize <strong>Vercel Postgres (Neon)</strong> bağlayabilir veya <code style={{ color: '#93C5FD' }}>DATABASE_URL</code> ortam değişkenini tanımlayabilirsiniz.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDbGuideModal(false)} className="btn btn-primary btn-sm">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
