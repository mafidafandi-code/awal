import admin from 'firebase-admin';

// Inisialisasi Firebase Admin SDK secara aman dari Environment Variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle karakter newline \n pada private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
  });
}

const db = admin.firestore();
const collectionRef = db.collection('users_hd');

export default async function handler(req, res) {
  const { method } = req;

  try {
    // 1. GET ALL USERS (READ)
    if (method === 'GET') {
      const snapshot = await collectionRef.orderBy('createdAt', 'desc').get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return res.status(200).json({ success: true, data: users });
    }

    // 2. CREATE USER
    if (method === 'POST') {
      const { nama, email, role, shift, status } = req.body;
      const newUser = {
        nama,
        email,
        role,
        shift,
        status,
        createdAt: new Date().toISOString()
      };
      const docRef = await collectionRef.add(newUser);
      return res.status(201).json({ success: true, id: docRef.id, message: "User berhasil ditambahkan" });
    }

    // 3. UPDATE USER
    if (method === 'PUT') {
      const { id, nama, email, role, shift, status } = req.body;
      if (!id) return res.status(400).json({ success: false, message: "ID User diperlukan" });

      await collectionRef.doc(id).update({
        nama,
        email,
        role,
        shift,
        status,
        updatedAt: new Date().toISOString()
      });
      return res.status(200).json({ success: true, message: "User berhasil diperbarui" });
    }

    // 4. DELETE USER
    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: "ID User diperlukan" });

      await collectionRef.doc(id).delete();
      return res.status(200).json({ success: true, message: "User berhasil dihapus" });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);

  } catch (error) {
    console.error("Firestore Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
