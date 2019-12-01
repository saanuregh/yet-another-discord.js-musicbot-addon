const { Command } = require('discord.js-commando');

module.exports = class MusicStopCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'stop',
			aliases: [],
			group: 'music',
			memberName: 'stop',
			cription: 'Stops playback and clears queue.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
		this.client.music.stopFunction(msg);
	}
};
