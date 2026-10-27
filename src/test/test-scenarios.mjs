import 'dotenv/config';
import { insertUserScenarioOne, insertUserScenarioTwo } from '../service/userService.js';

async function testScenarios() {
  try {
    console.log('Testando Cenário 1: insert no Postgres -> insert no MongoDB (com rollback)...');
    const resultOne = await insertUserScenarioOne({
      name: 'João Victor',
      email: `joao-victor-${Date.now()}@email.com`,
    });
    console.log('Cenário 1 finalizado com sucesso:', resultOne);

    console.log('Testando Cenário 2: insert no MongoDB -> insert no Postgres (com rollback)...');
    const resultTwo = await insertUserScenarioTwo({
      name: 'Luan',
      email: `luan-${Date.now()}@email.com`,
    });
    console.log('Cenário 2 finalizado com sucesso:', resultTwo);
  } catch (err) {
    console.error('Erro nos testes dos cenários:', err.message);
  }
}

testScenarios();
