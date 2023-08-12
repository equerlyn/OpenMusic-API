const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { mapActivitiesToModel } = require('../utils');

function generateActivitiesId() {
  const uuid = uuidv4().replace(/-/g, '');
  let temp = '';
  for (let i = 0; i < 16;) {
    const randomIndex = Math.round(Math.random());
    if (randomIndex === 1) temp += uuid[i].toUpperCase();
    else temp += uuid[i];
    i += 1;
  }
  return `ACT-${temp}`;
}

class ActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async addActivities({ playlistId, ownerId, title }) {
    const id = generateActivitiesId();

    const query = {
      text: 'INSERT INTO activities VALUES($1, $2, $3, $4, $5) RETURNING activities_id',
      values: [id, playlistId, ownerId, title, "add"],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Activities gagal ditambahkan');
    }

    return result.rows[0].activities_id;
  }

  async addDeleteActivities( {playlistId, ownerId, title }) {
    const id = generateActivitiesId();

    const query = {
      text: 'INSERT INTO activities VALUES($1, $2, $3, $4, $5) RETURNING activities_id',
      values: [id, playlistId, ownerId, title, "delete"],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Activities gagal ditambahkan');
    }

    return result.rows[0].activities_id;
  }
  
  async getActivities({ playlistId, ownerId }) {
    const query = {
      text: `SELECT a.*, users.username
      FROM activities AS a
      LEFT JOIN playlists AS p ON p.playlist_id = a.playlist_id
      LEFT JOIN users ON users.id = p.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = a.playlist_id
      WHERE p.owner = $1 OR collaborations.user_id = $1 AND a.playlist_id = $2`,
      values: [ownerId, playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows.map(mapActivitiesToModel);
  }

}

module.exports = ActivitiesService;
