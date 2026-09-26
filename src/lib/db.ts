import { Pool } from 'pg';
import { Pool as NeonPool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { User, Suggestion, VotingSession, Vote, Comment, LeaderboardItem } from './types';

// Initial 3 users as specified in the prompt: "3 kullanıcı olacak hepsi aynı özelliklere sahip olacak"
const DEFAULT_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Kullanıcı 1',
    avatar: '⚡',
    color: '#6366F1', // Indigo
    role: 'member',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user_2',
    name: 'Kullanıcı 2',
    avatar: '💎',
    color: '#EC4899', // Pink
    role: 'member',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user_3',
    name: 'Kullanıcı 3',
    avatar: '🚀',
    color: '#10B981', // Emerald
    role: 'member',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug_1',
    name: 'Lumivex',
    meaning: 'Latince "Lumen" (ışık, aydınlık) ve "Vex" (zirve, öncü) kelimelerinin birleşimi. Kullanıcılara yol gösteren, modern ve teknolojik bir kimlik çağrıştırır.',
    tagline: 'Geleceği aydınlatan yeni nesil platform.',
    domain_status: 'available',
    tags: ['Modern', 'Teknoloji', 'Global'],
    created_by_id: 'user_1',
    created_by_name: 'Kullanıcı 1',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'sug_2',
    name: 'PusulaSoft',
    meaning: 'Türkçe "Pusula" kavramından türetilmiştir. Kullanıcılarına doğru rotayı çizen, güvenilir ve sağlam bir yol gösterici vizyonunu temsil eder.',
    tagline: 'Doğru yönde, güvenle ilerleyin.',
    domain_status: 'unknown',
    tags: ['Türkçe', 'Güvenilir', 'Kurumsal'],
    created_by_id: 'user_2',
    created_by_name: 'Kullanıcı 2',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'sug_3',
    name: 'NovaForge',
    meaning: 'Nova (parlayan yeni yıldız) ve Forge (üretmek, şekil vermek) bileşimi. Yüksek enerjiyle yeni fikirler inşa eden dinamik bir ekibi anlatır.',
    tagline: 'Yıldız gibi parlayan fikirlerin atölyesi.',
    domain_status: 'available',
    tags: ['Yaratıcı', 'İnovasyon', 'Güçlü'],
    created_by_id: 'user_3',
    created_by_name: 'Kullanıcı 3',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const getConnectionString = () => {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  );
};

const isPostgresConfigured = () => {
  const url = getConnectionString();
  return Boolean(url && url.startsWith('postgres'));
};

let pgPoolInstance: any = null;

function getPgPool() {
  if (pgPoolInstance) return pgPoolInstance;
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  try {
    if (connectionString.includes('neon.tech') || connectionString.includes('vercel-storage.com')) {
      pgPoolInstance = new NeonPool({ connectionString });
    } else {
      pgPoolInstance = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      });
    }
    return pgPoolInstance;
  } catch (err) {
    console.error('Error creating PG pool:', err);
    return null;
  }
}

async function queryPg<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const pool = getPgPool();
  if (!pool) return { rows: [] };
  const res = await pool.query(text, params);
  return res;
}

