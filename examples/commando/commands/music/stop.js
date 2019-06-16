const Command = require('../../structures/Command');

module.exports = class MusicStopCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'stop',
			aliases: [],
			group: 'music',
			memberName: 'stop',
			description: 'Stops playback.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
         this.client.music.stopFunction(msg);
	}
};
