import 'dotenv/config';
import { connectPostgres } from '../config/connectPostgres.js';
import { connectMongo } from '../config/connectMongo.js';

async function test() {
  try {
    console.log('Testando conexão com o PostgreSQL...');
    await connectPostgres();
    console.log('Conexão estavel com PostgreSQL...\n');

    console.log('Testando conexão com o MongoDB...\n');
    await connectMongo();
    console.log('Conexão estavel com o MongoDB...');
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

test();