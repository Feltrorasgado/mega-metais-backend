import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Teste de rota
app.get('/', (req, res) => {
  res.send('API Mega Metais conectada ao banco!');
});

// =======================
// ROTAS DE PRODUTOS
// =======================

// Listar produtos
app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Adicionar produto
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

// =======================
// ROTAS DE PEDIDOS
// =======================

// Criar pedido
app.post('/pedidos', async (req, res) => {
  const { vendedor, cliente, cidade, data, observacoes, total, itens } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      'INSERT INTO pedidos (vendedor, cliente, cidade, data, observacoes, total) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [vendedor, cliente, cidade, data, observacoes, total]
    );

    const pedidoId = pedidoResult.rows[0].id;

    for (const item of itens) {
      await client.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, valor_unitario, valor_total) VALUES ($1, $2, $3, $4, $5)',
        [pedidoId, item.produto_id, item.quantidade, item.valor_unitario, item.valor_total]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Pedido criado com sucesso', pedidoId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  } finally {
    client.release();
  }
});

// Listar pedidos
app.get('/pedidos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
