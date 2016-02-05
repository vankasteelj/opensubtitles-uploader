# OpenSubtitles Uploader 

#### Upload your subtitles to [OpenSubtitles.org](http://www.opensubtitles.org)

**Download the [latest version](https://github.com/vankasteelj/opensubtitles-uploader/releases), for Windows/OSX/Linux !**

_Built with love and ducktape in HTML5 and Javascript._

![ui](http://i.imgur.com/Wl5XSYZ.png)

***

## Get involved
- [Report](https://github.com/vankasteelj/opensubtitles-uploader/issues/new) any bug/issue
- Fork, commit, then send a [Pull Request](https://github.com/vankasteelj/opensubtitles-uploader/pulls)
- Tell your friends

## Develop
- Install dependencies, download binaries:

        npm install
        grunt setup

- Start live-development:

        grunt dev
    
- CTRL+D to open devtools (debugger), CTRL+R to reload.

## Distribute
- Build packages and installers:

        grunt dist

- Build a Windows portable app:
 1. Create a new, empty folder somewhere.
 2. Copy all required files & folders:
   - app\
    - mi-win32\
    - node_modules\ (without `*grunt*` named folders, nor .bin\)
    - package.json
    - README.md
    - LICENSE
 3. Zip those as package.zip, rename to package.nw
 4. Copy next to that zip the required NWjs files & folders: 
   - locales\
    - icudtl.dat
    - nw.exe
    - nw.pak
 5. package .exe and .nw together in console: `copy /b nw.exe+package.nw OpenSubtitles-Uploader.exe`
 6. delete merged package.nw
 7. Use Enigma Virtual Box to make 1 executable "OpenSubtitles-Uploader_portable.exe" out of the remaining files:
   - OpenSubtitles-Uploader.exe
    - locales\
    - icudtl.dat
    - nw.pak
 8. You can use/distribute "OpenSubtitles-Uploader_portable.exe" alone, no other files required.
