const winston = require('winston');
const mysql = require('mysql');

class MysqlDocumentStore {
  constructor(options){
    this.expire = options.expire;
    this.MyqlClient = new mysql.createConnection(options.clientOptions);
    this.safeConnect();
    this.MyqlClient.on('end', () => {
      winston.debug('disconnected from mysql!');
    });
  }

  async set(key, data, skipExpire){
    const now = Math.floor(Date.now() / 1000);

    return await this.MyqlClient.query(
        'INSERT INTO entries (key, value, expiration) VALUES ($1, $2, $3)',
        [ key, data, (this.expire && !skipExpire) ? this.expire + now : null ]
    )
        .then(() => {
          return true;
        })
        .catch(err => {
          winston.error('failed to set mysql document', { key: key, error: err });
          return false;
        });

  }

  async get(key, skipExpire){
    const now = Math.floor(Date.now() / 1000);

    return await this.MyqlClient.query(
        'SELECT id,value,expiration FROM entries WHERE key = $1 AND (expiration IS NULL OR expiration > $2)',
        [ key, now ])
        .then(async res => {
          if (res.rows.length && this.expire && !skipExpire){
            await this.MyqlClient.query(
                'UPDATE entries SET expiration = $1 WHERE ID = $2',
                [ this.expire + now, res.rows[0].id ]
            );
          }
          return res.rows.length ? res.rows[0].value : null;
        })
        .catch(err => {
          winston.error('error retrieving value from mysql', { error: err });
          return null;
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

module.exports = MysqlDocumentStore;
