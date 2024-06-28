const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_KEY);

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  multipleStatements: true
});

db.connect((error) => {
  if(error) console.error("MySQL connection error: ", error);
  else console.log("Connected to MySQL database");
});

app.get("/databases", (req, res) => {
  db.query("SHOW DATABASES", (error, results) => {
    if(error) {
      console.error("Error fetching databases: ", error);
      res.status(500).send("Error fetching databases");
    }
    else {
      let databases = results.map(row => row.Database);
      databases = databases.filter(dbName => dbName !== "information_schema" && dbName !== "performance_schema");
      const dbPromises = databases.map(dbName => {
        return new Promise((resolve, reject) => {
          db.query(`SHOW TABLES FROM \`${dbName}\``, (tableErr, tableResults) => {
            if(tableErr) reject(tableErr);
            else {
              const tables = tableResults.map(row => Object.values(row)[0]);
              resolve({ dbName, tables });
            }
          });
        });
      });

      Promise.all(dbPromises)
        .then(dbWithTables => res.json(dbWithTables))
        .catch(tableErr => {
          console.error("Error fetching tables: ", tableErr);
          res.status(500).send("Error fetching tables");
        });
    }
  });
});

app.get('/table-data', (req, res) => {
  const { dbName, tableName } = req.query;

  if(!dbName || !tableName)
    return res.status(400).send('Database name and table name are required');

  const query = `SELECT * FROM ${mysql.escapeId(dbName)}.${mysql.escapeId(tableName)}`;
  db.query(query, (error, results) => {
    if(error) {
      console.error('Error fetching table data: ', error);
      res.status(500).send('Error fetching table data');
    }
    else res.json(results);
  });
});

const getDatabaseSchema = async (dbName) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = ?",
      [dbName],
      (error, results) => {
        if(error) return reject(error);
        resolve(results);
      }
    );
  });
};

app.post("/check-normalization", async (req, res) => {
  const { dbName } = req.body;

  let schema;
  try {
    schema = await getDatabaseSchema(dbName);
  }
  catch(error) {
    return res.status(500).json({ error: "Failed to fetch database schema" });
  }

  const schemaInfo = schema.map((row) => ({
    table: row.TABLE_NAME,
    column: row.COLUMN_NAME,
    type: row.DATA_TYPE,
  }));

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({ history: [] });

  const result = await chat.sendMessage(`
    You are an expert in database normalization. 
    Analyze the following database schema and determine if it adheres to 1NF, 2NF, and 3NF.
    If the database is not normalized, provide specific suggestions on what can be done to normalize it.
    Schema: ${JSON.stringify(schemaInfo)}
  `);

  const response = await result.response;
  const normalizationAnalysis = response.text();

  res.json({ message: { normalizationAnalysis } });
});

const findCurrentDB = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT DATABASE() as currentDB;", (error, results) => {
      if(error) {
        return reject(error);
      }
      resolve(results[0].currentDB);
    });
  });
};

app.post('/execute-sql', async (req, res) => {
  const { dbName, query } = req.body;

  if(!dbName || !query)
    return res.status(400).send('Database name and query are required');

  db.changeUser({ database: dbName }, async (error) => {
    if(error) {
      console.error('Error changing database: ', error);
      return res.status(500).send('Error changing database');
    }

    db.query(query, async (error, results) => {
      if(error) return res.json({ errorMessage: error.sqlMessage, error: true });

      try {
        res.json({ results, newDB: await findCurrentDB() });
      }
      catch(error) {
        console.error('Error fetching current database:', error);
      }
    });
  });
});

