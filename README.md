<div align="center">
  <p>
    <a href="https://nodei.co/npm/yet-another-discord.js-musicbot-addon
/"><img src="https://nodei.co/npm/yet-another-discord.js-musicbot-addon.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>

# Yet Another Discord MusicBot Addon
An easily customizable Node.js based music extension/bot for Discord.js@12.0.0 (master) projects using YouTube. Doesn't have inbuilt command handling, either use discord.js-commando or make your own. Supports multiple servers.

__The commands available are:__
* `play <url>|<search string>`: Play audio from YouTube URLs (video and playlist) or search string. Used as resume function also.
* `skip`: Skip a song .
* `queue`: Display the current queue.
* `history`: Show the history of playback.
* `resume`: Resumes music playback.
* `pause`: Pause music playback.
* `loop <one>|<all>|<off>`: Loop music playback. `one`: loop current song `all`: loop entire queue `off`: play normally.
* `shuffle`: Shuffles the queue.
* `remove <position>`: Remove a song from the queue by position.
* `volume <value>`: Adjust the playback volume between 0 and 200.
* `leave`: Bot leaves the channel.
* `stop`: Bot stops playback.
* `clear`: Clears the song queue.
* `np`: Show the current playing song.

# Installation
__Pre-installation:__
1. `npm install github:discordjs/discord.js`

2. `npm install node-opus` or `npm install opusscript`
Required for voice. Discord.js _prefers_ node-opus.

__Installation:__
* `npm install yet-another-discord.js-musicbot-addon`
Long name I know 😁

# Examples
__Basic Bot Example__
```js
// Require the Discord.js client or Discord.js-commando client.
const Discord = require('discord.js');
const client = new Discord.Client();
// Import the MusicClient Class from the module
const MusicClient = require("yet-another-discord.js-musicbot-addon");
// Put the Music module in the new Client object.
// This allows for easy access to all the modules
// functions and data.
client.music = new MusicClient(client, {
  // Set the api key used for YouTube.
  // This is required to run the bot.
	apiKey: "YouTubeAPIKeyHere",
	//all other options are optional
	defVolume: 50,
	bitRate: 12000,
	maxHistory: 50,
	maxQueue: 100,
	searchFilters: ['cover', 'live', 'remix', 'mix', 'parody', 'hour', 'extended'],
	color: 13632027,
	logger: logger()
});
// Connect the bot with your Discord applications bot token.
client.login("token");
```
__Commands example__
See the examples directory.
Currently i have only commando examples there.

# Options & Config.
***
__Most options are optional and thus not needed.__
The options you can pass in `new MusicClient(client,{options})` and their types is as followed:

## Basic Options.
| Option | Type | Description | Default |
| --- | --- | --- | --- |
| apiKey | String | A YouTube Data API3 key. Required to run. | NaN |
| defVolume | Number | The default volume of music. 1 - 100. | 50 |
| bitRate | String | Sets the preferred bitRate for the Discord.js stream to use. | "120000" |
| maxHistory | Number | Max history size allowed. | 50 |
| maxQueue | Number | Max queue size allowed. | 500 |
| searchFilters | Object/Array | List of filters for the YouTube query search. | [ ] |
| maxHistory | Number | Max history size allowed. | 50 |
| color | Number | Color of the embeds. | 13632027 |
| logger | Class or Function | For custom logger. | console |

# Functions.
playFunction(msg, query, force = false)
pauseFunction(msg)
resumeFunction(msg)
stopFunction(msg)
clearFunction(msg)
leaveFunction(msg)
repeatFunction(msg, mode)
shuffleFunction(msg)
skipFunction(msg)
previousFunction(msg)
removeFunction(msg, songIndex)
volumeFunction(msg, volume)
nowPlayingFunction(msg)
showHistoryFunction(msg)
showQueueFunction(msg)
searchFiltersFunction(msg, mode)
