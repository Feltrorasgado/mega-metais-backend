import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Para __dirname funcionar com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar CORS para permitir o frontend da Vercel
app.use(cors({
  origin: 'https://mega-metais-frontend.vercel.app'
}));

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do banco de dados PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // pasta local
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Rota inicial
app.get('/', (req, res) => {
  res.send('API Mega Metais rodando com sucesso!');
});

// Upload de imagem
app.post('/upload', upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Arquivo não enviado' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

// Cadastrar produto
app.post('/produtos', async (req, res) => {
  const { codigo, descricao, valor, imagem_url, categoria } = req.body;
  try {
    await pool.query(
      'INSERT INTO produtos (codigo, descricao, valor, imagem_url, categoria) VALUES ($1, $2, $3, $4, $5)',
      [codigo, descricao, valor, imagem_url, categoria]
    );
    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso' });
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).json({ erro: 'Erro ao cadastrar produto' });
  }
});

// Listar produtos
app.get('/produtos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
