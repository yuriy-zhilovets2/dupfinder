#!/usr/bin/node

const { ahash } = require('./image-hash')

const filename = process.argv[2]
if (!filename)
{
  console.log("Usage: calc-ahash.js filename")
  process.exit()
}

ahash(filename).then( hash =>
{
  console.log(filename, hash)
});
