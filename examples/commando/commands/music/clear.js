const Command = require('../../structures/Command');

module.exports = class MusicClearCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clear',
			aliases: [],
			group: 'music',
			memberName: 'clear',
			description: 'Clear Queue',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
         this.client.music.clearFunction(msg);
	}
};
