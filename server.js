const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer Storage for Logo Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

// Connect to SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("Connected to SQLite database.");
});

// Initialize Tables and Insert Default Credentials
db.serialize(() => {
    // 1. Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    // 2. Create Companies Table
    db.run(`CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        location TEXT,
        field TEXT,
        contact TEXT,
        phone TEXT,
        image TEXT
    )`);

    // 3. FORCE INSERT DEFAULT CREDENTIALS
    const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`);
    insertUser.run('admin', 'admin123', 'admin');
    insertUser.run('student', 'student123', 'student');
    insertUser.finalize();
    
    console.log("Database schemas initialized and default accounts verified!");
});

// --- API LOGIN ENDPOINT ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: "Database reading error" });
        
        if (row) {
            res.json({ username: row.username, role: row.role });
        } else {
            res.status(401).json({ error: "Invalid username or password credentials." });
        }
    });
});

// --- COMPANY PLACEMENT ENDPOINTS ---
app.get('/api/companies', (req, res) => {
    db.all(`SELECT * FROM companies`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/companies', upload.single('companyImage'), (req, res) => {
    const { name, location, field, contact, phone } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.png';

    const sql = `INSERT INTO companies (name, location, field, contact, phone, image) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, location, field, contact, phone, imagePath], function(err) {
        if (err) return res.status(500).send(err.message);
        res.redirect('/internships.html?role=admin');
    });
});

app.delete('/api/companies/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM companies WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Record deleted successfully" });
    });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server blasting off on http://localhost:3000`);
});