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

const mysql = require('mysql')

const combinations = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7],
  [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [3, 4], [3, 5], [3, 6], [3, 7], [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7]
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
  async find_p(hash, limit=0)
  {
    const chunks = this.#splitHash(hash).map( el => `0x${el}` )
    const where0 = combinations.map(([m,n]) => `(b${m}=${chunks[m]} AND b${n}=${chunks[n]})`).join(" OR ")
    const where = `(${where0}) AND (BIT_COUNT(hash ^ 0x${hash}) <= 6)`
    
    let q = `SELECT name, BIT_COUNT(hash ^ 0x${hash}) AS distance FROM image_hash WHERE ${where} ORDER BY distance`
    if (limit)
    {
      q += ` LIMIT ${limit}`
    }
    // console.log(q)
 
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
  
  #splitHash(hash)
  {
    return hash.match(/../g)
  }

}

module.exports = DupFinder