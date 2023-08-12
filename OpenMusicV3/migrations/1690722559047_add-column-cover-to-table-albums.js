exports.up = (pgm) => {
  pgm.addColumn('albums', {
    coverUrl: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('albums', 'coverUrl');
};
