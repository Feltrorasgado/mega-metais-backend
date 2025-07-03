

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pg from 'pg';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('API Mega Metais com upload de imagem!');
});

app.post('/upload', upload.single('imagem'), (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/produtos', async (req, res) => {
  const { codigo, descricao, valor, imagem_url, categoria } = req.body;
  try {
    await pool.query(
      'INSERT INTO produtos (codigo, descricao, valor, imagem_url, categoria) VALUES ($1, $2, $3, $4, $5)',
      [codigo, descricao, valor, imagem_url, categoria]
    );
    res.status(201).json({ message: 'Produto adicionado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar produto' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
