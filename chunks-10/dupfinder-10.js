// Поиск дубликатов для сайта Pastvu.com

// База для хранения хэшей картинок
/*
CREATE image_hash (
  name VARCHAR(200) not null,
  `hash` bigint(20) unsigned NOT NULL,
  `b0` tinyint(3) unsigned NOT NULL,
  `b1` tinyint(3) unsigned NOT NULL,
  `b2` tinyint(3) unsigned NOT NULL,
  `b3` tinyint(3) unsigned NOT NULL,
  `b4` tinyint(3) unsigned NOT NULL,
  `b5` tinyint(3) unsigned NOT NULL,
  `b6` tinyint(3) unsigned NOT NULL,
  `b7` tinyint(3) unsigned NOT NULL,
  `b8` tinyint(3) unsigned NOT NULL,
  `b9` tinyint(3) unsigned NOT NULL,
  UNIQUE KEY `name` (`name`),
  KEY `b0` (`b0`),
  KEY `b1` (`b1`),
  KEY `b2` (`b2`),
  KEY `b3` (`b3`),
  KEY `b4` (`b4`),
  KEY `b5` (`b5`),
  KEY `b6` (`b6`),
  KEY `b7` (`b7`),
  KEY `b8` (`b8`),
  KEY `b9` (`b9`)
  ENGINE=InnoDB
);
*/

const mysql = require('mysql')

const combinations = [
[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], 
[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], 
[2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], 
[3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], 
[4, 5], [4, 6], [4, 7], [4, 8], [4, 9], 
[5, 6], [5, 7], [5, 8], [5, 9], 
[6, 7], [6, 8], [6, 9], 
[7, 8], [7, 9], [8, 9]
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
   * @param {string} name - identifier of the image
   * @param {string} hash - hash of the image
   * @returns {Promise} - Promise object for await
  */  
  async add_p(name, hash)
  {
    const chunks = this.#splitHash(hash).map( (el,i) => `b${i}=0x${el}` ).join(", ")
    // console.log(`INSERT INTO image_hash SET name=?, hash=0x${hash}, ${chunks}`, name)
    await this.#query_p(`INSERT INTO image_hash SET name=?, hash=0x${hash}, ${chunks}`, name)
  }

  /**
   * @param {string} hash - image hash calculated by calcHash_p
   * @param {number} [limit=0] - number of returned results
   * @returns {Promise} - Promise object represents results of search
  */  
  async match_p(hash, limit=0)
  {
    const chunks = this.#splitHash(hash)
    const where0 = combinations.map(([m,n]) => `(b${m}=${chunks[m]} AND b${n}=${chunks[n]})`).join(" OR ")
    const where = `(${where0}) AND (BIT_COUNT(hash ^ 0x${hash}) <= 8)`
    
    let q = `SELECT name, BIT_COUNT(hash ^ 0x${hash}) AS distance FROM image_hash WHERE ${where} ORDER BY distance`
    if (limit)
    {
      q += ` LIMIT ${limit}`
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
    const chunks = bin.match(/^(.{7})(.{7})(.{7})(.{7})(.{6})(.{6})(.{6})(.{6})(.{6})(.{6})/)
    chunks.shift()
    return chunks.map( chunk => parseInt(chunk,2) )
  }

}

module.exports = DupFinder