#!/usr/bin/env bash

cp ./node_modules/mermaid/dist/mermaid.min.js ./site

mkdir -p ./site/fontawesome/css/
cp ./node_modules/@fortawesome/fontawesome-free-webfonts/css/* ./site/fontawesome/css/

mkdir -p ./site/fontawesome/webfonts/
cp ./node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/* ./site/fontawesome/webfonts/