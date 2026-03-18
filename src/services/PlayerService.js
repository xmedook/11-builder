/**
 * PlayerService — CRUD de jugadores custom sobre localStorage.
 * Diseñado para migrar a API REST sin cambiar los componentes.
 */

const STORAGE_KEY = '11builder_custom_players'

const PlayerService = {
  /**
   * Obtiene todos los jugadores custom guardados.
   * @returns {Object} Diccionario { formattedName: playerData }
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (e) {
      console.error('PlayerService.getAll error:', e)
      return {}
    }
  },

  /**
   * Obtiene un jugador por su key (formattedName).
   * @param {string} key
   * @returns {Object|null}
   */
  get(key) {
    const all = this.getAll()
    return all[key] || null
  },

  /**
   * Crea o actualiza un jugador custom.
   * @param {Object} player — { name, rating, positions, club }
   * @returns {Object} El jugador guardado con id y key generados
   */
  save(player) {
    const all = this.getAll()
    const key = this._formatKey(player.name)
    const id = player.id || `custom_${Date.now()}`

    const playerData = {
      id,
      name: player.name,
      rating: String(player.rating || 0),
      photo: player.photo || '',
      club: {
        name: (player.club && player.club.name) || 'Custom FC',
        logo: (player.club && player.club.logo) || ''
      },
      positions: player.positions || ['MC'],
      isCustom: true
    }

    all[key] = playerData
    this._persist(all)
    return { key, player: playerData }
  },

  /**
   * Elimina un jugador custom por su key.
   * @param {string} key
   * @returns {boolean}
   */
  remove(key) {
    const all = this.getAll()
    if (all[key]) {
      delete all[key]
      this._persist(all)
      return true
    }
    return false
  },

  /**
   * Cuenta jugadores custom.
   * @returns {number}
   */
  count() {
    return Object.keys(this.getAll()).length
  },

  /**
   * Exporta todos los jugadores custom como JSON string.
   * @returns {string}
   */
  exportJSON() {
    return JSON.stringify(this.getAll(), null, 2)
  },

  /**
   * Importa jugadores desde JSON string (merge, no replace).
   * @param {string} jsonStr
   * @returns {number} cantidad importada
   */
  importJSON(jsonStr) {
    try {
      const imported = JSON.parse(jsonStr)
      const all = this.getAll()
      let count = 0
      for (const key in imported) {
        if (imported[key] && imported[key].name) {
          imported[key].isCustom = true
          all[key] = imported[key]
          count++
        }
      }
      this._persist(all)
      return count
    } catch (e) {
      console.error('PlayerService.importJSON error:', e)
      return 0
    }
  },

  // --- Internals ---

  _formatKey(name) {
    return name
      .replace(/\s/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') + '0'
  },

  _persist(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

export default PlayerService
