/* eslint-disable camelcase */
const mapAlbumToModel = ({
  album_id,
  name,
  year,
  coverUrl,
  songs,
}) => ({
  id: album_id,
  name,
  year,
  coverUrl,
  songs,
});

const mapSongsToModel = ({
  song_id,
  title,
  performer,
}) => ({
  id: song_id,
  title,
  performer,
});

const mapSongToModel = ({
  song_id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId,
}) => {
  const model = {
    id: song_id,
    title,
    year,
    performer,
    genre,
    duration,
  };

  if (albumId !== null) {
    model.albumId = albumId;
  }

  return model;
};

const mapPlaylistsToModel = ({
  playlist_id,
  name,
  username,
}) => ({
  id: playlist_id,
  name,
  username,
});

const mapPlaylistToModel = ({
  playlist_id,
  name,
  username,
  songs,
}) => ({
  id: playlist_id,
  name,
  username,
  songs,
});

const mapActivitiesToModel = ({
  username,
  title,
  action,
  time,
})=> ({
  username,
  title,
  action,
  time,
});

module.exports = {
  mapAlbumToModel,
  mapSongsToModel,
  mapSongToModel,
  mapPlaylistsToModel,
  mapPlaylistToModel,
  mapActivitiesToModel,
};
