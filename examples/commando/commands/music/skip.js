const { Command } = require('discord.js-commando');

module.exports = class MusicStopCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'skip',
			aliases: [],
			group: 'music',
			memberName: 'skip',
			description: 'Skips current song.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.skipFunction(msg);
	}
};
