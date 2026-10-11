// server.js - Donut SMP Economy Ledger Web Server
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Security Hardening: Disable Express fingerprinting header
app.disable('x-powered-by');

// Security-Hardened CORS: Allow requests from localhost/local loopbacks, onrender.com, or native mod requests
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    try {
      const parsed = new URL(origin);
      if (/^(localhost|127\.0\.0\.1)$/.test(parsed.hostname) || parsed.hostname.endsWith('.onrender.com')) {
        return callback(null, true);
      }
    } catch (e) {}
    return callback(new Error('CORS access blocked by Donut SMP security policy.'));
  }
}));

// Standard HTTP Security Headers (OWASP Top 10 defenses)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://mineskin.eu https://mc-heads.net https://crafatar.com; connect-src 'self';"
  );
  next();
});

app.use(express.json({ limit: '100kb' })); // Body parser size limit against payload flood
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting & Cooldown In-Memory Stores
const authAttempts = new Map(); // ip -> { count, lockedUntil }
const chatSpamTracker = new Map(); // apiKey -> { lastMessage, lastSent, warningCount, mutedUntil, currentMuteSec }

function isRateLimitedAuth(ip) {
  const now = Date.now();
  const rec = authAttempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil && now < rec.lockedUntil) return true;
  if (rec.lockedUntil && now >= rec.lockedUntil) {
    authAttempts.delete(ip);
    return false;
  }
  return false;
}

function recordFailedAuth(ip) {
  const now = Date.now();
  const rec = authAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  rec.count++;
  if (rec.count >= 6) {
    rec.lockedUntil = now + 3 * 60 * 1000; // 3 minute lock
  }
  authAttempts.set(ip, rec);
}

function clearAuthAttempt(ip) {
  authAttempts.delete(ip);
}

// Direct Mod Download Endpoint
app.get(['/download/DonutLedger.jar', '/api/mod/download'], (req, res) => {
  const modPath = path.join(__dirname, 'DonutLedger.jar');
  if (fs.existsSync(modPath)) {
    return res.download(modPath, 'DonutLedger.jar');
  }
  return res.status(404).send('DonutLedger.jar not found.');
});

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Structure
const initialData = {
  players: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialData);
      return initialData;
    }
    let data = fs.readFileSync(DB_FILE, 'utf-8');
    if (data.charCodeAt(0) === 0xFEFF) {
      data = data.slice(1);
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return initialData;
  }
}

// Atomic File Writer (writes to .tmp and renames, preventing corruptions)
function writeDb(data) {
  try {
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error("Error writing database atomically:", err);
  }
}

function generateApiKey() {
  return 'dnt_sec_live_' + crypto.randomBytes(8).toString('hex');
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get Public Players (For Leaderboard & Directory)
// Only players who linked the plugin AND enabled public visibility appear here!
app.get('/api/players/public', (req, res) => {
  const db = readDb();
  const publicList = db.players
    .filter(p => p.isLinked && p.isPublic)
    .map(p => {
      const totalIncome = (p.transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalExpense = (p.transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      return {
        username: p.username,
        balance: Number(p.balance || 0),
        totalIncome,
        totalExpense,
        transactionCount: (p.transactions || []).length,
        isPublic: true,
        linkedAt: p.linkedAt || p.joinedAt
      };
    })
    .sort((a, b) => b.balance - a.balance);

  res.json({ success: true, count: publicList.length, players: publicList });
});

function extractCleanApiKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  // Strip Minecraft color codes (§0-9, §a-f, §k-o, §r)
  str = str.replace(/§[0-9a-fk-or]/gi, '');
  // Strip quotes, brackets
  str = str.replace(/^["'`\[\(]+|["'`\]\)]+$/g, '');
  // Extract pattern dnt_sec_[a-zA-Z0-9_]+ if present
  const match = str.match(/dnt_sec_[a-zA-Z0-9_]+/);
  if (match) return match[0];
  return str.trim();
}

// Cryptographically constant-time string comparison (Timing attack defense)
function secureCompareKeys(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const cleanA = extractCleanApiKey(a);
  const cleanB = extractCleanApiKey(b);
  if (!cleanA || !cleanB) return false;
  const bufA = Buffer.from(cleanA);
  const bufB = Buffer.from(cleanB);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-memory avatar buffer cache with LRU eviction (DoS protection)
const MAX_AVATAR_CACHE = 200;
const avatarCache = new Map();

// High-speed avatar proxy (bypasses browser adblockers and CORS, strictly validated)
app.get('/api/avatar/:username', async (req, res) => {
  const rawUser = (req.params.username || 'MHF_Steve').trim();
  // Strictly validate Minecraft username: 1-16 chars, letters/numbers/underscore
  const username = /^[a-zA-Z0-9_]{1,16}$/.test(rawUser) ? rawUser : 'MHF_Steve';
  const size = Math.min(128, Math.max(16, parseInt(req.query.size) || 64));
  const cacheKey = `${username.toLowerCase()}_${size}`;

  if (avatarCache.has(cacheKey)) {
    const cached = avatarCache.get(cacheKey);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cached);
  }

  // LRU Eviction: prevent unbounded memory consumption
  if (avatarCache.size >= MAX_AVATAR_CACHE) {
    const oldestKey = avatarCache.keys().next().value;
    avatarCache.delete(oldestKey);
  }

  const providers = [
    `https://mineskin.eu/helm/${encodeURIComponent(username)}/${size}.png`,
    `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`,
    `https://crafatar.com/avatars/${encodeURIComponent(username)}?size=${size}&overlay`
  ];

  for (const url of providers) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        avatarCache.set(cacheKey, buf);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buf);
      }
    } catch (e) {}
  }

  res.redirect(`https://mineskin.eu/helm/MHF_Steve/${size}.png`);
});

