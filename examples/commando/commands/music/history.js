const { Command } = require('discord.js-commando');

module.exports = class MusicHistoryCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'history',
			aliases: [],
			group: 'music',
			memberName: 'history',
			description: 'Shows playback history.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.showHistoryFunction(msg);
	}
};
