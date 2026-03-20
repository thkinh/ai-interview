#!/bin/bash

curl -G "http://localhost:5002/api/tts" \
     --data-urlencode "text=Testing the multi speaker model on Arch." \
     --data-urlencode "speaker_id=p376" \
     -o output.wav
