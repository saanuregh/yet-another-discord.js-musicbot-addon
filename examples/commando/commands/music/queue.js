const { Command } = require('discord.js-commando');

module.exports = class MusicQueueCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'queue',
			aliases: [],
			group: 'music',
			memberName: 'queue',
			description: 'Shows current queue.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.showQueueFunction(msg);
	}
};
