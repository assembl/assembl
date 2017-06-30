#!/bin/bash
which msgmerge > /dev/null
if [[ $? != 0 ]]; then
    echo "msgmerge command not found, syncing po files from pot file failed"
    exit 1
fi
for po in ../locale/assembl-v2/*.po; do
    msgmerge $po ../locale/assembl-v2.pot -o $po
done
