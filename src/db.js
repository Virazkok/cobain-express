require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');


// Load CA certificate
const ca = fs.readFileSync(process.env.PG_SSL_CA).toString();


let client; // Singleton instance


function getClient() {
if (!client) {
client = new Client({
host: process.env.PG_HOST,
port: process.env.PG_PORT,
user: process.env.PG_USER,
password: process.env.PG_PASSWORD,
database: process.env.PG_DATABASE,
ssl: {
rejectUnauthorized: true,
ca,
},
});


client.connect().then(() => {
console.log('Database connected');
}).catch(err => {
console.error('DB connection error:', err);
});
}


return client;
}


module.exports = getClient();