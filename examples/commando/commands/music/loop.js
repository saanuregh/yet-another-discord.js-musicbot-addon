const Command = require('../../structures/Command');

module.exports = class MusicLoopCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'loop',
			aliases: [],
			group: 'music',
			memberName: 'loop',
			description: 'Loop a song.',
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					key: 'query',
					prompt: '1: Current song, n:Loop entire queue, off: Stop looping',
					type: 'string'
				}
			]
		});
	}

	run(msg, { query }) {
         this.client.music.loopFunction(query,msg);
	}
};
