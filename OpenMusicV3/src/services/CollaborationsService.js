const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const InvariantError = require('../exceptions/InvariantError');

function generateCollabId() {
  const uuid = uuidv4().replace(/-/g, '');
  let temp = '';
  for (let i = 0; i < 16;) {
    const randomIndex = Math.round(Math.random());
    if (randomIndex === 1) temp += uuid[i].toUpperCase();
    else temp += uuid[i];
    i += 1;
  }
  return `collab-${temp}`;
}

class CollaborationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addCollaboration(playlistId, userId) {
    const id = generateCollabId();

    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING collab_id',
      values: [id, playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi gagal ditambahkan');
    }

    return result.rows[0].collab_id;
  }

  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING collab_id',
      values: [playlistId, userId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal dihapus');
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }

    return "ada"
  }
}

module.exports = CollaborationsService;
