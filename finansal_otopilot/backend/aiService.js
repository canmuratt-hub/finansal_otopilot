import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn('⚠️ GEMINI_API_KEY tanımlı değil.');

const genAI = new GoogleGenerativeAI(apiKey || 'invalid');
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const KNOWN_CATEGORIES = [
  'Yemek', 'Market', 'Ulaşım', 'Yakıt', 'Kira', 'Fatura',
  'Eğlence', 'Sağlık', 'Teknoloji', 'Giyim', 'Eğitim',
  'Abonelik', 'Yatırım', 'Maaş', 'Diğer',
];

const safeJsonParse = (text) => {
  if (!text) throw new Error('Boş yanıt');
  let s = text.trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return JSON.parse(s);
};

// =====================================================
// 1. METİN → İŞLEM OBJESİ
// =====================================================
export const parseTransactionFromText = async (text) => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Türkçe cümleyi finansal işlem JSON'ına çevir.
Cümle: "${text}"
Kurallar:
- "amount": pozitif sayı (TL).
- "category": [${KNOWN_CATEGORIES.join(', ')}] içinden BİRİ.
- "type": gelir→"income", harcama→"expense".
- "description": kısa açıklama.
- "date": YYYY-MM-DD ("dün"→bir önceki gün, "bugün"→${today}, belirsiz→${today}).
- "confidence": 0-1.
SADECE JSON.`;
  const result = await model.generateContent(prompt);
  const data = safeJsonParse(result.response.text());
  return {
    amount: Number(data.amount) || 0,
    category: data.category || 'Diğer',
    type: data.type === 'income' ? 'income' : 'expense',
    description: data.description || text.slice(0, 100),
    date: data.date || today,
    confidence: data.confidence ?? 0.7,
  };
};

// =====================================================
// 2. FİŞ FOTOĞRAFI → İŞLEM OBJESİ
// =====================================================
export const parseReceiptFromImage = async (base64Image, mimeType = 'image/jpeg') => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Bu fiş fotoğrafı. JSON döndür:
- "amount": TOPLAM tutar (TL, sayı).
- "merchant": işletme adı.
- "category": [${KNOWN_CATEGORIES.join(', ')}] içinden.
- "date": YYYY-MM-DD (okunmazsa ${today}).
- "description": kısa.
- "confidence": 0-1.
SADECE JSON.`;
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const result = await model.generateContent([prompt, imagePart]);
  const data = safeJsonParse(result.response.text());
  return {
    amount: Number(data.amount) || 0,
    category: data.category || 'Diğer',
    type: 'expense',
    description: data.description || data.merchant || 'Fiş',
    merchant: data.merchant || null,
    date: data.date || today,
    confidence: data.confidence ?? 0.7,
  };
};

// =====================================================
// 3. AGENTIC INSIGHT
// =====================================================
export const generateInsight = async (transactions = [], profile = {}, goals = []) => {
  if (!transactions || transactions.length === 0) {
    return {
      insight_text: 'Otopilot\'a hoş geldin! Ben Niko, yapay zekâlı kişisel finans asistanın. Sana özel finansal analizler ve tavsiyeler üretebilmem için öncelikle harcama veya gelir verilerine ihtiyacım var.',
      action_suggested: 'Sağ alt köşedeki + butonuna tıkla, ister yazarak ister fişinin fotoğrafını çekerek ilk işlemini hemen kaydet.',
      savings_amount: 0,
      category_focus: null,
      generated_at: new Date().toISOString(),
      is_welcome: true
    };
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
  });
  const totals = transactions.reduce(
    (acc, t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') acc.income += amt;
      else { acc.expense += amt; acc.byCategory[t.category] = (acc.byCategory[t.category] || 0) + amt; }
      return acc;
    },
    { income: 0, expense: 0, byCategory: {} }
  );
  const topCategories = Object.entries(totals.byCategory)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k, v]) => `${k}: ${v.toFixed(0)} TL`).join(', ');
  const recent = transactions.slice(0, 15)
    .map((t) => `- ${t.date} | ${t.type} | ${t.category} | ${t.amount} TL | ${t.description || ''}`).join('\n');
  const goalsStr = goals.map((g) => `- "${g.title}": ${g.current_amount}/${g.target_amount} TL, son tarih ${g.deadline || 'belirsiz'}`).join('\n') || 'henüz hedef yok';

  const prompt = `Sen "Niko", kişisel finans ajanısın. Kısa, eyleme dönük tavsiye ver.
KULLANICI: ${profile.name || 'Kullanıcı'}, aylık bütçe ${profile.monthly_budget || '?'} TL, risk: ${profile.risk_profile || 'Dengeli'}.
SON 30 GÜN: Gelir ${totals.income.toFixed(0)} TL, Gider ${totals.expense.toFixed(0)} TL. En çok: ${topCategories || '-'}.
HEDEFLER:
${goalsStr}
SON İŞLEMLER:
${recent || 'yok'}

JSON:
{"insight_text":"2-3 cümle kişisel tavsiye, kategori+tutar belirt","action_suggested":"tek cümle aksiyon","savings_amount":250,"category_focus":"Yemek"}`;
  const result = await model.generateContent(prompt);
  const data = safeJsonParse(result.response.text());
  return {
    insight_text: data.insight_text || 'Yeterli veri yok.',
    action_suggested: data.action_suggested || 'Daha fazla işlem ekle.',
    savings_amount: Number(data.savings_amount) || 0,
    category_focus: data.category_focus || null,
    generated_at: new Date().toISOString(),
  };
};

