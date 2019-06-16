const Command = require('../../structures/Command');

module.exports = class MusicLeaveCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'leave',
			aliases: [],
			group: 'music',
			memberName: 'leave',
			description: 'Leaves the voice channel.',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	run(msg) {
         this.client.music.leaveFunction(msg);
	}
};
