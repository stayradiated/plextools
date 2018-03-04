#!/usr/bin/env bash

counter=0

mkdir -p files

IFS=$'\n'

for filepath in $(node lib/playlistSource.js)
do
  filename=$(basename "${filepath%.*}")
  prefix=$(printf %03d $counter)
  outputPath="./files/$prefix. $filename.mp3"

  echo $outputPath

  ffmpeg-normalize "$filepath" -nt peak -t 0 -c:a libmp3lame -b:a 320k -o $outputPath

  let "counter++"
done

ls ./files |\
  sed 's/^/".\/files\//' |\
  sed 's/$/"/' |\
  sed -s '0~1 s/$/\nsilence.mp3/' |\
  xargs mp3wrap mixtape.mp3

ffmpeg -i mixtape_MP3WRAP.mp3 -c:a libmp3lame -b:a 320k mixtape.mp3
