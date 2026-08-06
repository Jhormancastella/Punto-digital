/**
 * Cliente Firebase — Auth + Firestore
 * Reemplaza supabaseClient.js
 */
class FirebaseClient {
  constructor() {
    this.app    = null;
    this.auth   = null;
    this.db     = null;
    this.user   = null;
    this.ready  = false;
    this._readyPromise = this._init();
  }

  async _init() {
    try {
      const { initializeApp }     = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      const { initializeFirestore, persistentLocalCache } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      const firebaseConfig = {
        apiKey:            'AIzaSyBMAdcPFlfnVpgEdacqMKnCxo8miofhpuY',
        authDomain:        'puntodigital-a7be8.firebaseapp.com',
        projectId:         'puntodigital-a7be8',
        storageBucket:     'puntodigital-a7be8.firebasestorage.app',
        messagingSenderId: '128217781602',
        appId:             '1:128217781602:web:b8c4cf7da356a8fbf0883b'
      };

      this.app  = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);

      try {
        this.db = initializeFirestore(this.app, {
          cache: persistentLocalCache({})
        });
        console.log('✅ Persistencia offline multi-tab habilitada (nueva API cache)');
      } catch (initErr) {
        console.warn('[Firebase] initializeFirestore con cache persistente falló (usando caché en memoria):', initErr?.code || initErr?.message);
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        this.db = getFirestore(this.app);
      }

      onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        window.dispatchEvent(new CustomEvent('firebaseAuthChanged', { detail: { user } }));
      });

      this.ready = true;
      window.dispatchEvent(new CustomEvent('firebaseReady'));
      console.log('✅ Firebase inicializado correctamente');

    } catch (err) {
      console.error('❌ Error inicializando Firebase:', err);
    }
  }

  /** Espera a que Firebase esté listo */
  waitReady() {
    return this._readyPromise;
  }

  // ── Auth ──────────────────────────────────────────────────────

  async signIn(email, password) {
    await this.waitReady();
    const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    return credential.user;
  }

  async signOut() {
    await this.waitReady();
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await signOut(this.auth);
    this.user = null;
  }

  async sendPasswordReset(email) {
    await this.waitReady();
    const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await sendPasswordResetEmail(this.auth, email);
  }

  isAuthenticated() { return !!this.user; }
  getCurrentUser()  { return this.user; }

  isAdmin() {
    return this.user?.email === 'puntodigitalti@gmail.com';
  }

  // ── Firestore ─────────────────────────────────────────────────

  async getDoc(path) {
    await this.waitReady();
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref    = doc(this.db, ...path.split('/'));
    const snap   = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }

  async setDoc(path, data, merge = true) {
    await this.waitReady();
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref = doc(this.db, ...path.split('/'));
    await setDoc(ref, data, { merge });
  }

  async getCollection(path) {
    await this.waitReady();
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref  = collection(this.db, path);
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async addDoc(collectionPath, data) {
    await this.waitReady();
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref    = collection(this.db, collectionPath);
    const docRef = await addDoc(ref, data);
    return docRef.id;
  }

  async updateDoc(path, data) {
    await this.waitReady();
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref = doc(this.db, ...path.split('/'));
    await updateDoc(ref, data);
  }

  async deleteDoc(path) {
    await this.waitReady();
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref = doc(this.db, ...path.split('/'));
    await deleteDoc(ref);
  }
}

// Instancia global
window.firebaseClient = new FirebaseClient();
