#!/bin/bash
exec 2>&1
cd /home/z/my-project
rm -rf .next
npx next dev -p 3000 &
echo $! > /home/z/my-project/.zscripts/dev.pid