// 2. Login to manage profile on web (Brute-force protected)
app.post('/api/player/auth', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (isRateLimitedAuth(clientIp)) {
    return res.status(429).json({
      success: false,
      code: "RATE_LIMITED",
      message: "Çok fazla hatalı giriş denemesi yapıldı. Güvenliğiniz için 3 dakika bekleyiniz."
    });
  }

  const { username, apiKey } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Geçerli bir Minecraft kullanıcı adı giriniz." 
    });
  }

  const cleanName = username.trim();
  const db = readDb();
  const player = db.players.find(p => p.username.toLowerCase() === cleanName.toLowerCase());

  // If not linked via plugin -> REJECT
  if (!player || !player.isLinked) {
    recordFailedAuth(clientIp);
    return res.status(404).json({
      success: false,
      code: "NOT_LINKED",
      message: `"${cleanName}" adlı oyuncu henüz Donut SMP modunu kurup hesabını bağlamamış.`
    });
  }

  // API Key is strictly MANDATORY to prevent unauthorized access (Constant-Time Verified)
  if (!secureCompareKeys(apiKey, player.apiKey)) {
    recordFailedAuth(clientIp);
    return res.status(403).json({
      success: false,
      code: "INVALID_KEY",
      message: "Hatalı API Anahtarı! Oyunda /verify yazarak güncel anahtarınızı kopyalayın."
    });
  }

  clearAuthAttempt(clientIp);
  res.json({
    success: true,
    message: "Giriş başarılı.",
    player: {
      username: player.username,
      apiKey: player.apiKey,
      isPublic: player.isPublic,
      balance: Number(player.balance || 0),
      linkedAt: player.linkedAt || player.joinedAt
    }
  });
});

// 3. Get Player Profile & Ledger (respecting privacy and plugin linking)
app.get('/api/player/:username', (req, res) => {
  const targetUsername = req.params.username;
  const clientApiKey = req.headers['x-api-key'] || req.query.apiKey;

  const db = readDb();
  const player = db.players.find(p => p.username.toLowerCase() === targetUsername.toLowerCase());

  // If player does not exist or has not linked plugin -> 404
  if (!player || !player.isLinked) {
    return res.status(404).json({ 
      success: false, 
      code: "NOT_LINKED",
      message: `"${targetUsername}" adlı kullanıcı bulunamadı. Bu oyuncu henüz Donut SMP eklentisini indirip hesabını bağlamamış.` 
    });
  }

  const isOwner = secureCompareKeys(clientApiKey, player.apiKey);

  // If private and not owner -> block
  if (!player.isPublic && !isOwner) {
    return res.status(403).json({
      success: false,
      isPrivate: true,
      username: player.username,
      message: `"${player.username}" kullanıcısının finansal bilgileri gizlidir. Yalnızca oyuncunun kendisi görebilir.`
    });
  }

  const transactions = player.transactions || [];
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netCashflow = totalIncome - totalExpense;

  const isOnline = !!(player.lastSync && (Date.now() - new Date(player.lastSync).getTime() < 3 * 60 * 1000));

  res.json({
    success: true,
    isOwner: !!isOwner,
    player: {
      username: player.username,
      isPublic: player.isPublic,
      isOnline: isOnline,
      balance: Number(player.balance || 0),
      linkedAt: player.linkedAt || player.joinedAt,
      lastSync: player.lastSync || null,
      apiKey: isOwner ? player.apiKey : undefined,
      stats: {
        totalIncome,
        totalExpense,
        netCashflow,
        transactionCount: transactions.length
      },
      transactions
    }
  });
});

