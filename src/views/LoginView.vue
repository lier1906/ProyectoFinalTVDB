<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">Iniciar Sesión</h1>
      <p class="subtitle">Bienvenido de vuelta a TV Series Tracker</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            :class="['form-input', { error: errors.email }]"
            placeholder="ejemplo@correo.com"
            autocomplete="username"
            required
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-input-container">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :class="['form-input', { error: errors.password }]"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              required
            />
            <button type="button" @click="togglePasswordVisibility" class="password-toggle">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div v-if="errors.general" class="error-message general-error">{{ errors.general }}</div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="login-footer">
        <p>¿No tienes una cuenta? <router-link to="/register">Regístrate aquí</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import tursodb from '@/services/tursodb';

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      errors: {},
      loading: false,
      showPassword: false
    };
  },
  methods: {
    validateForm() {
      this.errors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!this.form.email.trim()) {
        this.errors.email = 'El correo electrónico es requerido';
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = 'Por favor ingresa un correo electrónico válido';
      }

      if (!this.form.password) {
        this.errors.password = 'La contraseña es requerida';
      }

      return Object.keys(this.errors).length === 0;
    },

    async handleLogin() {
      if (!this.validateForm()) return;

      this.loading = true;
      this.errors.general = null;

      try {
        console.log('Intentando login con:', this.form.email); // Debug
        
        // Usa el método verifyUserCredentials que ya tienes en tursodb
        const user = await tursodb.verifyUserCredentials(this.form.email, this.form.password);

        if (!user) {
          this.errors.general = 'Credenciales inválidas. Verifica tu email y contraseña.';
          this.loading = false;
          return;
        }

        console.log('Login exitoso:', user); // Debug

        // Login exitoso: guarda info en localStorage
        const userData = {
          id: user.id,
          name: user.name, // Cambiado de 'username' a 'name' según tu BD
          email: user.email,
          loginAt: new Date().toISOString()
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');

        // Redirige al dashboard
        this.$router.push('/dashboard');

      } catch (error) {
        console.error('Login error:', error);
        this.errors.general = 'Error al conectar con la base de datos. Inténtalo más tarde.';
      } finally {
        this.loading = false;
      }
    },

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    }
  }
};
</script>

<style scoped>
/* Contenedor oscuro y centrado */
.login-container {
  min-height: 100vh;
  background: #121212;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #eee;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-card {
  background: #1e1e1e;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.7);
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 0.2rem;
  font-weight: 700;
  color: #f5f5f5;
}

.subtitle {
  font-size: 1rem;
  color: #bbb;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  text-align: left;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: #ccc;
  display: block;
}

.form-input {
  background: #2b2b2b;
  border: 1.8px solid #444;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: #eee;
  transition: border-color 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
  background: #3c3c3c;
}

.form-input.error {
  border-color: #e74c3c;
  background: #3a1e1e;
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #aaa;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #f5f5f5;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.3rem;
}

.general-error {
  background: #4a1f1f;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.submit-btn {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 0.85rem 0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-top: 0.8rem;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #357ABD;
}

.submit-btn:disabled {
  background: #2a5a8a;
  cursor: not-allowed;
}

.loading-spinner {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

.login-footer {
  margin-top: 1.8rem;
  font-size: 0.9rem;
  color: #999;
}

.login-footer a {
  color: #4a90e2;
  text-decoration: none;
  font-weight: 600;
}

.login-footer a:hover {
  text-decoration: underline;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
}
</style>