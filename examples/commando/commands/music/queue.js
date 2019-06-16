const Command = require('../../structures/Command');

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
