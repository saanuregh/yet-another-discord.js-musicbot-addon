const Command = require('../../structures/Command');

module.exports = class MusicPlayCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'play',
			aliases: [],
			group: 'music',
			memberName: 'play',
			description: 'Play a song or resume playback.',
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					key: 'query',
					prompt: 'What song would you like to play?',
					type: 'string',
					default: ''
				}
			]
		});
	}

	run(msg, { query }) {
         this.client.music.playFunction(query,msg);
	}
};
