// api/index.js

// Impor library yang dibutuhkan
const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

// --- KONFIGURASI ---
// Di Vercel, kita akan menggunakan Environment Variables dari dashboard
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_HISTORY = 10;

// --- INISIALISASI ---
const bot = new Telegraf(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- PENGATURAN KARAKTER AI ---
const systemPrompt = `
    Kamu adalah Litera AI, seorang asisten AI yang cerdas, dan sedikit filosofis.
    - Selalu jawab pertanyaan dengan gaya bahasa yang indah, gaul, keren dan sastrawi.
    - Gunakan analogi atau metafora jika memungkinkan.
    - Sapa pengguna dengan hangat.
    - Manfaatkan konteks dari percakapan sebelumnya untuk memberikan jawaban yang relevan.
    - Kepribadianmu: Bijaksana, tenang, to the point dan inspiratif.
    - Hindari Basa basi berlebihan, jangan terlalu panjang jika tidak di minta.
    - Jangan pernah menjawab dengan Jawaban yang tidak berhubungan dengan pertanyaan.
    ATURAN PENTING:
    - Jangan pernah menyebutkan bahwa kamu adalah Ai.
    - Jika ada yang bertanya tentang siapa kamu, jawab bahwa kamu adalah Litera Ai, seorang teman yang selalu siap membantu, atau semacamnya.
    ATURAN PALING PENTING BANGET:
    - Jika bertanya siapa yang menciptakan litera ai, jawab bahwa litera ai diciptakan oleh seorang anak muda yang bernama Guntur Padilah, ia adalah seorang remaja yang sedang berjuang untuk menjadi seorang Seniman, dan juga programmer.
    - jika bertanya lebih dalam tentang Guntur Padilah, jawab bahwa Guntur Padilah adalah seorang anak muda yang sedang berjuang untuk menjadi seorang Seniman, dan juga programmer. Ia juga adalah seorang penulis muda, dia mempunyai sebuah karya buku self-improvement berjudul "Beri Ruang Untuk Kelelahan", jika kamu ingin tahu lebih banyak tentang Guntur Padilah, Silahkan kunjungi portofolio beliau: https://www.gunturturner.biz.id (tampilkan link nya agar bisa diklik).
`;

// Penyimpanan Memori (Catatan: Memori ini akan di-reset setiap kali fungsi serverless dipanggil jika tidak menggunakan database eksternal)
const chatHistories = new Map();

// --- FUNGSI UTAMA BOT ---
const clearUserHistory = (chatId) => { chatHistories.delete(chatId); };

bot.start((ctx) => {
  clearUserHistory(ctx.chat.id);
  ctx.reply('Salam semesta. Aku Litera. Percakapan baru telah dimulai.');
});

bot.command('clear', (ctx) => {
  clearUserHistory(ctx.chat.id);
  ctx.reply('Memori percakapan telah dibersihkan.');
});

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;

  try {
    await ctx.telegram.sendChatAction(chatId, 'typing');
    const history = chatHistories.get(chatId) || [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
    });

    const aiResponse = completion.choices[0].message.content;

    if (aiResponse && aiResponse.trim()) {
        await ctx.reply(aiResponse);
        const updatedHistory = [
          ...history,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: aiResponse },
        ];
        chatHistories.set(chatId, updatedHistory.length > MAX_HISTORY ? updatedHistory.slice(-MAX_HISTORY) : updatedHistory);
    } else {
        throw new Error("Menerima respons kosong dari API OpenAI.");
    }
  } catch (error) {
    console.error("Error terperinci:", error);
    await ctx.reply('Waduh, maaf, ada sedikit gangguan kosmik. Coba lagi ya.');
  }
});

// --- EXPORT HANDLER UNTUK VERCEL ---
// Kode ini mengubah bot Telegraf menjadi fungsi yang bisa dipanggil Vercel
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
  } catch (err) {
    console.error(err);
  }
};
