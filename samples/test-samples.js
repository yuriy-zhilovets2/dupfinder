const dhash = require('../dhash')
const hamming = require('hamming-distance');

const test = [
"dj-br.jpg",
"dj-bw.jpg",
"dj-color.jpg",
"dj-crop.jpg",
"dj-mirror.jpg",
"dj-sharp.jpg",
"dj-letter.jpg",
"dj-crop2.jpg",
"dj-crop3.jpg",
]

dhash("dj.jpg").then( baseHash =>
{
  console.log("dj.jpg", baseHash)
  for (let f of test)
  { 
    dhash(f).then( hash =>
    {
      console.log(f, hash, hamming(hash, baseHash))
    } );
  }
})
