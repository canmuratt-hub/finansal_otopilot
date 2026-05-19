const path = require('path');
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  parseTransactionFromText,
  parseReceiptFromImage,
  generateInsight,
  chatWithNiko,
  generateGoalReminder,
} from './aiService.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-finansal-otopilot';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finansal_otopilot',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL bağlantısı başarılı (Multi-User)');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL bağlantı hatası:', err.message);
  }
})();

// =====================================================
// AUTH MIDDLEWARE
// =====================================================
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Lütfen giriş yapın.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user_id = decoded.user_id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Geçersiz token.' });
  }
};

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Finansal Otopilot API', multiUser: true, ai: !!process.env.GEMINI_API_KEY });
});

// =====================================================
// AUTH ROUTES
// =====================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Tüm alanları doldurun.' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Bu e-posta zaten kullanımda.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    // Create default profile
    await pool.query(
      'INSERT INTO user_profile (user_id, name, email, monthly_budget, risk_profile, preferred_currency) VALUES (?, ?, ?, ?, ?, ?)',
      [result.insertId, name, email, 10000, 'Dengeli', 'TRY']
    );

    const token = jwt.sign({ user_id: result.insertId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: { id: result.insertId, name, email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Tüm alanları doldurun.' });

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ success: false, message: 'Hatalı e-posta veya şifre.' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Hatalı e-posta veya şifre.' });

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// TRANSACTIONS
// =====================================================
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, amount, category, type, DATE_FORMAT(date, "%Y-%m-%d") AS date, description, created_at FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC',
      [req.user_id]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/transactions', auth, async (req, res) => {
  try {
    const { amount, category, type, date, description } = req.body;
    if (amount === undefined || !category || !type || !date)
      return res.status(400).json({ success: false, message: 'amount, category, type, date zorunlu' });
    if (!['income', 'expense'].includes(type))
      return res.status(400).json({ success: false, message: "type 'income' veya 'expense'" });
    const [r] = await pool.query(
      'INSERT INTO transactions (user_id, amount, category, type, date, description) VALUES (?,?,?,?,?,?)',
      [req.user_id, amount, category, type, date, description || null]
    );
    res.status(201).json({ success: true, data: { id: r.insertId, amount, category, type, date, description } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/transactions/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// AI: parse-text, parse-receipt, insight
// =====================================================
app.post('/api/ai/parse-text', auth, async (req, res) => {
  try {
    const { text, autoSave = true } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'text zorunlu' });
    const parsed = await parseTransactionFromText(text);
    let saved = null;
    if (autoSave && parsed.amount > 0) {
      const [r] = await pool.query(
        'INSERT INTO transactions (user_id, amount, category, type, date, description) VALUES (?,?,?,?,?,?)',
        [req.user_id, parsed.amount, parsed.category, parsed.type, parsed.date, parsed.description]
      );
      saved = { id: r.insertId, ...parsed };
    }
    res.json({ success: true, parsed, saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/ai/parse-receipt', auth, async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', autoSave = true } = req.body;
    if (!image) return res.status(400).json({ success: false, message: 'image zorunlu' });
    const parsed = await parseReceiptFromImage(image, mimeType);
    let saved = null;
    if (autoSave && parsed.amount > 0) {
      const [r] = await pool.query(
        'INSERT INTO transactions (user_id, amount, category, type, date, description) VALUES (?,?,?,?,?,?)',
        [req.user_id, parsed.amount, parsed.category, parsed.type, parsed.date, parsed.description]
      );
      saved = { id: r.insertId, ...parsed };
    }
    res.json({ success: true, parsed, saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ai/insight', auth, async (req, res) => {
  try {
    const [tx] = await pool.query(
      'SELECT amount, category, type, DATE_FORMAT(date, "%Y-%m-%d") AS date, description FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 100',
      [req.user_id]
    );
    let profile = { name: 'Kullanıcı', monthly_budget: 10000, risk_profile: 'Dengeli' };
    let goals = [];
    try {
      const [p] = await pool.query('SELECT * FROM user_profile WHERE user_id = ?', [req.user_id]);
      if (p[0]) profile = p[0];
    } catch { }
    try {
      const [g] = await pool.query('SELECT * FROM goals WHERE status = "active" AND user_id = ?', [req.user_id]);
      goals = g;
    } catch { }
    const insight = await generateInsight(tx, profile, goals);
    try {
      await pool.query('INSERT INTO ai_insights (user_id, insight_text, action_suggested) VALUES (?,?,?)',
        [req.user_id, insight.insight_text, insight.action_suggested]);
    } catch { }
    res.json({ success: true, data: insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// NIKO CHAT
// =====================================================
const executeAction = async (action, userId) => {
  if (!action || !action.type) return null;
  try {
    if (action.type === 'add_transaction') {
      const d = action.data || {};
      if (!d.amount) return null;
      const [r] = await pool.query(
        'INSERT INTO transactions (user_id, amount, category, type, date, description) VALUES (?,?,?,?,?,?)',
        [userId, Number(d.amount), d.category || 'Diğer', d.type === 'income' ? 'income' : 'expense',
          d.date || new Date().toISOString().slice(0, 10), d.description || null]
      );
      return { type: 'add_transaction', id: r.insertId, data: d };
    }
    if (action.type === 'add_goal') {
      const d = action.data || {};
      if (!d.title || !d.target_amount) return null;
      const [r] = await pool.query(
        'INSERT INTO goals (user_id, title, target_amount, deadline) VALUES (?,?,?,?)',
        [userId, d.title, Number(d.target_amount), d.deadline || null]
      );
      return { type: 'add_goal', id: r.insertId, data: d };
    }
  } catch (e) {
    console.error('action execute err:', e.message);
  }
  return null;
};

app.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message zorunlu' });

    let profile = null, goals = [], recent_total = 0;
    try { const [p] = await pool.query('SELECT * FROM user_profile WHERE user_id = ?', [req.user_id]); profile = p[0]; } catch { }
    try { const [g] = await pool.query('SELECT * FROM goals WHERE status = "active" AND user_id = ?', [req.user_id]); goals = g; } catch { }
    try {
      const [t] = await pool.query(
        "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='expense' AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND user_id = ?",
        [req.user_id]
      );
      recent_total = Number(t[0]?.total) || 0;
    } catch { }

    const result = await chatWithNiko(message, history, { profile, goals, recent_total });

    // Action'ları çalıştır
    const executed = [];
    for (const a of result.actions || []) {
      const r = await executeAction(a, req.user_id);
      if (r) executed.push(r);
    }

    // Mesajları logla
    try {
      await pool.query('INSERT INTO niko_messages (user_id, role, content) VALUES (?,?,?)', [req.user_id, 'user', message]);
      await pool.query('INSERT INTO niko_messages (user_id, role, content) VALUES (?,?,?)', [req.user_id, 'assistant', result.reply]);
    } catch { }

    res.json({ success: true, reply: result.reply, actions_executed: executed });
  } catch (err) {
    console.error('chat err:', err.message);
    const isQuota = /quota|429|rate ?limit|exceeded/i.test(err.message);
    const isNetwork = /fetch|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(err.message);
    const friendly = isQuota
      ? '🌬️ Şu an çok yoğunum, biraz nefes alayım. 30 saniye sonra tekrar dener misin? (AI servisi geçici limit)'
      : isNetwork
        ? '📡 İnternete erişimde sorun var, bağlantını kontrol edip yeniden dener misin?'
        : 'Üzgünüm, beklenmedik bir aksilik oldu. Tekrar dener misin?';
    res.json({ success: true, reply: friendly, actions_executed: [], soft_error: true });
  }
});

// Goal reminder
app.get('/api/ai/goal-reminder', auth, async (req, res) => {
  try {
    const [goals] = await pool.query("SELECT * FROM goals WHERE status='active' AND user_id = ? ORDER BY deadline ASC LIMIT 1", [req.user_id]);
    if (!goals[0]) return res.json({ success: true, data: null });
    const [tx] = await pool.query(
      "SELECT amount, category, type FROM transactions WHERE type='expense' AND user_id = ? ORDER BY date DESC LIMIT 20",
      [req.user_id]
    );
    const reminder = await generateGoalReminder(goals[0], tx);
    res.json({ success: true, data: { ...reminder, goal: goals[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// PROFILE
// =====================================================
app.get('/api/profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_profile WHERE user_id = ?', [req.user_id]);
    if (!rows[0]) {
      const [u] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user_id]);
      return res.json({ success: true, data: { name: u[0]?.name || 'Kullanıcı', monthly_budget: 10000, risk_profile: 'Dengeli', preferred_currency: 'TRY' } });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const { name, email, monthly_budget, risk_profile, preferred_currency } = req.body;
    if (risk_profile && !['Güvenli', 'Dengeli', 'Agresif'].includes(risk_profile))
      return res.status(400).json({ success: false, message: 'risk_profile geçersiz' });

    const [existing] = await pool.query('SELECT id FROM user_profile WHERE user_id = ?', [req.user_id]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE user_profile SET name=?, email=?, monthly_budget=?, risk_profile=?, preferred_currency=? WHERE user_id=?',
        [name || 'Kullanıcı', email || null, monthly_budget || 0, risk_profile || 'Dengeli', preferred_currency || 'TRY', req.user_id]
      );
    } else {
      await pool.query(
        'INSERT INTO user_profile (user_id, name, email, monthly_budget, risk_profile, preferred_currency) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user_id, name || 'Kullanıcı', email || null, monthly_budget || 0, risk_profile || 'Dengeli', preferred_currency || 'TRY']
      );
    }
    const [rows] = await pool.query('SELECT * FROM user_profile WHERE user_id = ?', [req.user_id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// SUBSCRIPTIONS / FIXED EXPENSES / GOALS — Generic CRUD
// =====================================================
const crud = (table, allowedFields) => ({
  list: async (req, res) => {
    try { const [rows] = await pool.query(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY id DESC`, [req.user_id]); res.json({ success: true, data: rows }); }
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  create: async (req, res) => {
    try {
      const fields = allowedFields.filter((f) => req.body[f] !== undefined);
      if (!fields.length) return res.status(400).json({ success: false, message: 'alan yok' });
      const cols = ['user_id', ...fields].join(', ');
      const placeholders = ['?', ...fields.map(() => '?')].join(', ');
      const values = [req.user_id, ...fields.map((f) => req.body[f])];
      const [r] = await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [r.insertId, req.user_id]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  update: async (req, res) => {
    try {
      const fields = allowedFields.filter((f) => req.body[f] !== undefined);
      if (!fields.length) return res.status(400).json({ success: false, message: 'alan yok' });
      const setSql = fields.map((f) => `${f} = ?`).join(', ');
      const values = [...fields.map((f) => req.body[f]), req.params.id, req.user_id];
      await pool.query(`UPDATE ${table} SET ${setSql} WHERE id = ? AND user_id = ?`, values);
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [req.params.id, req.user_id]);
      res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  remove: async (req, res) => {
    try { await pool.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [req.params.id, req.user_id]); res.json({ success: true }); }
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
});

const subs = crud('subscriptions', ['name', 'amount', 'cycle', 'next_renewal', 'icon']);
app.get('/api/subscriptions', auth, subs.list);
app.post('/api/subscriptions', auth, subs.create);
app.put('/api/subscriptions/:id', auth, subs.update);
app.delete('/api/subscriptions/:id', auth, subs.remove);

const fx = crud('fixed_expenses', ['name', 'amount', 'due_day', 'category']);
app.get('/api/fixed-expenses', auth, fx.list);
app.post('/api/fixed-expenses', auth, fx.create);
app.put('/api/fixed-expenses/:id', auth, fx.update);
app.delete('/api/fixed-expenses/:id', auth, fx.remove);

const gl = crud('goals', ['title', 'target_amount', 'current_amount', 'deadline', 'status']);
app.get('/api/goals', auth, gl.list);
app.post('/api/goals', auth, gl.create);
app.put('/api/goals/:id', auth, gl.update);
app.delete('/api/goals/:id', auth, gl.remove);

// Hesap sıfırla — kullanıcının tüm verilerini sil
app.delete('/api/reset', auth, async (req, res) => {
  const tables = ['transactions', 'subscriptions', 'fixed_expenses', 'goals', 'niko_messages', 'ai_insights'];
  const cleared = [];
  for (const t of tables) {
    try { await pool.query(`DELETE FROM ${t} WHERE user_id = ?`, [req.user_id]); cleared.push(t); } catch { }
  }
  res.json({ success: true, message: 'Verileriniz silindi.', cleared });
});

// --- FRONTEND ENTEGRASYONU ---
// 1. Statik dosyaları (CSS, JS, Resimler) servise aç
app.use(express.static(path.join(__dirname, 'dist')));

// 2. API harici tüm link tıklamalarını React (index.html) arayüzüne yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Finansal Otopilot API: http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'aktif' : 'devre dışı'}`);
});
