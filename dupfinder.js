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

const mysql = require('mysql')

const combinations = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7],
  [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [3, 4], [3, 5], [3, 6], [3, 7], [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7]
]

class DupFinder {

  /**
   * Creates a new dupfinder object
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
   * Adds a new entry to the image hashes database
   *
   * @param {string} name - an unique identifier of the image
   * @param {string} hash - hash of the image
   * @returns {Promise} - Promise object for await
  */  
  async add(name, hash)
  {
    const chunks = this.#splitHash(hash).map( (el,i) => `b${i}=0x${el}` ).join(", ")
    // console.log(`INSERT INTO image_hash SET name=?, hash=0x${hash}, ${chunks}`, name)
    await this.#query(`INSERT INTO image_hash SET name=?, hash=0x${hash}, ${chunks}`, name)
  }

  /**
   * Removes an entry from the image hashes database
   *
   * @param {string} name - an unique identifier of the image
   * @returns {Promise} - Promise object for await
  */  
  async remove(name)
  {
    await this.#query("DELETE FROM image_hash WHERE name=?", name)
  }

  /**
   * Finds a hash by image name
   * 
   * @param {string} name - identifier of the image
   * @returns {Promise} - Promise object, returns a hash or undefined if a name was not found
  */  
  async hashOf(name)
  {
    const res = await this.#query("SELECT LPAD(HEX(hash), 16, '0') AS hash FROM image_hash WHERE name=?", name)
    if (res.length)
    {
      return res[0].hash
    }
    else
    {
      return undefined
    }
  }

  /**
   * Finds a hash of the image with provided name and matches it against the image hashes database
   * 
   * @param {string} name - identifier of the image
   * @returns {Promise} - Promise object returns a hash or undefined if a name was not found
  */  
  async matchFromName(name, maxDist=6, limit=0)
  {
    const hash = await this.hashOf(name)
    if (!hash) return []
    return this.match(hash, maxDist, limit)
  }
  
  /**
   * Matches a hash against the image hashes database
   *
   * @param {string} hash - 8 byte image hash calculated by dhash
   * @param {number} [maxDist=0] - maximal hamming distance of found duplicates (0..6, 0 does not always find exact duplicates)
   * @param {number} [limit=0] - number of returned results, 0 means all results. Usually this param is not needed
   * @returns {Promise} - Promise object represents results of search sorted by distance (i.e. relevancy)
  */  
  async match(hash, maxDist=6, limit=0)
  {
    const chunks = this.#splitHash(hash).map( el => `0x${el}` )
    const where0 = combinations.map(([m,n]) => `(b${m}=${chunks[m]} AND b${n}=${chunks[n]})`).join(" OR ")
    const where = `(${where0}) AND (BIT_COUNT(hash ^ 0x${hash}) <= ${maxDist})`
    
    let q = `SELECT name, BIT_COUNT(hash ^ 0x${hash}) AS distance FROM image_hash WHERE ${where} ORDER BY distance`
    if (limit)
    {
      q += ` LIMIT ${limit}`
    }
    // console.log(q)
 
    const results = await this.#query(q)
    return results
  }
  
  #query(qstr, values)
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
  
  #splitHash(hash)
  {
    return hash.match(/../g)
  }

}

module.exports = DupFinder
