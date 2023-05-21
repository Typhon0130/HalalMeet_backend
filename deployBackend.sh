#!/bin/bash

cd /home/exworm/Projects/HalalMeet/

sudo ssh -i "halal.pem" ubuntu@18.219.255.23 << EOF
  cd halalmeet/backend/
  git pull
  npm install
  export NODE_ENV=production
  pm2 restart app.js --update-env
EOF
