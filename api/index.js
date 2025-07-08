// --- EXPORT HANDLER UNTUK VERCEL ---
// PERBAIKAN: Kita tambahkan pengecekan metode request
module.exports = async (req, res) => {
  // Hanya proses jika requestnya adalah POST (dari Telegram)
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body, res);
    } catch (err) {
      console.error("Error saat handleUpdate:", err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    // Jika bukan POST (misalnya dari browser atau health check Vercel), kirim pesan sambutan
    res.status(200).send('Halo! Ini adalah URL untuk Webhook Litera AI Bot. Bot siap menerima koneksi dari Telegram.');
  }
};
