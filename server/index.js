import express from 'express';
import snowflake from 'snowflake-sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), '../../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to create connection
const createConnection = (password) => {
    return snowflake.createConnection({
        account: process.env.SNOWFLAKE_ACCOUNT,
        username: process.env.SNOWFLAKE_USERNAME,
        //password: password, // Dynamic password/key from header
        password: process.env.SNOWFLAKE_PASSWORD,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
        database: process.env.SNOWFLAKE_DATABASE,
        schema: process.env.SNOWFLAKE_SCHEMA,
        role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
    });
};

// Routes
app.get('/api/dashboard-data', (req, res) => {
    const apiKey = req.headers['x-snowflake-key'];

    // Check for "API Key" (Password) in headers, fallback to env for dev/legacy
    const password = apiKey || process.env.SNOWFLAKE_PASSWORD;

    if (!process.env.SNOWFLAKE_ACCOUNT || !process.env.SNOWFLAKE_USERNAME || !password) {
        console.warn('Missing Snowflake credentials');
        return res.status(503).json({ error: 'Missing database credentials. Please configure connection.' });
    }

    const connection = createConnection(password);

    connection.connect((err, conn) => {
        if (err) {
            console.error('Unable to connect to Snowflake: ' + err.message);
            return res.status(401).json({ error: 'Failed to connect to Snowflake. Invalid credentials? Detail: ' + err.message });
        }

        // Query the dynamic table created in setup
        const query = 'SELECT * FROM CURRENT_STOCK_SNAPSHOT';

        connection.execute({
            sqlText: query,
            complete: (err, stmt, rows) => {
                // Always disconnect after request
                /*
                  Note: In a high-traffic production app, you'd use a connection pool.
                  For this "Connect with Key" user-centric usecase, per-request connect is acceptable/simpler
                  to guarantee correct key usage.
                */
                connection.destroy((destroyErr) => {
                    if (destroyErr) console.error('Error destroying connection:', destroyErr);
                });

                if (err) {
                    console.error('Failed to execute statement: ' + err.message);
                    res.status(500).json({ error: err.message });
                } else {
                    res.json(rows);
                }
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
