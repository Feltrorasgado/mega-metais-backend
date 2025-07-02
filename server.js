import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('API Mega Metais rodando com sucesso!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
