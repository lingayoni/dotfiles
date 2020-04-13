#!/bin/sh

while read f; do
    echo "Backup file $f..."
    cp -rf $HOME/$f ./
done < listofbkfiles
echo "Backup files done, please commit!"