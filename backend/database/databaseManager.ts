import sqlite3, { Database, Statement } from 'sqlite3';
import sToJ from 'sqlite-to-json'
import { Token, TupleType } from 'typescript';
import { resolve } from 'path';

export interface User {
  uId: number;
  email: string;
  password: string;
  username: string;
  pId: number;
}

export interface DataStructure {
  users: User[];
  tokens: TokensStruct;
}

export interface TokensStruct {
  [token: string]: number;
}

export class dbManager {
  private db: sqlite3.Database
  constructor() {
    this.db = new sqlite3.Database('./database/database.sqlite3')
  }

  async initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        uId INTEGER PRIMARY KEY,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        username TEXT NOT NULL,
        pId INTEGER NOT NULL
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        value INTEGER NOT NULL
      )
    `);
    this.db.exec(`
       CREATE TABLE IF NOT EXISTS userFiles (
          id INTEGER PRIMARY KEY,
          uId INTEGER NOT NULL,
          savedFile TEXT,
          inUse INTEGER DEFAULT 0,
          FOREIGN KEY (uId) REFERENCES users (uId)
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customEvents (
          condition TEXT PRIMARY KEY,
          uId INTEGER NOT NULL,
          value TEXT NOT NULL,
          action TEXT NOT NULL,
          FOREIGN KEY (uId) REFERENCES users (uId)
      );
   `);
    
  }

  async createUser(user: User): Promise<void> {
    const { uId, email, password, username, pId } = user;
    const sql = 'INSERT INTO users (uId, email, password, username, pId) VALUES (?, ?, ?, ?, ?)';

    const result = this.db.run(sql, [uId, email, password, username, pId], (err, result) => {
      if (err) {
        throw new Error('Failed to create user');
      }
    })
  }

  async getUsers(): Promise<User[]> {
    const sql = 'SELECT * FROM users';
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, row: User[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(row)
        }
      })
    })
  }

  async createToken(tokenStr: String, authUserId: number): Promise<void> {
    const sql = 'INSERT INTO tokens (token, value) VALUES (?, ?)';
    console.log(tokenStr, authUserId)
    const result = this.db.run(sql, [tokenStr, authUserId], (err) => {
      if (err) {
        console.log(err)
        throw new Error('Failed to create token');
      }
    })
  }

  async getTokens(): Promise<TokensStruct> {
    const sql = 'SELECT * FROM tokens';
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          const tokens: TokensStruct = {};
          rows.forEach(row => {
            tokens[row['token']] = row['value'];
          });
          resolve(tokens);
        }
      })
    })
  }
  async deleteRec(table: String, condition: String) {
    const sql = `DELETE FROM ${table} WHERE ${condition}`;
    const result = this.db.run(sql, (err) => {
      if (err) {
        console.log(err)
        throw new Error('Failed to delete token');
      }
    })
  }
  
  async deleteEvents(token: string) {
    try {
      const uId = await this.idByToken(token);
      const sql = `DELETE FROM customEvents WHERE uId = ${uId}`;
      const result = this.db.run(sql, (err) => {
        if (err) {
          throw new Error('Failed to delete events');
        }
      })
    } catch(error) {
      throw new Error('Failed to delete events')
    }
  }

  async createCustomEvent(token: string, condition: String, value: String, action: String) {
    console.log(condition, value, action)
    console.log('creating custom events')
    try {
      const uId = await this.idByToken(token);
      const sqlStatements = `
          BEGIN TRANSACTION;
          INSERT INTO customEvents (condition, value, action, uId) VALUES ('${condition}', '${value}', '${action}', ${uId});
          COMMIT;
      `;
        await new Promise<void>((resolve, reject) => {
            this.db.exec(sqlStatements, (err) => {
                if (err) {
                    // Rollback transaction if there's an error
                    this.db.exec('ROLLBACK;', (rollbackErr) => {
                        if (rollbackErr) {
                            return reject(new Error('Failed to rollback transaction: ' + rollbackErr.message));
                        }
                        return reject(new Error('Failed to execute SQL statements: ' + err.message));
                    });
                } else {
                    resolve();
                }
            });
        });

        console.log('Custom event created successfully');
    } catch (err) {
        console.error(err.message);
        throw new Error('Failed to create custom event: ' + err.message);
    }
}

  async getCustomEvents(token: string): Promise<[]> {
    try {
      const uId = await this.idByToken(token);
      const sql = `SELECT * FROM customEvents WHERE uId = ${uId}`;
      return new Promise((resolve, reject) => {
        this.db.all(sql, [], (err, row: []) => {
          console.log(row)
          if (err) {
            // Check if the error indicates that the table does not exist
            if (err.message.includes('no such table')) {
              resolve([]); // Return an empty array if the table does not exist
            } else {
              reject(err); // Reject the promise with other errors
            }
          } else {
            resolve(row);
          }
        })
      })
    } catch (error) {
      throw new Error('Failed to get custom events')
    }
  }

  async clearCustomEvents() {
    return new Promise<void>((resolve, reject) => {
      this.db.exec(`DROP TABLE customEvents`, (err) => {
        if (err) {
          // Check if the error indicates that the table does not exist
          reject(err)
        } else {
          resolve();
        }
      })
    })
  }

  // Gets userid with token, returns promise with either empty [] if token is invalid or userId
  async idByToken(token: string): Promise<any> {
    try {
      const sql = `SELECT value FROM tokens WHERE token=${token}`;
      return new Promise((resolve, reject) => {
        this.db.get(sql, (err, row: {value: number}) => {
          console.log(row)
          if (row == undefined) {
            resolve([])
          }
          else if (err) {
            reject(err); 
          } else {
            resolve(row.value);
          }
        })
      })
    } catch (error) {
      throw(error)
    }
  }

  // Returns promise true if user has selected files, false if the user hasn't
  async getSelectState(token: string): Promise<Boolean> {
    try {
      const uId = await this.idByToken(token);
      return new Promise((resolve, reject) => {
        this.db.get('SELECT * FROM userFiles WHERE uId = ? AND inUse = ?', [uId, 1], (err, row) => {
            if (err) {
                return reject(err);
            }

            // Check if the hasFiles field is null
            if (row === null) {
                return resolve(false);
            } else {
                return resolve(true);
            }
        });
      });
    } catch(error) {
      throw new Error('Failed to get selected files')
    }
  }

  // Fetches list of filenames of the user
  async getFileList(token: string): Promise<any> {
    try {
      const userId = await this.idByToken(token);
      if (userId == undefined) {
        throw new Error('User Id not found for the given token');
      }
      const sql = `SELECT savedFile, inUse FROM userFiles WHERE uId=${userId}`;
      return new Promise((resolve, reject) => {
        this.db.all(sql, (err, rows: any) => {  
          if (err) {
            // Check if the error indicates that the table does not exist
            resolve([]); // Reject the promise with other errors
          } else {
            const processedRows = rows.map(row => {
              const regex = new RegExp('\.csv.*')
              const name = row.savedFile.replace(regex, '.csv');
              return { ...row, savedFile: name }
            })
            resolve(processedRows);
          }
        })
      })
  } catch(error) {
    throw new Error('Failed to get list of filenames')
  }
  }
  
  // Saves chose of files to be processed
  async saveFileChoice(fileList, token) {
    const sqlBeginTransaction = 'BEGIN TRANSACTION';
    const sqlCommitTransaction = 'COMMIT';
    const sqlUpdateInUse = 'UPDATE userFiles SET inUse = ? WHERE uId = ? AND savedFile = ?';
    
    const runAsync = (sql, params = []) => {
        return new Promise<void>((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) return reject(new Error('Failed to execute SQL: ' + err.message));
                resolve();
            });
        });
    };

    try {
      const userId = await this.idByToken(token);
      // Begin transaction
      await runAsync(sqlBeginTransaction);
      
      // Reset inUse field to false for all records of the user
      await runAsync('UPDATE userFiles SET inUse = ? WHERE uId = ?', [0, userId]);
      
      // Update inUse to true for the provided file list
      for (const file of fileList) {
          const savedFile = `${file}`;
          console.log(savedFile);
          await runAsync(sqlUpdateInUse, [1, userId, savedFile]);
      }
      
      // Commit transaction
      await runAsync(sqlCommitTransaction);
      
      console.log('File choices saved successfully');
    } catch (err) {
        console.error(err.message);
        // Rollback transaction in case of error
        try {
            await runAsync('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Failed to rollback transaction: ' + rollbackErr.message);
        }
        throw new Error('Failed to save file choices: ' + err.message);
    }
}


  // Delete file from record and userFiles
  async deleteFile(token: string, fileToDelete: string) {
    const userId = await this.idByToken(token);
    const sqlDelete = `DROP TABLE '${fileToDelete}${userId}';
                      DELETE FROM userFiles WHERE uId=${userId} AND savedFile=${fileToDelete};
                      `                   
    try {
      this.db.exec(sqlDelete)
    } catch (err) {
      throw err
    }

  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing the database', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}