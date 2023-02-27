#!/usr/bin/node

const file = process.argv[2]
if (!file)
{
  console.log("Usage: ./find-dup-mysql IMAGE-FILE")
  process.exit()
}

const DupFinder = require("./dupfinder-mysql")

async function search()
{
  const finder = new DupFinder('localhost', 'dhash', 'istanbul', 'dhash')
  const hash = await finder.calcHash_p(file)
  const found = await finder.find_p(hash)
  console.log(found)
}

search().then( () => process.exit() )
