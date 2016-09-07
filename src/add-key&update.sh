#!/bin/bash

# Add ssh key
eval `ssh-agent`
chmod 600 npm_key_rsa
ssh-add npm_key_rsa

npm install