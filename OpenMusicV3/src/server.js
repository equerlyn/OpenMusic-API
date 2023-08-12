const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');
const config = require('./utils/config')
const ClientError = require('./exceptions/ClientError');

const {
  AlbumsPlugin,
  SongsPlugin,
  UsersPlugin,
  AuthenticationsPlugin,
  PlaylistsPlugin,
  CollaborationsPlugin,
  ExportsPlugin,
} = require('./api');

// Service
const AlbumsService = require('./services/AlbumsService');
const SongsService = require('./services/SongsService');
const UsersService = require('./services/UsersService');
const AuthenticationsService = require('./services/AuthenticationsService');
const PlaylistsService = require('./services/PlaylistsService');
const CollaborationsService = require('./services/CollaborationsService');
const ActivitiesService = require('./services/ActivitiesService');
const ProducerService = require('./services/rabbitmq/ProducerService')
const UploadsService = require('./services/storage/StorageService')

// Cache
const CacheService = require('./services/redis/CacheService');

// Validator
const allValidator = require('./validator');
const tokenManager = require('./tokenize/TokenManager');
const authenticationsValidator = require('./validator/authentications');
const playlistsValidator = require('./validator/playlists');
const collaborationsValidator = require('./validator/collaborations');
const exportsValidator = require('./validator/exports');
const uploadsValidator = require('./validator/uploads')

const init = async () => {
  const cacheService = new CacheService();
  const collaborationService = new CollaborationsService();
  const albumService = new AlbumsService(cacheService);
  const songService = new SongsService();
  const userService = new UsersService();
  const authService = new AuthenticationsService();
  const playlistService = new PlaylistsService(collaborationService);
  const activityService = new ActivitiesService;
  const uploadService = new UploadsService(path.resolve(__dirname, 'api/albums/file/images'));

  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.jwt.keys,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.jwt.maxAgeSec,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: AlbumsPlugin,
      options: {
        albumsService: albumService,
        songsService: songService,
        uploadsService: uploadService,
        validator: allValidator,
        uploadValidator: uploadsValidator
      },
    },
    {
      plugin: SongsPlugin,
      options: {
        service: songService,
        validator: allValidator,
      },
    },
    {
      plugin: UsersPlugin,
      options: {
        service: userService,
        validator: allValidator,
      },
    },
    {
      plugin: AuthenticationsPlugin,
      options: {
        authenticationsService: authService,
        usersService: userService,
        tokenManager,
        validator: authenticationsValidator,
      },
    },
    {
      plugin: PlaylistsPlugin,
      options: {
        playlistsService: playlistService,
        songsService: songService,
        activitiesService: activityService,
        validator: playlistsValidator,
      },
    },
    {
      plugin: CollaborationsPlugin,
      options: {
        collaborationsService: collaborationService,
        playlistsService: playlistService,
        usersService: userService,
        validator: collaborationsValidator,
      },
    },
    {
      plugin: ExportsPlugin,
      options: {
        service: ProducerService,
        playlistsService: playlistService,
        validator: exportsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    // console.log(response)
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  // eslint-disable-next-line no-console
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
