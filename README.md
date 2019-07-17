<div align="center">
  <p>
    <a href="https://nodei.co/npm/yet-another-discord.js-musicbot-addon
/"><img src="https://nodei.co/npm/yet-another-discord.js-musicbot-addon.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>

# Yet Another Discord MusicBot Addon
An easily customizable Node.js based music extension/bot for Discord.js@12.0.0 (master) projects using YouTube. Doesn't have inbuilt command handling, either use discord.js-commando or make your own. Supports multiple servers.

# Functions.
Common to all functions is a discord.js/discord.js-commando message object.
| Function                                        | Description                                                                                       | Parameters                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `async playFunction(msg, query, force = false)` | Plays the song specified in the query                                                             | `query`: is the search query, can be URLs, `force`: `boolean`(to force playback instead of adding to the queue) |
| `pauseFunction(msg)`                            | Pauses current song playback                                                                      |                                                                                                                 |
| `resumeFunction(msg)`                           | Resumes current song playback                                                                     |                                                                                                                 |
| `stopFunction(msg)`                             | Stops current song playback and clears the queue                                                  |                                                                                                                 |
| `clearFunction(msg)`                            | Clears the queue                                                                                  |                                                                                                                 |
| `async joinFunction(msg)`                       | Joins the channel                                                                                 |                                                                                                                 |
| `leaveFunction(msg)`                            | Leaves the channel                                                                                |                                                                                                                 |
| `repeatFunction(msg, mode)`                     | Changes the repeat modes for the playback                                                         | `mode`: `one|all|off`                                                                                           |
| `shuffleFunction(msg)`                          | Shuffles the current queue                                                                        |                                                                                                                 |
| `skipFunction(msg)`                             | Skips current song                                                                                |                                                                                                                 |
| `previousFunction(msg)`                         | Plays most recently played song from history                                                      |                                                                                                                 |
| `removeFunction(msg, songIndex)`                | Removes a song at particular index from the queue                                                 | `songIndex`: `number`                                                                                           |
| `volumeFunction(msg, volume)`                   | Sets volume of playback                                                                           | `volume`: `number: 0<=x<=200`                                                                                   |
| `nowPlayingFunction(msg)`                       | Shows currently playing song, with it's info, also has cool reaction buttons to control playback. |                                                                                                                 |
| `showHistoryFunction(msg)`                      | Shows history of playback                                                                         |                                                                                                                 |
| `showQueueFunction(msg)`                        | Shows queue                                                                                       |                                                                                                                 |
| `searchFiltersModeFunction(msg, mode)`          | Enable or disable search filters                                                                  | `mode`: `on|off`                                                                                                |
| `setSearchFiltersFunction(msg, filters)`        | Set search filters                                                                                | `filters`: `array`                                                                                              |
| `showSearchFiltersFunction(msg)`                | Show current search filters and status of search filters                                          |                                                                                                                 |


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
	searchFilters: ['cover', 'live', 'remix', 'mix', 'parody', 'hour', 'extended', 'trailer'],
	color: 13632027,
	logger: logger()
});
// Connect the bot with your Discord applications bot token.
client.login("token");
```
__Commands example__  
See the examples directory.  
Currently I have only `discord.js-commando` examples there, but you can use any kind-of command parser.

# Options & Config.
__apiKey option is only required, other options are optional and thus not needed.__  
The options you can pass in `new MusicClient(client,{options})` and their types is as followed:

## Basic Options.
| Option        | Type              | Description                                                                                                      | Default               |
| ------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| apiKey        | String            | A YouTube Data API3 key. Required to run.                                                                        | NaN                   |
| defVolume     | Number            | The default volume of music. 1 - 100.                                                                            | 50                    |
| bitRate       | String            | Sets the preferred bitRate for the Discord.js stream to use.                                                     | "120000"              |
| maxHistory    | Number            | Max history size allowed.                                                                                        | 50                    |
| maxQueue      | Number            | Max queue size allowed.                                                                                          | 500                   |
| searchFilters | Object/Array      | List of filters for the YouTube query search, ignores results matching the filters unless specified in query.    | [ ]                   |
| maxHistory    | Number            | Max history size allowed.                                                                                        | 50                    |
| color         | Number            | Color of the embeds.                                                                                             | 13632027              |
| autoLeaveIn   | Number            | Specifies the amount of time after which the bot leaves channel after playback (in ms), 0 to disable auto leave. | 5 * 60 * 1000 (5 min) |
| logger        | Class or Function | For custom logger.                                                                                               | console               |
