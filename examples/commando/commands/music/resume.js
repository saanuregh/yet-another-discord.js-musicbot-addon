const { Command } = require('discord.js-commando');

module.exports = class MusicPauseCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'resume',
			aliases: [],
			group: 'music',
			memberName: 'resume',
			description: 'Resume the playback.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.resumeFunction(msg);
	}
};
