const Discord = require('discord.js');
const { getBasicInfo } = require('ytdl-core');
const ytdlDiscord = require('ytdl-core-discord');
const ytpl = require('ytpl');
const request = require('node-superfetch');
const moment = require('moment');
const paginationEmbed = require('discord.js-pagination');
require('moment-duration-format');

module.exports = class MusicClient {
	constructor(client, options) {
		this.client = client;
		this.apiKey = options && options.apiKey;
		this.defVolume = (options && options.defVolume) || 50;
		this.bitRate = (options && options.bitRate) || '120000';
		this.maxHistory = (options && options.maxHistory) || 50;
		this.maxQueue = (options && options.maxQueue) || 500;
		this.searchFilters = options && options.searchFilters;
		this.color = (options && options.color) || 13632027;
		this.logger = (options && options.logger) || console;
		this.servers = new Map();
		this.logger.info('[READY] Ready to play some tunes.');
	}

	static get queueMode() {
		return {
			NORMAL: 'n',
			REPEAT_ALL: 'ra',
			REPEAT_ONE: 'ro'
		};
	}
	static get noteType() {
		return {
			ERROR: 'error',
			INFO: 'info',
			MUSIC: 'music',
			SEARCH: 'search'
		};
	}
	static song() {
		return {
			id: '',
			title: '',
			uploader: '',
			uploaderURL: '',
			requester: '',
			requesterAvatarURL: '',
			url: '',
			duration: ''
		};
	}

	getServer(serverId) {
		if (!this.servers.has(serverId)) {
			this.servers.set(serverId, {
				id: serverId,
				audioDispatcher: null,
				queue: new Array(),
				history: new Array(),
				mode: MusicClient.queueMode.NORMAL,
				volume: this.defVolume
			});
		}
		const server = this.servers.get(serverId);
		return server;
	}
	getCurrentSong(server) {
		return server.history[0];
	}
	getNextSong(server) {
		if (server.queue.length > 0) {
			const song = server.queue[0];
			if (server.mode === MusicClient.queueMode.NORMAL) {
				server.queue.shift();
			} else if (server.mode === MusicClient.queueMode.REPEAT_ALL) {
				server.queue.shift();
				server.queue.push(song);
			}
			return song;
		}
	}
	addSongToHistory(server, song) {
		if (server.history[0] !== song) {
			server.history.unshift(song);
			while (server.history.length > this.maxHistory) server.history.pop();
		}
	}
	async playStream(song, msg, volume, seek = 0) {
		const conn = await this.getVoiceConnection(msg);
		return conn.play(await ytdlDiscord(song.url), {
			bitrate: this.bitRate,
			passes: 3,
			seek,
			volume: volume / 100,
			type: 'opus'
		});
	}
	async playNow(server, song, msg) {
		try {
			if (server.audioDispatcher) this.stop(server, msg, false);
			server.audioDispatcher = await this.playStream(song, msg, server.volume);
			this.addSongToHistory(server, song);
			server.audioDispatcher.on('finish', () => this.playNext(server, msg));
			server.audioDispatcher.on('error', error => this.note(error, msg, MusicClient.noteType.ERROR));
			this.displaySong(server, msg, song);
			this.logger.info(`[PLAYER] Playing SONG_URL:${song.url} SERVERID:${server.id}`);
		} catch (error) {
			this.note(msg, error, MusicClient.noteType.ERROR);
			this.logger.error(`[PLAYER] ${error.stack}`);
			this.playNext(server, msg);
		}
	}
	playNext(server, msg) {
		try {
			const song = this.getNextSong(server);
			if (song) return this.playNow(server, song, msg);
			this.stop(server, msg, false);
			this.disconnectVoiceConnection(msg);
			this.note(msg, 'Queue is empty, playback finished.', MusicClient.noteType.MUSIC);
		} catch (error) {
			this.disconnectVoiceConnection(msg);
		}
	}
	stop(server, msg, displayNote = true) {
		if (!server.audioDispatcher && displayNote) {
			return this.note(msg, 'Nothing playing right now.', MusicClient.noteType.ERROR);
		}
		server.audioDispatcher.pause();
		server.audioDispatcher.destroy();
		server.audioDispatcher = null;
		if (displayNote) return this.note(msg, 'Playback stopped.', MusicClient.noteType.MUSIC);
	}
	async getVoiceConnection(msg) {
		if (!msg.guild) throw new Error('Unable to find discord server.');
		const voiceChannel = msg.member.voice.channel;
		const voiceConnection = this.client.voice.connections.find(val => val.channel.guild.id === msg.guild.id);
		if (!voiceConnection) {
			if (voiceChannel && voiceChannel.joinable) return await voiceChannel.join();
			throw new Error('Unable to join your voice channel.');
		}
		return voiceConnection;
	}
	disconnectVoiceConnection(msg) {
		const serverId = msg.guild.id;
		this.client.voice.connections.forEach(conn => {
			if (conn.channel.guild.id === serverId) conn.disconnect();
		});
	}
	async getSongViaUrl(url) {
		this.logger.info(`[REQUEST] URL:${url}`);
		const info = await getBasicInfo(url);
		const song = MusicClient.song();
		song.id = info.video_id;
		song.title = info.title;
		song.url = info.video_url;
		song.uploader = info.author.name;
		song.uploaderURL = `https://www.youtube.com/channel/${info.player_response.videoDetails.channelId}`;
		song.duration = moment.duration(parseInt(info.length_seconds), 'seconds').format();
		return [song];
	}
	async getSongsViaPlaylistUrl(url) {
		this.logger.info(`[REQUEST] PLAYLIST_URL:${url}`);
		const playId = url.toString().split('list=')[1];
		const playlist = await ytpl(playId);
		if (playlist.items.length < 1) throw new Error('Couldn\'t get any songs from that playlist.');
		const songs = [];
		for (const info of playlist.items) {
			const song = MusicClient.song();
			song.id = info.id;
			song.title = info.title;
			song.url = info.url_simple;
			song.uploader = info.author.name;
			song.uploaderURL = info.author.ref;
			song.duration = info.duration;
			songs.push(song);
		}
		return songs;
	}
	filterSong(songs, query) {
		let exclude = this.searchFilters;
		exclude = exclude.filter(term => !query.includes(term));
		let hit = songs[0];
		songs.reverse().forEach(song => {
			if (!new RegExp(exclude.join('|'), 'u').test(song.title)) hit = song;
		});
		return hit;
	}
	async getSongsViaSearchQuery(query) {
		this.logger.info(`[REQUEST] QUERY:${query} FILTER:${this.searchFilters ? 'ENABLED' : 'DISABLED'}`);
		const searchString = query.trim();
		const { body, error } = await request.get('https://www.googleapis.com/youtube/v3/search').query({
			part: 'snippet',
			type: 'video',
			maxResults: this.searchFilters ? 5 : 1,
			q: searchString,
			key: this.apiKey
		});
		if (!body.items.length || error) throw new Error(`No results for query: "${searchString}".`);
		const songs = [];
		for (const info of body.items) {
			const song = MusicClient.song();
			song.id = info.id.videoId;
			song.title = info.snippet.title;
			song.url = `https://www.youtube.com/watch?v=${info.id.videoId}`;
			song.uploader = info.snippet.channelTitle;
			song.uploaderURL = `https://www.youtube.com/channel/${info.snippet.channelId}`;
			song.duration = moment
				.duration(parseInt((await getBasicInfo(song.url)).length_seconds), 'seconds')
				.format();
			songs.push(song);
		}
		if (this.searchFilters && songs.length > 0) return [this.filterSong(songs, searchString)];
		return [songs[0]];
	}
	async search(msg, query) {
		let searchString = query.trim();
		let songs = [];
		let note;
		if (searchString.includes('youtu.be/') || searchString.includes('youtube.com/')) {
			if (searchString.includes('&')) searchString = searchString.split('&')[0];
			if (searchString.includes('watch') || searchString.includes('youtu.be/')) {
				note = await this.note(msg, '*~Searching for the YouTube URL~*', MusicClient.noteType.SEARCH);
				songs = await this.getSongViaUrl(searchString);
			} else if (searchString.includes('playlist')) {
				note = await this.note(msg, '*~Searching for the YouTube playlist~*', MusicClient.noteType.SEARCH);
				songs = await this.getSongsViaPlaylistUrl(searchString);
			}
		} else {
			note = await this.note(msg, '*~Searching for the search query~*', MusicClient.noteType.SEARCH);
			songs = await this.getSongsViaSearchQuery(query);
		}
		note.delete({ timeout: 3000 });
		return songs;
	}
	displaySong(server, msg, song) {
		if (!msg.channel) throw new Error('Channel is inaccessible.');
		let repeatMode = 'Disabled';
		if (server.mode === MusicClient.queueMode.REPEAT_ALL) repeatMode = 'All';
		if (server.mode === MusicClient.queueMode.REPEAT_ONE) repeatMode = 'One';
		const embed = new Discord.MessageEmbed()
			.setAuthor('Now Playing', this.client.user.displayAvatarURL())
			.setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
			.setColor(this.color)
			.addField('Title', `[${song.title}](${song.url})`)
			.addField('Uploader', `[${song.uploader}](${song.uploaderURL})`, true)
			.addField('Length', `${song.duration}`, true)
			.addField('Requester', `<@${song.requester}>`, true)
			.addField('Volume', `${server.audioDispatcher.volume * 100}%`, true)
			.addField('Repeat', `${repeatMode}`, true);
		return msg.channel.send(embed);
	}
	async note(msg, text, type) {
		if (!msg.channel) throw new Error('Channel is inaccessible.');
		const embed = new Discord.MessageEmbed().setColor(this.color);
		switch (type) {
			case MusicClient.noteType.INFO:
				return await msg.channel.send(embed.setDescription(`:information_source: | ${text}`));
			case MusicClient.noteType.MUSIC:
				return await msg.channel.send(embed.setDescription(`:musical_note: | ${text}`));
			case MusicClient.noteType.SEARCH:
				return await msg.channel.send(embed.setDescription(`:mag: | ${text}`));
			case MusicClient.noteType.ERROR:
				return await msg.channel.send(embed.setDescription(`:warning: | ${text}`));
			default:
				return await msg.channel.send(embed.setDescription(`${text}`));
		}
	}
	pageEmbed(_title, _isField, _extraTitle, _extraText) {
		class pageEmbed extends Discord.MessageEmbed {
			constructor(title, avatarURL, color, isField = false, extraTitle, extraText) {
				super();
				this.setAuthor(title, avatarURL);
				this.setColor(color);
				if (extraTitle) this.addField(extraTitle, extraText);
				this.isField = isField;
			}
			addContent(title, text) {
				!this.isField ? this.setDescription(text) : this.addField(title, text);
			}
		}
		const avatarURL = this.client.user.displayAvatarURL();
		return new pageEmbed(_title, avatarURL, this.color, _isField, _extraTitle, _extraText);
	}
	pageBuilder(title, list, pageLimit, isField, extraTitle, extraText) {
		const pages = [];
		if (list.length < 1) {
			const pageEmbed = this.pageEmbed(title, isField, extraTitle, extraText);
			pageEmbed.addContent(title, `${title} is empty.`);
			pages.push(pageEmbed);
		}
		for (let i = 0; i < list.length; i += pageLimit) {
			let text = '';
			const pageEmbed = this.pageEmbed(title, isField, extraTitle, extraText);
			list.slice(i, i + pageLimit).forEach((entry, index) => {
				text += `${i + index + 1}. [${entry.title}](${entry.url})\n*Requested by: <@${entry.requester}>*\n`;
			});
			pageEmbed.addContent(title, text);
			pages.push(pageEmbed);
		}
		return pages;
	}

	async playFunction(msg, query) {
		this.logger.info(`[COMMAND] TYPE:PLAY QUERY:${query} AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		if (!query) return this.note(msg, 'No URL or query found.', MusicClient.noteType.ERROR);
		const server = this.getServer(msg.guild.id);
		const voiceChannel = msg.member.voice.channel;
		if (!voiceChannel) return this.note(msg, 'Must be in a voice channel.', MusicClient.noteType.ERROR);
		try {
			let songs = await this.search(msg, query);
			if (songs.length + server.queue.length > this.maxQueue) {
				if (songs.length === 1) return this.note(msg, 'Queue is full.', MusicClient.noteType.ERROR);
				(await this.note(msg, 'Playlist has been shortened.', MusicClient.noteType.ERROR)).delete({
					timeout: 3000
				});
				songs = songs.slice(0, this.maxQueue - server.queue.length);
			}
			for (const song of songs) {
				song.requester = msg.author.id;
				song.requesterAvatarURL = msg.author.displayAvatarURL();
			}
			server.queue = server.queue.concat(songs);
			this.logger.info(`[QUEUE] SERVERID:${msg.guild.id} Added ${songs.length} songs.`);
			if (songs.length > 1) {
				this.note(msg, `Added to queue: ${songs.length} songs`, MusicClient.noteType.MUSIC);
			} else {
				this.note(msg, `Added to queue: [${songs[0].title}](${songs[0].url})`, MusicClient.noteType.MUSIC);
			}
			if (!server.audioDispatcher) this.playNext(server, msg);
		} catch (error) {
			this.logger.error(`[COMMAND] TYPE:PLAY ${error.stack} SERVERID:${server.id}`);
			this.note(msg, error, MusicClient.noteType.ERROR);
		}
	}
	clearFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:CLEAR AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		server.queue = new Array();
		this.note(msg, 'Queue is now empty.', MusicClient.noteType.MUSIC);
	}
	leaveFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:LEAVE AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const voiceConnection = this.client.voice.connections.find(val => val.channel.guild.id === msg.guild.id);
		if (!voiceConnection) return this.note(msg, 'Not in a voice channel.', MusicClient.noteType.ERROR);
		const server = this.getServer(msg.guild.id);
		this.stop(server, msg);
		this.disconnectVoiceConnection(msg);
		this.note(msg, 'Leaving voice channel.', MusicClient.noteType.MUSIC);
	}
	nowPlayingFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:NOWPLAYING AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		if (!server.audioDispatcher) return this.note(msg, 'Nothing playing right now.', MusicClient.noteType.ERROR);
		this.displaySong(server, msg, this.getCurrentSong(server));
	}
	pauseFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:PAUSE AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		if (!server.audioDispatcher) {
			this.note(msg, 'Nothing playing right now.', MusicClient.noteType.ERROR);
		} else if (server.audioDispatcher.paused) {
			this.note(msg, 'Music already paused.', MusicClient.noteType.ERROR);
		} else {
			server.audioDispatcher.pause(true);
			this.note(msg, 'Playback paused.', MusicClient.noteType.MUSIC);
		}
	}
	resumeFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:RESUME AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		if (!server.audioDispatcher) {
			this.note(msg, 'Nothing playing right now.', MusicClient.noteType.ERROR);
		} else if (!server.audioDispatcher.paused) {
			this.note(msg, 'Music already playing.', MusicClient.noteType.ERROR);
		} else {
			server.audioDispatcher.resume();
			this.note(msg, 'Playback resumed.', MusicClient.noteType.MUSIC);
		}
	}
	stopFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:STOP AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		this.stop(server, msg);
		server.queue = new Array();
		this.note(msg, 'Queue is now empty.', MusicClient.noteType.MUSIC);
	}
	repeatFunction(msg, mode) {
		this.logger.info(`[COMMAND] TYPE:REPEAT MODE:${mode} AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		switch (mode.trim().toLowerCase()) {
			case 'one':
				if (server.queue[0] !== server.history[0]) server.queue.unshift(server.history[0]);
				server.mode = MusicClient.queueMode.REPEAT_ONE;
				return this.note(msg, 'Repeat: One', MusicClient.noteType.MUSIC);
			case 'all':
				if (server.queue[server.queue.length - 1] !== server.history[0]) server.queue.push(server.history[0]);
				server.mode = MusicClient.queueMode.REPEAT_ALL;
				return this.note(msg, 'Repeat: All', MusicClient.noteType.MUSIC);
			case 'off':
				server.mode = MusicClient.queueMode.NORMAL;
				return this.note(msg, 'Repeat: Disabled', MusicClient.noteType.MUSIC);
			default:
				return this.note(msg, 'Invalid argument.', MusicClient.noteType.ERROR);
		}
	}
	removeFunction(msg, songIndex) {
		this.logger.info(
			`[COMMAND] TYPE:REMOVE INDEX:${songIndex} AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`
		);
		if (!songIndex) return this.note(msg, 'No index specified.', MusicClient.noteType.ERROR);
		const index = songIndex - 1;
		const server = this.getServer(msg.guild.id);
		if (index < 0 || index >= server.queue.length) {
			return this.note(msg, 'Index out of bounds.', MusicClient.noteType.ERROR);
		}
		const song = server.queue[index];
		server.queue.splice(index, 1);
		this.logger.info('[QUEUE] Removed 1 song.');
		return this.note(msg, `[${song.title}](${song.url}) removed from the queue!`, MusicClient.noteType.MUSIC);
	}
	shuffleFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:SHUFFLE AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		if (server.queue.length < 1) return this.note(msg, 'Queue is empty.', MusicClient.noteType.ERROR);
		for (let i = server.queue.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[server.queue[i], server.queue[j]] = [server.queue[j], server.queue[i]];
		}
		this.note(msg, 'Queue has shuffled.', MusicClient.noteType.MUSIC);
	}
	skipFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:SKIP AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		if (!server.audioDispatcher) return this.note(msg, 'Nothing playing right now.', MusicClient.noteType.ERROR);
		this.note(msg, 'Skipping song.', MusicClient.noteType.MUSIC);
		server.audioDispatcher.end();
	}
	volumeFunction(msg, volume) {
		this.logger.info(`[COMMAND] TYPE:VOLUME VALUE:${volume} AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		if (isNaN(volume)) return this.note(msg, 'No volume specified.', MusicClient.noteType.ERROR);
		if (volume < 0 || volume > 200) {
			return this.note(msg, 'Volume should be between 0 and 200.', MusicClient.noteType.ERROR);
		}
		const server = this.getServer(msg.guild.id);
		this.note(msg, `Setting volume to ${volume}.`, MusicClient.noteType.MUSIC);
		server.defVolume = volume;
		if (server.audioDispatcher) server.audioDispatcher.setVolume(volume / 100);
	}
	showHistoryFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:HISTORY AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		const pages = this.pageBuilder('History', server.history, 10);
		paginationEmbed(msg, pages);
	}
	showQueueFunction(msg) {
		this.logger.info(`[COMMAND] TYPE:QUEUE AUTHOR_ID:${msg.author.id} SERVERID:${msg.guild.id}`);
		const server = this.getServer(msg.guild.id);
		const nowPlaying = this.getCurrentSong(server);
		let nowPlayingText = 'Nothing playing right now.';
		if (nowPlaying && server.audioDispatcher) {
			nowPlayingText = `[${nowPlaying.title}](${nowPlaying.url})\n*Requested by: <@${nowPlaying.requester}>*\n`;
		}
		const pages = this.pageBuilder('Queue', server.queue, 5, true, 'Now Playing', nowPlayingText);
		paginationEmbed(msg, pages);
	}
};
