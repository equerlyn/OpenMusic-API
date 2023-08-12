exports.up = (pgm) => {
  pgm.createTable('likes', {
    like_id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    album_id: {
      type: 'VARCHAR(50)',
      references: 'albums(album_id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      references: 'users(id)',
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
  pgm.dropTable('likes');
};
