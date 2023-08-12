const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { mapPlaylistsToModel } = require('../utils');
const InvariantError = require('../exceptions/InvariantError');
const AuthorizationError = require('../exceptions/AuthorizationError');
const NotFoundError = require('../exceptions/NotFoundError');
const { mapPlaylistToModel } = require('../utils');

function generateId() {
  const uuid = uuidv4().replace(/-/g, '');
  let temp = '';
  for (let i = 0; i < 16;) {
    const randomIndex = Math.round(Math.random());
    if (randomIndex === 1) temp += uuid[i].toUpperCase();
    else temp += uuid[i];
    i += 1;
  }
  return temp;
}

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, ownerId }) {
    const id = `playlist-${generateId()}`;
    
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING playlist_id',
      values: [id, name, ownerId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].playlist_id;
  }

  async getPlaylist({ ownerId }) {
    const query = {
      text: `SELECT p.*, users.username
      FROM playlists AS p
      LEFT JOIN users ON users.id = p.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = p.playlist_id
      WHERE p.owner = $1 OR collaborations.user_id = $1`,
      values: [ownerId],
    };

    const result = await this._pool.query(query);
    return result.rows.map(mapPlaylistsToModel);
  }

  async getPlaylistById({ ownerId, playlistId }) {
    const query = {
      text: `SELECT p.*
      FROM playlists AS p
      LEFT JOIN collaborations ON collaborations.playlist_id = p.playlist_id
      WHERE p.owner = $1 OR collaborations.user_id = $1 and p.playlist_id = $2`,
      values: [ownerId, playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
    return result.rows[0].name;
  }

  async deleteSongFromPlaylistById({ playlistId, songId }) {
    const queryDelete = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING ID',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(queryDelete);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan di playlist ini');
    }
  }

  async addSongOnPlaylist({ playlistId, songId }) {
    const id = `PS-${generateId()}`;
    
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    return result.rows[0].id;
  }

  async getSongOnPlaylist({ playlistId, ownerId }) {
    const checkQuery = {
      text: 'select * from playlists',
    };
    const checkResult = await this._pool.query(checkQuery);
    if (!checkResult.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const selectByPlaylistId = checkResult.rows.filter(
      (playlist) => playlist.playlist_id === playlistId,
    );
    const selectByOwnerId = checkResult.rows.filter(
      (playlist) => playlist.owner === ownerId,
    );

    if (!selectByPlaylistId.length && selectByOwnerId.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    } else if (!selectByPlaylistId.length && !selectByOwnerId.length) {
      const checkCollab = await this._collaborationService.verifyCollaborator(playlistId, ownerId)
      if (selectByPlaylistId.length && checkCollab === undefined) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      }
    }

    const query = {
      text: `SELECT p.*,  users.username
      FROM playlists AS p
      LEFT JOIN users ON users.id = p.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = p.playlist_id
      WHERE p.playlist_id = $1 AND "owner" = $2  OR collaborations.user_id = $2`,
      values: [playlistId, ownerId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    const playlist = mapPlaylistToModel(result.rows[0]);
    return playlist;
  }

  async deletePlaylistById({ playlistId, ownerId }) {
    const queryDelete = {
      text: 'DELETE FROM playlists WHERE playlist_id = $1 AND owner = $2 RETURNING playlist_id',
      values: [playlistId, ownerId],
    };

    const result = await this._pool.query(queryDelete);

    if (!result.rowCount) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistOwner(playlistId, ownerId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE playlist_id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== ownerId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini :((');
    }

    return playlist;
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
