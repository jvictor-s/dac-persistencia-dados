# Relatório de Persistência Distribuída

## Arquitetura utilizada

A aplicação é um serviço Node.js/Express que usa:

- PostgreSQL, acessado por `pg`, como uma das fontes de usuários;
- MongoDB, acessado por Mongoose, como a segunda fonte;
- um coordenador distribuído que simula a lógica de fase de preparação e confirmação de um 2PC;
- compensação e rollback quando alguma etapa falha;
- um lock em memória para evitar leituras concorrentes inconsistentes durante a atualização;
- um monitor que consulta os bancos a cada 10 ms para validar a consistência.

Cada usuário é identificado pelo `email`, que é único nos dois bancos. A rota
`GET /users/consistent` pareia os registros por e-mail e informa se o nome e a
existência estão consistentes. A rota `GET /users/monitor` expõe o último
estado observado pelo monitor.

A implementação não cria uma transação distribuída nativa entre PostgreSQL e
MongoDB, porque bancos heterogêneos não oferecem isso de forma transparente.
O que foi implementado é uma coordenação 2PC-like com compensação:

1. **Prepare:** valida a entrada e confirma que o registro pode ser alterado,
   abrindo a transação local no PostgreSQL e bloqueando a linha relevante.
2. **Commit/confirm:** aplica a alteração no segundo banco e confirma a
   transação no PostgreSQL.
3. **Rollback/compensação:** caso uma etapa falhe, reverte a transação local e
   restaura o valor anterior no MongoDB, quando necessário.

Esse modelo é adequado para demonstração acadêmica e para cenários de
persistência distribuída, mas não substitui um gerenciador de transações
multi-database em produção.

## Cenário 1: PostgreSQL -> MongoDB

`POST /users/scenario1` inicia uma transação PostgreSQL e insere o usuário.
Depois tenta inserir o documento no MongoDB. Se a segunda etapa falhar, a
transação PostgreSQL recebe `ROLLBACK`. Se o commit no PostgreSQL falhar depois
que o documento já foi criado no MongoDB, o documento é removido pelo `_id` para
evitar registro órfão.

Resultado esperado:

- sucesso: resposta `201` com `status: "COMMITTED"`;
- falha no MongoDB: erro HTTP e nenhuma persistência final do cenário;
- falha no commit PostgreSQL: erro HTTP e compensação do documento no MongoDB.

## Cenário 2: MongoDB -> PostgreSQL

`POST /users/scenario2` cria primeiro o documento MongoDB e depois inicia uma
transação PostgreSQL. Qualquer falha ao conectar, iniciar, inserir ou confirmar o
PostgreSQL remove exatamente o documento criado, usando seu `_id`.

Resultado esperado:

- sucesso: resposta `201` com `status: "COMMITTED"`;
- falha PostgreSQL: rollback local e remoção do documento MongoDB;
- falha na criação MongoDB: PostgreSQL não chega a ser alterado.

## Cenário 3: atualização e consultas a cada 10 ms

`PUT /users/scenario3/:email` atualiza o nome do usuário nos dois bancos. O
coordenador mantém o lock durante a transação: o PostgreSQL é preparado, o
MongoDB é atualizado e a transação PostgreSQL é confirmada. Se a atualização do
MongoDB falhar, o PostgreSQL é revertido. Se a confirmação do PostgreSQL falhar
após a alteração no MongoDB, o documento é restaurado com o valor anterior.

Em paralelo, o monitor executa leituras a cada 10 ms para verificar se os dados
estão consistentes. A rota `GET /users/monitor` mostra o último estado
observado, enquanto `GET /users/consistent` compara os registros por e-mail e
retorna o indicador `consistent`.

## Como executar e demonstrar

```powershell
docker compose up -d
npm install
npm test
npm start
```

Bateria automatizada:

```powershell
powershell -ExecutionPolicy Bypass -File .\test-scenarios.ps1
```

Exemplo de criação:

```powershell
curl -X POST http://localhost:3333/users/scenario1 `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Ana\",\"email\":\"ana@example.com\"}"
```

Exemplo de falha/rollback no cenário 1:

```powershell
curl -X POST http://localhost:3333/users/scenario1 `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Falha\",\"email\":\"falha@example.com\",\"failureAt\":\"mongodb\"}"
```

Exemplo de atualização no cenário 3:

```powershell
curl -X PUT http://localhost:3333/users/scenario3/ana.consistente@example.com `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Ana atualizada\"}"
```

## Revisão realizada

Além de implementar o cenário 3, a revisão corrigiu problemas dos cenários
existentes: a aplicação HTTP agora conecta explicitamente ao MongoDB e cria a
tabela antes de aceitar requisições; a conexão MongoDB não mascara erros; o
cenário 1 compensa também uma falha de commit; o cenário 2 remove apenas o
registro gerado pela própria operação; e o script de teste garante que o e-mail
usado no cenário 3 exista antes da atualização.

## Resultado esperado por cenário

### Cenário 1

- sucesso: resposta `201` com `status: "COMMITTED"`;
- falha no MongoDB: erro HTTP e rollback no PostgreSQL;
- falha no commit PostgreSQL: compensação do documento no MongoDB.

### Cenário 2

- sucesso: resposta `201` com `status: "COMMITTED"`;
- falha no PostgreSQL: rollback do MongoDB;
- falha na criação do MongoDB: PostgreSQL não deve ser alterado.

### Cenário 3

- atualização bem-sucedida: resposta `200` com `status: "COMMITTED"`;
- consistência: `GET /users/consistent` deve mostrar `consistent: true`;
- monitoramento: `GET /users/monitor` deve registrar o estado mais recente do serviço.
