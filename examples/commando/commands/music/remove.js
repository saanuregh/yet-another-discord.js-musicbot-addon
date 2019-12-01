const { Command } = require('discord.js-commando');

module.exports = class MusicRemoveCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'remove',
			aliases: [],
			group: 'music',
			memberName: 'remove',
			description: 'Remove a song from the queue.',
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					key: 'index',
					prompt: 'Index of the song?',
					type: 'string'
				}
			]
		});
	}

	run(msg, { index }) {
		this.client.music.removeFunction(msg, index);
	}
};
