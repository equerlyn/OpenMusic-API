const AlbumHandler = require('./albums/handler');
const AlbumRoutes = require('./albums/routes');

const SongHandler = require('./songs/handler');
const SongRoutes = require('./songs/routes');

const UserHandler = require('./users/handler');
const UserRoutes = require('./users/routes');

const AuthenticationHandler = require('./authentications/handler');
const AuthenticationRoutes = require('./authentications/routes');

const PlaylistsHandler = require('./playlists/handler');
const PlaylistRoutes = require('./playlists/routes');

const CollaborationsHandler = require('./collaborations/handler');
const CollaborationRoutes = require('./collaborations/routes');

const ExportsHandler = require('./exports/handler');
const ExportRoutes = require('./exports/routes');

const AlbumsPlugin = {
  name: 'albums',
  version: '1.0.0',
  register: async (server,
    {
      albumsService, songsService, uploadsService, validator, uploadValidator,
    }
  ) => {
    const albumHandler = new AlbumHandler(
      albumsService,
      songsService,
      uploadsService,
      validator,
      uploadValidator,
    );
    server.route(AlbumRoutes(albumHandler));
  },
};

const SongsPlugin = {
  name: 'songs',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const songHandler = new SongHandler(service, validator);
    server.route(SongRoutes(songHandler));
  },
};

const UsersPlugin = {
  name: 'users',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const userHandler = new UserHandler(service, validator);
    server.route(UserRoutes(userHandler));
  },
};

const AuthenticationsPlugin = {
  name: 'authentications',
  version: '1.0.0',
  register: async (
    server,
    {
      authenticationsService, usersService, tokenManager, validator,
    },
  ) => {
    const authenticationHandler = new AuthenticationHandler(
      authenticationsService,
      usersService,
      tokenManager,
      validator,
    );
    server.route(AuthenticationRoutes(authenticationHandler));
  },
};

const PlaylistsPlugin = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server,
    {
      playlistsService, songsService, activitiesService, validator,
    }
  ) => {
    const playlistsHandler = new PlaylistsHandler(
      playlistsService,
      songsService,
      activitiesService,
      validator,
    );
    server.route(PlaylistRoutes(playlistsHandler));
  },
};

const CollaborationsPlugin = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server,
    {
      collaborationsService, playlistsService, usersService, validator,
    }
  ) => {
    const collaborationsHandler = new CollaborationsHandler(
      collaborationsService,
      playlistsService,
      usersService, 
      validator,
    );
    server.route(CollaborationRoutes(collaborationsHandler));
  },
};

const ExportsPlugin = {
  name: 'exports',
  version: '1.0.0',
  register: async (server, { service, playlistsService, validator }) => {
    const exportsHandler = new ExportsHandler(
      service,
      playlistsService,
      validator,
    );
    server.route(ExportRoutes(exportsHandler));
  },
};


module.exports = {
  AlbumsPlugin,
  SongsPlugin,
  UsersPlugin,
  AuthenticationsPlugin,
  PlaylistsPlugin,
  CollaborationsPlugin,
  ExportsPlugin,
};
