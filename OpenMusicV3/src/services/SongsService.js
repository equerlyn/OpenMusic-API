const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const InvariantError = require('../exceptions/InvariantError');
const { mapSongsToModel, mapSongToModel } = require('../utils');
const NotFoundError = require('../exceptions/NotFoundError');

function generateSongId() {
  const uuid = uuidv4().replace(/-/g, '');
  let temp = '';
  for (let i = 0; i < 16;) {
    const randomIndex = Math.round(Math.random());
    if (randomIndex === 1) temp += uuid[i].toUpperCase();
    else temp += uuid[i];
    i += 1;
  }
  return `song-${temp}`;
}

class SongService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = generateSongId();

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING song_id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].song_id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].song_id;
  }

  async getSong(title, performer) {
    const result = await this._pool.query(`SELECT * FROM songs WHERE title ILIKE '%${title}%' AND performer ILIKE '%${performer}%'`);
    return result.rows.map(mapSongsToModel);
  }

  async getSongById(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE song_id = $1',
      values: [songId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return mapSongToModel(result.rows[0]);
  }

  async getSongsByAlbumId(albumId) {
    const query = {
      text: 'SELECT * FROM songs WHERE "albumId" = $1',
      values: [albumId],
    };
    const result = await this._pool.query(query);
    return result.rows;
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

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows;
  }

  async editSongById(songId, {
    title, year, genre, performer, duration,
  }) {
    const pgTime = await this._pool.query('SELECT NOW() AS current_time');
    const updatedAt = pgTime.rows[0].current_time;
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, updated_at = $6 WHERE song_id = $7 RETURNING song_id',
      values: [title, year, genre, performer, duration, updatedAt, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(songId) {
    const queryDelete = {
      text: 'DELETE FROM songs WHERE song_id = $1 RETURNING song_id',
      values: [songId],
    };
    const result = await this._pool.query(queryDelete);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongService;
