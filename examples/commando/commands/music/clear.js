const { Command } = require('discord.js-commando');

module.exports = class MusicClearCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clear',
			aliases: [],
			group: 'music',
			memberName: 'clear',
			description: 'Clears Queue',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.clearFunction(msg);
	}
};
