<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>Crear Cuenta</h1>
        <p>Únete a TV Series Tracker</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div v-if="errors.general" class="error-message" style="margin-bottom: 1rem;">
          {{ errors.general }}
        </div>

        <div class="form-group">
          <label for="username">Nombre de Usuario</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            :class="['form-input', { error: errors.username }]"
            placeholder="Ingresa tu nombre de usuario"
            required
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            :class="['form-input', { error: errors.email }]"
            placeholder="ejemplo@correo.com"
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
              placeholder="Mínimo 8 caracteres"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="password-toggle"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>

          <div class="password-strength" v-if="form.password">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :class="passwordStrength.class"
                :style="{ width: passwordStrength.percentage + '%' }"
              ></div>
            </div>
            <span class="strength-text">{{ passwordStrength.text }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            :class="['form-input', { error: errors.confirmPassword }]"
            placeholder="Confirma tu contraseña"
            required
          />
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="form.acceptTerms"
              type="checkbox"
              class="checkbox-input"
              required
            />
            <span class="checkbox-custom"></span>
            Acepto los <a href="#" @click.prevent="showTerms = true">términos y condiciones</a>
          </label>
          <span v-if="errors.acceptTerms" class="error-message">{{ errors.acceptTerms }}</span>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="form.newsletter"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Recibir notificaciones sobre nuevas series y actualizaciones
          </label>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="submit-btn"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
        </button>
      </form>

      <div class="register-footer">
        <p>¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión aquí</router-link></p>
      </div>

      <div v-if="showTerms" class="modal-overlay" @click="showTerms = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Términos y Condiciones</h2>
            <button @click="showTerms = false" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>Al usar TV Series Tracker, aceptas los siguientes términos:</p>
            <ul>
              <li>Proporcionar información precisa y actualizada</li>
              <li>No usar la plataforma para actividades ilegales</li>
              <li>Respetar los derechos de autor del contenido</li>
              <li>Mantener la confidencialidad de tu cuenta</li>
            </ul>
            <p>Nos reservamos el derecho de suspender cuentas que violen estos términos.</p>
          </div>
          <div class="modal-footer">
            <button @click="showTerms = false" class="btn-secondary">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TursoService from '@/services/tursodb'


export default {
   name: 'RegisterView',
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
        newsletter: false
      },
      errors: {},
      loading: false,
      showPassword: false,
      showTerms: false
    }
  },
  methods: {
    validateForm() {
      this.errors = {}
      // ... tus validaciones idénticas ...
      return Object.keys(this.errors).length === 0
    },
    async handleRegister() {
      if (!this.validateForm()) return

      this.loading = true
      this.errors.general = null

      try {
        // Ya no uso bcrypt aquí, paso la contraseña tal cual:
        const userId = await TursoService.createUser(
          this.form.email,
          this.form.password,
          this.form.username
        )

        if (!userId) throw new Error('No se pudo crear el usuario')

        const userData = {
          id: userId,
          name: this.form.username,
          email: this.form.email,
          newsletter: this.form.newsletter,
          registeredAt: new Date().toISOString()
        }

        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('isAuthenticated', 'true')

        this.$router.push('/dashboard')
      } catch (error) {
        console.error('Error en registro:', error)
        this.errors.general = error.message.includes('UNIQUE')
          ? 'El correo ya está registrado.'
          : error.message
      } finally {
        this.loading = false
      }
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    }
  },
  async mounted() {
    await TursoService.initDatabase()
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.register-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.register-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: #34495e;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e0e6ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.form-input.error {
  border-color: #e74c3c;
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  background: #e0e6ed;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-fill.weak { background: #e74c3c; }
.strength-fill.medium { background: #f39c12; }
.strength-fill.strong { background: #27ae60; }
.strength-fill.very-strong { background: #2ecc71; }

.strength-text {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.checkbox-group {
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #34495e;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e6ed;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #3498db;
  border-color: #3498db;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 0.8rem;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.submit-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(52, 152, 219, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.register-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: #7f8c8d;
}

.register-footer a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.register-footer a:hover {
  text-decoration: underline;
}

.social-register {
  margin-top: 2rem;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e6ed;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.social-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #e0e6ed;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.social-btn:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.google-btn:hover {
  border-color: #db4437;
  color: #db4437;
}

.facebook-btn:hover {
  border-color: #4267b2;
  color: #4267b2;
}

.social-icon {
  font-size: 1.2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e6ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
  color: #34495e;
  line-height: 1.6;
}

.modal-body ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.modal-body li {
  margin-bottom: 0.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e6ed;
  text-align: right;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .register-container {
    padding: 1rem;
  }
  
  .register-card {
    padding: 1.5rem;
  }
  
  .social-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