const preprocessSqlQuery = (sqlQuery) => {
  sqlQuery = sqlQuery.replace(/```/g, '');
  sqlQuery = sqlQuery.replace(/\r/g, '');
  sqlQuery = sqlQuery.replace(/sql/gi, '');
  sqlQuery = sqlQuery.trim();
  return sqlQuery;
};

app.post("/generate-sql", async (req, res) => {
  const { dbName, nlq } = req.body;

  let schema;
  try {
    schema = await getDatabaseSchema(dbName);
  }
  catch(error) {
    return res.status(500).json({ error: "Failed to fetch database schema" });
  }

  const schemaInfo = schema.map((row) => ({
    table: row.TABLE_NAME,
    column: row.COLUMN_NAME,
    type: row.DATA_TYPE,
  }));

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({ history: [] });

  const result = await chat.sendMessage(`
  You are an expert SQL generator. Generate an accurate, efficient, simple and error-free SQL query from the given natural language query(NLQ).
  Guidelines:
  1. **Use Proper Syntax**: Ensure all SQL keywords are used correctly and that the query is syntactically correct.
  2. **Avoid Errors**: Use the correct column names for the tables and also pay particular attention to avoiding common SQL errors such as:
     - 'ONLY_FULL_GROUP_BY' errors: Ensure all non-aggregated columns in the SELECT clause are also in the GROUP BY clause or use subqueries.
     - Join errors: Ensure joins are correctly formed and all tables and columns are referenced properly.
     - Aggregation errors: Ensure aggregate functions are used correctly, and appropriate GROUP BY clauses are included.
  3. **Maintain Simplicity**: Keep the SQL query as simple as possible while achieving the desired result.
  4. **No Comments**: Do not include comments in the SQL query.
  5. **Formatting**: Format the query for readability, with proper indentation and line breaks.
  
  Here is an example of a valid query:
  NLQ: "Find the maximum average salary of employees in each department."
  SQL: 
  SELECT d.dname, MAX(avg_salary) AS max_avg_salary
  FROM (SELECT d.dname, AVG(e.salary) AS avg_salary
        FROM department d
        JOIN employee e ON d.dno = e.dno
        GROUP BY d.dno, d.dname) AS subquery;
  
  Convert the following natural language query to SQL based on this schema: ${JSON.stringify(schemaInfo)}. 
  NLQ: "${nlq}".
 `);

  const response = await result.response;
  let sqlQuery = response.text();
  sqlQuery = preprocessSqlQuery(sqlQuery);
  res.json({ message: {sqlQuery} })
});

app.post("/explain-sql", async (req, res) => {
  const { dbName, query } = req.body;

  let schema;
  try {
    schema = await getDatabaseSchema(dbName);
  }
  catch(error) {
    return res.status(500).json({ error: "Failed to fetch database schema" });
  }

  const schemaInfo = schema.map((row) => ({
    table: row.TABLE_NAME,
    column: row.COLUMN_NAME,
    type: row.DATA_TYPE,
  }));

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({ history: [] });

  const result = await chat.sendMessage(`
  You are an expert in SQL queries. 
  Provide a simple, clear, and concise explanation for the given SQL query. 
  The explanation should clearly explain what the query is doing, but should also cover any complex parts in the query(for example joins or subqueries if present).
  
  Explain the following query based on this schema: ${JSON.stringify(schemaInfo)}. 
  Query: "${query}".
  `);

  const response = await result.response;
  const explanation = response.text();
  res.json({ message: {explanation} });
});

app.post("/analyze-sql", async (req, res) => {
  const { dbName, query } = req.body;

  let schema;
  try {
    schema = await getDatabaseSchema(dbName);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch database schema" });
  }

  const schemaInfo = schema.map((row) => ({
    table: row.TABLE_NAME,
    column: row.COLUMN_NAME,
    type: row.DATA_TYPE,
  }));

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({ history: [] });

  const result = await chat.sendMessage(`
    You are an expert in SQL query analysis.
    Analyze the following SQL query based on the given schema and provide a detailed explanation of what it does and any potential issues or improvements:
    
    Schema: ${JSON.stringify(schemaInfo)}
    Query: "${query}"
  `);

  const analysis = await result.response;
  const explanation = analysis.text();

  res.json({ message: { explanation } });
});

app.post("/enhance-sql", async (req, res) => {
  const { dbName, query } = req.body;

  let schema;
  try {
    schema = await getDatabaseSchema(dbName);
  }
  catch(error) {
    return res.status(500).json({ error: "Failed to fetch database schema" });
  }

  const schemaInfo = schema.map((row) => ({
    table: row.TABLE_NAME,
    column: row.COLUMN_NAME,
    type: row.DATA_TYPE,
  }));

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({ history: [] });

  const result = await chat.sendMessage(`
    You are an expert in SQL query optimization and simplification.
    Enhance the following SQL query based on the given schema:
    1. **Optimize Performance**: Make sure the query is optimized for performance. Use appropriate indexing, avoid unnecessary columns, and rewrite parts of the query if needed for better performance.
    2. **Simplify**: Simplify the query without changing its functionality. Remove any redundant parts and make it more readable.
    3. **Error-Free**: Ensure the enhanced query is syntactically correct and error-free.
    
    Enhance the following query based on this schema: ${JSON.stringify(schemaInfo)}.
    Query: "${query}".
  `);

  const response = await result.response;
  const explanation = response.text();

  const sqlStartIndex = explanation.indexOf('```sql\n') + 6;
  const sqlEndIndex = explanation.lastIndexOf('\n```');
  const enhancedSQL = explanation.substring(sqlStartIndex, sqlEndIndex).trim();

  res.json({ message: { explanation, enhancedSQL } });
});


app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
