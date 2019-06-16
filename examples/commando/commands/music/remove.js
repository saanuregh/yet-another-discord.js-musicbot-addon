const Command = require('../../structures/Command');

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
					key: 'query',
					prompt: 'Index of the song?',
					type: 'string'
				}
			]
		});
	}

	run(msg, { query }) {
         this.client.music.removeFunction(query,msg);
	}
};
