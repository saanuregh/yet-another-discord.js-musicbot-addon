const { Command } = require('discord.js-commando');

module.exports = class MusicNowPlayingCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'np',
			aliases: [],
			group: 'music',
			memberName: 'np',
			description: 'Shows nowplaying.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.nowPlayingFunction(msg);
	}
};
