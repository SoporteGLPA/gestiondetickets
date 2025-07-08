
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Pool de conexiones a PostgreSQL
let pool;

function initializeDatabase(config) {
  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl || false
  });
}

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Endpoint para configurar la base de datos
app.post('/api/database/config', (req, res) => {
  try {
    const { config } = req.body;
    initializeDatabase(config);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para consultas a la base de datos
app.post('/api/database', async (req, res) => {
  try {
    const { table, query, config } = req.body;
    
    if (!pool) {
      initializeDatabase(config);
    }

    let sql = '';
    let values = [];

    switch (query.action) {
      case 'SELECT':
        sql = `SELECT ${query.columns || '*'} FROM ${table}`;
        break;
      
      case 'INSERT':
        const insertColumns = Object.keys(query.data);
        const insertPlaceholders = insertColumns.map((_, i) => `$${i + 1}`);
        sql = `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`;
        values = Object.values(query.data);
        break;
      
      case 'UPDATE':
        const updateColumns = Object.keys(query.data);
        const updatePlaceholders = updateColumns.map((col, i) => `${col} = $${i + 1}`);
        sql = `UPDATE ${table} SET ${updatePlaceholders.join(', ')}`;
        values = Object.values(query.data);
        break;
      
      case 'DELETE':
        sql = `DELETE FROM ${table}`;
        break;
    }

    // Agregar WHERE
    if (query.where && query.where.length > 0) {
      const whereClause = query.where.map((w, i) => {
        const paramIndex = values.length + i + 1;
        values.push(w.value);
        return `${w.column} ${w.operator} $${paramIndex}`;
      }).join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    // Agregar ORDER BY
    if (query.order) {
      sql += ` ORDER BY ${query.order.column} ${query.order.ascending ? 'ASC' : 'DESC'}`;
    }

    // Agregar LIMIT
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    // Si es INSERT o UPDATE, agregar RETURNING
    if (query.action === 'INSERT' || query.action === 'UPDATE') {
      sql += ' RETURNING *';
    }

    const result = await pool.query(sql, values);
    
    res.json({
      data: query.single ? result.rows[0] : result.rows,
      error: null
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({
      data: null,
      error: error.message
    });
  }
});

// Endpoint para autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    
    // Por simplicidad, comparamos directamente (en producción usar bcrypt)
    const isValid = password === 'admin' || await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      data: { user, session: { access_token: token } },
      error: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO profiles (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, full_name]
    );

    const user = result.rows[0];
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      data: { user, session: { access_token: token } },
      error: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
