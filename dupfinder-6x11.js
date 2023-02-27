// Поиск дубликатов для сайта Pastvu.com
// Предполагается, что дубликаты фотографий слабо отличаются друг от друга
// и представляют собой копии с измененными цветами, подкрученной контрастностью или резкостью, 
// нанесенными небольшими надписями и другими правками косметического характера
// Алгоритм не очень стоек к обрезке картинок и позволяет найти оригиналы, лишь слегка отличающиеся
// друг от друга в плане кадрирования
// Описание использованных алгоритмов: https://habr.com/ru/post/715714/

// Алгоритм создания хэшей dhash не совсем детерминированный и зависит от каких-то свойств компьютера
// Возможно от версии ImageMagick
// Поэтому поиск должен проводиться на том же компьютере, где создавались хэши

// База для хранения хэшей картинок
/*
CREATE image_hash (
  name VARCHAR(200) not null,
  `b0` tinyint(3) unsigned NOT NULL,
  `b1` tinyint(3) unsigned NOT NULL,
  `b2` tinyint(3) unsigned NOT NULL,
  `b3` tinyint(3) unsigned NOT NULL,
  `b4` tinyint(3) unsigned NOT NULL,
  `b5` tinyint(3) unsigned NOT NULL,
  `b6` tinyint(3) unsigned NOT NULL,
  `b7` tinyint(3) unsigned NOT NULL,
  `hash` bigint(20) unsigned NOT NULL,
  UNIQUE KEY `name` (`name`),
  KEY `b0` (`b0`),
  KEY `b1` (`b1`),
  KEY `b2` (`b2`),
  KEY `b3` (`b3`),
  KEY `b4` (`b4`),
  KEY `b5` (`b5`),
  KEY `b6` (`b6`),
  KEY `b7` (`b7`)
  ENGINE=InnoDB
);
*/

const dhash = require("dhash")
const mysql = require('mysql')

const combinations = [
[0, 1, 2], [0, 1, 3], [0, 1, 4], [0, 1, 5], [0, 1, 6], [0, 1, 7], [0, 1, 8], [0, 1, 9], [0, 1, 10], [0, 2, 3], [0, 2, 4], [0, 2, 5], [0, 2, 6], [0, 2, 7], [0, 2, 8], [0, 2, 9], [0, 2, 10], [0, 3, 4], [0, 3, 5], [0, 3, 6], [0, 3, 7], [0, 3, 8], [0, 3, 9], [0, 3, 10], [0, 4, 5], [0, 4, 6], [0, 4, 7], [0, 4, 8], [0, 4, 9], [0, 4, 10], [0, 5, 6], [0, 5, 7], [0, 5, 8], [0, 5, 9], [0, 5, 10], [0, 6, 7], [0, 6, 8], [0, 6, 9], [0, 6, 10], [0, 7, 8], [0, 7, 9], [0, 7, 10], [0, 8, 9], [0, 8, 10], [0, 9, 10], [1, 2, 3], [1, 2, 4], [1, 2, 5], [1, 2, 6], [1, 2, 7], [1, 2, 8], [1, 2, 9], [1, 2, 10], [1, 3, 4], [1, 3, 5], [1, 3, 6], [1, 3, 7], [1, 3, 8], [1, 3, 9], [1, 3, 10], [1, 4, 5], [1, 4, 6], [1, 4, 7], [1, 4, 8], [1, 4, 9], [1, 4, 10], [1, 5, 6], [1, 5, 7], [1, 5, 8], [1, 5, 9], [1, 5, 10], [1, 6, 7], [1, 6, 8], [1, 6, 9], [1, 6, 10], [1, 7, 8], [1, 7, 9], [1, 7, 10], [1, 8, 9], [1, 8, 10], [1, 9, 10], [2, 3, 4], [2, 3, 5], [2, 3, 6], [2, 3, 7], [2, 3, 8], [2, 3, 9], [2, 3, 10], [2, 4, 5], [2, 4, 6], [2, 4, 7], [2, 4, 8], [2, 4, 9], [2, 4, 10], [2, 5, 6], [2, 5, 7], [2, 5, 8], [2, 5, 9], [2, 5, 10], [2, 6, 7], [2, 6, 8], [2, 6, 9], [2, 6, 10], [2, 7, 8], [2, 7, 9], [2, 7, 10], [2, 8, 9], [2, 8, 10], [2, 9, 10], [3, 4, 5], [3, 4, 6], [3, 4, 7], [3, 4, 8], [3, 4, 9], [3, 4, 10], [3, 5, 6], [3, 5, 7], [3, 5, 8], [3, 5, 9], [3, 5, 10], [3, 6, 7], [3, 6, 8], [3, 6, 9], [3, 6, 10], [3, 7, 8], [3, 7, 9], [3, 7, 10], [3, 8, 9], [3, 8, 10], [3, 9, 10], [4, 5, 6], [4, 5, 7], [4, 5, 8], [4, 5, 9], [4, 5, 10], [4, 6, 7], [4, 6, 8], [4, 6, 9], [4, 6, 10], [4, 7, 8], [4, 7, 9], [4, 7, 10], [4, 8, 9], [4, 8, 10], [4, 9, 10], [5, 6, 7], [5, 6, 8], [5, 6, 9], [5, 6, 10], [5, 7, 8], [5, 7, 9], [5, 7, 10], [5, 8, 9], [5, 8, 10], [5, 9, 10], [6, 7, 8], [6, 7, 9], [6, 7, 10], [6, 8, 9], [6, 8, 10], [6, 9, 10], [7, 8, 9], [7, 8, 10], [7, 9, 10], [8, 9, 10]

/*  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], 
  [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], 
  [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], 
  [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], 
  [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], 
  [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], 
  [6, 7], [6, 8], [6, 9], [6, 10], 
  [7, 8], [7, 9], [7, 10], 
  [8, 9], [8, 10], [9, 10]
*/
]

