const { Command } = require('discord.js-commando');

module.exports = class MusicVolumeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'volume',
			aliases: [],
			group: 'music',
			memberName: 'volume',
			description: 'Changes the volume.',
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					key: 'volume',
					prompt: 'Volume 0-200?',
					type: 'integer',
					validate: volume => {
						if (volume <= 200 && volume >= 0) return true;
						return false;
					}
				}
			]
		});
	}

	run(msg, { volume }) {
		this.client.music.volumeFunction(msg, volume);
	}
};
