const admin = require('firebase-admin');

// Inisialisasi Firebase Admin privat dari Environment Variables Vercel
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.database();
const ref = db.ref('data_laporan'); // Nama tempat penyimpanan data kamu

module.exports = async (req, res) => {
  // Set Header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. READ: Ambil Semua Data
    if (req.method === 'GET') {
      const snapshot = await ref.once('value');
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      return res.status(200).json(list);
    }

    // 2. CREATE: Tambah Data Baru
    if (req.method === 'POST') {
      const { nama, keterangan } = req.body;
      const newRef = ref.push();
      const newItem = {
        id: newRef.key,
        nama,
        keterangan,
        createdAt: Date.now()
      };
      await newRef.set(newItem);
      return res.status(200).json({ success: true, item: newItem });
    }

    // 3. DELETE: Hapus Data Berdasarkan ID
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await ref.child(id).remove();
      return res.status(200).json({ success: true });
    }

    return res.status(405).send('Method Not Allowed');
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
