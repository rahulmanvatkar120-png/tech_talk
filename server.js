const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

const db = new sqlite3.Database('./techtalk.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        tech TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Table creation error:', err.message);
        } else {
            console.log('Inquiries table ready');
        }
    });
}

app.get('/api/inquiries', (req, res) => {
    const query = 'SELECT * FROM inquiries ORDER BY created_at DESC';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

app.post('/api/inquiries', (req, res) => {
    const { name, email, phone, tech, message } = req.body;
    
    console.log('Received:', req.body);
    
    const query = 'INSERT INTO inquiries (name, email, phone, tech, message) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [name || '', email || '', phone || '', tech || '', message || ''], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
            return;
        }
        res.json({ success: true, id: this.lastID, message: 'Inquiry saved successfully' });
    });
});

app.delete('/api/inquiries', (req, res) => {
    db.run('DELETE FROM inquiries', [], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
            return;
        }
        res.json({ success: true, message: 'All inquiries cleared' });
    });
});

app.get('/api/stats', (req, res) => {
    const totalQuery = 'SELECT COUNT(*) as total FROM inquiries';
    const weekQuery = `SELECT COUNT(*) as this_week FROM inquiries WHERE created_at >= date('now', '-7 days')`;
    const techQuery = `SELECT tech, COUNT(*) as count FROM inquiries WHERE tech LIKE ? GROUP BY tech`;
    
    db.get(totalQuery, [], (err, totalResult) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.get(weekQuery, [], (err, weekResult) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            db.all(techQuery, ['%Unity%'], (err, unityResults) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                db.all(techQuery, ['%Flutter%'], (err, flutterResults) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    res.json({
                        success: true,
                        stats: {
                            total: totalResult.total,
                            thisWeek: weekResult.this_week,
                            unity: unityResults.length > 0 ? unityResults[0].count : 0,
                            flutter: flutterResults.length > 0 ? flutterResults[0].count : 0
                        }
                    });
                });
            });
        });
    });
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
});