# OpenSubtitles Uploader 

[![Build Status](https://travis-ci.org/vankasteelj/opensubtitles-uploader.svg?branch=master)](https://travis-ci.org/vankasteelj/opensubtitles-uploader)
[![Dependency Status](https://david-dm.org/vankasteelj/opensubtitles-uploader.svg)](https://david-dm.org/vankasteelj/opensubtitles-uploader)
[![devDependency Status](https://david-dm.org/vankasteelj/opensubtitles-uploader/dev-status.svg)](https://david-dm.org/vankasteelj/opensubtitles-uploader#info=devDependencies)

#### Easily upload your subtitles to [OpenSubtitles.org](http://www.opensubtitles.org), as simple as drag&drop

_Built with love and ducktape in HTML5 and Node.js._

**Download the [latest version](https://github.com/vankasteelj/opensubtitles-uploader/releases), for Windows/OSX/Linux !**

![ui](https://cloud.githubusercontent.com/assets/12599850/15271128/aaa81de4-1a3a-11e6-8b05-7aba496c0d2f.png)

Confused? Wondering how to use it? Watch the [tutorial video](http://www.youtube.com/watch?v=jrIgL8kwBdI) on Youtube!

***

## Get involved
Here's a few easy ways of getting involved with the project:
- [Report](https://github.com/vankasteelj/opensubtitles-uploader/issues/new) any bug/issue
- Fork, commit, then send a [Pull Request](https://github.com/vankasteelj/opensubtitles-uploader/pulls)
- [Translate](https://github.com/vankasteelj/opensubtitles-uploader/tree/master/app/localization) the application
- Tell your friends

## Develop
- Install dependencies, download binaries:

        npm install -g gulp-cli
        npm install
        gulp build

- Start live-development:

        gulp run
    
- CTRL+D to open devtools (debugger), CTRL+R to reload.

## Distribute
- Build packages and installers:

        gulp dist --platforms=all