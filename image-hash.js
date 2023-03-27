'use strict';

// Код по мотивам https://www.npmjs.com/package/dhash
// Ю. Жиловец, 1.03.23

const DEFAULT_HASH_SIZE = 8

const gm = require('gm')

const digits = {
    "0000": "0",
    "0001": "1",
    "0010": "2",
    "0011": "3",
    "0100": "4",
    "0101": "5",
    "0110": "6",
    "0111": "7",
    "1000": "8",
    "1001": "9",
    "1010": "A",
    "1011": "B",
    "1100": "C",
    "1101": "D",
    "1110": "E",
    "1111": "F",
}

function binaryToHex(s) 
{
	return s.match(/.{4}/g).map( nibble => digits[nibble] ).join("")
}

function diff(pixels, width, height)
{
   let difference = ""

   for (let row = 0; row < height; row++) 
   {
     for (let col = 0; col < height; col++) // height is not a mistake here...
     {
        const i = width*row+col
        difference += pixels[i] < pixels[i+1] ? "1" : "0"
     }
   }

   return difference
}

function average(pixels, width, height)
{
   const avg = pixels.reduce((sum, a) => sum + a, 0) / width / height
   return Array.from(pixels).map(p => p>=avg ? "1" : "0").join("")
}

function calcHash(path, size, algo)
{
  return new Promise( (resolve, reject) =>
  {
  	gm(path)
 	    .colorspace('Rec601Luma')
 	    .filter('Lanczos')
	    .resize(size[0], size[1], '!')
	    .toBuffer('GRAY', function(err, buffer) 
	    {
		    if (err) return reject(err)	
 			  resolve( binaryToHex(algo(buffer, size[0], size[1])) )
		  })
	 })
}

/**
  * @param {string} path - image file name
  * @param {number} [hashSize] - size of the hash in bytes (default 8)
*/
function dhash(path, hashSize)
{
  const height = hashSize || DEFAULT_HASH_SIZE
  return calcHash(path, [height+1, height], diff)
}

/**
  * @param {string} path - image file name
  * @param {number} [hashSize] - size of the hash in bytes (default 8)
*/
function ahash(path, hashSize)
{
  const height = hashSize || DEFAULT_HASH_SIZE
  return calcHash(path, [height, height], average)
}

module.exports = { dhash, ahash }

