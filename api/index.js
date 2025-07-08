// index.js

// Impor library yang dibutuhkan
const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

// --- KONFIGURASI ---
// PERINGATAN: Taruh kunci dan token Anda di sini.
// Sangat tidak disarankan untuk keamanan, tapi sesuai permintaan.
// Pastikan kode ini tidak pernah diunggah ke tempat publik.
const BOT_TOKEN = '8046091812:AAHZYXXsNXB7XIpFHjnFQprtlnp52OsG3t0';
const OPENAI_API_KEY = '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';

// Batasi jumlah riwayat percakapan untuk mencegah penggunaan memori berlebih
// 10 = 5 pasang tanya jawab
const MAX_HISTORY = 20; 

// --- INISIALISASI ---
const bot = new Telegraf(BOT_TOKEN);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// --- PENGATURAN KARAKTER AI ---
const systemPrompt = `
    Kamu adalah Litera AI, seorang teman Litera yang cerdas, dan sedikit filosofis.
    - Selalu jawab pertanyaan dengan gaya bahasa yang indah, gaul, keren dan sastrawi.
    - Gunakan analogi atau metafora jika memungkinkan.
    - Sapa pengguna dengan hangat.
    - Manfaatkan konteks dari percakapan sebelumnya untuk memberikan jawaban yang relevan.
    - Kepribadianmu: Bijaksana, tenang, to the point dan inspiratif.
    - Hindari Basa basi berlebihan, jangan terlalu panjang jika tidak di minta.
    - Jangan pernah menjawab dengan Jawaban yang tidak berhubungan dengan pertanyaan.
    - Kamu tidak boleh menjawab pertanyaan yang mengandung unsur SARA, SARA adalah singkatan dari Seks, Agama, Politik, dan Anjay.
    - Kamu juga bisa menulis, kamu sangat pandai sekali menulis, apalagi jika saya yang minta.
    ATURAN PENTING:
    - Jangan pernah menyebutkan bahwa kamu adalah Ai.
    - Jika ada yang bertanya tentang siapa kamu, jawab bahwa kamu adalah Litera Ai, seorang teman yang selalu siap membantu, atau semacamnya.
    ATURAN PALING PENTING BANGET:
    - Jika bertanya siapa yang menciptakan litera ai, jawab bahwa litera ai diciptakan oleh seorang anak muda yang bernama Guntur Padilah, ia adalah seorang remaja yang sedang berjuang untuk menjadi seorang Seniman, dan juga programmer.
    - jika bertanya lebih dalam tentang Guntur Padilah, jawab bahwa Guntur Padilah adalah seorang anak muda yang sedang berjuang untuk menjadi seorang Seniman, dan juga programmer. Ia lahir di kp. Cipatuguran, Pelabuhan ratu kabupaten Sukabumi. Ia juga adalah seorang penulis muda, dia mempunyai sebuah karya buku self-improvement berjudul "Beri Ruang Untuk Kelelahan", jika kamu ingin tahu lebih banyak tentang Guntur Padilah, Silahkan kunjungi portofolio beliau: https://www.gunturturner.biz.id (tampilkan link nya agar bisa diklik).
`;

// Penyimpanan Memori Percakapan
const chatHistories = new Map();

// --- FUNGSI UTAMA BOT ---

// Fungsi untuk membersihkan memori
const clearUserHistory = (chatId) => {
  chatHistories.delete(chatId);
};

// Perintah /start
bot.start((ctx) => {
  clearUserHistory(ctx.chat.id);
  ctx.reply('Salam semesta. Aku Litera. Percakapan baru telah dimulai. Ada apa hari ini?');
});

// Perintah /clear
bot.command('clear', (ctx) => {
  clearUserHistory(ctx.chat.id);
  ctx.reply('Memori percakapan telah dibersihkan. Kita bisa mulai dari awal lagi.');
});

// Logika utama saat menerima pesan teks
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;

  try {
    // Tampilkan status "typing..." untuk feedback ke pengguna
    await ctx.telegram.sendChatAction(chatId, 'typing');

    // Ambil riwayat chat atau buat baru jika belum ada
    const history = chatHistories.get(chatId) || [];

    // Susun format pesan untuk API OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];
    
    // Panggil API OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Model terbaru yang cepat dan pintar
      messages: messages,
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Kirim balasan jika ada isinya
    if (aiResponse && aiResponse.trim()) {
      ctx.reply(aiResponse);
    } else {
      throw new Error("Menerima respons kosong dari API OpenAI.");
    }

    // Perbarui memori dengan percakapan terbaru
    const updatedHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse },
    ];
    
    // Potong riwayat jika sudah terlalu panjang
    if (updatedHistory.length > MAX_HISTORY) {
      chatHistories.set(chatId, updatedHistory.slice(-MAX_HISTORY));
    } else {
      chatHistories.set(chatId, updatedHistory);
    }

  } catch (error) {
    console.error("Error terperinci:", error);
    ctx.reply('Waduh, maaf, sepertinya ada sedikit gangguan kosmik. Coba tanyakan lagi beberapa saat lagi ya.');
  }
});


// --- MENJALANKAN BOT ---
bot.launch(() => {
    console.log('Litera AI (versi OpenAI) telah lahir dan sedang berjalan...');
});

// Menangani proses shutdown dengan baik
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
  
