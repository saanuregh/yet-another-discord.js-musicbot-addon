# Yet Another Discord MusicBot Addon
***  
An easily customizable Node.js based music extension/bot for Discord.js@12.0.0 (master) projects using YouTube. Doesn't have inbuilt command handling, either use discord.js-commando or make your own.

__The commands available are: __  
* `play <url>|<search string>`: Play audio from YouTube URLs (video and playlist) or search string. Used as resume function also.
* `skip`: Skip a song .
* `queue`: Display the current queue.
* `history`: Show the history of playback.  
* `pause`: Pause music playback.
* `loop 1|n|off`: Loop music playback. `1`: loop current song `n`: loop entire queue `off`: play normally.
* `shuffle`: Shuffles the queue.
* `remove [position]`: Remove a song from the queue by position.
* `volume`: Adjust the playback volume between 0 and 100.
* `leave`: Bot leaves the channel.
* `stop`: Bot stops playback.
* `clear`: Clears the song queue.
* `np`: Show the current playing song.  


***
# Installation
***  
__Pre-installation:__  
1. `npm install github:discordjs/discord.js`  
It is recommended to have the stable branch.  

2. `npm install node-opus` or `npm install opusscript`  
Required for voice. Discord.js _prefers_ node-opus.  

__Installation:__  
* `npm install <placeholder>`  

# Examples
***  
See the examples directory.

# Options & Config.
***
__Most options are optional and thus not needed.__  
The options you can pass in `new MusicClient(client, apiKey, {options})` and their types is as followed:  

## Basic Options.
| Option | Type | Description | Default |  
| --- | --- | --- | --- |
| defVolume | Number | The default volume of music. 1 - 100. | 50 |
| bitRate | String | Sets the preferred bitRate for the Discord.js stream to use. | "120000" |
| historyLength | Number | Max history size allowed. | 50 |
| searchFilters | Object/Array | List of filters for the YouTube URL search. | [ ] |