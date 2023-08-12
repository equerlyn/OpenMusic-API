const { Pool } = require('pg');

class SongService {
  constructor() {
    this._pool = new Pool();
  }

  async getSongsByPlaylistId(playlistId) {
    const query = {
      text: `SELECT songs.*
      FROM playlist_songs AS p
      LEFT JOIN songs ON songs.song_id = p.song_id
      LEFT JOIN playlists ON playlists.playlist_id = p.playlist_id
      WHERE p.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = SongService;
