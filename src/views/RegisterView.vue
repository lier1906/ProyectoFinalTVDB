<template>
  <div class="register-container">
    <div class="register-card">
      <!-- Header -->
      <div class="register-header">
        <button @click="goBack" class="back-button">
          <ArrowLeft class="back-icon" />
        </button>
        <h1 class="title">Sign Up</h1>
        <div class="spacer"></div>
      </div>

      <!-- Logo/Brand -->
      <div class="brand-section">
        <div class="brand-icon">
          <Tv class="tv-icon" />
        </div>
        <h2 class="brand-title">TV Tracker</h2>
        <p class="brand-subtitle">Create your account</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div v-if="errors.general" class="error-message general-error">
          {{ errors.general }}
        </div>

        <div class="form-group">
          <label for="username">Name</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            :class="['form-input', { error: errors.username }]"
            placeholder="Enter your name"
            required
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            :class="['form-input', { error: errors.email }]"
            placeholder="your@email.com"
            required
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-container">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :class="['form-input', { error: errors.password }]"
              placeholder="Minimum 8 characters"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="password-toggle"
            >
              <Eye v-if="showPassword" class="eye-icon" />
              <EyeOff v-else class="eye-icon" />
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
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            :class="['form-input', { error: errors.confirmPassword }]"
            placeholder="Confirm your password"
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
            I agree to the <a href="#" @click.prevent="showTerms = true">terms and conditions</a>
          </label>
          <span v-if="errors.acceptTerms" class="error-message">{{ errors.acceptTerms }}</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="submit-btn"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="register-footer">
        <p>Already have an account? <router-link to="/login">Sign in here</router-link></p>
      </div>

      <!-- Terms Modal -->
      <div v-if="showTerms" class="modal-overlay" @click="showTerms = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Terms and Conditions</h2>
            <button @click="showTerms = false" class="modal-close">
              <X class="close-icon" />
            </button>
          </div>
          <div class="modal-body">
            <p>By using TV Tracker, you agree to the following terms:</p>
            <ul>
              <li>Provide accurate and up-to-date information</li>
              <li>Do not use the platform for illegal activities</li>
              <li>Respect content copyrights</li>
              <li>Keep your account credentials confidential</li>
            </ul>
            <p>We reserve the right to suspend accounts that violate these terms.</p>
          </div>
          <div class="modal-footer">
            <button @click="showTerms = false" class="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Tv, Eye, EyeOff, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = ref({})
const loading = ref(false)
const showPassword = ref(false)
const showTerms = ref(false)

const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return { percentage: 0, text: '', class: '' }

  let score = 0
  let feedback = []

  // Length check
  if (password.length >= 8) score += 25
  else feedback.push('at least 8 characters')

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 25
  else feedback.push('uppercase letter')

  // Lowercase check
  if (/[a-z]/.test(password)) score += 25
  else feedback.push('lowercase letter')

  // Number or symbol check
  if (/[\d\W]/.test(password)) score += 25
  else feedback.push('number or symbol')

  let strength = 'weak'
  let className = 'weak'
  
  if (score >= 75) {
    strength = 'strong'
    className = 'strong'
  } else if (score >= 50) {
    strength = 'medium'
    className = 'medium'
  }

  return {
    percentage: score,
    text: `Password strength: ${strength}`,
    class: className
  }
})

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.username.trim()) {
    errors.value.username = 'Name is required'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!emailRegex.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }

  if (!form.value.password) {
    errors.value.password = 'Password is required'
  } else if (form.value.password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters'
  }

  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  }

  if (!form.value.acceptTerms) {
    errors.value.acceptTerms = 'You must accept the terms and conditions'
  }

  return Object.keys(errors.value).length === 0
}

const handleRegister = async () => {
  if (!validateForm()) return

  loading.value = true
  errors.value.general = null

  try {
    const success = await authStore.register(
      form.value.email,
      form.value.password,
      form.value.username
    )

    if (!success) {
      errors.value.general = 'Could not create user'
      loading.value = false
      return
    }

    uiStore.showToast('Account created successfully!', 'success')
    router.push('/')
  } catch (error) {
    console.error('Registration error:', error)
    errors.value.general = error.message.includes('UNIQUE')
      ? 'Email already registered.'
      : 'Error creating account. Please try again.'
  } finally {
    loading.value = false
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: white;
}

.register-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
}

.register-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.spacer {
  width: 40px;
}

.brand-section {
  text-align: center;
  margin-bottom: 30px;
}

.brand-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
}

.tv-icon {
  width: 30px;
  height: 30px;
  color: white;
}

.brand-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 5px;
  color: white;
}

.brand-subtitle {
  font-size: 16px;
  color: #999;
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 14px;
}

.form-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #666;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
}

.form-input.error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #999;
}

.eye-icon {
  width: 20px;
  height: 20px;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 5px;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-fill.weak { background: #ef4444; }
.strength-fill.medium { background: #f59e0b; }
.strength-fill.strong { background: #22c55e; }

.strength-text {
  font-size: 12px;
  color: #999;
}

.checkbox-group {
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #ccc;
  line-height: 1.4;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
}

.checkbox-label a {
  color: #667eea;
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 5px;
}

.general-error {
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  margin-bottom: 10px;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.register-footer {
  text-align: center;
  margin-top: 25px;
  font-size: 14px;
  color: #999;
}

.register-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-footer a:hover {
  text-decoration: underline;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #2a2a2a;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 5px;
}

.close-icon {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 20px;
  color: #ccc;
  line-height: 1.6;
}

.modal-body ul {
  margin: 15px 0;
  padding-left: 20px;
}

.modal-body li {
  margin-bottom: 8px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: right;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 480px) {
  .register-container {
    padding: 15px;
  }
  
  .register-card {
    padding: 25px;
  }
  
  .checkbox-label {
    font-size: 13px;
  }
}
</style>