// 4. Toggle Privacy (Public / Private)
app.post('/api/player/privacy', (req, res) => {
  const { username, apiKey, isPublic } = req.body;
  if (!username || !apiKey) {
    return res.status(401).json({ success: false, message: "Yetkisiz işlem: API anahtarı gerekli." });
  }

  const db = readDb();
  const player = db.players.find(p => p.username.toLowerCase() === username.toLowerCase());

  if (!player || !secureCompareKeys(apiKey, player.apiKey)) {
    return res.status(403).json({ success: false, message: "Yetkilendirme hatası." });
  }

  player.isPublic = !!isPublic;
  writeDb(db);

  res.json({
    success: true,
    isPublic: player.isPublic,
    message: player.isPublic 
      ? "Profiliniz artık herkese açık! Diğer oyuncular profilinizi ve defterinizi inceleyebilir." 
      : "Profiliniz gizlendi! Bilgilerinizi yalnızca siz görebilirsiniz."
  });
});

// 5. Regenerate API Key
app.post('/api/player/regen-key', (req, res) => {
  const { username, apiKey } = req.body;
  const db = readDb();
  const player = db.players.find(p => p.username.toLowerCase() === username.toLowerCase());

  if (!player || !secureCompareKeys(apiKey, player.apiKey)) {
    return res.status(403).json({ success: false, message: "Yetkilendirme hatası." });
  }

  player.apiKey = generateApiKey();
  writeDb(db);

  // Otomatik olarak bilgisayardaki Minecraft mod konfigürasyonlarını da güncelle
  const possibleConfigs = [
    path.join(__dirname, 'config', 'donutledger.json'),
    path.join(process.env.APPDATA || '', 'ModrinthApp', 'profiles', 'main', 'config', 'donutledger.json'),
    path.join(process.env.APPDATA || '', '.minecraft', 'config', 'donutledger.json')
  ];
  for (const cfgPath of possibleConfigs) {
    try {
      if (fs.existsSync(cfgPath)) {
        const cData = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
        if (cData.username && cData.username.toLowerCase() === player.username.toLowerCase()) {
          cData.apiKey = player.apiKey;
          fs.writeFileSync(cfgPath, JSON.stringify(cData, null, 2), 'utf-8');
          console.log(`[Regen Key] Minecraft config dosyası güncellendi: ${cfgPath}`);
        }
      }
    } catch (e) {}
  }

  res.json({
    success: true,
    apiKey: player.apiKey,
    message: "Yeni API Anahtarı üretildi ve Minecraft eklentisiyle otomatik senkronize edildi."
  });
});

// 6. Manual Transaction Entry is DISABLED
// Transactions can ONLY be added via Minecraft plugin synchronization (/api/plugin/sync)
app.post('/api/transactions', (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Manuel işlem ekleme devre dışıdır. Tüm işlemler Donut SMP Minecraft eklentisi tarafından otomatik tespit edilir."
  });
});


// 7. Delete Transaction
app.delete('/api/transactions/:id', (req, res) => {
  const txId = req.params.id;
  const { username, apiKey } = req.body;

  const db = readDb();
  const player = db.players.find(p => p.username.toLowerCase() === (username || '').toLowerCase());

  if (!player || !secureCompareKeys(apiKey, player.apiKey)) {
    return res.status(403).json({ success: false, message: "Yetkisiz işlem." });
  }

  const txIndex = (player.transactions || []).findIndex(t => t.id === txId);
  if (txIndex === -1) {
    return res.status(404).json({ success: false, message: "İşlem bulunamadı." });
  }

  const [removedTx] = player.transactions.splice(txIndex, 1);
  if (removedTx.type === 'income') {
    player.balance = Number(player.balance || 0) - Number(removedTx.amount);
  } else {
    player.balance = Number(player.balance || 0) + Number(removedTx.amount);
  }

  writeDb(db);

  res.json({
    success: true,
    message: "İşlem silindi.",
    newBalance: player.balance
  });
});

