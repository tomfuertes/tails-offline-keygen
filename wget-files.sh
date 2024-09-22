#!/usr/bin/env zsh

echo "Are you CDed into the transient USB volume/directory? Type y <enter> to confirm"
read -r answer
if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
  echo "Continuing..."
else
  echo "Aborting..."
  exit 0
fi

echo "Downloading Node.js"
curl -s -O https://nodejs.org/download/release/latest/$(curl -s https://nodejs.org/download/release/latest/ | grep -oE 'node-v[0-9]+\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz' | head -n 1)

echo "Downloading solana"
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition https://github.com/solana-labs/solana/releases/latest/download/solana-release-x86_64-unknown-linux-gnu.tar.bz2

echo "Downloading Ian Coleman BIP39"
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition https://github.com/iancoleman/bip39/releases/latest/download/bip39-standalone.html
mv bip39-standalone.html ian-bip39.html

echo "Downloading Staking CLI"
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition https://github.com/ethereum/staking-deposit-cli/releases/latest/download/staking_deposit-cli-fdab65d-linux-amd64.tar.gz

echo "Download RocketPool"
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition https://github.com/rocket-pool/smartnode-install/releases/latest/download/rocketpool-cli-linux-amd64

echo "Download wagyu"
curl -s https://wagyu.gg/ | grep -o 'href="[^"]*\.AppImage"' | sed 's/href="//;s/"$//' | while read -r link; do curl -O "$link"; done

echo "Downloading Ian Coleman Shamir"
curl -s -o ian-shamir.html https://iancoleman.io/shamir/

echo "Downloading Ian Coleman Shamir39"
curl -s -o ian-shamir39.html https://iancoleman.io/shamir39/

echo "Downloading Ian Coleman Slip39"
curl -s -o ian-slip39.html https://iancoleman.io/slip39/

echo "Downloading Ian Coleman EIP2333"
curl -s -o ian-eip2333.html https://iancoleman.io/eip2333/

echo "Downloading ThisBeTom Slip39"
curl -s -o tom-slip39.html https://tomfuertes.github.io/tails-offline-keygen/

echo "Downloading BIP39 Words"
curl -s -o wordlist-bip39.txt https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt

echo "Downloading Slip39 Words"
curl -s -o wordlist-slip39.txt https://raw.githubusercontent.com/satoshilabs/slips/master/slip-0039/wordlist.txt

echo "Slip39-JS-v0.1.9"
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition https://github.com/ilap/slip39-js/archive/refs/tags/v0.1.9.tar.gz
npm view slip39 | grep latest

echo "Slip39-JS-Playground"
curl -s -o tom-slip39-playground.html https://raw.githubusercontent.com/tomfuertes/slip39-js-playground/main/dist/main.html

echo "Slip39-JS Offline"
curl -s -o tom-slip39-offline.js https://raw.githubusercontent.com/tomfuertes/slip39-js-playground/main/offline.js

echo "Perta Slip39JS Hosted"
curl -s -o petra-slip39.html https://3rditeration.github.io/slip39/src/
mkdir -p js
cd js || exit
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition  https://3rditeration.github.io/slip39/src/js/jquery-3.2.1.js
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition  https://3rditeration.github.io/slip39/src/js/slip39-libs.js
wget -q --show-progress --max-redirect=20 --no-server-response --content-disposition  https://3rditeration.github.io/slip39/src/js/index.js
cd ../
