const path = require('path');
const fs = require('fs');

const dbType = process.env.DB_TYPE || 'sqlite';
let query;
let db;

if (dbType === 'postgres') {
    const { Pool } = require('pg');
    const pool = new Pool(
        process.env.DATABASE_URL 
        ? { connectionString: process.env.DATABASE_URL }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        }
    );
    
    query = (text, params) => pool.query(text, params);
    db = pool;
    console.log('PostgreSQL database connected.');
} else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, '../../database.sqlite');
    db = new sqlite3.Database(dbPath);
    
    let isInitialized = false;
    const initPromise = new Promise((resolve, reject) => {
        const existing = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;
        
        if (existing) {
            isInitialized = true;
            resolve();
        } else {
            const schemaPath = path.resolve(__dirname, 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error initializing SQLite schema:', err);
                        reject(err);
                    } else {
                        console.log('SQLite schema initialized.');
                        isInitialized = true;
                        resolve();
                    }
                });
            } else {
                console.warn('schema.sql not found, skipping SQLite initialization.');
                isInitialized = true;
                resolve();
            }
        }
    });
    
    // Helper to mimic pg's query interface
    query = async (text, params = []) => {
        if (!isInitialized) await initPromise;

        // Map $1, $2... to ? and maintain correct order of parameters
        const orderedParams = [];
        let sqliteQuery = text.replace(/\$\d+/g, (match) => {
            const index = parseInt(match.substring(1)) - 1;
            orderedParams.push(params[index]);
            return '?';
        });

        return new Promise((resolve, reject) => {
            const trimmed = sqliteQuery.trim().toUpperCase();
            const isSelect = trimmed.startsWith('SELECT');
            const hasReturning = trimmed.includes('RETURNING');
            const isInsert = trimmed.startsWith('INSERT');

            if (isSelect) {
                // Pure SELECT — use db.all()
                db.all(sqliteQuery, orderedParams, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows: rows || [], rowCount: rows ? rows.length : 0, lastID: null });
                });
            } else if (hasReturning && isInsert) {
                // INSERT ... RETURNING: SQLite doesn't support RETURNING.
                // Strip the RETURNING clause and use db.run() + this.lastID, 
                // then SELECT the new row by lastID to mimic pg behavior.
                const strippedQuery = sqliteQuery.replace(/\s+RETURNING\s+\S+/gi, '').trim();
                db.run(strippedQuery, orderedParams, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        const newId = this.lastID;
                        // Return a rows array with the id so controllers can use insertRes.rows[0].id
                        resolve({ rows: [{ id: newId }], rowCount: 1, lastID: newId });
                    }
                });
            } else {
                // UPDATE / DELETE / other DML
                db.run(sqliteQuery, orderedParams, function(err) {
                    if (err) reject(err);
                    else resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
                });
            }
        });
    };
    console.log('SQLite database connected.');
}

module.exports = {
    query,
    db 
};