// Ensure database tables exist if PostgreSQL is connected
let pgInitialized = false;
async function ensurePgSchema() {
  if (pgInitialized) return;
  const pool = getPgPool();
  if (!pool) return;

  try {
    await queryPg(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(50) NOT NULL,
        color VARCHAR(50) NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS suggestions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        tagline TEXT,
        domain_status VARCHAR(50) DEFAULT 'unknown',
        tags TEXT,
        created_by_id VARCHAR(50) NOT NULL,
        created_by_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS voting_sessions (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_by_id VARCHAR(50) NOT NULL,
        created_by_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        max_score INTEGER DEFAULT 10,
        included_suggestion_ids TEXT,
        winner_suggestion_id VARCHAR(50),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(50) PRIMARY KEY,
        session_id VARCHAR(50) NOT NULL,
        suggestion_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, suggestion_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(50) PRIMARY KEY,
        suggestion_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default users if empty
    const usersCountRes = await queryPg('SELECT COUNT(*) FROM users');
    if (parseInt(usersCountRes.rows[0].count, 10) === 0) {
      for (const u of DEFAULT_USERS) {
        await queryPg(
          'INSERT INTO users (id, name, avatar, color, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [u.id, u.name, u.avatar, u.color, u.role, u.created_at]
        );
      }
    }

    // Seed default suggestions if empty
    const sugCountRes = await queryPg('SELECT COUNT(*) FROM suggestions');
    if (parseInt(sugCountRes.rows[0].count, 10) === 0) {
      for (const s of INITIAL_SUGGESTIONS) {
        await queryPg(
          'INSERT INTO suggestions (id, name, meaning, tagline, domain_status, tags, created_by_id, created_by_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            s.id,
            s.name,
            s.meaning,
            s.tagline || '',
            s.domain_status || 'unknown',
            JSON.stringify(s.tags || []),
            s.created_by_id,
            s.created_by_name,
            s.status,
            s.created_at,
          ]
        );
      }
    }

    pgInitialized = true;
  } catch (err) {
    console.error('Failed to initialize PG schema:', err);
  }
}

// ---------------- LOCAL FILE-BASED STORAGE (Fallback when no DATABASE_URL) ----------------
interface LocalDbSchema {
  users: User[];
  suggestions: Suggestion[];
  voting_sessions: VotingSession[];
  votes: Vote[];
  comments: Comment[];
}

const LOCAL_DB_PATH = path.join(process.cwd(), '.data', 'db.json');

function getLocalData(): LocalDbSchema {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read local db file, fallback to defaults:', err);
  }

  // Initialize defaults
  const initialData: LocalDbSchema = {
    users: DEFAULT_USERS,
    suggestions: INITIAL_SUGGESTIONS,
    voting_sessions: [],
    votes: [],
    comments: [],
  };

  saveLocalData(initialData);
  return initialData;
}

function saveLocalData(data: LocalDbSchema) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write local db file (read-only filesystem):', err);
  }
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// ---------------- REPOSITORY API ----------------

