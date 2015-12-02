#!/bin/bash
# launch 'linux-maker.sh 0.12.3 linux64' for example
# requires: tar

nw=$1
arch=$2
if [[ $arch == *"32"* ]]; then
  real_arch="i386"
else
  real_arch="amd64"
fi
cwd="releases/linux-package/$arch"
name="opensubtitles-uploader"
projectName="OpenSubtitles-Uploader"
version=$(sed -n 's|\s*\"version\"\:\ \"\(.*\)\"\,|\1|p' package.json)
package_name=${name}_${version}_${real_arch}

### RESET
rm -rf releases/linux-package

### COPY FILES
#base
cp -r builds/cache/$nw/$arch/locales $cwd/$projectName/
cp builds/cache/$nw/$arch/icudtl.dat $cwd/$projectName/
cp builds/cache/$nw/$arch/libffmpegsumo.so $cwd/$projectName/
cp builds/cache/$nw/$arch/nw $cwd/$package_name/$projectName
cp builds/cache/$nw/$arch/nw.pak $cwd/$projectName/

#src
cp -r app $cwd/$projectName/
cp package.json $cwd/$projectName/
cp LICENSE $cwd/$projectName/

#mediainfo
cp -r mi-$arch $cwd/$projectName/

#node_modules
cp -r node_modules/bluebird $cwd/$projectName/node_modules/bluebird
cp -r node_modules/detect-lang $cwd/$projectName/node_modules/detect-lang
cp -r node_modules/opensubtitles-api $cwd/$projectName/node_modules/opensubtitles-api

### CLEAN
shopt -s globstar
cd $cwd/$projectName
rm -rf node_modules/*grunt*/** 
rm -rf ./**/test*/** 
rm -rf ./**/doc*/** 
rm -rf ./**/example*/** 
rm -rf ./**/demo*/** 
rm -rf ./**/bin/** 
rm -rf ./**/build/**
rm -rf **/*.*~
cd ../../../../

### COMPRESS
cd $cwd
tar --exclude-vcs -c . | $(command -v pxz || command -v xz) -T8 -7 > $package_name.tar.xz

### CLEAN
cd ../../../
mv $cwd/$name*.tar.xz releases