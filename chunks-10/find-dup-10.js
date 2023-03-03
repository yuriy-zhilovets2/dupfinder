#!/usr/bin/node

const file = process.argv[2]
if (!file)
{
  console.log("Usage: ./find-dup-mysql IMAGE-FILE")
  process.exit()
}

const dhash_p = require("../dhash-p")
const DupFinder = require("./dupfinder-10")

async function search()
{
  const finder = new DupFinder('localhost', 'dhash', 'istanbul', 'dhash')
  const hash = await dhash_p(file)
  console.log(file, hash)
  const found = await finder.match_p(hash)
  console.log(found)
}

search().then( () => process.exit() )
