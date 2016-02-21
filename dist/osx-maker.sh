#!/bin/bash
# launch 'osx-maker.sh 0.12.3 0.0.1' for example

nw=$1
version=$2
arch="osx64"
real_arch="OSX"
cwd="releases/osx-package"
name="opensubtitles-uploader"
release_name="OpenSubtitles-Uploader"

### RESET
rm -rf releases/osx-package

### SOURCE TREE
#create package dir
mkdir -p $cwd

### COPY FILES
#base
cp -r builds/cache/$nw/$arch/nwjs.app $cwd

#src
mkdir -p $cwd/nwjs.app/Contents/Resources/app.nw
cp -r app $cwd/nwjs.app/Contents/Resources/app.nw
cp package.json $cwd/nwjs.app/Contents/Resources/app.nw
cp LICENSE $cwd/nwjs.app/Contents/Resources/app.nw

#mediainfo
cp -r mi-$arch $cwd/nwjs.app/Contents/Resources/app.nw

#node_modules
mkdir -p $cwd/nwjs.app/Contents/Resources/app.nw/node_modules
cp -r node_modules/bluebird $cwd/nwjs.app/Contents/Resources/app.nw/node_modules
cp -r node_modules/detect-lang $cwd/nwjs.app/Contents/Resources/app.nw/node_modules
cp -r node_modules/opensubtitles-api $cwd/nwjs.app/Contents/Resources/app.nw/node_modules
cp -r node_modules/i18n $cwd/nwjs.app/Contents/Resources/app.nw/node_modules

#icon
rm -f $cwd/nwjs.app/Contents/Resources/nw.icns
cp dist/os-icon.icns $cwd/nwjs.app/Contents/Resources/nw.icns

#plist
rm -f $cwd/nwjs.app/Contents/Info.plist
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\">
<dict>
	<key>BuildMachineOSBuild</key>
	<string>14D136</string>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>OpenSubtitles-Uploader</string>
	<key>CFBundleDocumentTypes</key>
	<array>
		<dict>
			<key>CFBundleTypeIconFile</key>
			<string>nw.icns</string>
			<key>CFBundleTypeName</key>
			<string>nwjs App</string>
			<key>CFBundleTypeRole</key>
			<string>Viewer</string>
			<key>LSHandlerRank</key>
			<string>Owner</string>
			<key>LSItemContentTypes</key>
			<array>
				<string>io.nwjs.nw.app</string>
			</array>
		</dict>
		<dict>
			<key>CFBundleTypeName</key>
			<string>Folder</string>
			<key>CFBundleTypeOSTypes</key>
			<array>
				<string>fold</string>
			</array>
			<key>CFBundleTypeRole</key>
			<string>Viewer</string>
			<key>LSHandlerRank</key>
			<string>None</string>
		</dict>
	</array>
	<key>CFBundleExecutable</key>
	<string>nwjs</string>
	<key>CFBundleIconFile</key>
	<string>nw.icns</string>
	<key>CFBundleIdentifier</key>
	<string>io.nwjs.nw</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>${release_name}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>Version ${version}</string>
	<key>CFBundleVersion</key>
	<string>${version}</string>
	<key>DTSDKBuild</key>
	<string>13F34</string>
	<key>DTSDKName</key>
	<string>macosx10.9</string>
	<key>DTXcode</key>
	<string>0631</string>
	<key>DTXcodeBuild</key>
	<string>6D1002</string>
	<key>LSFileQuarantineEnabled</key>
	<false/>
	<key>LSMinimumSystemVersion</key>
	<string>10.6.0</string>
	<key>NSPrincipalClass</key>
	<string>NSApplication</string>
	<key>NSSupportsAutomaticGraphicsSwitching</key>
	<true/>
	<key>SCMRevision</key>
	<string>4997442d98d80e4cacb1d81ce90d0a45ccd4b185</string>
	<key>UTExportedTypeDeclarations</key>
	<array>
		<dict>
			<key>UTTypeConformsTo</key>
			<array>
				<string>com.pkware.zip-archive</string>
			</array>
			<key>UTTypeDescription</key>
			<string>nwjs App</string>
			<key>UTTypeIconFile</key>
			<string>nw.icns</string>
			<key>UTTypeIdentifier</key>
			<string>io.nwjs.nw.app</string>
			<key>UTTypeReferenceURL</key>
			<string>https://github.com/rogerwang/node-webkit/wiki/How-to-package-and-distribute-your-apps</string>
			<key>UTTypeTagSpecification</key>
			<dict>
				<key>com.apple.ostype</key>
				<string>nwjs</string>
				<key>public.filename-extension</key>
				<array>
					<string>nw</string>
				</array>
				<key>public.mime-type</key>
				<string>application/x-nwjs-app</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>" > $cwd/nwjs.app/Contents/Info.plist

### clean
mv $cwd/nwjs.app releases/$name.app
rm -rf releases/osx-package