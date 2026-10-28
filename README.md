<div align="center">
  <h1>Persistência de Dados</h1>
  <p>Repositório destinado a aplicação acadêmica que permite persistir dados entre dois bancos de dados diferentes usando o conceito de 2PC (Two Phase Commit)</p>
</br>
  <p>Serão utilizados os ambientes do Postgres & MongoDB</p>
</div>

## Os cenários do atividade:

> 1º Cenário 

- Inserir os dados em um tabela no Postgres e depois no MongoDB. Porém, ao tentar salvar os dados no MongoDB, gera-se um erro e é necessário fazer um "roolback" no Postgres.

> 2º Cenário

- Inserir os dados em uma tabela no MongoDB e depois no Postgres. Porém, ao tentar salvar os dados no Postgres, gera-se um erro e é necessário fazer um "roolback" no MongoDB.

> 3º Cenário

- Atualizar os dados no MongoDB e no Postgres enquanto um serviço consulta constantemente (a cada 10ms) a lista de dados de ambos os bancos.

## Como executar o projeto

```
⚠️ ATENÇÃO

Certifique-se de ter o NodeJS, o npm, o docker e o docker compose na v2 instalados em seu computador. 
``` 

> Passo 1 - clone o repositório e acesse a página

- no terminal copie e cole os comandos abaixo:

```
git clone https://github.com/jvictor-s/dac-persistencia-dados.git
```

```
cd dac-persistencia-dados/
```

> Passo 2 - execute do compose 

```
docker compose up -d
``` 
> Passo 3 - baixe os pacotes necessarios para o projeto

```
npm install
```

> Passo 4 - inicie a API

```
npm start
```

> Passo 5 - execute a bateria automatizada de testes dos cenários

```powershell
pwsh -File .\test-scenarios.ps1
```

O servidor inicia na porta `3333` por padrão. A especificação completa dos
cenários, decisões de arquitetura e comandos de validação está em
[RELATORIO.MD](./RELATORIO.MD).

### Endpoints

- `POST /users/scenario1`: grava primeiro no PostgreSQL e depois no MongoDB.
- `POST /users/scenario2`: grava primeiro no MongoDB e depois no PostgreSQL.
- `PUT /users/scenario3/:email`: atualiza o nome nos dois bancos com coordenação 2PC.
- `GET /users/consistent`: retorna os registros pareados e o indicador de consistência.
- `GET /users/monitor`: retorna a última leitura do monitor de 10 ms.

Para reproduzir falhas controladas nos cenários, inclua no JSON
`"failureAt": "mongodb"`, `"postgres"` ou `"postgres-commit"`. No cenário 3
também são aceitos `"prepare"`. Essa injeção existe apenas para demonstrar os
rollbacks e não deve ser exposta em uma API de produção.

<div align="center">
  <p><strong>Equipe:</strong> Joao Victor e Luan</p>
</div>
