#!/usr/bin/node

const file = process.argv[2]
if (!file)
{
  console.log("Usage: ./find-dup-mysql IMAGE-FILE")
  process.exit()
}

const { dhash } = require("./image-hash")
const DupFinder = require("./dupfinder-8")

async function search()
{
  const finder = new DupFinder('localhost', 'dhash', 'istanbul', 'dhash')
  const hash = await dhash(file)
  console.log(file, hash)
  const found = await finder.match(hash)
  console.log(found)
}

search().then( () => process.exit() )