class DupFinder {

  /**
   * @param {string} host - name of the mysql host
   * @param {string} user - user of mysql database
   * @param {string} password - password of the user
   * @param {string} database - name of the database
  */  
  constructor(host, user, password, database) 
  {
    this.db = mysql.createConnection({host, user, password, database})
    this.db.connect();
  }

  /**
   * @param {string} fileName - name of the image file
  */  
  calcHash_p(fileName)
  {
    return new Promise( (resolve, reject) =>
    {
      dhash(fileName, function(err, hash)
      {
        if (err)
        {
          reject(err)
        }
        else
        {
          resolve(hash)
        }
      })
    })
  }
  
  /**
   * @param {string} fileName - name of the image file
   * @param {string} name - identifier of the image
   * @returns {Promise} - Promise object for await
  */  
  async add_p(fileName, name)
  {
    const hash = await this.calcHash_p(fileName)
    const chunks = this.#splitHash(hash).map( (el,i) => `c${i}=${el}` ).join(", ")
     console.log(`INSERT INTO image_hash SET name=?, hash=0x${hash}, ${chunks}`, name)
    await this.#query_p(`INSERT INTO image_hash SET name=?, hash=0x${hash}, ${chunks}`, name)
  }

  /**
   * @param {string} hash - image hash calculated by calcHash_p
   * @param {number} [limit=0] - number of returned results
   * @returns {Promise} - Promise object represents results of search
  */  
  async find_p(hash, limit=0)
  {
    const chunks = this.#splitHash(hash)
    const where0 = combinations.map(([m,n]) => `(c${m}=${chunks[m]} AND c${n}=${chunks[n]})`).join(" OR ")
    const where = `(${where0}) AND (BIT_COUNT(hash ^ 0x${hash}) <= 8)`
    
    let q = `SELECT name, BIT_COUNT(hash ^ 0x${hash}) AS distance FROM image_hash FORCE KEY (c0,c1,c2,c3,c4,c5,c6,c7,c8,c9,c10) WHERE ${where}`
    if (limit)
    {
      q += ` ORDER BY distance LIMIT ${limit}`
    }
     console.log(q)
 
    const results = await this.#query_p(q)
    return results
  }
  
  #query_p(qstr, values)
  {
    return new Promise( (resolve, reject) =>
    {
      this.db.query(qstr, values, (error, results, fields) =>
      {
        if (error)
        {
          reject(error)
        }
        else
        {
          resolve(results)
        }
      })
    })
  }
  
  #digits = {
    "0": "0000",
    "1": "0001",
    "2": "0010",
    "3": "0011",
    "4": "0100",
    "5": "0101",
    "6": "0110",
    "7": "0111",
    "8": "1000",
    "9": "1001",
    "A": "1010",
    "B": "1011",
    "C": "1100",
    "D": "1101",
    "E": "1110",
    "F": "1111",
  }
  
  #splitHash(hash)
  {
    const bin = hash.toUpperCase().split("").map(d => this.#digits[d]).join("")
    return [0,1,2,3,4,5,6,7,8,9,10].map(i => parseInt(bin.substr(i*6, 6), 2))
  }

}

module.exports = DupFinder