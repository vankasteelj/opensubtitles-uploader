# OpenSubtitles Uploader 

#### Easily upload your subtitles to [OpenSubtitles.org](http://www.opensubtitles.org), as simple as drag&drop

_Built with love and ducktape in HTML5 and Node.js._

**Download the [latest version](https://github.com/vankasteelj/opensubtitles-uploader/releases)!**

![ui](https://github.com/vankasteelj/opensubtitles-uploader/assets/12599850/3bb860c2-e131-4121-b168-3e5205170b12)

Confused? Wondering how to use it? Watch the [tutorial video](http://www.youtube.com/watch?v=jrIgL8kwBdI) on Youtube!

***

## Common issues
- Q: It says "error" when I try to upload a subtitle or log-in
  - A: Opensubtitles' servers are probably down or temporarily unavailable. It happens. Try again in a few hours or a few days. Or contact OpenSubtitles directly, I'm not them.

- Q: The app says the subtitle is already in Opensubtitles, but it isn't
  - A: The application only communicates with Opensubtitles' servers. If they say it's already online, check with Opensubtitles directly, as this software does not provide support for Opensubtitles services themselves.

- Q: I have an error "The profile couln't be loaded" related to NW.js
  - A: Try deleting `%localappdata%\nwjs` and `%localappdata%\opensubtitles-uploader`.

- Q: I'm using Linux, where can I use the app?
  - A: I'm no longer actively maintaining linux builds due to limited time available. You can try to build the application yourself (see below how) and report on improvements/enhancements needed in order to ship those binaries as well in the future.

- Q: I'm using OSX, can I use the app?
  - A: Due to Apple Silicon being based on ARM, there currently is no offcial support in NWjs for OSX. Older X86-based apple computers might be able to build the application, but that will require tinkering.

## Get involved
Here's a few easy ways of getting involved with the project:
- [Report](https://github.com/vankasteelj/opensubtitles-uploader/issues/new) any bug/issue
- Help develop the app: fork, commit, then send a [Pull Request](https://github.com/vankasteelj/opensubtitles-uploader/pulls)
- [Translate](https://www.transifex.com/vankasteelj/opensubtitles-uploader-nwjs/translate) the application on Transifex (or send me a .json) - you've already translated this application in 20 languages, thank you!
- Tell your friends

## Develop
- On Windows - install dependencies, download binaries:

        npm install -g gulp-cli
        npm install
        gulp build

- Start live-development:

        gulp run
    
- CTRL+D to open devtools (debugger), CTRL+R to reload.

## Distribute
- Build packages and installers:

        gulp dist
