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

      await client.execute(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          series_id INTEGER NOT NULL,
          series_name TEXT NOT NULL,
          series_poster TEXT,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, series_id)
        )
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS watchlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          series_id INTEGER NOT NULL,
          series_name TEXT NOT NULL,
          series_poster TEXT,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, series_id)
        )
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS watched (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          series_id INTEGER NOT NULL,
          episode_id INTEGER NOT NULL,
          series_name TEXT NOT NULL,
          episode_name TEXT,
          season_number INTEGER,
          episode_number INTEGER,
          watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, series_id, episode_id)
        )
      `)

      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }

   // REGISTRO SIN HASH
  async createUser(email, password, name) {
    try {
      const result = await client.execute({
        sql: 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        args: [email, password, name]
      })
      return result.lastInsertRowid.toString()
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }
  // CONSULTAR USUARIO POR EMAIL
  async getUserByEmail(email) {
    try {
      const result = await client.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      })
      return result.rows[0] || null
    } catch (error) {
      console.error('Error getting user by email:', error)
      throw error
    }
  }

 // VERIFICAR LOGIN SIN HASH
  async verifyUserCredentials(email, plainPassword) {
    try {
      const user = await this.getUserByEmail(email)
      if (!user) return null
      return user.password_hash === plainPassword ? user : null
    } catch (error) {
      console.error('Error verifying user credentials:', error)
      throw error
    }
  }

  // FAVORITOS
  async addToFavorites(userId, seriesId, seriesName, seriesPoster) {
    try {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO favorites (user_id, series_id, series_name, series_poster) VALUES (?, ?, ?, ?)',
        args: [userId, seriesId, seriesName, seriesPoster]
      })
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  async removeFromFavorites(userId, seriesId) {
    try {
      await client.execute({
        sql: 'DELETE FROM favorites WHERE user_id = ? AND series_id = ?',
        args: [userId, seriesId]
      })
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  async getFavorites(userId) {
    try {
      const result = await client.execute({
        sql: 'SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC',
        args: [userId]
      })
      return result.rows
    } catch (error) {
      console.error('Error getting favorites:', error)
      throw error
    }
  }

  // WATCHLIST
  async addToWatchlist(userId, seriesId, seriesName, seriesPoster) {
    try {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO watchlist (user_id, series_id, series_name, series_poster) VALUES (?, ?, ?, ?)',
        args: [userId, seriesId, seriesName, seriesPoster]
      })
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw error
    }
  }

  async getWatchlist(userId) {
    try {
      const result = await client.execute({
        sql: 'SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC',
        args: [userId]
      })
      return result.rows
    } catch (error) {
      console.error('Error getting watchlist:', error)
      throw error
    }
  }

  // EPISODIOS VISTOS
  async markAsWatched(userId, seriesId, episodeId, seriesName, episodeName, seasonNumber, episodeNumber) {
    try {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO watched (user_id, series_id, episode_id, series_name, episode_name, season_number, episode_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [userId, seriesId, episodeId, seriesName, episodeName, seasonNumber, episodeNumber]
      })
    } catch (error) {
      console.error('Error marking as watched:', error)
      throw error
    }
  }

  async getWatchedEpisodes(userId) {
    try {
      const result = await client.execute({
        sql: 'SELECT * FROM watched WHERE user_id = ? ORDER BY watched_at DESC',
        args: [userId]
      })
      return result.rows
    } catch (error) {
      console.error('Error getting watched episodes:', error)
      throw error
    }
  }
  // Agregar estos métodos a tu archivo tursoDb.js existente

// MÉTODO FALTANTE: Remover de watchlist
async removeFromWatchlist(userId, seriesId) {
  try {
    await client.execute({
      sql: 'DELETE FROM watchlist WHERE user_id = ? AND series_id = ?',
      args: [userId, seriesId]
    })
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    throw error
  }
}

// MÉTODO FALTANTE: Remover episodio visto (opcional)
async removeWatchedEpisode(userId, episodeId) {
  try {
    await client.execute({
      sql: 'DELETE FROM watched WHERE user_id = ? AND episode_id = ?',
      args: [userId, episodeId]
    })
  } catch (error) {
    console.error('Error removing watched episode:', error)
    throw error
  }
}

// MÉTODO MEJORADO: Verificar si episodio ya está visto
async isEpisodeWatched(userId, episodeId) {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM watched WHERE user_id = ? AND episode_id = ?',
      args: [userId, episodeId]
    })
    return result.rows[0].count > 0
  } catch (error) {
    console.error('Error checking if episode is watched:', error)
    return false
  }
}

// MÉTODO ÚTIL: Obtener estadísticas del usuario
async getUserStats(userId) {
  try {
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

    return {
      totalFavorites: favoritesResult.rows[0].count,
      totalWatchlist: watchlistResult.rows[0].count,
      totalWatchedEpisodes: watchedResult.rows[0].episodes,
      totalWatchedSeries: watchedResult.rows[0].series
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    throw error
  }
}
}

export default new TursoService()
