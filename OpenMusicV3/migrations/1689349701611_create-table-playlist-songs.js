exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      references: 'playlists(playlist_id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      references: 'songs(song_id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: false,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: false,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_songs');
};
