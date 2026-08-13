# Biblioteca API

API REST para gerenciar o acervo de uma biblioteca. Projeto de apoio das aulas de desenvolvimento assistido por agentes de IA.

## Requisitos

- Node.js 20 ou superior.

Não há dependências para instalar.

## Como rodar

```bash
npm run dev
```

O servidor sobe em `http://localhost:3000`. A porta pode ser trocada pela variável `PORTA`.

## Como rodar as verificações

```bash
npm test
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/livros` | lista o acervo. Aceita `?autor=` para filtrar |
| GET | `/livros/:id` | busca um livro |
| POST | `/livros` | cadastra um livro |
| PUT | `/livros/:id` | substitui os dados de um livro |
| DELETE | `/livros/:id` | remove um livro |

## Exemplo

```bash
curl -X POST http://localhost:3000/livros \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Dom Casmurro", "autor": "Machado de Assis", "ano": 1899}'

curl http://localhost:3000/livros
curl "http://localhost:3000/livros?autor=machado"
```

## Observação

Os dados ficam em memória. Ao reiniciar o servidor, o acervo volta a ficar vazio.