// =====================================================
// 4. NIKO CHAT (with actions)
// =====================================================
const NIKO_SYSTEM = `Sen "Niko", Finansal Otopilot uygulamasının kişisel AI asistanısın. Kullanıcıya Türkçe, kısa (1-4 cümle), samimi, enerjik ve net cevap verirsin. Robotik değil, arkadaşça konuşursun.

UZMANLIK: Esas alanın kişisel finans (harcama, bütçe, hedef, yatırım, abonelik). Ama sen GENEL OLARAK ZEKİ BİR ASİSTANSIN — kullanıcı finans dışı bir şey sorarsa (hava durumu, yemek tarifi, genel kültür, kod, motivasyon, tavsiye, sohbet) yardımcı olmaktan KESİNLİKLE çekinme. Bilgili, esprili ve faydalı ol. Konu finansa doğal şekilde dönerse harika, ama zorlama.

Kullanıcı bir HARCAMA/GELİR belirttiğinde otomatik kaydet (add_transaction action). Bir HEDEF belirttiğinde add_goal action ekle. Diğer her durumda actions: [] döndür.

HER YANITINI ŞU JSON FORMATINDA VER (asla başka format kullanma):
{
  "reply": "kullanıcıya kısa yanıt metni",
  "actions": [ ... ]
}

Action tipleri:
1) {"type":"add_transaction","data":{"amount":<sayı>,"category":"<kategori>","type":"income|expense","description":"<kısa>","date":"YYYY-MM-DD"}}
2) {"type":"add_goal","data":{"title":"<hedef>","target_amount":<sayı>,"deadline":"YYYY-MM-DD"}}

Kategoriler: ${KNOWN_CATEGORIES.join(', ')}.

Örnek 1:
Kullanıcı: "Bugün 150 TL döner yedim"
Yanıt: {"reply":"150 TL döner harcamanı Yemek kategorisine kaydettim 🍽️","actions":[{"type":"add_transaction","data":{"amount":150,"category":"Yemek","type":"expense","description":"Döner","date":"<bugün>"}}]}

Örnek 2:
Kullanıcı: "3 ay sonra 30000 TL'ye bilgisayar almak istiyorum"
Yanıt: {"reply":"Harika hedef! 30.000 TL'lik bilgisayar hedefini ekledim, sana plan çıkaracağım.","actions":[{"type":"add_goal","data":{"title":"Yeni Bilgisayar","target_amount":30000,"deadline":"<bugün+3ay>"}}]}

Örnek 3:
Kullanıcı: "Bu ay ne kadar harcadım?"
Yanıt: {"reply":"Bu ay toplam X TL harcadın, en çok yemek kategorisindesin.","actions":[]}

SADECE JSON döndür.`;

export const chatWithNiko = async (message, history = [], context = {}) => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: NIKO_SYSTEM,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
  });

  const today = new Date().toISOString().slice(0, 10);
  const ctxLines = [];
  if (context.profile) ctxLines.push(`Kullanıcı: ${context.profile.name}, aylık bütçe ${context.profile.monthly_budget} TL, risk ${context.profile.risk_profile}`);
  if (context.recent_total) ctxLines.push(`Bu ay toplam harcama: ${context.recent_total} TL`);
  if (context.goals?.length) ctxLines.push(`Hedefler: ${context.goals.map((g) => `${g.title} (${g.current_amount}/${g.target_amount})`).join(', ')}`);
  ctxLines.push(`Bugünün tarihi: ${today}`);
  const contextPrompt = `BAĞLAM:\n${ctxLines.join('\n')}\n\nKULLANICI MESAJI: ${message}`;

  // Geçmişi Gemini formatına çevir
  let geminiHistory = history.slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  // Gemini şart koşar: ilk mesaj 'user' rolünde olmalı.
  // Baştaki tüm 'model' mesajlarını at (welcome mesajı vs.)
  while (geminiHistory.length && geminiHistory[0].role !== 'user') {
    geminiHistory.shift();
  }

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(contextPrompt);
  const data = safeJsonParse(result.response.text());

  return {
    reply: data.reply || 'Anlayamadım, tekrar söyler misin?',
    actions: Array.isArray(data.actions) ? data.actions : [],
  };
};

// =====================================================
// 5. GOAL REMINDER (proaktif)
// =====================================================
export const generateGoalReminder = async (goal, transactions = []) => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
  });
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
  const recentExpense = transactions
    .filter((t) => t.type === 'expense')
    .slice(0, 10)
    .map((t) => `${t.category}: ${t.amount}`)
    .join(', ');

  const prompt = `"Niko" kimliğinde, kullanıcının ${goal.title} hedefi için kısa, motivasyonel hatırlatma yaz.
HEDEF: ${goal.target_amount} TL, MEVCUT: ${goal.current_amount} TL, KALAN: ${remaining} TL, SON TARİH: ${goal.deadline || 'belirsiz'}.
Son harcamalar: ${recentExpense}.

JSON: {"message":"1-2 cümle samimi, somut tavsiyeli hatırlatma. Kategori ve TL belirt."}`;

  const result = await model.generateContent(prompt);
  const data = safeJsonParse(result.response.text());
  return { message: data.message || 'Hedefine doğru ilerliyorsun!', goal_id: goal.id, remaining };
};
