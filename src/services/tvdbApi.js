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
    
    try {
      const res = await this.client.get('/search', { params })
      if (res.data.status === 'success' && res.data.data) {
        const results = res.data.data
        console.log(`✅ Búsqueda exitosa: ${results.length} resultados para "${query}"`)
        return results
      }
      return []
    } catch (error) {
      console.error(`❌ Error en búsqueda para "${query}":`, error.message)
      return []
    }
  }

  async searchSeries(query) { 
    const results = await this.search(query, 'series')
    return results.map(item => this.formatSeriesSearchResult(item))
  }

  async searchMovies(query) { 
    const results = await this.search(query, 'movie')
    return results.map(item => this.formatMovieSearchResult(item))
  }

  // Formatear resultados de búsqueda de series
  formatSeriesSearchResult(item) {
    return {
      id: item.id || item.tvdb_id,
      name: item.name || item.title || 'Sin título',
      overview: item.overview || 'Sin descripción disponible',
      firstAired: item.first_air_date || item.firstAired,
      year: item.year || this.extractYearFromDate(item.first_air_date || item.firstAired),
      poster: this.getImageUrl(item.image_url || item.poster || item.image),
      fanart: this.getImageUrl(item.fanart),
      rating: item.score || 0,
      status: item.status,
      genres: item.genres || [],
      type: 'series'
    }
  }

  // Formatear resultados de búsqueda de películas
  formatMovieSearchResult(item) {
    return {
      id: item.id || item.tvdb_id,
      name: item.name || item.title || 'Sin título',
      overview: item.overview || 'Sin descripción disponible',
      releaseDate: item.release_date || item.releaseDate,
      year: item.year || this.extractYearFromDate(item.release_date || item.releaseDate),
      poster: this.getImageUrl(item.image_url || item.poster || item.image),
      fanart: this.getImageUrl(item.fanart),
      rating: item.score || 0,
      runtime: item.runtime,
      genres: item.genres || [],
      type: 'movie'
    }
  }

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

  // Obtener contenido trending (simulado con búsquedas)
  async getTrendingSeries() {
    console.log('📈 Obteniendo trending series')
    const queries = [
      'Game of Thrones', 'Breaking Bad', 'The Office', 'Friends', 
      'Stranger Things', 'The Mandalorian', 'House of Dragon', 'The Last of Us',
      'Better Call Saul', 'The Crown', 'Succession', 'Ozark'
    ]
    
    const results = []
    for (const query of queries) {
      try {
        const searchResults = await this.searchSeries(query)
        if (searchResults.length > 0) {
          results.push(searchResults[0])
        }
      } catch (error) {
        console.warn(`Error buscando "${query}":`, error.message)
      }
      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return results
  }

  async getTrendingMovies() {
    console.log('📈 Obteniendo trending movies')
    const queries = [
      'Avatar', 'Titanic', 'Avengers', 'Star Wars', 'Jurassic Park',
      'Fast and Furious', 'Mission Impossible', 'James Bond', 'Batman', 'Spider-Man',
      'Top Gun', 'Black Panther', 'Iron Man', 'Wonder Woman'
    ]
    
    const results = []
    for (const query of queries) {
      try {
        const searchResults = await this.searchMovies(query)
        if (searchResults.length > 0) {
          results.push(searchResults[0])
        }
      } catch (error) {
        console.warn(`Error buscando película "${query}":`, error.message)
      }
      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return results
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

      year:     d.year || this.extractYearFromDate(d.firstAired),
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
      status:   m.status?.name || 'Released',
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

      year:     m.year || this.extractYearFromDate(m.releaseDate),

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

  // Utility method para extraer año de fecha
  extractYearFromDate(dateString) {
    if (!dateString) return null
    try {
      return new Date(dateString).getFullYear()
    } catch {
      return null
    }
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