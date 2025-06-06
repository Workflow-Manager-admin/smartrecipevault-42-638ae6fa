#!/bin/bash
cd /home/kavia/workspace/code-generation/smartrecipevault-42-638ae6fa/smartrecipevault
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

