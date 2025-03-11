# Natural Language Query Executor (NLQE)

![SQL Execution](https://github.com/user-attachments/assets/80a4c4d1-4d78-4f7d-9210-73c503cc43d3)
**SQL Execution**
<br><br>

![Natural Language to SQL Conversion](https://github.com/user-attachments/assets/9c1c7347-7d5a-4bc9-9e77-773583043ef8)
**Natural Language to SQL Conversion**
<br><br>

![Database Viewing](https://github.com/user-attachments/assets/6d12a59e-7558-4b0e-ad4d-6ab9f0f15c01)
**Database Viewing**
<br><br>

![Query Explanation, Analysis and Enhancement](https://github.com/user-attachments/assets/7854e3f5-b50e-4471-a51d-e717e3dd60a6)
**Query Explanation, Analysis and Enhancement**
<br><br>

![Normalization Check](https://github.com/user-attachments/assets/b34ef834-bc67-4778-8c61-8575491a81a7)
**Normalization Check**
<br><br>

## 📌 Description  
Natural Language Query Executor is a web-based tool that allows users to execute SQL queries directly or generate them using natural language input. The project integrates **React**, **Express**, **MySQL**, and **Google Gemini AI** to provide seamless SQL query execution, conversion, analysis, and normalization checking.

## ✨ Features  
-  Direct SQL execution through **Monaco Editor**  
-  Convert natural language queries to **SQL** using **Google Gemini AI**  
-  View database tables from the frontend  
-  Multiple result display with table selection  
-  Explanation, enhancement, and analysis of SQL queries  
-  Normalization checking of database tables  
-  Query execution history management  

## 🛠 Tech Stack  
- **Frontend:** React.js  
- **Backend:** Express.js  
- **Database:** MySQL  
- **AI Integration:** Google Gemini AI

## 🏗 Installation & Setup  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/srinidhiv2107/NaturalLanguageQueryExecutor.git
cd NaturalLanguageQueryExecutor
```

### 2️⃣ Setup Backend

#### ✅ Prerequisites
- Ensure MySQL is installed and running.
- Grant privileges to the MySQL user:
```sql
GRANT ALL PRIVILEGES ON *.* TO 'your_mysql_user'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

- Create a .env file inside the backend folder with the following:
```env
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
GOOGLE_GEN_AI_KEY=your_google_gen_ai_key
```

#### ▶ Install Dependencies & Run Backend
```bash
cd backend
npm install
npm run devStart
```

### 3️⃣ Setup Frontend
```bash
cd ../frontend
npm install
npm start
```
