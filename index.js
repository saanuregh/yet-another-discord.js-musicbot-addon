const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const ytdlDiscord = require("ytdl-core-discord");
const ytpl = require('ytpl');
const request = require("request");

module.exports = class MusicClient {
	constructor(client, apiKey, options) {
		this.msgType = {
			FAIL: "fail",
			INFO: "info",
			MUSIC: "music",
			SEARCH: "search"
		};
		this.client = client;
		this.apiKey = apiKey;
		this.defVolume = (options && options.defVolume) || 50;
		this.bitRate = (options && options.bitrate) || "120000";
		this.historyLength = (options && options.maxhistory) || 50;
		this.searchFilters = (options && options.searchfilters) || [];
		this.queue = [];
		this.history = [];
		this.mode = MusicClient.queueMode.NORMAL;
		this.audioDispatcher = null;
	}
	static get queueMode() {
		return {
			NORMAL: "n",
			REPEAT_ALL: "ra",
			REPEAT_ONE: "ro"
		};
	}
	getCurrentSong() {
		return new Promise((resolve, reject) => {
			resolve(this.history[0]).catch(reject);
		});
	}
	getNextSong() {
		return new Promise((resolve, reject) => {
			if (this.queue.length > 0) {
				const song = this.queue[0];
				if (this.mode === MusicClient.queueMode.NORMAL) {
					// NORMAL: remove song first song from queue.
					this.queue.shift();
				} else if (this.mode === MusicClient.queueMode.REPEAT_ALL) {
					// REPEAT_ALL: remove song first song from queue and reinsert it at the end.
					this.queue.shift();
					this.queue.push(song);
				}
				// REPEAT_ONE: Do nothing, leave current song at the top of the queue.
				this.addSongToHistory(song);
				resolve(song);
			} else {
				resolve(null);
				return;
			}
		});
	}
	addSongToHistory(song) {
		if (this.history[0] !== song) {
			this.history.unshift(song);
			while (this.history.length > this.historyLength) {
				this.history.pop();
			}
		}
	}
	search(payload) {
		return new Promise((resolve, reject) => {
			let searchString = payload.trim();
			if (
				searchString.includes("youtu.be/") ||
				searchString.includes("youtube.com/")
			) {
				// YouTube url detected:
				if (searchString.includes("&")) {
					searchString = searchString.split("&")[0];
				}
				if (
					searchString.includes("watch") ||
					searchString.includes("youtu.be/")
				) {
					// YouTube video url detected:
					this.getSongViaUrl(searchString)
						.then(songs =>
							resolve({ note: "Getting song from YouTube url~", songs })
						)
						.catch(reject);
				} else if (searchString.includes("playlist")) {
					// Youtube playlist url detected:
					this.getSongsViaPlaylistUrl(searchString)
						.then(songs =>
							resolve({ note: "Getting songs from YouTube playlist url~", songs })
						)
						.catch(reject);
				}
			} else {
				this.querySearch(payload)
					.then(resolve)
					.catch(reject);
			}
		});
	}
	querySearch(payload) {
		return new Promise((resolve, reject) => {
			const searchString = payload.trim();
			let note = "Getting songs from YouTube search query~";
			this.getSongsViaSearchQuery(searchString)
				.then(songs => resolve({ note, songs }))
				.catch(err => {
					reject(new Error(`${err}`));
				});
		});
	}
	getSongViaUrl(searchString) {
		return new Promise((resolve, reject) => {
			ytdl.getBasicInfo(searchString, {}, (err, info) => {
				if (err) {
					return reject(err);
				}
				const song = new Song();
				song.title = info.title;
				song.url = info.video_url;
				song.artist = info.author.name;
				return resolve([song]);
			});
		});
	}
	getSongsViaPlaylistUrl(searchString) {
		const playId = searchString.toString().split("list=")[1];
		return new Promise((resolve, reject) => {
			ytpl(playId, (err, playlist) => {
				if (err) {
					return reject(
						new Error("Something went wrong fetching that playlist!")
					);
				}
				if (playlist.items.length <= 0) {
					return reject(
						new Error("Couldn't get any songs from that playlist.")
					);
				}
				const songs = [];
				playlist.items.forEach(info => {
					const song = new Song();
					song.title = info.title;
					song.url = info.url_simple;
					song.artist = info.author.name;
					songs.push(song);
				});
				return resolve(songs);
			});
		});
	}
	getSongsViaSearchQuery(searchString) {
		return new Promise((resolve, reject) => {
			const maxResults = 5;
			request(
				"https://www.googleapis.com/youtube/v3/search?" +
				"part=snippet&" +
				"type=video&" +
				"videoCategoryId=10&" + // https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=DE&key=
				"fields=items(id%2FvideoId%2Csnippet(channelTitle%2Ctitle))&" + // Cspell:disable-line
				`maxResults=${maxResults}&` +
				`q=${encodeURIComponent(searchString)}&` +
				`key=${this.apiKey}`,
				(error, response, body) => {
					if (error) {
						return reject(error);
					}
					if (
						typeof body === "undefined" ||
						typeof JSON.parse(body).items === "undefined"
					) {
						return reject(new Error("Something went wrong. Try again! [YT]"));
					}
					const result = JSON.parse(body).items;
					if (result.length < 1) {
						return reject(
							new Error(`No results for Query: "${searchString}"! [YT]`)
						);
					}
					let songs = [];
					for (let index = 0; index < result.length; index++) {
						const song = new Song();
						song.title = result[index].snippet.title;
						song.url = `https://www.youtube.com/watch?v=${
							result[index].id.videoId
							}`;
						song.artist = result[index].snippet.channelTitle;
						songs.push(song);
					}
					if (songs.length > 0) {
						songs = [this.autoChoose(songs, searchString)];
					}
					return resolve(songs);
				}
			);
		});
	}
	autoChoose(songs, query) {
		let exclude = this.searchFilters;
		exclude = exclude.filter(term => !query.includes(term));
		let hit = songs[0];
		songs.reverse().forEach(song => {
			if (!new RegExp(exclude.join("|"), "u").test(song.title)) {
				hit = song;
			}
		});
		return hit;
	}
	handleSongEnd(msg, startTime) {
		const delta = new Date() - startTime;
		if (delta < 2000) {
			// Try to reset everything.
			this.simpleNote(
				msg,
				"Song ended to quickly: Try to reset voice.",
				this.msgType.FAIL
			);
			this.audioDispatcher.destroy();
			this.audioDispatcher = null;
			this.disconnectVoiceConnection(msg);
			this.getVoiceConnection(msg)
				.then(() => this.playNext(msg))
				.catch(err => this.simpleNote(msg, err, this.msgType.FAIL));
			return;
		}
		this.playNext(msg);
	}
	playNow(song, msg) {
		if (this.audioDispatcher) {
			this.audioDispatcher.destroy();
			this.audioDispatcher = null;
		}
		this.playStream(song, msg)
			.then(dispatcher => {
				this.addSongToHistory(song);
				this.audioDispatcher = dispatcher;
				const startTime = new Date();
				this.audioDispatcher.on("finish", () =>
					this.handleSongEnd(msg, startTime)
				);
				this.audioDispatcher.on("error", error => this.simpleNote(error, msg, this.msgType.FAIL));
				this.simpleNote(msg, `Playing now: ${song.title}`, this.msgType.MUSIC);
				this.displaySong(msg, song);
			})
			.catch(error => {
				this.simpleNote(msg, error, this.msgType.FAIL);
				this.playNext(msg);
			});
	}
	playNext(msg) {
		this.getNextSong()
			.then(song => {
				if (song === null) {
					this.simpleNote(
						msg,
						"Queue is empty, playback finished!",
						this.msgType.MUSIC
					);
					this.disconnectVoiceConnection(msg);
				} else {
					this.playNow(song, msg);
				}
			})
			.catch(err => {
				this.simpleNote(msg, err, this.msgType.FAIL);
				this.disconnectVoiceConnection(msg);
			});
	}
	play(msg) {
		if (!this.audioDispatcher || this.audioDispatcher.writableLength <= 0) {
			this.playNext(msg);
		} else if (this.audioDispatcher.paused) {
			this.audioDispatcher.resume();
			this.simpleNote(msg, "Now playing!", this.msgType.MUSIC);
		}
	}
	stop(msg) {
		if (!this.audioDispatcher) {
			this.simpleNote(msg, "Audio stream not found!", this.msgType.FAIL);
			return;
		}
		this.audioDispatcher.destroy();
		this.audioDispatcher = null;
		this.simpleNote(msg, "Playback stopped!", this.msgType.MUSIC);
	}
	playStream(song, msg, seek = 0) {
		return new Promise((resolve, reject) => {
			const opt = {
				bitrate: this.bitRate,
				passes: 3,
				seek,
				volume: this.defVolume / 100,
				type: "opus"
			};
			this.getVoiceConnection(msg)
				.then(conn =>
					this.getStream(song)
						.then(stream => resolve(conn.play(stream, opt)))
						.catch(err => reject(err))
				)
				.catch(err => reject(err));
		});
	}
	disconnectVoiceConnection(msg) {
		const serverId = msg.guild.id;
		this.client.voice.connections.forEach(conn => {
			if (conn.channel.guild.id === serverId) {
				conn.disconnect();
			}
		});
	}
	getVoiceConnection(msg) {
		if (typeof msg.guild === "undefined") {
			return new Promise((resolve, reject) =>
				reject(new Error("Unable to find discord server!"))
			);
		}
		const serverId = msg.guild.id;
		const voiceChannel = msg.member.voice.channel;
		return new Promise((resolve, reject) => {
			// Search for established connection with this server.
			const voiceConnection = this.client.voice.connections.find(
				val => val.channel.guild.id === serverId
			);
			// If not already connected try to join.
			if (typeof voiceConnection === "undefined") {
				if (voiceChannel && voiceChannel.joinable) {
					voiceChannel
						.join()
						.then(connection => {
							resolve(connection);
						})
						.catch(() => {
							reject(new Error("Unable to join your voice channel!"));
						});
				} else {
					reject(new Error("Unable to join your voice channel!"));
				}
			} else {
				resolve(voiceConnection);
			}
		});
	}
	getStream(song) {
		return new Promise((resolve, reject) => {
			resolve(ytdlDiscord(song.url));
		});
	}
	playFunction(payload, msg) {
		if (typeof payload === "undefined" || payload.length === 0) {
			this.simpleNote(msg, "Nothing to resume and no URL or query found!", this.msgType.FAIL);
			return;
		}
		this.search(payload).
			then(({ note, songs }) => {
				this.simpleNote(msg, note, this.msgType.MUSIC).
					then((infoMsg) => infoMsg.delete({ "timeout": 5000 }));
				if (songs.length > 1) {
					const enrichedSongs = songs.map((song) => {
						song.requester = msg.author.username;
						song.requesterAvatarURL = msg.author.displayAvatarURL();
						return song;
					});
					this.queue = this.queue.concat(enrichedSongs);
					const count = enrichedSongs.length;
					this.simpleNote(msg, `${count} songs added to queue.`, this.msgType.MUSIC);
				} else {
					songs[0].requester = msg.author.username;
					songs[0].requesterAvatarURL = msg.author.displayAvatarURL();
					this.queue.push(songs[0]);
					this.simpleNote(msg, `song added to queue: ${songs[0].title}`, this.msgType.MUSIC);
				}
				this.play(msg);
			}).
			catch((error) => this.simpleNote(msg, error, this.msgType.FAIL));
	}
	clearFunction(msg) {
		this.queue = [];
		this.simpleNote(msg, "Queue is now empty!", this.msgType.MUSIC);
	}
	leaveFunction(msg) {
		this.stop(msg);
		this.disconnectVoiceConnection(msg);
	}
	loopFunction(payload, msg) {
		if (payload === "1") {
			this.mode = "ro";
			this.simpleNote(msg, "Loop current song!", this.msgType.MUSIC);
		} else if (this.mode === "n") {
			this.mode = "ra";
			this.simpleNote(msg, "Loop current queue!", this.msgType.MUSIC);
		} else {
			this.mode = "n";
			this.simpleNote(msg, "No more looping!", this.msgType.MUSIC);
		}
	}
	nowPlayingFunction(msg) {
		this.getCurrentSong().
			then((nowPlaying) => {
				if (typeof nowPlaying === "undefined") {
					this.simpleNote(msg, "Go check your ears, there is clearly nothing playing right now!", this, this.msgType.FAIL);
				} else {
					this.displaySong(
						msg, nowPlaying
					);
				}
			});
	}
	pauseFunction(msg) {
		if (!this.audioDispatcher) {
			this.simpleNote(msg, "Audio stream not found!", this.msgType.FAIL);
		} else if (this.audioDispatcher.paused) {
			this.simpleNote(msg, "Playback already paused!", this.msgType.FAIL);
		} else {
			this.audioDispatcher.pause(true);
			this.simpleNote(msg, "Playback paused!", this.msgType.MUSIC);
		}
	}
	removeFunction(payload, msg) {
		if (typeof payload === "undefined" || payload.length === 0 || isNaN(payload)) {
			this.simpleNote(msg, "No queue number found!", this.msgType.FAIL);
			this.simpleNote(msg, `Usage: ${this.usage}`, this.msgType.INFO);
			return;
		}
		const index = payload - 1;
		if (index < 0 || index >= this.queue.length) {
			this.simpleNote(msg, "queue number out of bounds!", this.msgType.FAIL);
			return;
		}
		const song = this.queue[index];
		this.queue.splice(index, 1)
		const message = `${song.title} - ${song.artist} removed from the queue!`;
		this.simpleNote(msg, message, this.msgType.MUSIC);
	}
	showHistoryFunction(msg) {
		const pages = [];
		let historyText = "";
		this.history.forEach((entry, index) => {
			historyText += `${index + 1}. ${entry.title} - ${entry.artist}\n`;
			if ((index + 1) % 10 === 0) {
				historyText += `Page ${pages.length + 1} / ${Math.ceil(this.history.length / 10)}`;
				const embed = new Discord.MessageEmbed();
				embed.setAuthor('History', this.client.user.displayAvatarURL());
				embed.setColor(48769);
				embed.setDescription(historyText);
				pages.push(embed);
				historyText = "";
			}
		});
		if (this.history.length % 10 !== 0) {
			historyText += `Page ${pages.length + 1} / ${Math.ceil(this.history.length / 10)}`;
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('History', this.client.user.displayAvatarURL());
			embed.setColor(48769);
			embed.setDescription(historyText);
			pages.push(embed);
		}
		if (pages.length === 0) {
			this.simpleNote(msg, "History is empty!", this.msgType.INFO);
		} else {
			this.pagedContent(msg, pages);
		}
	}
	showQueueFunction(msg) {
		const pages = [];
		let queueText = "";
		this.queue.forEach((entry, index) => {
			queueText += `${index + 1}. ${entry.title} - ${entry.artist}\n`;
			if ((index + 1) % 10 === 0) {
				queueText += `Page ${pages.length + 1} / ${Math.ceil(this.queue.length / 10)}`;
				const embed = new Discord.MessageEmbed();
				embed.setAuthor('Queue', this.client.user.displayAvatarURL());
				embed.setColor(48769);
				embed.setDescription(queueText);
				pages.push(embed);
				queueText = "";
			}
		});
		if (this.queue.length % 10 !== 0) {
			queueText += `Page ${pages.length + 1} / ${Math.ceil(this.queue.length / 10)}`;
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Queue', this.client.user.displayAvatarURL());
			embed.setColor(48769);
			embed.setDescription(queueText);
			pages.push(embed);
		}
		if (pages.length === 0) {
			this.simpleNote(msg, "Queue is empty!", this.msgType.INFO);
		} else {
			this.pagedContent(msg, pages);
		}
	}
	shuffleFunction(msg) {
		this.queue = shuffle(this.queue);
		this.simpleNote(msg, "Queue shuffled!", this.msgType.MUSIC);
	}
	skipFunction(msg) {
		if (!this.audioDispatcher) {
			this.simpleNote(msg, "Audio stream not found!", this.msgType.FAIL);
			return;
		}
		this.simpleNote(msg, "Skipping song!", this.msgType.MUSIC);
		this.audioDispatcher.end();
	}
	stopFunction(msg) {
		this.stop(msg);
	}
	volumeFunction(payload, msg) {
		if (!payload) {
			const note = `Volume is set to  ${this.defVolume} right now`;
			this.simpleNote(msg, note, this.msgType.MUSIC);
		} else if (isNaN(payload)) {
			const note = `What the fuck, are you doing? Ever heard of a volume setting named "${payload}"?`;
			this.simpleNote(msg, note, this.msgType.FAIL);
		} else if (payload > 200 || payload < 0) {
			const note = "A cheeky one, aren't you? Try with numbers between 0 and 200";
			this.simpleNote(msg, note, this.msgType.FAIL);
		} else {
			this.simpleNote(msg, `Set Volume to  ${payload}`, this.msgType.MUSIC);
			this.defVolume = payload;
			if (this.audioDispatcher) {
				this.audioDispatcher.setVolume(payload / 100);
			}
		}
	}
	simpleNote(msg, text, type) {
		// this.debugPrint(text);
		let ret = new Promise((resolve) => resolve({ "delete": () => null }));
		if (typeof msg.channel === "undefined") {
			return ret;
		}
		text.toString().split("\n").
			forEach((line) => {
				switch (type) {
					case this.msgType.INFO:
						ret = msg.channel.send(`:information_source: | ${line}`);
						return;
					case this.msgType.MUSIC:
						ret = msg.channel.send(`:musical_note: | ${line}`);
						return;
					case this.msgType.SEARCH:
						ret = msg.channel.send(`:mag: | ${line}`);
						return;
					case this.msgType.FAIL:
						ret = msg.channel.send(`:x: | ${line}`);
						return;
					default:
						ret = msg.channel.send(`${line}`);
				}
			});
		return ret;
	}
	displaySong(msg, song) {
		if (typeof msg.channel === "undefined") {
			return this.simpleNote(msg, "Something happened!!!", this.msgType.FAIL);;
		}
		const embed = new Discord.MessageEmbed();
		for (const key in song) {
			if (song[key] === "") {
				song[key] = "-";
			}
		}
		embed.setAuthor('Now Playing', this.client.user.displayAvatarURL());
		embed.setThumbnail(`https://img.youtube.com/vi/${ytid(song.url)}/maxresdefault.jpg`);
		embed.setColor(890629);
		embed.addField("Title", `${song.title}`, true);
		embed.addField("Artist", `${song.artist}`, true);
		embed.setFooter(`Requested by ${song.requester}`, song.requesterAvatarURL);
		msg.channel.send(embed)
	}
	pagedContent(msg, pages) {
		if (typeof msg.channel === "undefined") {
			return this.simpleNote(msg, "Something happened!!!", this.msgType.FAIL);;
		}
		return new Promise((resolve, reject) => {
			let page = 0;
			// Build choose menu.
			msg.channel.send(pages[0]).
				// Add reactions for page navigation.
				then((curPage) => this.postReactionEmojis(curPage, ["⏪", "⏩"]).
					then(() => {
						// Add listeners to reactions.
						const reactionCollector = curPage.createReactionCollector(
							(reaction, user) => (["⏪", "⏩"].includes(reaction.emoji.name) && user.id === msg.author.id),
							{ "time": 120000 }
						);
						// Handle reactions.
						reactionCollector.on("collect", (reaction) => {
							reaction.users.remove(msg.author);
							switch (reaction.emoji.name) {
								case "⏪":
									page = (page > 0) ? --page : pages.length - 1;
									break;
								case "⏩":
									page = (page + 1) < pages.length ? ++page : 0;
									break;
								default:
									break;
							}
							curPage.edit(pages[page]);
						});
						// Timeout.
						reactionCollector.on("end", () => curPage.reactions.removeAll());
						resolve(curPage);
					}).
					catch(reject)).
				catch(reject);
		});
	}
	postReactionEmojis(msg, emojiList) {
		return new Promise((resolve, reject) => {
			msg.react(emojiList.shift()).
				then(() => {
					if (emojiList.length > 0) {
						// Send all reactions recursively.
						this.postReactionEmojis(msg, emojiList).
							then(resolve).
							catch(reject);
					} else {
						resolve();
					}
				}).
				catch(reject);
		});
	}
}

class Song {
	constructor() {
		this.title = "";
		this.artist = "";
		this.requester = "";
		this.requesterAvatarURL = "";
		this.url = "";
		this.playlist = "";
	}
}

const shuffle = array => {
	let pos1 = 0,
		pos2 = 0,
		tmpVal = 0;
	for (pos1 = array.length - 1; pos1 > 0; pos1--) {
		pos2 = Math.floor(Math.random() * (pos1 + 1));
		tmpVal = array[pos1];
		array[pos1] = array[pos2];
		array[pos2] = tmpVal;
	}
	return array;
};

const ytid = (url) => {
	var ID = '';
	url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
	if (url[2] !== undefined) {
		ID = url[2].split(/[^0-9a-z_\-]/i);
		ID = ID[0];
	}
	else {
		ID = url;
	}
	return ID;
}

