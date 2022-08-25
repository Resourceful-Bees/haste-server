const winston = require('winston');
const mysql = require('mysql');

class MysqlDocumentStore {
  constructor(options){
    this.expire = options.expire;
    this.MyqlClient = new Database(options.clientOptions);
    this.safeConnect();
    this.MyqlClient.getConnection().on('end', () => {
      winston.debug('disconnected from mysql!');
    });
  }

  set(key, data, callback, skipExpire){
    const now = Math.floor(Date.now() / 1000);

    this.MyqlClient.query(
        'INSERT IGNORE INTO `entries` (`key`, `value`, `expiration`) VALUES (?)',
        [[ key, data, (this.expire && !skipExpire) ? this.expire + now : null ]]
        )
        .then(() => callback(true))
        .catch(err => {
          winston.error('failed to set mysql document', { key: key, error: err });
          callback(false);
        });
  }

  get(key, callback, skipExpire){
    const now = Math.floor(Date.now() / 1000);

    this.MyqlClient.query(
        'SELECT `id`, `value`, `expiration` FROM `entries` WHERE `key` = ? AND (`expiration` IS NULL OR `expiration` > ?)',
        [ key, now ])
        .then(async res => {
          if (res.length && this.expire && !skipExpire){
            await this.MyqlClient.query(
                'UPDATE `entries` SET `expiration` = ? WHERE ID = ?',
                [ this.expire + now, res[0].id ]
            );
          }
          callback(res.length ? res[0].value : null);
        })
        .catch(err => {
          winston.error('error retrieving value from mysql', { error: err });
            callback(null);
        });
  }

  async safeConnect(){
    return await this.MyqlClient.connect()
        .then(() => {
          winston.info('connected to mysql!');
          return { error: null };
        })
        .catch(err => {
          winston.error('failed connecting to mysql!', {error: err});
          return { error: err };
        });
  }
}

class Database {
    constructor(config) {
        this.connection = new mysql.createConnection(config);
    }

    query(sql, values) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, values, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    getConnection() {
        return this.connection;
    }
}

module.exports = MysqlDocumentStore;
