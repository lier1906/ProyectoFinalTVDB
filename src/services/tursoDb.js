// src/services/tursodb.js
import { createClient } from '@libsql/client/web'
import bcrypt from 'bcryptjs'

const client = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN
})

class TursoService {
  async initDatabase() {
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // MIGRACIÓN FORZADA: Recrear tablas con item_type, is_movie y poster_url
      console.log('🔄 Iniciando migración de base de datos...')

      // 1. Crear tabla temporal de favorites con la nueva estructura
      await client.execute(`
        CREATE TABLE IF NOT EXISTS favorites_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          series_id INTEGER NOT NULL,
          series_name TEXT NOT NULL,
          series_poster TEXT,
          item_type TEXT DEFAULT 'series',
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, series_id, item_type)
        )
      `)

      // 2. Copiar datos existentes de favorites (si existe)
      try {
        await client.execute(`
          INSERT OR IGNORE INTO favorites_new (user_id, series_id, series_name, series_poster, item_type, added_at)
          SELECT user_id, series_id, series_name, series_poster, 'series', added_at 
          FROM favorites
        `)
        console.log('✅ Datos de favorites migrados')
      } catch (e) {
        console.log('ℹ️ Tabla favorites no existía, creando nueva')
      }

      // 3. Eliminar tabla antigua y renombrar nueva
      await client.execute(`DROP TABLE IF EXISTS favorites`)
      await client.execute(`ALTER TABLE favorites_new RENAME TO favorites`)

      // 4. Repetir para watchlist
      await client.execute(`
        CREATE TABLE IF NOT EXISTS watchlist_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          series_id INTEGER NOT NULL,
          series_name TEXT NOT NULL,
          series_poster TEXT,
          item_type TEXT DEFAULT 'series',
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, series_id, item_type)
        )
      `)

      try {
        await client.execute(`
          INSERT OR IGNORE INTO watchlist_new (user_id, series_id, series_name, series_poster, item_type, added_at)
          SELECT user_id, series_id, series_name, series_poster, 'series', added_at 
          FROM watchlist
        `)
        console.log('✅ Datos de watchlist migrados')
      } catch (e) {
        console.log('ℹ️ Tabla watchlist no existía, creando nueva')
      }

      await client.execute(`DROP TABLE IF EXISTS watchlist`)
      await client.execute(`ALTER TABLE watchlist_new RENAME TO watchlist`)

      // 5. Crear tabla watched con is_movie y poster_url
      await client.execute(`
        CREATE TABLE IF NOT EXISTS watched_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          series_id INTEGER NOT NULL,
          episode_id TEXT NOT NULL,
          series_name TEXT NOT NULL,
          episode_name TEXT,
          season_number INTEGER,
          episode_number INTEGER,
          poster_url TEXT,
          is_movie INTEGER DEFAULT 0,
          watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, series_id, episode_id)
        )
      `)

      // Migrar datos existentes de watched
      try {
        await client.execute(`
          INSERT OR IGNORE INTO watched_new (user_id, series_id, episode_id, series_name, episode_name, season_number, episode_number, is_movie, watched_at)
          SELECT user_id, series_id, episode_id, series_name, episode_name, season_number, episode_number, 
                 CASE WHEN episode_id LIKE 'movie_%' THEN 1 ELSE 0 END, watched_at 
          FROM watched
        `)
        console.log('✅ Datos de watched migrados')
      } catch (e) {
        console.log('ℹ️ Tabla watched no existía, creando nueva')
      }

      await client.execute(`DROP TABLE IF EXISTS watched`)
      await client.execute(`ALTER TABLE watched_new RENAME TO watched`)

      console.log('✅ Database migration completed successfully')
    } catch (error) {
      console.error('❌ Error initializing database:', error)
      throw error
    }
  }

  // =================== USUARIOS ===================
  
  // REGISTRO SIN HASH
  async createUser(email, password, name) {
    try {
      console.log('👤 Creating user:', { email, name })
      const result = await client.execute({
        sql: 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        args: [email, password, name]
      })
      console.log('✅ User created with ID:', result.lastInsertRowid.toString())
      return result.lastInsertRowid.toString()
    } catch (error) {
      console.error('❌ Error creating user:', error)
      throw error
    }
  }
  
  // CONSULTAR USUARIO POR EMAIL
  async getUserByEmail(email) {
    try {
      console.log('🔍 Getting user by email:', email)
      const result = await client.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      })
      const user = result.rows[0] || null
      console.log(user ? '✅ User found' : '❌ User not found')
      return user
    } catch (error) {
      console.error('❌ Error getting user by email:', error)
      throw error
    }
  }

  // VERIFICAR LOGIN SIN HASH
  async verifyUserCredentials(email, plainPassword) {
    try {
      console.log('🔐 Verifying credentials for:', email)
      const user = await this.getUserByEmail(email)
      if (!user) {
        console.log('❌ User not found for credentials verification')
        return null
      }
      
      const isValid = user.password_hash === plainPassword
      console.log(isValid ? '✅ Credentials valid' : '❌ Invalid password')
      return isValid ? user : null
    } catch (error) {
      console.error('❌ Error verifying user credentials:', error)
      throw error
    }
  }

  // =================== FAVORITOS ===================
  
  async addToFavorites(userId, seriesId, seriesName, seriesPoster, itemType = 'series') {
    try {
      console.log('❤️ Adding to favorites DB:', { userId, seriesId, seriesName, itemType })
      await client.execute({
        sql: 'INSERT OR REPLACE INTO favorites (user_id, series_id, series_name, series_poster, item_type) VALUES (?, ?, ?, ?, ?)',
        args: [userId, seriesId, seriesName, seriesPoster, itemType]
      })
      console.log('✅ Successfully added to favorites DB')
    } catch (error) {
      console.error('❌ Error adding to favorites:', error)
      throw error
    }
  }

  async removeFromFavorites(userId, seriesId) {
    try {
      console.log('💔 Removing from favorites:', { userId, seriesId })
      await client.execute({
        sql: 'DELETE FROM favorites WHERE user_id = ? AND series_id = ?',
        args: [userId, seriesId]
      })
      console.log('✅ Successfully removed from favorites')
    } catch (error) {
      console.error('❌ Error removing from favorites:', error)
      throw error
    }
  }

  async getFavorites(userId) {
    try {
      console.log('📥 Getting favorites for user:', userId)
      const result = await client.execute({
        sql: 'SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC',
        args: [userId]
      })
      console.log('✅ Retrieved favorites:', result.rows.length)
      return result.rows
    } catch (error) {
      console.error('❌ Error getting favorites:', error)
      throw error
    }
  }

  // =================== WATCHLIST ===================
  
  async addToWatchlist(userId, seriesId, seriesName, seriesPoster, itemType = 'series') {
    try {
      console.log('⏰ Adding to watchlist DB:', { userId, seriesId, seriesName, itemType })
      await client.execute({
        sql: 'INSERT OR REPLACE INTO watchlist (user_id, series_id, series_name, series_poster, item_type) VALUES (?, ?, ?, ?, ?)',
        args: [userId, seriesId, seriesName, seriesPoster, itemType]
      })
      console.log('✅ Successfully added to watchlist DB')
    } catch (error) {
      console.error('❌ Error adding to watchlist:', error)
      throw error
    }
  }

  async getWatchlist(userId) {
    try {
      console.log('📥 Getting watchlist for user:', userId)
      const result = await client.execute({
        sql: 'SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC',
        args: [userId]
      })
      console.log('✅ Retrieved watchlist:', result.rows.length)
      return result.rows
    } catch (error) {
      console.error('❌ Error getting watchlist:', error)
      throw error
    }
  }

  async removeFromWatchlist(userId, seriesId) {
    try {
      console.log('🗑️ Removing from watchlist:', { userId, seriesId })
      await client.execute({
        sql: 'DELETE FROM watchlist WHERE user_id = ? AND series_id = ?',
        args: [userId, seriesId]
      })
      console.log('✅ Successfully removed from watchlist')
    } catch (error) {
      console.error('❌ Error removing from watchlist:', error)
      throw error
    }
  }

  // =================== EPISODIOS VISTOS ===================
  
  async markAsWatched(userId, seriesId, episodeId, seriesName, episodeName, seasonNumber, episodeNumber, posterUrl = null) {
    try {
      // Detectar si es película basado en el episodeId
      const isMovie = episodeId && episodeId.toString().startsWith('movie_')
      
      console.log('🎬 Marking as watched in DB:', {
        userId, seriesId, episodeId, seriesName, episodeName, 
        seasonNumber, episodeNumber, posterUrl, isMovie
      })
      
      await client.execute({
        sql: 'INSERT OR REPLACE INTO watched (user_id, series_id, episode_id, series_name, episode_name, season_number, episode_number, poster_url, is_movie) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [userId, seriesId, episodeId, seriesName, episodeName, seasonNumber, episodeNumber, posterUrl, isMovie ? 1 : 0]
      })
      
      console.log('✅ Successfully marked as watched in DB')
    } catch (error) {
      console.error('❌ Error marking as watched:', error)
      throw error
    }
  }

  async getWatchedEpisodes(userId) {
    try {
      console.log('📥 Getting watched episodes for user:', userId)
      const result = await client.execute({
        sql: 'SELECT * FROM watched WHERE user_id = ? ORDER BY watched_at DESC',
        args: [userId]
      })
      
      // Asegurar que is_movie esté correctamente convertido
      const processedRows = result.rows.map(row => ({
        ...row,
        is_movie: Boolean(row.is_movie) || (row.episode_id && row.episode_id.toString().startsWith('movie_'))
      }))
      
      console.log('✅ Retrieved watched episodes from DB:', processedRows.length)
      return processedRows
    } catch (error) {
      console.error('❌ Error getting watched episodes:', error)
      throw error
    }
  }

  async removeWatchedEpisode(userId, episodeId) {
    try {
      console.log('🗑️ Removing watched episode:', { userId, episodeId })
      await client.execute({
        sql: 'DELETE FROM watched WHERE user_id = ? AND episode_id = ?',
        args: [userId, episodeId]
      })
      console.log('✅ Successfully removed watched episode')
    } catch (error) {
      console.error('❌ Error removing watched episode:', error)
      throw error
    }
  }

  async isEpisodeWatched(userId, episodeId) {
    try {
      const result = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM watched WHERE user_id = ? AND episode_id = ?',
        args: [userId, episodeId]
      })
      return result.rows[0].count > 0
    } catch (error) {
      console.error('❌ Error checking if episode is watched:', error)
      return false
    }
  }
  

  // =================== ESTADÍSTICAS ===================
  
  async getUserStats(userId) {
    try {
      console.log('📊 Getting user stats for:', userId)
      
      const [favoritesResult, watchlistResult, watchedResult] = await Promise.all([
        client.execute({
          sql: 'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
          args: [userId]
        }),
        client.execute({
          sql: 'SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?',
          args: [userId]
        }),
        client.execute({
          sql: 'SELECT COUNT(*) as episodes, COUNT(DISTINCT series_id) as series FROM watched WHERE user_id = ?',
          args: [userId]
        })
      ])

      const stats = {
        totalFavorites: favoritesResult.rows[0].count,
        totalWatchlist: watchlistResult.rows[0].count,
        totalWatchedEpisodes: watchedResult.rows[0].episodes,
        totalWatchedSeries: watchedResult.rows[0].series
      }

      console.log('✅ User stats retrieved:', stats)
      return stats
    } catch (error) {
      console.error('❌ Error getting user stats:', error)
      throw error
    }
  }

  // =================== UTILIDADES ===================
  
  async clearUserData(userId) {
    try {
      console.log('🧹 Clearing all data for user:', userId)
      
      await Promise.all([
        client.execute({
          sql: 'DELETE FROM favorites WHERE user_id = ?',
          args: [userId]
        }),
        client.execute({
          sql: 'DELETE FROM watchlist WHERE user_id = ?',
          args: [userId]
        }),
        client.execute({
          sql: 'DELETE FROM watched WHERE user_id = ?',
          args: [userId]
        })
      ])
      
      console.log('✅ All user data cleared successfully')
    } catch (error) {
      console.error('❌ Error clearing user data:', error)
      throw error
    }
  }

  async getWatchedMovies(userId) {
    try {
      console.log('🎬 Getting watched movies for user:', userId)
      const result = await client.execute({
        sql: 'SELECT * FROM watched WHERE user_id = ? AND is_movie = 1 ORDER BY watched_at DESC',
        args: [userId]
      })
      console.log('✅ Retrieved watched movies:', result.rows.length)
      return result.rows
    } catch (error) {
      console.error('❌ Error getting watched movies:', error)
      throw error
    }
  }

  async getWatchedSeries(userId) {
    try {
      console.log('📺 Getting watched series for user:', userId)
      const result = await client.execute({
        sql: 'SELECT * FROM watched WHERE user_id = ? AND (is_movie = 0 OR is_movie IS NULL) ORDER BY watched_at DESC',
        args: [userId]
      })
      console.log('✅ Retrieved watched series episodes:', result.rows.length)
      return result.rows
    } catch (error) {
      console.error('❌ Error getting watched series:', error)
      throw error
    }
  }

  // =================== MÉTODO DE DEBUG ===================
  
  async debugDatabase() {
    try {
      console.log('🐛 Starting database debug...')
      
      const tables = ['users', 'favorites', 'watchlist', 'watched']
      
      for (const table of tables) {
        try {
          const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`)
          console.log(`📊 ${table}: ${result.rows[0].count} records`)
          
          if (result.rows[0].count > 0) {
            const sample = await client.execute(`SELECT * FROM ${table} LIMIT 1`)
            console.log(`🔍 ${table} sample:`, sample.rows[0])
          }
        } catch (error) {
          console.log(`❌ Error querying ${table}:`, error.message)
        }
      }
      
      console.log('✅ Database debug completed')
    } catch (error) {
      console.error('❌ Error in database debug:', error)
    }
  }
  
}

export default new TursoService()