// ----------------------------------------------------
// MINECRAFT PLUGIN ENDPOINTS
// ----------------------------------------------------

// 8. LINK / REGISTER FROM MINECRAFT PLUGIN
// Called when player runs in-game: `/donut link`
// Creates the player on the site, assigns API key, initial balance is 0 (or in-game balance).
app.post('/api/plugin/link', (req, res) => {
  const { username, uuid, initialBalance, apiKey } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ success: false, message: "Geçerli bir Minecraft kullanıcı adı gerekli." });
  }

  // Strictly validate Minecraft username pattern
  const cleanName = username.trim();
  if (!/^[a-zA-Z0-9_]{1,16}$/.test(cleanName)) {
    return res.status(400).json({ success: false, message: "Geçersiz Minecraft kullanıcı adı formatı." });
  }

  const db = readDb();
  let player = db.players.find(p => p.username.toLowerCase() === cleanName.toLowerCase());

  if (!player) {
    player = {
      username: cleanName,
      uuid: uuid || null,
      apiKey: generateApiKey(),
      isLinked: true,
      isPublic: false, // Default private for safety until player chooses to make public
      balance: (typeof initialBalance === 'number' && Number.isFinite(initialBalance) && initialBalance >= 0) ? initialBalance : 0,
      linkedAt: new Date().toISOString(),
      transactions: []
    };
    db.players.push(player);
  } else {
    // SECURITY HARDENING: If player exists, unauthenticated caller CANNOT hijack or leak the apiKey
    const reqKey = apiKey || req.headers['x-api-key'];
    if (!secureCompareKeys(reqKey, player.apiKey)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Bu kullanıcı hesabı zaten kayıtlı. Eşleme veya güncelleme yapmak için geçerli API Anahtarı gereklidir."
      });
    }

    player.isLinked = true;
    if (uuid) player.uuid = uuid;
    if (typeof initialBalance === 'number' && Number.isFinite(initialBalance) && typeof player.balance !== 'number') {
      player.balance = Math.max(0, initialBalance);
    }
  }

  player.lastSync = new Date().toISOString();
  writeDb(db);
  console.log(`[Plugin Link] Oyuncu bağlandı: ${cleanName} (Bakiye: $${player.balance})`);

  res.json({
    success: true,
    message: "Minecraft hesabı başarıyla web sitesine bağlandı.",
    apiKey: player.apiKey,
    player: {
      username: player.username,
      balance: player.balance,
      isPublic: player.isPublic,
      isOnline: true,
      linkedAt: player.linkedAt
    }
  });
});