export const db = {
  async getStatus() {
    const postgresConfigured = isPostgresConfigured();
    const connStr = getConnectionString();
    let masked = '';
    if (connStr) {
      try {
        const u = new URL(connStr);
        masked = `${u.protocol}//${u.username}:****@${u.host}${u.pathname}`;
      } catch {
        masked = 'configured (custom format)';
      }
    }

    return {
      type: postgresConfigured ? 'postgres' : 'local',
      connected: postgresConfigured ? pgInitialized : true,
      connectionString: masked,
      instructions: !postgresConfigured
        ? 'Vercel dağıtımında kalıcı veritabanı için Vercel Postgres / Neon / Supabase DATABASE_URL ortam değişkenini ekleyebilirsiniz.'
        : 'PostgreSQL bağlantısı aktif ve tablolar hazır.',
    };
  },

  async getUsers(): Promise<User[]> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const res = await queryPg('SELECT * FROM users ORDER BY id ASC');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          avatar: r.avatar,
          color: r.color,
          role: r.role || 'member',
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }));
      }
    }

    const local = getLocalData();
    return local.users;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const currentRes = await queryPg('SELECT * FROM users WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) return null;
      const current = currentRes.rows[0];
      const newName = updates.name !== undefined ? updates.name : current.name;
      const newAvatar = updates.avatar !== undefined ? updates.avatar : current.avatar;
      const newColor = updates.color !== undefined ? updates.color : current.color;

      const updateRes = await queryPg(
        'UPDATE users SET name = $1, avatar = $2, color = $3 WHERE id = $4 RETURNING *',
        [newName, newAvatar, newColor, id]
      );
      const r = updateRes.rows[0];
      return {
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        color: r.color,
        role: r.role || 'member',
        created_at: new Date(r.created_at).toISOString(),
      };
    }

    const local = getLocalData();
    const idx = local.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    local.users[idx] = { ...local.users[idx], ...updates };
    saveLocalData(local);
    return local.users[idx];
  },

  async getSuggestions(): Promise<Suggestion[]> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const res = await queryPg('SELECT * FROM suggestions ORDER BY created_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => {
          let tags: string[] = [];
          try {
            tags = typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [];
          } catch {
            tags = r.tags ? [String(r.tags)] : [];
          }
          return {
            id: r.id,
            name: r.name,
            meaning: r.meaning,
            tagline: r.tagline || '',
            domain_status: r.domain_status || 'unknown',
            tags,
            created_by_id: r.created_by_id,
            created_by_name: r.created_by_name,
            status: r.status || 'active',
            created_at: new Date(r.created_at).toISOString(),
          };
        });
      }
    }

    const local = getLocalData();
    return local.suggestions;
  },

  async createSuggestion(data: Omit<Suggestion, 'id' | 'created_at' | 'status'>): Promise<Suggestion> {
    const newSug: Suggestion = {
      ...data,
      id: generateId('sug'),
      status: 'active',
      created_at: new Date().toISOString(),
    };

    if (isPostgresConfigured()) {
      await ensurePgSchema();
      await queryPg(
        'INSERT INTO suggestions (id, name, meaning, tagline, domain_status, tags, created_by_id, created_by_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          newSug.id,
          newSug.name,
          newSug.meaning,
          newSug.tagline || '',
          newSug.domain_status || 'unknown',
          JSON.stringify(newSug.tags || []),
          newSug.created_by_id,
          newSug.created_by_name,
          newSug.status,
          newSug.created_at,
        ]
      );
      return newSug;
    }

    const local = getLocalData();
    local.suggestions.unshift(newSug);
    saveLocalData(local);
    return newSug;
  },

  async deleteSuggestion(id: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      await queryPg('DELETE FROM suggestions WHERE id = $1', [id]);
      await queryPg('DELETE FROM votes WHERE suggestion_id = $1', [id]);
      await queryPg('DELETE FROM comments WHERE suggestion_id = $1', [id]);
      return true;
    }

    const local = getLocalData();
    local.suggestions = local.suggestions.filter((s) => s.id !== id);
    local.votes = local.votes.filter((v) => v.suggestion_id !== id);
    local.comments = local.comments.filter((c) => c.suggestion_id !== id);
    saveLocalData(local);
    return true;
  },

  async getVotingSessions(): Promise<VotingSession[]> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const res = await queryPg('SELECT * FROM voting_sessions ORDER BY started_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => {
          let ids: string[] = [];
          try {
            ids = typeof r.included_suggestion_ids === 'string' ? JSON.parse(r.included_suggestion_ids) : r.included_suggestion_ids || [];
          } catch {
            ids = [];
          }
          return {
            id: r.id,
            title: r.title,
            description: r.description || '',
            created_by_id: r.created_by_id,
            created_by_name: r.created_by_name,
            status: r.status,
            max_score: r.max_score || 10,
            included_suggestion_ids: ids,
            winner_suggestion_id: r.winner_suggestion_id || null,
            started_at: new Date(r.started_at).toISOString(),
            ended_at: r.ended_at ? new Date(r.ended_at).toISOString() : null,
          };
        });
      }
    }

    const local = getLocalData();
    return local.voting_sessions;
  },

  async getActiveVotingSession(): Promise<VotingSession | null> {
    const sessions = await this.getVotingSessions();
    const active = sessions.find((s) => s.status === 'active');
    if (!active) return null;

    const votes = await this.getVotesBySession(active.id);
    const userIds = Array.from(new Set(votes.map((v) => v.user_id)));
    return {
      ...active,
      total_participants_voted: userIds.length,
      user_voted_ids: userIds,
    };
  },

  async createVotingSession(data: {
    title: string;
    description?: string;
    created_by_id: string;
    created_by_name: string;
    max_score?: number;
    included_suggestion_ids?: string[];
  }): Promise<VotingSession> {
    const active = await this.getActiveVotingSession();
    if (active) {
      await this.completeVotingSession(active.id);
    }

    let sugIds = data.included_suggestion_ids;
    if (!sugIds || sugIds.length === 0) {
      const allSugs = await this.getSuggestions();
      sugIds = allSugs.map((s) => s.id);
    }

    const newSession: VotingSession = {
      id: generateId('sess'),
      title: data.title,
      description: data.description || '',
      created_by_id: data.created_by_id,
      created_by_name: data.created_by_name,
      status: 'active',
      max_score: data.max_score || 10,
      included_suggestion_ids: sugIds,
      started_at: new Date().toISOString(),
      ended_at: null,
      winner_suggestion_id: null,
    };

    if (isPostgresConfigured()) {
      await ensurePgSchema();
      await queryPg(
        'INSERT INTO voting_sessions (id, title, description, created_by_id, created_by_name, status, max_score, included_suggestion_ids, started_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          newSession.id,
          newSession.title,
          newSession.description || '',
          newSession.created_by_id,
          newSession.created_by_name,
          newSession.status,
          newSession.max_score,
          JSON.stringify(newSession.included_suggestion_ids),
          newSession.started_at,
        ]
      );
      return newSession;
    }

    const local = getLocalData();
    local.voting_sessions.unshift(newSession);
    saveLocalData(local);
    return newSession;
  },

  async completeVotingSession(sessionId: string, winnerId?: string): Promise<VotingSession | null> {
    const ended_at = new Date().toISOString();

    let finalWinnerId = winnerId;
    if (!finalWinnerId) {
      const leaderboard = await this.getSessionLeaderboard(sessionId);
      if (leaderboard.length > 0) {
        finalWinnerId = leaderboard[0].suggestion.id;
      }
    }

    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const res = await queryPg(
        'UPDATE voting_sessions SET status = $1, ended_at = $2, winner_suggestion_id = $3 WHERE id = $4 RETURNING *',
        ['completed', ended_at, finalWinnerId || null, sessionId]
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      let ids: string[] = [];
      try {
        ids = typeof r.included_suggestion_ids === 'string' ? JSON.parse(r.included_suggestion_ids) : r.included_suggestion_ids || [];
      } catch {
        ids = [];
      }
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        created_by_id: r.created_by_id,
        created_by_name: r.created_by_name,
        status: r.status,
        max_score: r.max_score,
        included_suggestion_ids: ids,
        winner_suggestion_id: r.winner_suggestion_id,
        started_at: new Date(r.started_at).toISOString(),
        ended_at: new Date(r.ended_at).toISOString(),
      };
    }

    const local = getLocalData();
    const idx = local.voting_sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;
    local.voting_sessions[idx].status = 'completed';
    local.voting_sessions[idx].ended_at = ended_at;
    local.voting_sessions[idx].winner_suggestion_id = finalWinnerId || null;
    saveLocalData(local);
    return local.voting_sessions[idx];
  },

  async getVotesBySession(sessionId: string): Promise<Vote[]> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const res = await queryPg('SELECT * FROM votes WHERE session_id = $1', [sessionId]);
      return res.rows.map((r: any) => ({
        id: r.id,
        session_id: r.session_id,
        suggestion_id: r.suggestion_id,
        user_id: r.user_id,
        user_name: r.user_name,
        score: r.score,
        note: r.note || '',
        created_at: new Date(r.created_at).toISOString(),
      }));
    }

    const local = getLocalData();
    return local.votes.filter((v) => v.session_id === sessionId);
  },

  async submitUserVotes(
    sessionId: string,
    userId: string,
    userName: string,
    votes: { suggestion_id: string; score: number; note?: string }[]
  ): Promise<Vote[]> {
    const createdVotes: Vote[] = [];

    if (isPostgresConfigured()) {
      await ensurePgSchema();
      for (const item of votes) {
        const voteId = generateId('vt');
        const now = new Date().toISOString();
        const res = await queryPg(
          `INSERT INTO votes (id, session_id, suggestion_id, user_id, user_name, score, note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (session_id, suggestion_id, user_id)
           DO UPDATE SET score = EXCLUDED.score, note = EXCLUDED.note, created_at = EXCLUDED.created_at
           RETURNING *`,
          [voteId, sessionId, item.suggestion_id, userId, userName, item.score, item.note || '', now]
        );
        const r = res.rows[0];
        createdVotes.push({
          id: r.id,
          session_id: r.session_id,
          suggestion_id: r.suggestion_id,
          user_id: r.user_id,
          user_name: r.user_name,
          score: r.score,
          note: r.note,
          created_at: new Date(r.created_at).toISOString(),
        });
      }
      return createdVotes;
    }

    const local = getLocalData();
    local.votes = local.votes.filter(
      (v) => !(v.session_id === sessionId && v.user_id === userId)
    );

    for (const item of votes) {
      const newVote: Vote = {
        id: generateId('vt'),
        session_id: sessionId,
        suggestion_id: item.suggestion_id,
        user_id: userId,
        user_name: userName,
        score: item.score,
        note: item.note || '',
        created_at: new Date().toISOString(),
      };
      local.votes.push(newVote);
      createdVotes.push(newVote);
    }
    saveLocalData(local);
    return createdVotes;
  },

  async getSessionLeaderboard(sessionId: string): Promise<LeaderboardItem[]> {
    const [suggestions, votes] = await Promise.all([
      this.getSuggestions(),
      this.getVotesBySession(sessionId),
    ]);

    const sessionVotes = votes.filter((v) => v.session_id === sessionId);

    const group: Record<
      string,
      {
        total_score: number;
        voters: { user_id: string; user_name: string; score: number; note?: string }[];
      }
    > = {};

    for (const v of sessionVotes) {
      if (!group[v.suggestion_id]) {
        group[v.suggestion_id] = { total_score: 0, voters: [] };
      }
      group[v.suggestion_id].total_score += v.score;
      group[v.suggestion_id].voters.push({
        user_id: v.user_id,
        user_name: v.user_name,
        score: v.score,
        note: v.note,
      });
    }

    const items: LeaderboardItem[] = [];
    for (const sug of suggestions) {
      const g = group[sug.id] || { total_score: 0, voters: [] };
      const count = g.voters.length;
      const avg = count > 0 ? Number((g.total_score / count).toFixed(1)) : 0;
      items.push({
        suggestion: sug,
        rank: 0,
        total_score: g.total_score,
        average_score: avg,
        vote_count: count,
        voters: g.voters,
      });
    }

    items.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return b.average_score - a.average_score;
    });

    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    return items;
  },

  async getComments(suggestionId: string): Promise<Comment[]> {
    if (isPostgresConfigured()) {
      await ensurePgSchema();
      const res = await queryPg(
        'SELECT * FROM comments WHERE suggestion_id = $1 ORDER BY created_at ASC',
        [suggestionId]
      );
      return res.rows.map((r: any) => ({
        id: r.id,
        suggestion_id: r.suggestion_id,
        user_id: r.user_id,
        user_name: r.user_name,
        text: r.text,
        created_at: new Date(r.created_at).toISOString(),
      }));
    }

    const local = getLocalData();
    return local.comments.filter((c) => c.suggestion_id === suggestionId);
  },

  async addComment(data: {
    suggestion_id: string;
    user_id: string;
    user_name: string;
    text: string;
  }): Promise<Comment> {
    const newComment: Comment = {
      id: generateId('cmt'),
      suggestion_id: data.suggestion_id,
      user_id: data.user_id,
      user_name: data.user_name,
      text: data.text,
      created_at: new Date().toISOString(),
    };

    if (isPostgresConfigured()) {
      await ensurePgSchema();
      await queryPg(
        'INSERT INTO comments (id, suggestion_id, user_id, user_name, text, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [newComment.id, newComment.suggestion_id, newComment.user_id, newComment.user_name, newComment.text, newComment.created_at]
      );
      return newComment;
    }

    const local = getLocalData();
    local.comments.push(newComment);
    saveLocalData(local);
    return newComment;
  },
};
