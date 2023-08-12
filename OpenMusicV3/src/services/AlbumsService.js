const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const InvariantError = require('../exceptions/InvariantError');
const { mapAlbumToModel } = require('../utils');
const NotFoundError = require('../exceptions/NotFoundError');
const ClientError = require('../exceptions/ClientError');

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

class AlbumService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${generateId()}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING album_id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].album_id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].album_id;
  }

  async getAlbumById(albumId) {
    const query = {
      text: 'SELECT * FROM albums WHERE album_id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = mapAlbumToModel(result.rows[0]);
    return album;
  }

  async editAlbumById(albumId, { name, year }) {
    const pgTime = await this._pool.query('SELECT NOW() AS current_time');
    const updatedAt = pgTime.rows[0].current_time;

    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE album_id = $4 RETURNING album_id',
      values: [name, year, updatedAt, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(albumId) {
    const queryDelete = {
      text: 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id',
      values: [albumId],
    };
    const result = await this._pool.query(queryDelete);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addCoverToAlbum(albumId, url) {
    const pgTime = await this._pool.query('SELECT NOW() AS current_time');
    const updatedAt = pgTime.rows[0].current_time;

    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1, updated_at = $2 WHERE album_id = $3',
      values: [url, updatedAt, albumId]
    }
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal menambah sampul. Id tidak ditemukan');
    }
  }

  async addLikeAlbum(albumId, userId) {
    const id = `like-${generateId()}`;

    const query = {
      text: 'INSERT INTO likes VALUES($1, $2, $3) RETURNING like_id',
      values: [id, albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].like_id) {
      throw new InvariantError('Gagal like album');
    }

    await this._cacheService.delete(`X-Data-Source:${albumId}`);
    return result.rows[0].like_id;
  }

  async searchLike(albumId, userId) {
    const query = {
      text: 'SELECT * FROM likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      throw new ClientError('Anda sudah like album ini');
    }
  }

  async deleteLikeAlbum(albumId, userId) {
    const queryDelete = {
      text: 'DELETE FROM likes WHERE album_id = $1 AND user_id = $2 RETURNING like_id',
      values: [albumId, userId],
    };
    const result = await this._pool.query(queryDelete);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal unlike. Id tidak ditemukan');
    }

    await this._cacheService.delete(`X-Data-Source:${albumId}`);
  }

  async getLikeAlbum(albumId) {
    try {
      const result = await this._cacheService.get(`X-Data-Source:${albumId}`);
      return { likes: JSON.parse(result), source: 'with cache' };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM likes WHERE album_id = $1',
        values: [albumId],
      };
  
      const result = await this._pool.query(query);
      
      await this._cacheService.set(`X-Data-Source:${albumId}`, JSON.stringify(result.rowCount));
      
      return result.rowCount;
    }
  }
}

module.exports = AlbumService;
