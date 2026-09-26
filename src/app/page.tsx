'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Plus,
  Vote as VoteIcon,
  Trophy,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Trash2,
  X,
  HelpCircle,
  Database,
  ArrowRight,
  Edit3,
  Star,
  Globe,
  Share2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { User, Suggestion, VotingSession, LeaderboardItem, Comment } from '@/lib/types';

export default function HomePage() {
  // App State
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
  const [allSessions, setAllSessions] = useState<VotingSession[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState<Suggestion | null>(null);
  const [showDbGuideModal, setShowDbGuideModal] = useState(false);

  // Form State: New Suggestion
  const [newSugName, setNewSugName] = useState('');
  const [newSugMeaning, setNewSugMeaning] = useState('');
  const [newSugTagline, setNewSugTagline] = useState('');
  const [newSugTags, setNewSugTags] = useState('');
  const [newSugDomain, setNewSugDomain] = useState<'available' | 'taken' | 'unknown'>('available');
  const [submittingSug, setSubmittingSug] = useState(false);

  // Form State: New Voting Session
  const [newSessionTitle, setNewSessionTitle] = useState('1. Tur İsim Oylaması');
  const [newSessionDesc, setNewSessionDesc] = useState('Tüm öneriler arasından en uygun projeyi seçiyoruz.');
  const [submittingSession, setSubmittingSession] = useState(false);

  // Form State: User Votes
  // Map of suggestionId -> score (1-10) and note
  const [ballotScores, setBallotScores] = useState<Record<string, { score: number; note: string }>>({});
  const [submittingVotes, setSubmittingVotes] = useState(false);

  // Form State: User Profile Edit
  const [editUserName, setEditUserName] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [submittingUserEdit, setSubmittingUserEdit] = useState(false);

  // Form State: Comments
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [usersRes, sugsRes, sessionsRes, dbRes] = await Promise.all([
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/suggestions').then((r) => r.json()),
        fetch('/api/sessions').then((r) => r.json()),
        fetch('/api/db-status').then((r) => r.json()),
      ]);

      if (usersRes.success && usersRes.users.length > 0) {
        setUsers(usersRes.users);
        if (!activeUser) {
          // Default to first user
          setActiveUser(usersRes.users[0]);
        } else {
          // Update active user reference
          const updatedActive = usersRes.users.find((u: User) => u.id === activeUser.id);
          if (updatedActive) setActiveUser(updatedActive);
        }
      }

      if (sugsRes.success) {
        setSuggestions(sugsRes.suggestions);
      }

      if (sessionsRes.success) {
        setAllSessions(sessionsRes.sessions);
        setActiveSession(sessionsRes.activeSession);

        // If there is an active session, fetch its current leaderboard
        if (sessionsRes.activeSession) {
          const lbRes = await fetch(`/api/sessions/${sessionsRes.activeSession.id}`).then((r) => r.json());
          if (lbRes.success) {
            setLeaderboard(lbRes.leaderboard);
          }
        } else if (sessionsRes.sessions.length > 0) {
          // Fetch last completed session's leaderboard
          const lbRes = await fetch(`/api/sessions/${sessionsRes.sessions[0].id}`).then((r) => r.json());
          if (lbRes.success) {
            setLeaderboard(lbRes.leaderboard);
          }
        }
      }

      if (dbRes.success) {
        setDbStatus(dbRes.status);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Handle Confetti on Winner
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'],
      });
    } catch (e) {
      console.log('Confetti trigger error:', e);
    }
  };

  // Switch Active User
  const handleUserSwitch = (user: User) => {
    setActiveUser(user);
  };

  // Add Suggestion Submit
  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !newSugName.trim() || !newSugMeaning.trim()) return;

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
          created_by_id: activeUser.id,
          created_by_name: activeUser.name,
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
    if (!activeUser || !newSessionTitle.trim()) return;

    try {
      setSubmittingSession(true);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSessionTitle.trim(),
          description: newSessionDesc.trim(),
          created_by_id: activeUser.id,
          created_by_name: activeUser.name,
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

  // Complete / Finalize Session
  const handleCompleteSession = async () => {
    if (!activeSession) return;
    if (!confirm(`"${activeSession.title}" oylamasını tamamlamak ve kazananı ilan etmek istiyor musunuz?`)) return;

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

  // Prepare Ballot & Open Vote Modal
  const openVoteModal = () => {
    if (!activeSession) return;
    // Pre-fill ballot scores if any
    const initial: Record<string, { score: number; note: string }> = {};
    suggestions.forEach((s) => {
      initial[s.id] = ballotScores[s.id] || { score: 7, note: '' };
    });
    setBallotScores(initial);
    setShowVoteModal(true);
  };

  // Submit User Votes
  const handleSubmitVotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !activeUser) return;

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
          user_id: activeUser.id,
          user_name: activeUser.name,
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

  // Open Edit User Modal
  const openEditUser = () => {
    if (!activeUser) return;
    setEditUserName(activeUser.name);
    setEditUserAvatar(activeUser.avatar);
    setShowEditUserModal(true);
  };

  // Submit User Profile Edit
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !editUserName.trim()) return;

    try {
      setSubmittingUserEdit(true);
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeUser.id,
          name: editUserName.trim(),
          avatar: editUserAvatar || '⚡',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveUser(data.user);
        setUsers(users.map((u) => (u.id === data.user.id ? data.user : u)));
        setShowEditUserModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingUserEdit(false);
    }
  };

  // Open Comments Modal
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

  // Submit Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCommentsModal || !activeUser || !newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_id: showCommentsModal.id,
          user_id: activeUser.id,
          user_name: activeUser.name,
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

  // Top 3 Podium Winners
  const podiumTop3 = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const hasActiveUserVoted = useMemo(() => {
    if (!activeSession || !activeUser) return false;
    return activeSession.user_voted_ids?.includes(activeUser.id) || false;
  }, [activeSession, activeUser]);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header" id="main-header">
        <div className="header-container">
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-icon">✨</div>
            <div className="brand-info">
              <h1>İsimBulucu</h1>
              <p>Yeni Proje İsim Önerisi & Oylama</p>
            </div>
          </div>

          {/* 3-User Switcher: Equal permissions */}
          <div className="user-switcher-container" id="user-switcher">
            <span className="user-pill-label">3 Ortak Kullanıcı</span>
            {users.map((u) => {
              const isActive = activeUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  id={`switch-user-${u.id}`}
                  onClick={() => handleUserSwitch(u)}
                  className={`user-pill-btn ${isActive ? 'active' : ''}`}
                  title={`${u.name} olarak işlem yap`}
                >
                  <span className="user-pill-avatar">{u.avatar}</span>
                  <span>{u.name}</span>
                </button>
              );
            })}
            <button
              id="edit-profile-btn"
              onClick={openEditUser}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.35rem 0.55rem', borderRadius: '999px', border: 'none' }}
              title="Profil İsmini Değiştir"
            >
              <Edit3 size={14} />
            </button>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Database status pill */}
            <button
              id="db-status-btn"
              onClick={() => setShowDbGuideModal(true)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.4rem' }}
            >
              <Database size={13} color={dbStatus?.type === 'postgres' ? '#10B981' : '#F59E0B'} />
              <span>{dbStatus?.type === 'postgres' ? 'Vercel Postgres' : 'Yerel Veritabanı'}</span>
            </button>

            <button
              id="add-suggestion-top-btn"
              onClick={() => setShowAddModal(true)}
              className="btn btn-gradient btn-sm"
            >
              <Plus size={16} />
              <span>İsim Öner</span>
            </button>

            <button
              id="start-voting-top-btn"
              onClick={() => setShowStartSessionModal(true)}
              className="btn btn-primary btn-sm"
            >
              <VoteIcon size={16} />
              <span>Oylama Başlat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-container">
        {/* Active Voting Hero Banner */}
        {activeSession ? (
          <section className="voting-hero" id="active-voting-hero">
            <div className="voting-hero-content">
              <div className="hero-left">
                <div className="live-badge">
                  <span className="live-dot"></span>
                  CANLI OYLAMA DEVAM EDİYOR
                </div>
                <h2 className="hero-title">{activeSession.title}</h2>
                <p className="hero-description">
                  {activeSession.description || '3 kullanıcı da puanlarını vererek en iyi proje ismini belirliyor.'}
                  {' · '}
                  <strong style={{ color: '#A5B4FC' }}>
                    Başlatan: {activeSession.created_by_name}
                  </strong>
                </p>

                {/* Voters status tracker */}
                <div className="hero-status-row">
                  <div className="voters-tracker">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Katılım ({activeSession.total_participants_voted || 0}/3):
                    </span>
                    {users.map((u) => {
                      const hasVoted = activeSession.user_voted_ids?.includes(u.id);
                      return (
                        <span
                          key={u.id}
                          className={`voter-status-badge ${hasVoted ? 'voted' : 'pending'}`}
                        >
                          {hasVoted ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{u.avatar} {u.name}</span>
                          <span>{hasVoted ? 'Oy Verdi' : 'Bekliyor'}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="hero-right-actions">
                <button
                  id="vote-now-btn"
                  onClick={openVoteModal}
                  className="btn btn-gradient"
                  style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }}
                >
                  <Star size={18} />
                  <span>{hasActiveUserVoted ? 'Oylarımı Güncelle' : 'Hemen Oyumu Ver'}</span>
                </button>

                <button
                  id="complete-session-btn"
                  onClick={handleCompleteSession}
                  className="btn btn-secondary"
                  title="Tüm 3 kullanıcı oy kullandıktan sonra kazananı ilan edebilirsiniz"
                >
                  <Trophy size={16} />
                  <span>Oylamayı Sonlandır</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div
            style={{
              background: 'rgba(14, 19, 31, 0.5)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-light)',
                }}
              >
                <VoteIcon size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Şu an aktif bir oylama oturumu yok
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  3 kullanıcıdan herhangi biri yeni bir oylama başlatabilir ve puanlama yapabilir.
                </p>
              </div>
            </div>

            <button
              id="start-session-inline-btn"
              onClick={() => setShowStartSessionModal(true)}
              className="btn btn-primary btn-sm"
            >
              <VoteIcon size={14} />
              <span>Yeni Oylama Başlat</span>
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="tabs-bar">
          <div className="tabs-nav">
            <button
              id="tab-suggestions-btn"
              onClick={() => setActiveTab('suggestions')}
              className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
            >
              <Sparkles size={16} />
              <span>Tüm İsim Önerileri</span>
              <span className="tab-count-badge">{suggestions.length}</span>
            </button>

            <button
              id="tab-leaderboard-btn"
              onClick={() => setActiveTab('leaderboard')}
              className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            >
              <Trophy size={16} />
              <span>Oylama & Sıralama</span>
            </button>

            <button
              id="tab-guide-btn"
              onClick={() => setActiveTab('guide')}
              className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            >
              <HelpCircle size={16} />
              <span>Nasıl Çalışır & Vercel Rehberi</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="refresh-data-btn"
              onClick={fetchData}
              disabled={refreshing}
              className="btn btn-outline btn-sm"
              title="Verileri Yenile"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Yenileniyor...' : 'Yenile'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SUGGESTIONS GRID */}
        {activeTab === 'suggestions' && (
          <section id="suggestions-section">
            {/* Filter and Search Bar */}
            <div className="filter-bar">
              <div className="search-input-box">
                <Search size={16} className="search-icon" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="İsim, anlam veya öneren kullanıcı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-pills">
                <button
                  id="filter-all-btn"
                  onClick={() => setSelectedTag('all')}
                  className={`filter-pill ${selectedTag === 'all' ? 'active' : ''}`}
                >
                  Tümü ({suggestions.length})
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    id={`filter-tag-${tag}`}
                    onClick={() => setSelectedTag(tag)}
                    className={`filter-pill ${selectedTag === tag ? 'active' : ''}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions Cards Grid */}
            {filteredSuggestions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 1rem',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💡</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Henüz aradığınız kriterde bir öneri bulunamadı.
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Hemen yeni bir proje isim önerisi ve anlamını ekleyerek başlayabilirsiniz.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-gradient"
                >
                  <Plus size={16} />
                  <span>İlk İsim Önerisini Ekle</span>
                </button>
              </div>
            ) : (
              <div className="suggestions-grid">
                {filteredSuggestions.map((sug) => (
                  <article key={sug.id} className="suggestion-card" id={`card-${sug.id}`}>
                    <div>
                      {/* Card Top */}
                      <div className="card-top">
                        <div className="suggestion-name-box">
                          <h3 className="suggestion-title">{sug.name}</h3>
                          {sug.tagline && <p className="suggestion-tagline">&ldquo;{sug.tagline}&rdquo;</p>}
                        </div>

                        <span
                          className={`domain-pill ${
                            sug.domain_status === 'available' ? 'domain-available' : 'domain-unknown'
                          }`}
                        >
                          <Globe size={11} />
                          {sug.domain_status === 'available' ? '.com Müsait' : 'Alan Adı'}
                        </span>
                      </div>

                      {/* Card Meaning Box */}
                      <div className="suggestion-meaning-box" style={{ marginTop: '1rem' }}>
                        <span className="meaning-label">
                          <Sparkles size={12} color="var(--primary-light)" />
                          Ne Anlama Geliyor?
                        </span>
                        <p className="meaning-text">{sug.meaning}</p>
                      </div>

                      {/* Tags List */}
                      {sug.tags && sug.tags.length > 0 && (
                        <div className="tags-list" style={{ marginTop: '0.9rem' }}>
                          {sug.tags.map((t) => (
                            <span key={t} className="tag-item">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer">
                      <div className="creator-info">
                        <span className="creator-avatar">👤</span>
                        <div>
                          <div className="creator-name">{sug.created_by_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {new Date(sug.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          id={`comment-btn-${sug.id}`}
                          onClick={() => openComments(sug)}
                          className="btn btn-outline btn-sm"
                          title="Görüş / Yorum Yaz"
                        >
                          <MessageSquare size={13} />
                          <span>Yorum</span>
                        </button>

                        <button
                          id={`delete-btn-${sug.id}`}
                          onClick={() => handleDeleteSuggestion(sug.id, sug.name)}
                          className="btn btn-danger btn-sm"
                          title="Öneriyi Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: LEADERBOARD & VOTING RESULTS */}
        {activeTab === 'leaderboard' && (
          <section id="leaderboard-section">
            {leaderboard.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 1rem',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <Trophy size={48} color="var(--gold)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Henüz bir oylama sonucu kaydedilmedi
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                  Yukarıdaki &ldquo;Oylama Başlat&rdquo; butonuna basarak 3 kullanıcının katılacağı yeni bir puanlama turu başlatabilirsiniz.
                </p>
                <button
                  onClick={() => setShowStartSessionModal(true)}
                  className="btn btn-gradient"
                >
                  <VoteIcon size={16} />
                  <span>İlk Oylama Turunu Başlat</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Winner Podium (Top 3) */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
                    🏆 Oylama Liderlik Tablosu
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {activeSession ? 'Canlı oylamada öne çıkan isimler' : 'Tamamlanan son oylama sonuçları'}
                  </p>
                </div>

                {podiumTop3.length > 0 && (
                  <div className="podium-container">
                    {/* Rank 2 (Silver) */}
                    {podiumTop3[1] && (
                      <div className="podium-column">
                        <div className="podium-rank-badge">🥈</div>
                        <div className="podium-box rank-2">
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--silver)', fontWeight: 700, textTransform: 'uppercase' }}>
                              2. Sırada
                            </span>
                            <h4 className="podium-name">{podiumTop3[1].suggestion.name}</h4>
                            <div className="podium-score">{podiumTop3[1].total_score} Puan</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Ortalama: {podiumTop3[1].average_score} / 10 ({podiumTop3[1].vote_count} oy)
                            </div>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                            {podiumTop3[1].suggestion.meaning.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rank 1 (Gold - Winner) */}
                    {podiumTop3[0] && (
                      <div className="podium-column">
                        <div className="podium-rank-badge">👑 🥇</div>
                        <div className="podium-box rank-1">
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✨ Lider İsim ✨
                            </span>
                            <h3 className="podium-name" style={{ fontSize: '1.6rem', color: '#FFFFFF' }}>
                              {podiumTop3[0].suggestion.name}
                            </h3>
                            <div className="podium-score" style={{ fontSize: '1.4rem' }}>
                              {podiumTop3[0].total_score} Puan
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              Ortalama: {podiumTop3[0].average_score} / 10 ({podiumTop3[0].vote_count} oy)
                            </div>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                            {podiumTop3[0].suggestion.meaning.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rank 3 (Bronze) */}
                    {podiumTop3[2] && (
                      <div className="podium-column">
                        <div className="podium-rank-badge">🥉</div>
                        <div className="podium-box rank-3">
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', fontWeight: 700, textTransform: 'uppercase' }}>
                              3. Sırada
                            </span>
                            <h4 className="podium-name">{podiumTop3[2].suggestion.name}</h4>
                            <div className="podium-score">{podiumTop3[2].total_score} Puan</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Ortalama: {podiumTop3[2].average_score} / 10 ({podiumTop3[2].vote_count} oy)
                            </div>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                            {podiumTop3[2].suggestion.meaning.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Complete Leaderboard List */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#FFFFFF' }}>
                  Detaylı Puan ve Kullanıcı Dökümü
                </h3>
                <div className="leaderboard-list">
                  {leaderboard.map((item) => (
                    <div key={item.suggestion.id} className="leaderboard-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="rank-indicator">{item.rank}</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                              {item.suggestion.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              Öneren: {item.suggestion.created_by_name}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', maxWidth: '600px' }}>
                            {item.suggestion.meaning}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'right' }}>
                        {/* Breakdown of voters */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {item.voters.map((v) => (
                            <span
                              key={v.user_id}
                              style={{
                                fontSize: '0.75rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--border-subtle)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                              }}
                              title={v.note ? `${v.user_name} notu: "${v.note}"` : `${v.user_name} puanı: ${v.score}`}
                            >
                              <strong>{v.user_name.split(' ')[0]}:</strong> {v.score}★
                            </span>
                          ))}
                        </div>

                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold)' }}>
                            {item.total_score} Puan
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
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

        {/* TAB 3: HOW IT WORKS & VERCEL GUIDE */}
        {activeTab === 'guide' && (
          <section id="guide-section">
            <div className="db-guide-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-light)',
                  }}
                >
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
                    3 Kullanıcılı Eşit Yetkili Oylama Mekanizması
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Tüm ortaklar aynı haklara sahiptir ve tam şeffaflıkla çalışır.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ color: '#A5B4FC', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> 1. İsim & Anlam Girişi
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    3 kullanıcı da istediği an yeni bir marka/proje ismi, ne anlama geldiği ve alan adı uygunluk notlarını sisteme kaydedebilir.
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ color: '#F472B6', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <VoteIcon size={16} /> 2. Oylama Başlatma
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Herhangi bir kullanıcı dilediği zaman &ldquo;Oylama Başlat&rdquo; diyerek aktif bir oylama oturumu açabilir.
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ color: '#34D399', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Trophy size={16} /> 3. 1-10 Puanlama & Podyum
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    3 kullanıcı da her isme 1 ile 10 arasında puan verir. Puanlar otomatik toplanır ve kazanan 1., 2. ve 3. podyuma çıkarılır.
                  </p>
                </div>
              </div>

              {/* Vercel Deployment Guide */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Database size={18} color="var(--primary-light)" />
                  Vercel&apos;de Yayına Alma ve Veritabanı (PostgreSQL) Kurulumu
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  Uygulamanız Vercel serverless ortamı için özel olarak hazırlanmıştır. Tablolar otomatik olarak oluşturulur (otomatik migration).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                      Adım 1: GitHub Deposunu Vercel&apos;e Bağlayın
                    </strong>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      vercel.com &gt; &ldquo;Add New Project&rdquo; &gt; GitHub deponuzu seçip Deploy&apos;a basın.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                      Adım 2: Vercel Postgres veya Neon Ekleyin
                    </strong>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Vercel Dashboard &gt; Projeniz &gt; <strong>Storage</strong> sekmesinden tek tıkla <strong>Postgres (Neon)</strong> oluşturun. Vercel otomatik olarak <code style={{ color: '#38BDF8' }}>POSTGRES_URL</code> değişkenini ekler!
                    </p>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Veya Supabase / Neon / Railway kullanıyorsanız, <strong>Settings &gt; Environment Variables</strong> kısmına şu değişkeni ekleyin:
                    </p>
                    <div className="code-snippet">DATABASE_URL=&quot;postgres://username:password@ep-host.region.neon.tech/neondb?sslmode=require&quot;</div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                      Adım 3: Sıfır Zahmetsiz Başlatma
                    </strong>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Herhangi bir SQL komutu çalıştırmanıza gerek yoktur. İlk ziyarette sistem otomatik olarak <code style={{ color: '#38BDF8' }}>users</code>, <code style={{ color: '#38BDF8' }}>suggestions</code>, <code style={{ color: '#38BDF8' }}>voting_sessions</code> ve <code style={{ color: '#38BDF8' }}>votes</code> tablolarını oluşturur ve 3 kullanıcıyı hazır eder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: ADD NEW SUGGESTION */}
      {showAddModal && (
        <div className="modal-overlay" id="add-suggestion-modal">
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Yeni İsim Önerisi Ekle</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Öneren: <strong style={{ color: '#FFFFFF' }}>{activeUser?.name}</strong>
                </p>
              </div>
              <button
                id="close-add-modal"
                onClick={() => setShowAddModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSuggestion}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-sug-name">
                  Proje / Marka İsmi *
                </label>
                <input
                  id="input-sug-name"
                  type="text"
                  required
                  placeholder="Örn: NovaForge, Lumivex, Pusula..."
                  value={newSugName}
                  onChange={(e) => setNewSugName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-sug-meaning">
                  Ne Anlama Geliyor? (Açıklama / Köken) *
                </label>
                <textarea
                  id="input-sug-meaning"
                  required
                  placeholder="Bu ismin anlamı nedir, hangi dilden türedi, projeyi neden iyi temsil ediyor?"
                  value={newSugMeaning}
                  onChange={(e) => setNewSugMeaning(e.target.value)}
                  className="form-textarea"
                  rows={4}
                />
                <span className="form-helper">
                  Diğer 2 ortağınızın oy verirken anlayabilmesi için detaylı açıklayın.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-sug-tagline">
                  Slogan / Kısa Açıklama (İsteğe Bağlı)
                </label>
                <input
                  id="input-sug-tagline"
                  type="text"
                  placeholder="Örn: Geleceği aydınlatan yeni nesil platform"
                  value={newSugTagline}
                  onChange={(e) => setNewSugTagline(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-sug-tags">
                  Etiketler (Virgülle ayırın)
                </label>
                <input
                  id="input-sug-tags"
                  type="text"
                  placeholder="Teknoloji, Modern, Global, Türkçe, Kısa"
                  value={newSugTags}
                  onChange={(e) => setNewSugTags(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-sug-domain">
                  Alan Adı (.com) Durumu
                </label>
                <select
                  id="input-sug-domain"
                  value={newSugDomain}
                  onChange={(e) => setNewSugDomain(e.target.value as any)}
                  className="form-select"
                >
                  <option value="available">Müsait / Satın Alınabilir</option>
                  <option value="unknown">Henüz Kontrol Edilmedi</option>
                  <option value="taken">Dolu / Alternatif Uzantı Gerekir</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                >
                  İptal
                </button>
                <button
                  id="submit-sug-btn"
                  type="submit"
                  disabled={submittingSug}
                  className="btn btn-gradient"
                >
                  {submittingSug ? 'Kaydediliyor...' : 'Öneriyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: START VOTING SESSION */}
      {showStartSessionModal && (
        <div className="modal-overlay" id="start-session-modal">
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Yeni Oylama Oturumu Başlat</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  3 kullanıcıdan biri olarak resmi oylamayı başlatıyorsunuz.
                </p>
              </div>
              <button
                id="close-start-session-modal"
                onClick={() => setShowStartSessionModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartSession}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-session-title">
                  Oylama Başlığı *
                </label>
                <input
                  id="input-session-title"
                  type="text"
                  required
                  placeholder="Örn: 1. Tur Ön Eleme Oylaması, Büyük Final"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-session-desc">
                  Oylama Notu / Açıklama
                </label>
                <textarea
                  id="input-session-desc"
                  rows={2}
                  placeholder="Tüm önerilere 1-10 arası puan verilecektir..."
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#A5B4FC', marginBottom: '0.35rem' }}>
                  ℹ️ Oylama Bilgisi
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Oylama başladığında ekranda canlı banner belirecek. Sistemdeki tüm <strong>{suggestions.length}</strong> isim önerisi oylamaya dahil edilecektir.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStartSessionModal(false)}
                  className="btn btn-outline"
                >
                  Vazgeç
                </button>
                <button
                  id="confirm-start-session-btn"
                  type="submit"
                  disabled={submittingSession}
                  className="btn btn-primary"
                >
                  {submittingSession ? 'Başlatılıyor...' : 'Oylamayı Başlat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INTERACTIVE BALLOT VOTING */}
      {showVoteModal && activeSession && (
        <div className="modal-overlay" id="ballot-modal">
          <div className="modal-dialog" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Oyunu Kullan (1-10 Puan)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Kullanıcı: <strong style={{ color: '#FFFFFF' }}>{activeUser?.name}</strong> · Oturum: {activeSession.title}
                </p>
              </div>
              <button
                id="close-vote-modal"
                onClick={() => setShowVoteModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitVotes}>
              <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
                {suggestions.map((sug, index) => {
                  const currentScore = ballotScores[sug.id]?.score ?? 7;
                  const currentNote = ballotScores[sug.id]?.note ?? '';

                  return (
                    <div key={sug.id} className="ballot-item" id={`ballot-item-${sug.id}`}>
                      <div className="ballot-item-header">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                          #{index + 1}
                        </span>
                        <div className="ballot-item-title">{sug.name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Öneren: {sug.created_by_name}
                        </span>
                      </div>

                      <p className="ballot-item-meaning">
                        <strong>Anlam:</strong> {sug.meaning}
                      </p>

                      {/* Score Selector (1 to 10) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Puanınız (1 = Zayıf, 10 = Mükemmel):
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold)' }}>
                            {currentScore} / 10 Puan
                          </span>
                        </div>

                        <div className="score-selector-grid">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              id={`score-btn-${sug.id}-${num}`}
                              onClick={() => {
                                setBallotScores({
                                  ...ballotScores,
                                  [sug.id]: {
                                    score: num,
                                    note: currentNote,
                                  },
                                });
                              }}
                              className={`score-btn ${currentScore === num ? 'selected' : ''}`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          placeholder="Kısa bir görüş veya eleştiri notu (isteğe bağlı)..."
                          value={currentNote}
                          onChange={(e) => {
                            setBallotScores({
                              ...ballotScores,
                              [sug.id]: {
                                score: currentScore,
                                note: e.target.value,
                              },
                            });
                          }}
                          className="form-input"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tüm isimlere verdiğiniz puanlar kaydedilecektir.
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowVoteModal(false)}
                    className="btn btn-outline"
                  >
                    İptal
                  </button>
                  <button
                    id="submit-ballot-btn"
                    type="submit"
                    disabled={submittingVotes}
                    className="btn btn-gradient"
                  >
                    {submittingVotes ? 'Oylar Kaydediliyor...' : 'Oylarımı Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT USER PROFILE */}
      {showEditUserModal && activeUser && (
        <div className="modal-overlay" id="edit-user-modal">
          <div className="modal-dialog" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Kullanıcı Profilini Düzenle</h3>
              <button
                id="close-edit-user-modal"
                onClick={() => setShowEditUserModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-username-input">
                  Adınız / Takma Adınız
                </label>
                <input
                  id="edit-username-input"
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="form-input"
                  placeholder="Örn: Ahmet, Mehmet, Ayşe..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Emoji</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {['⚡', '💎', '🚀', '🌟', '🔥', '👑', '🎯', '🦁', '🦉'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditUserAvatar(emoji)}
                      style={{
                        fontSize: '1.3rem',
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-sm)',
                        background: editUserAvatar === emoji ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="btn btn-outline"
                >
                  Vazgeç
                </button>
                <button
                  id="save-user-profile-btn"
                  type="submit"
                  disabled={submittingUserEdit}
                  className="btn btn-primary"
                >
                  {submittingUserEdit ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: COMMENTS / DISCUSSION */}
      {showCommentsModal && (
        <div className="modal-overlay" id="comments-modal">
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">&ldquo;{showCommentsModal.name}&rdquo; Hakkında Görüşler</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  3 ortağın fikir alışverişi ve geri bildirimleri
                </p>
              </div>
              <button
                id="close-comments-modal"
                onClick={() => setShowCommentsModal(null)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Existing comments */}
            <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {commentsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  Bu öneri hakkında henüz bir yorum yapılmadı. İlk yorumu siz yazın!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {commentsList.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: 'rgba(10, 14, 25, 0.65)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>{c.user_name}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new comment form */}
            <form onSubmit={handleAddComment}>
              <div className="form-group">
                <input
                  id="new-comment-input"
                  type="text"
                  required
                  placeholder={`${activeUser?.name} olarak bir düşünce veya öneri paylaşın...`}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCommentsModal(null)}
                  className="btn btn-outline btn-sm"
                >
                  Kapat
                </button>
                <button
                  id="submit-comment-btn"
                  type="submit"
                  disabled={submittingComment}
                  className="btn btn-primary btn-sm"
                >
                  {submittingComment ? 'Gönderiliyor...' : 'Yorum Yaz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: DB STATUS & VERCEL GUIDE */}
      {showDbGuideModal && (
        <div className="modal-overlay" id="db-guide-modal">
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Veritabanı ve Vercel Durumu</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Canlı ve Yerel Veritabanı Bilgileri
                </p>
              </div>
              <button
                id="close-db-modal"
                onClick={() => setShowDbGuideModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aktif DB Motoru:</span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: dbStatus?.type === 'postgres' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: dbStatus?.type === 'postgres' ? '#34D399' : '#FBBF24',
                    }}
                  >
                    {dbStatus?.type === 'postgres' ? 'PostgreSQL (Vercel / Neon)' : 'Yerel Veritabanı (.data/db.json)'}
                  </span>
                </div>

                {dbStatus?.connectionString && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                    URL: {dbStatus.connectionString}
                  </div>
                )}
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
                🚀 Vercel&apos;de Yayına Alırken:
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                Vercel Dashboard&apos;da projenize bir <strong>Vercel Postgres (Neon)</strong> veritabanı eklediğinizde veya Supabase bağlantı dizginizi <code style={{ color: '#38BDF8' }}>DATABASE_URL</code> olarak girdiğinizde, uygulama otomatik olarak Postgres&apos;e geçiş yapar.
              </p>
              <div className="code-snippet">DATABASE_URL=postgres://user:pass@host/dbname</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDbGuideModal(false)}
                className="btn btn-primary btn-sm"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
