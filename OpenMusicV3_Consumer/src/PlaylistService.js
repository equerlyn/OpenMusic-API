const { Pool } = require('pg');
const { mapPlaylistToModel } = require('./utils');

class PlaylistService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylist(playlistId) {
    const query = {
      text: `SELECT p.*,  users.username
      FROM playlists AS p
      LEFT JOIN users ON users.id = p.owner
      WHERE p.playlist_id = $1`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    const playlist = mapPlaylistToModel(result.rows[0]);
    return playlist;
  }
}

module.exports = PlaylistService;
