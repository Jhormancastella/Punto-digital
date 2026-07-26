/**
 * Cliente de Supabase para autenticación y base de datos
 */
class SupabaseClient {
  constructor() {
    this.client = null;
    this.user = null;
    this.session = null;
    this.init();
  }

  async init() {
    try {
      const supabaseUrl = window.env.get('supabase.url');
      const supabaseKey = window.env.get('supabase.anonKey');

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase no configurado. Funcionando en modo offline.');
        return;
      }

      // Importar Supabase dinámicamente
      const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
      
      this.client = createClient(supabaseUrl, supabaseKey);
      
      // Escuchar cambios de autenticación
      this.client.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user || null;
        this.handleAuthChange(event, session);
      });

      // Obtener sesión actual
      const { data: { session } } = await this.client.auth.getSession();
      this.session = session;
      this.user = session?.user || null;

    } catch (error) {
      console.error('Error inicializando Supabase:', error);
    }
  }

  handleAuthChange(event, session) {
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { event, session, user: session?.user }
    }));
  }

  // Métodos de autenticación
  async signIn(email, password) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signUp(email, password, metadata = {}) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) return;
    
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }

  // Métodos de base de datos
  async select(table, query = '*', filters = {}) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    let queryBuilder = this.client.from(table).select(query);
    
    Object.entries(filters).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value);
    });

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  }

  async insert(table, data) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return result;
  }

  async update(table, id, data) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { data: result, error } = await this.client
      .from(table)
      .update(data)
      .eq('id', id)
      .select();

    if (error) throw error;
    return result;
  }

  async delete(table, id) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { error } = await this.client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Métodos de storage
  async uploadFile(bucket, path, file) {
    if (!this.client) throw new Error('Supabase no inicializado');
    
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  }

  async getPublicUrl(bucket, path) {
    if (!this.client) return null;
    
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Getters
  isAuthenticated() {
    return !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  getSession() {
    return this.session;
  }

  isAdmin() {
    return this.user?.user_metadata?.role === 'admin';
  }
}

// Instancia global
window.supabase = new SupabaseClient();