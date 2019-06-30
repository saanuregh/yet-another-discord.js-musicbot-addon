const { Command } = require('discord.js-commando');

module.exports = class MusicShuffleCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'shuffle',
			aliases: [],
			group: 'music',
			memberName: 'shuffle',
			description: 'Shuffles current queue.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.shuffleFunction(msg);
	}
};
