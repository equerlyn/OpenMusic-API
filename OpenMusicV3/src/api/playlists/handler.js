const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistsService, songsService, activitiesService, validator) {
    this._playlistService = playlistsService;
    this._songsService = songsService;
    this._activitiesService = activitiesService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);

    const { id: credentialId } = request.auth.credentials;
    const { name } = request.payload;

    const playlistId = await this._playlistService.addPlaylist({
      name,
      ownerId: credentialId,
    });

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlaylistHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._playlistService.getPlaylist({
      ownerId: credentialId,
    });
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistService.deletePlaylistById({
      playlistId: id,
      ownerId: credentialId,
    });

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongOnPlaylistHandler(request, h) {
    this._validator.validatePlaylistWithIdPayload(request.payload);

    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;
    const { songId } = request.payload;

    await this._playlistService.verifyPlaylistAccess(id, credentialId);
    const pTitle = await this._songsService.getSongById(songId);
    await this._playlistService.getPlaylist({ ownerId: credentialId });
    await this._playlistService.getPlaylistById({
      ownerId: credentialId,
      playlistId: id,
    });
    await this._playlistService.addSongOnPlaylist({
      playlistId: id,
      songId,
      ownerId: credentialId,
    });
    await this._activitiesService.addActivities({
      playlistId: id,
      ownerId: credentialId,
      title: pTitle.title,
    })

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil dimasukkan ke Playlist',
    });

    response.code(201);
    return response;
  }

  async getSongOnPlaylistHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;
    const playlist = await this._playlistService.getSongOnPlaylist({
      playlistId: id,
      ownerId: credentialId,
    });
    const songs = await this._songsService.getSongsByPlaylistId(id);
    playlist.songs = songs.map((song) => ({
      id: song.song_id,
      title: song.title,
      performer: song.performer,
    }));

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongOnPlaylistHandler(request, h) {
    this._validator.validatePlaylistWithIdPayload(request.payload);
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;
    await this._playlistService.verifyPlaylistAccess(id, credentialId);
    await this._playlistService.getPlaylistById({
      ownerId: credentialId,
      playlistId: id,
    });
    const pTitle = await this._songsService.getSongById(songId);
    await this._playlistService.deleteSongFromPlaylistById({
      playlistId: id,
      songId,
    });
    await this._activitiesService.addDeleteActivities({
      playlistId: id,
      ownerId: credentialId,
      title: pTitle.title,
    })

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }

  async getPlaylistActivitiesHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistOwner(id, credentialId);
    const activities = await this._activitiesService.getActivities({
      playlistId: id,
      ownerId: credentialId,
    });

    return {
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
