/* eslint-disable camelcase */
const mapPlaylistToModel = ({
  playlist_id,
  name,
  songs,
}) => ({
  id: playlist_id,
  name,
  songs,
});

module.exports = {
  mapPlaylistToModel,
};
