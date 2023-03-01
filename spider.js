#!/usr/bin/node

// Рекурсивно обходим каталог и собираем хэши

const directory = process.argv[2]

if (!directory)
{
  console.log("Usage: spider.js DIRECTORY")
  process.exit()
}

const fg = require('fast-glob')
const dhash_p = require("./dhash-pv")
const DupFinder = require("./dupfinder")

async function walk()
{
  const finder = new DupFinder('localhost', 'dhash', 'istanbul', 'dhash')
  const list = fg.sync(directory + '/**/*.{tif,jpg,png,jpeg}', { onlyFiles: false, caseSensitiveMatch: false });

  for (let name of list)
  {
   process.stderr.write(name+"\n")
   try {
     const hash = await dhash_p(name)
     await finder.add_p(name, hash)
   }
   catch(err)
   {
     process.stderr.write(err.message)
   }
  }
}

walk().then( () => { process.stderr.write("Done\n"); process.exit() })

