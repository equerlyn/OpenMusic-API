const autoBind = require('auto-bind');
const config = require('../../utils/config')

class AlbumsHandler {
  constructor(albumsService, songsService, uploadsService, validator, uploadValidator) {
    this._albumService = albumsService;
    this._songService = songsService;
    this._uploadService = uploadsService;
    this._validator = validator;
    this._uploadValidator = uploadValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayLoad(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._albumService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._albumService.getAlbumById(id);
    const songs = await this._songService.getSongsByAlbumId(id);

    album.songs = songs.map((song) => ({
      id: song.song_id,
      title: song.title,
      performer: song.performer,
    }));

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayLoad(request.payload);
    const { id } = request.params;

    await this._albumService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;

    await this._albumService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;

    this._uploadValidator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._uploadService.writeFile(cover, cover.hapi);
    await this._albumService.addCoverToAlbum(id, `http://${config.app.host}:${config.app.port}/albums/${id}/${filename}`)
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postLikeAlbumByIdHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    await this._albumService.getAlbumById(id)
    await this._albumService.searchLike(id, credentialId);
    await this._albumService.addLikeAlbum(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil like album'
    });

    response.code(201);
    return response;
  }

  async deleteLikeAlbumByIdHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    await this._albumService.getAlbumById(id)
    await this._albumService.deleteLikeAlbum(id, credentialId);

    return {
      status: 'success',
      message: 'Like berhasil dihapus',
    };
  }

  async getLikeAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const likes = await this._albumService.getLikeAlbum(id);

    let response = '';

    if (likes.source) {
      response = h.response({
        status: 'success',
        data: {
          likes: likes.likes,
        }
      });
      response.header('X-Data-Source', 'cache');
    } else {
      response = h.response({
        status: 'success',
        data: {
          likes
        }
      });
    }
    return response;
  }
}

module.exports = AlbumsHandler;
