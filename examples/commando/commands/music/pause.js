const { Command } = require('discord.js-commando');

module.exports = class MusicPauseCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pause',
			aliases: [],
			group: 'music',
			memberName: 'pause',
			description: 'Pause the song.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.pauseFunction(msg);
	}
};