// 9. MINECRAFT PLUGIN REAL-TIME SYNC
// Invoked when an in-game transaction happens (/ah, /trade, /cf, death tax, etc.)
app.post('/api/plugin/sync', (req, res) => {
  const rawKey = req.headers['x-api-key'] || req.body.apiKey;
  const apiKey = extractCleanApiKey(rawKey);
  const { balance, transaction } = req.body;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      code: "MISSING_API_KEY",
      message: "API Key bulunamadı. Lütfen Minecraft içinde '/donut link' komutunu çalıştırın."
    });
  }

  const db = readDb();
  const player = db.players.find(p => secureCompareKeys(p.apiKey, apiKey));

  if (!player) {
    return res.status(403).json({
      success: false,
      code: "INVALID_API_KEY",
      message: "Geçersiz API Key veya hesap bağlanmamış."
    });
  }

  // Update last active sync timestamp
  player.lastSync = new Date().toISOString();

  // Validate and update in-game balance if provided
  if (balance !== undefined && balance !== null) {
    const numBal = Number(balance);
    if (!Number.isFinite(numBal) || numBal < 0 || numBal > 1e15) {
      return res.status(400).json({
        success: false,
        code: "INVALID_BALANCE",
        message: "Geçersiz bakiye değeri."
      });
    }
    player.balance = numBal;
  }

  let recordedTx = null;
  if (transaction && transaction.amount !== undefined && transaction.type) {
    const numAmount = Number(transaction.amount);
    if (!Number.isFinite(numAmount) || numAmount < 0 || numAmount > 1e15) {
      return res.status(400).json({
        success: false,
        code: "INVALID_AMOUNT",
        message: "Geçersiz işlem tutarı."
      });
    }

    if (!player.transactions) player.transactions = [];

    const txType = (transaction.type === 'expense' || transaction.type === 'info') 
      ? transaction.type 
      : 'income';

    const cleanCategory = String(transaction.category || 'Donut SMP Olayı').slice(0, 50).replace(/[<>&"']/g, '');
    const cleanDescription = String(transaction.description || 'Donut SMP Oyun İçi İşlem').slice(0, 150).replace(/[<>&"']/g, '');

    recordedTx = {
      id: 'tx-mc-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
      type: txType,
      category: cleanCategory,
      amount: numAmount,
      description: cleanDescription,
      timestamp: new Date().toISOString(),
      source: 'minecraft_plugin'
    };

    player.transactions.unshift(recordedTx);

    // Keep transaction history bounded per player (500 max) to prevent memory & disk bloat
    if (player.transactions.length > 500) {
      player.transactions.length = 500;
    }

    // If explicit balance was not provided, increment/decrement (info transactions do not change balance)
    if (balance === undefined || balance === null) {
      if (txType === 'income') {
        player.balance = Number(player.balance || 0) + numAmount;
      } else if (txType === 'expense') {
        player.balance = Math.max(0, Number(player.balance || 0) - numAmount);
      }
    }
  }

  writeDb(db);

  console.log(`[Plugin Sync] ${player.username} verisi senkronize edildi. Güncel Bakiye: $${player.balance}`);

  res.json({
    success: true,
    player: player.username,
    balance: player.balance,
    transactionRecorded: recordedTx,
    isPublic: player.isPublic,
    timestamp: new Date().toISOString()
  });
});

// 10. Global Leaderboard (Only public, plugin-linked players)
app.get('/api/stats/leaderboard', (req, res) => {
  const db = readDb();
  const publicPlayers = db.players.filter(p => p.isLinked && p.isPublic);

  const leaderboard = publicPlayers.map(p => {
    const totalIncome = (p.transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpense = (p.transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    return {
      username: p.username,
      balance: Number(p.balance || 0),
      totalIncome,
      totalExpense,
      netWorth: Number(p.balance || 0),
      transactionCount: (p.transactions || []).length
    };
  }).sort((a, b) => b.balance - a.balance);

  res.json({
    success: true,
    leaderboard
  });
});

// ----------------------------------------------------
// PUBLIC CHAT API (Only Verified/Linked Players Can Talk)
// ----------------------------------------------------
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');

function readChat() {
  try {
    if (!fs.existsSync(CHAT_FILE)) {
      fs.writeFileSync(CHAT_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    let data = fs.readFileSync(CHAT_FILE, 'utf-8');
    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading chat file:", err);
    return [];
  }
}

function writeChat(messages) {
  try {
    const tmpFile = CHAT_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(messages, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CHAT_FILE);
  } catch (err) {
    console.error("Error writing chat file atomically:", err);
  }
}

const MAX_CHAT_HISTORY = 60;

// 11. Get Public Chat Messages (Rolling active history)
app.get('/api/chat/messages', (req, res) => {
  const messages = readChat();
  res.json({
    success: true,
    messages: messages.slice(-MAX_CHAT_HISTORY)
  });
});

// 12. Send Public Chat Message (Verified Players Only, Progressive Mute System)
app.post('/api/chat/send', (req, res) => {
  const rawKey = req.headers['x-api-key'] || req.body.apiKey;
  const apiKey = extractCleanApiKey(rawKey);
  const rawMessage = (req.body.message || '').trim();

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Sohbette konuşabilmek için hesabınızı doğrulamanız ve giriş yapmanız gerekir.'
    });
  }

  const now = Date.now();
  let tracker = chatSpamTracker.get(apiKey);
  if (!tracker) {
    tracker = {
      lastMessage: '',
      lastSent: 0,
      warningCount: 0,
      mutedUntil: 0,
      currentMuteSec: 60
    };
  }

  // 1. Susturulma (Mute) Kontrolü
  if (tracker.mutedUntil && now < tracker.mutedUntil) {
    const remainingSec = Math.ceil((tracker.mutedUntil - now) / 1000);
    return res.status(403).json({
      success: false,
      code: "MUTED",
      remainingSeconds: remainingSec,
      message: `Sohbetten geçici olarak susturuldunuz. Kalan süre: ${remainingSec} saniye.`
    });
  }

  if (!rawMessage || rawMessage.length === 0) {
    return res.status(400).json({ success: false, error: 'Mesaj boş olamaz.' });
  }

  if (rawMessage.length > 200) {
    return res.status(400).json({ success: false, error: 'Mesaj 200 karakterden uzun olamaz.' });
  }

  const db = readDb();
  const player = db.players.find(p => secureCompareKeys(p.apiKey, apiKey));

  if (!player || !player.isLinked) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Sadece Donut SMP modunu kurup eşlemiş onaylı oyuncular sohbete yazabilir.'
    });
  }

  // 2. Spam Tespiti (Hızlı Gönderim < 2.5s veya Aynı Mesajı Tekrarlama < 45s)
  const isFast = tracker.lastSent > 0 && (now - tracker.lastSent < 2500);
  const isRepeat = tracker.lastMessage && (tracker.lastMessage.toLowerCase() === rawMessage.toLowerCase()) && (now - tracker.lastSent < 45000);

  if (isFast || isRepeat) {
    tracker.warningCount = (tracker.warningCount || 0) + 1;

    // Eğer uyarıya rağmen devam ederse -> MUTE!
    if (tracker.warningCount >= 2) {
      const muteSec = tracker.currentMuteSec || 60;
      tracker.mutedUntil = now + muteSec * 1000;
      // Bir sonraki ihlalde mute süresi katlanarak artar (60s -> 120s -> 240s...)
      tracker.currentMuteSec = muteSec * 2;
      tracker.warningCount = 0;
      chatSpamTracker.set(apiKey, tracker);

      return res.status(403).json({
        success: false,
        code: "MUTED",
        durationSeconds: muteSec,
        remainingSeconds: muteSec,
        reason: isRepeat ? "REPEAT" : "FAST",
        message: `Spam koruması: ${isRepeat ? 'Aynı mesajı tekrar ettiğiniz' : 'Çok hızlı mesaj gönderdiğiniz'} için ${Math.round(muteSec / 60)} dakika susturuldunuz.`
      });
    }

    // İlk ihlal: Uyarı ver
    chatSpamTracker.set(apiKey, tracker);
    const waitSec = Math.max(1, Math.ceil((2500 - (now - tracker.lastSent)) / 1000));
    return res.status(429).json({
      success: false,
      code: "SPAM_WARNING",
      reason: isRepeat ? "REPEAT" : "FAST",
      waitSeconds: waitSec,
      message: isRepeat
        ? "Lütfen aynı mesajı art arda göndermeyin! Devam ederseniz 1 dakika susturulacaksınız."
        : "Çok hızlı mesaj gönderiyorsunuz! Devam ederseniz 1 dakika susturulacaksınız."
    });
  }

  // Temiz gönderim: Durumu güncelle
  tracker.lastMessage = rawMessage;
  tracker.lastSent = now;
  // 15 saniyeden uzun süre temiz mesaj atıldıysa uyarı sayacını sıfırla
  if (now - tracker.lastSent > 15000) {
    tracker.warningCount = 0;
  }
  chatSpamTracker.set(apiKey, tracker);

  // Sanitize message content
  const cleanText = rawMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const newMsg = {
    id: 'msg_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
    username: player.username,
    balance: Number(player.balance || 0),
    message: cleanText,
    timestamp: new Date().toISOString()
  };

  const messages = readChat();
  messages.push(newMsg);

  // Automatically prune older messages beyond MAX_CHAT_HISTORY so chat stays fast & fresh
  if (messages.length > MAX_CHAT_HISTORY) {
    messages.splice(0, messages.length - MAX_CHAT_HISTORY);
  }

  writeChat(messages);

  console.log(`[Public Chat] <${player.username}>: ${cleanText}`);

  res.json({
    success: true,
    message: newMsg
  });
});

// Centralized Error Handling Middleware (prevents internal stack trace & path disclosure)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(err.status || 400).json({
      success: false,
      code: "BAD_REQUEST",
      message: "Geçersiz istek biçimi veya veri gövdesi."
    });
  }
  next();
});

// Explicit 404 for unhandled API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    code: "ENDPOINT_NOT_FOUND",
    message: "İstenen API uç noktası mevcut değil."
  });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🍩 Donut SMP Ledger Sunucusu Çalışıyor: http://localhost:${PORT}`);
});
