exports.up = (pgm) => {
  pgm.createTable('activities', {
    activities_id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      },
    username: {
      type: 'VARCHAR(50)',
      references: 'users(id)',
      notNull: true,
    },
    title: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    action: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    time: {
      type: 'timestamp',
      notNull: false,
      default: pgm.func('current_timestamp'),
    },
  })
};

exports.down = (pgm) => {
  pgm.dropTable('activities');
};
