#!/usr/bin/node

const { dhash } = require('./image-hash')

const filename = process.argv[2]
if (!filename)
{
  console.log("Usage: calc-dhash.js filename")
  process.exit()
}

dhash(filename).then( hash =>
{
  console.log(filename, hash)
});
