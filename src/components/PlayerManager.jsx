import React from 'react'
import PlayerService from '../services/PlayerService'
import './PlayerManager.css'

const POSITIONS = [
  'PO', 'DC', 'DC1', 'DC2', 'DG', 'DD', 'DLG', 'DLD',
  'MC', 'MCO', 'MDC', 'MOC', 'MG', 'MD',
  'EI', 'ED', 'BU', 'SD', 'ATT'
]

export default class PlayerManager extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      players: {},
      editingKey: null,
      form: this._emptyForm(),
      searchFilter: '',
      showImport: false,
      importText: ''
    }
  }

  componentDidMount() {
    this._loadPlayers()
  }

  _emptyForm() {
    return {
      name: '',
      rating: 75,
      position: 'MC',
      clubName: '',
      photo: ''
    }
  }

  _loadPlayers() {
    this.setState({ players: PlayerService.getAll() })
  }

  handleInputChange = (e) => {
    const { name, value } = e.target
    this.setState(prev => ({
      form: { ...prev.form, [name]: value }
    }))
  }

  handleSave = (e) => {
    e.preventDefault()
    const { form, editingKey } = this.state

    if (!form.name.trim()) return

    const player = {
      id: editingKey ? this.state.players[editingKey].id : undefined,
      name: form.name.trim(),
      rating: parseInt(form.rating, 10) || 0,
      positions: [form.position],
      photo: form.photo || '',
      club: {
        name: form.clubName || 'Custom FC',
        logo: ''
      }
    }

    const result = PlayerService.save(player)

    // If editing and key changed (name changed), remove old one
    if (editingKey && editingKey !== result.key) {
      PlayerService.remove(editingKey)
    }

    // Notify parent to refresh index
    if (this.props.onPlayersChanged) {
      this.props.onPlayersChanged(PlayerService.getAll())
    }

    this.setState({
      form: this._emptyForm(),
      editingKey: null
    })
    this._loadPlayers()
  }

  handleEdit = (key) => {
    const player = this.state.players[key]
    this.setState({
      editingKey: key,
      form: {
        name: player.name,
        rating: parseInt(player.rating, 10),
        position: player.positions[0] || 'MC',
        clubName: player.club.name || '',
        photo: player.photo || ''
      }
    })
  }

  handleDelete = (key) => {
    PlayerService.remove(key)
    if (this.props.onPlayersChanged) {
      this.props.onPlayersChanged(PlayerService.getAll())
    }
    this._loadPlayers()
  }

  handleCancel = () => {
    this.setState({
      form: this._emptyForm(),
      editingKey: null
    })
  }

  handleExport = () => {
    const json = PlayerService.exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'custom-players.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  handleImport = () => {
    const count = PlayerService.importJSON(this.state.importText)
    if (count > 0) {
      this._loadPlayers()
      if (this.props.onPlayersChanged) {
        this.props.onPlayersChanged(PlayerService.getAll())
      }
    }
    this.setState({ showImport: false, importText: '' })
    alert(`${count} jugador(es) importado(s)`)
  }

  getFilteredPlayers() {
    const { players, searchFilter } = this.state
    if (!searchFilter) return players
    const filter = searchFilter.toLowerCase()
    const filtered = {}
    for (const key in players) {
      if (players[key].name.toLowerCase().includes(filter)) {
        filtered[key] = players[key]
      }
    }
    return filtered
  }

  render() {
    const filteredPlayers = this.getFilteredPlayers()
    const playerKeys = Object.keys(filteredPlayers)
    const { form, editingKey, showImport } = this.state

    return (
      <div className="PlayerManager">
        <div className="PM-header">
          <h2>⚽ Mis Jugadores</h2>
          <span className="PM-count">{PlayerService.count()} jugadores</span>
        </div>

        {/* Form */}
        <form className="PM-form" onSubmit={this.handleSave}>
          <div className="PM-form-row">
            <input
              name="name"
              type="text"
              placeholder="Nombre del jugador"
              value={form.name}
              onChange={this.handleInputChange}
              required
              className="PM-input PM-input-name"
            />
            <input
              name="rating"
              type="number"
              min="0"
              max="99"
              placeholder="Rating"
              value={form.rating}
              onChange={this.handleInputChange}
              className="PM-input PM-input-rating"
            />
          </div>
          <div className="PM-form-row">
            <select
              name="position"
              value={form.position}
              onChange={this.handleInputChange}
              className="PM-input PM-input-pos"
            >
              {POSITIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              name="clubName"
              type="text"
              placeholder="Nombre del club"
              value={form.clubName}
              onChange={this.handleInputChange}
              className="PM-input PM-input-club"
            />
          </div>
          <div className="PM-form-row">
            <input
              name="photo"
              type="text"
              placeholder="URL de la foto (opcional)"
              value={form.photo}
              onChange={this.handleInputChange}
              className="PM-input PM-input-photo"
            />
          </div>
          <div className="PM-form-actions">
            <button type="submit" className="PM-btn PM-btn-save">
              {editingKey ? '✏️ Actualizar' : '➕ Agregar'}
            </button>
            {editingKey && (
              <button type="button" className="PM-btn PM-btn-cancel" onClick={this.handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Tools */}
        <div className="PM-tools">
          <button className="PM-btn PM-btn-export" onClick={this.handleExport}>
            📥 Exportar
          </button>
          <button className="PM-btn PM-btn-import" onClick={() => this.setState({ showImport: !showImport })}>
            📤 Importar
          </button>
        </div>

        {showImport && (
          <div className="PM-import">
            <textarea
              className="PM-import-textarea"
              placeholder="Pega aquí el JSON exportado..."
              value={this.state.importText}
              onChange={e => this.setState({ importText: e.target.value })}
            />
            <button className="PM-btn PM-btn-save" onClick={this.handleImport}>
              Importar
            </button>
          </div>
        )}

        {/* Search */}
        <input
          type="search"
          placeholder="Buscar en mis jugadores..."
          value={this.state.searchFilter}
          onChange={e => this.setState({ searchFilter: e.target.value })}
          className="PM-input PM-search"
        />

        {/* Player list */}
        <div className="PM-list">
          {playerKeys.length === 0 && (
            <p className="PM-empty">No hay jugadores custom aún. ¡Agrega el primero!</p>
          )}
          {playerKeys.map(key => {
            const player = filteredPlayers[key]
            return (
              <div className="PM-player" key={key}>
                <div className="PM-player-info">
                  <span className="PM-player-rating">{player.rating}</span>
                  <span className="PM-player-name">{player.name}</span>
                  <span className="PM-player-pos">{player.positions.join(', ')}</span>
                  <span className="PM-player-club">{player.club.name}</span>
                </div>
                <div className="PM-player-actions">
                  <button
                    className="PM-btn-icon"
                    onClick={() => this.handleEdit(key)}
                    title="Editar"
                  >✏️</button>
                  <button
                    className="PM-btn-icon"
                    onClick={() => this.handleDelete(key)}
                    title="Eliminar"
                  >🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
