const Command = require('../../structures/Command');

module.exports = class MusicVolumeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'volume',
			aliases: [],
			group: 'music',
			memberName: 'volume',
			description: 'Changes the volume output of the bot.',
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					key: 'query',
					prompt: 'Volume 0-100?',
					type: 'string'
				}
			]
		});
	}

	run(msg, { query }) {
         this.client.music.volumeFunction(query,msg);
	}
};
