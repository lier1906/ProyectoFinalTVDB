// services/tvdbApi.js
import axios from 'axios'

const TVDB_BASE_URL = 'https://api4.thetvdb.com/v4'

class TVDBApi {
  constructor() {
    this.token = null
    this.tokenExpiry = null
    this.apiKey = import.meta.env.VITE_TVDB_API_KEY
    this.pin = import.meta.env.VITE_TVDB_PIN

    this.client = axios.create({
      baseURL: TVDB_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    })

    // Agrega token automáticamente
    this.client.interceptors.request.use(
      async config => {
        if (this.shouldAuthenticate() && config.url !== '/login') {
          await this.authenticate()
        }
        if (this.token && config.url !== '/login') {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    // Reintenta en 401
    this.client.interceptors.response.use(
      res => res,
      async error => {
        if (error.response?.status === 401 && error.config.url !== '/login') {
          this.token = null
          this.tokenExpiry = null
          await this.authenticate()
          return this.client.request(error.config)
        }
        return Promise.reject(error)
      }
    )
  }

  shouldAuthenticate() {
    if (!this.token || !this.tokenExpiry) return true
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
    return this.tokenExpiry.getTime() <= fiveMinutesFromNow
  }

  async authenticate() {
    console.log('🔐 Autenticando con TheTVDB...')
    if (!this.apiKey || !this.pin) {
      throw new Error('API Key o PIN no configurados')
    }
    const response = await this.client.post('/login', {
      apikey: this.apiKey,
      pin: this.pin
    })
    if (response.data.status === 'success' && response.data.data?.token) {
      this.token = response.data.data.token
      this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      console.log('✅ Autenticación exitosa')
      return this.token
    }
    throw new Error('Error en respuesta de autenticación')
  }

  validateAndCleanId(id) {
    if (!id) throw new Error('ID no proporcionado')
    let cleanId = String(id).trim()
    if (!cleanId) throw new Error('ID vacío después de limpieza')
    const m = cleanId.match(/(\d+)$/)
    if (m) {
      cleanId = m[1]
      console.log(`🔧 ID transformado: "${id}" → "${cleanId}"`)
    }
    if (!/^\d+$/.test(cleanId)) {
      throw new Error(`ID inválido: ${id}`)
    }
    return cleanId
  }

  async search(query, type = null) {
    if (!query?.trim()) throw new Error('Query vacío')
    const params = { query: query.trim() }
    if (type) params.type = type
    console.log('🔍 Buscando:', params)
    const res = await this.client.get('/search', { params })
    return res.data.status === 'success' ? res.data.data || [] : []
  }

  async searchSeries(q)  { return this.search(q, 'series') }
  async searchMovies(q)  { return this.search(q, 'movie')   }

  async getSeriesById(id, extended = true) {
    const cleanId = this.validateAndCleanId(id)
    const endpoint = extended ? `/series/${cleanId}/extended` : `/series/${cleanId}`
    console.log(`📺 Obteniendo serie ID: ${cleanId}`)
    const res = await this.client.get(endpoint)
    if (res.data.status === 'success' && res.data.data) {
      return this.formatSeriesData(res.data.data)
    }
    throw new Error('Serie no encontrada')
  }

  async getSeriesEpisodes(seriesId, page = 0) {
    const cleanId = this.validateAndCleanId(seriesId)
    console.log(`📺 Obteniendo episodios serie ID: ${cleanId}`)
    const res = await this.client.get(`/series/${cleanId}/episodes/default`, { params: { page } })
    if (res.data.status === 'success') {
      return {
        episodes: res.data.data.episodes || [],
        links:    res.data.data.links    || {}
      }
    }
    return { episodes: [], links: {} }
  }

  async getSeriesSeasons(seriesId) {
    const cleanId = this.validateAndCleanId(seriesId)
    console.log(`🗂 Obteniendo temporadas serie ID: ${cleanId}`)
    const res = await this.client.get(`/series/${cleanId}/extended`)
    if (res.data.status === 'success' && res.data.data.seasons) {
      return res.data.data.seasons.map(s => ({
        id:      s.id,
        number:  s.number,
        name:    s.name,
        overview:s.overview,
        image:   this.getImageUrl(s.image),
        episodes:s.episodes || []
      }))
    }
    return []
  }

  async getMovieById(id, extended = true) {
    const cleanId = this.validateAndCleanId(id)
    const endpoint = extended ? `/movies/${cleanId}/extended` : `/movies/${cleanId}`
    console.log(`🎬 Obteniendo película ID: ${cleanId}`)
    const res = await this.client.get(endpoint)
    if (res.data.status === 'success' && res.data.data) {
      return this.formatMovieData(res.data.data)
    }
    throw new Error('Película no encontrada')
  }

  // 👉 Simulación simple
  async getTrending(type = 'series') {
    console.log(`📈 Obteniendo trending ${type}`)
    const fallback = type === 'movie' ? 'm' : 'a'
    return this.search(fallback, type)
  }

  // 🔄 Ahora sí devolvemos detalles completos
  async getTrendingSeries() {
    try {
      console.log('📈 Obteniendo trending series detalladas')
      const raw = await this.getTrending('series')
      const full = await Promise.all(
        raw.map(item => this.getSeriesById(item.id, true))
      )
      return full
    } catch (err) {
      console.error('❌ Error en getTrendingSeries:', err)
      return []
    }
  }

  async getTrendingMovies() {
    try {
      console.log('📈 Obteniendo trending movies detalladas')
      const raw = await this.getTrending('movie')
      const full = await Promise.all(
        raw.map(item => this.getMovieById(item.id, true))
      )
      return full
    } catch {
      return []
    }
  }

  formatSeriesData(d) {
    if (!d) throw new Error('Datos de serie vacíos')
    return {
      id:       d.id,
      name:     d.name || 'Sin título',
      slug:     d.slug,
      overview: d.overview || 'Sin descripción disponible',
      firstAired: d.firstAired,
      lastAired:  d.lastAired,
      status:   d.status?.name || 'Unknown',
      rating:   d.score || 0,
      genres:   d.genres?.map(g => g.name) || [],
      networks: d.networks?.map(n => n.name) || [],
      companies:d.companies?.map(c => c.name) || [],
      country:  d.country,
      language: d.originalLanguage,

      poster:   this.getImageUrl(d.image),
      fanart:   this.getImageUrl(d.fanart),
      banner:   this.getImageUrl(d.banner),

      seasons:  d.seasons || [],
      episodes: d.episodes || [],

      year:     d.year,
      airsTime: d.airsTime,
      airsDays: d.airsDays,
      runtime:  d.runtime,

      originalData: d
    }
  }

  formatMovieData(m) {
    if (!m) throw new Error('Datos de película vacíos')
    return {
      id:       m.id,
      name:     m.name || 'Sin título',
      slug:     m.slug,
      overview: m.overview || 'Sin descripción disponible',
      releaseDate: m.releaseDate,
      status:   m.status?.name || 'Unknown',
      rating:   m.score || 0,
      runtime:  m.runtime,
      genres:   m.genres?.map(g => g.name) || [],
      studios:  m.studios?.map(s => s.name) || [],
      companies:m.companies?.map(c => c.name) || [],
      country:  m.country,
      language: m.originalLanguage,

      poster:   this.getImageUrl(m.image),
      fanart:   this.getImageUrl(m.fanart),
      banner:   this.getImageUrl(m.banner),

      originalData: m
    }
  }

  getImageUrl(imagePath) {
    if (!imagePath) return null
    let p = String(imagePath).trim()
    // URL absoluta malformada?
    if (/^https?:\/\/?/i.test(p)) {
      // corrige 'https//...' → 'https://...'
      return p.replace(/^https?:\/\//i, 'https://')
    }
    // path relativo
    if (!p.startsWith('/')) p = '/' + p
    return `https://artworks.thetvdb.com${p}`
  }

  // Para debug
  async debugSeriesId(id) {
    console.log('🐛 Debug ID:', id, typeof id)
    const clean = this.validateAndCleanId(id)
    console.log('🐛 Clean ID:', clean)
    const res = await this.client.get(`/series/${clean}`)
    console.log('🐛 Respuesta básica:', res.data)
    return res.data
  }
}

const tvdbApi = new TVDBApi()
export default tvdbApi
