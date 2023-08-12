/* eslint-disable no-console */
class Listener {
  constructor(playlistService, songsService, mailSender) {
    this._playlistService = playlistService;
    this._songsService = songsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());
      const playlist = await this._playlistService.getPlaylist(playlistId);
      const songs = await this._songsService.getSongsByPlaylistId(playlistId);
      playlist.songs = songs.map((song) => ({
        id: song.song_id,
        title: song.title,
        performer: song.performer,
      }));
      const temp = { playlist };
      const result = await this._mailSender.sendEmail(targetEmail, JSON.stringify(temp, null, 2));
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Listener;
