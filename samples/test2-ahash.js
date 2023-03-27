const { ahash } = require('../image-hash')
const hamming = require('hamming-distance');

const test = [
  "arktika",
  "vnukovo",
  "sol",
  "torg",
  "buda",
  "dom",
  "pogod",
  "dj",
]

for (let f of test)
{ 
  Promise.all([ahash("set2/"+f+".jpg"), ahash("set2/"+f+"2.jpg")]).then( ([hash1, hash2]) =>
  {
    console.log(f, hash1, hash2, hamming(hash1, hash2))
  } );
}
