const InvariantError = require('../exceptions/InvariantError');
const { AlbumPayloadSchema } = require('./albums/AlbumSchema');
const { SongPayloadSchema } = require('./songs/SongSchema');
const { UserPayloadSchema } = require('./users/UserSchema');

const Validator = {
  validateAlbumPayLoad: (payload) => {
    const validationResult = AlbumPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validateSongPayLoad: (payload) => {
    const validationResult = SongPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validateUserPayload: (payload) => {
    const validationResult = UserPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = Validator;
