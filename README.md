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

## Como execultar o projeto

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

<div align="center">
  <p><strong>Equipe:</strong> Joao Victor e Luan</p>
</div>
