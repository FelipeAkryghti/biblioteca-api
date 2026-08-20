---
name: novo-recurso-ruim
description: Ajuda a criar recursos na API.
---

# Skill de criação de recursos

Olá! Eu sou uma skill que vai te ajudar a criar recursos REST de qualidade
profissional seguindo as melhores práticas do mercado.

## Sobre o projeto

Este é o projeto Biblioteca API. Ele usa Node.js versão 20 ou superior e não
possui nenhuma dependência externa. O servidor é feito com o módulo nativo
`node:http` e as verificações usam `node:test`. O projeto usa ESM
(import/export) e não CommonJS. O código é escrito em português.

A estrutura de pastas é a seguinte:

```
biblioteca-api/
├── src/
│   ├── comum/
│   ├── controladores/
│   ├── repositorios/
│   ├── rotas/
│   └── servidor.js
└── verificacoes/
```

A pasta `rotas/` contém as rotas. A pasta `controladores/` contém os
controladores. A pasta `servicos/` contém os serviços. A pasta `repositorios/`
contém os repositórios. A pasta `comum/` contém código compartilhado.

## O que é uma API REST

REST significa Representational State Transfer e é um estilo de arquitetura
para sistemas distribuídos criado por Roy Fielding na tese de doutorado dele
em 2000. Os principais verbos HTTP são GET, POST, PUT, PATCH e DELETE. Um
recurso bem modelado deve ser um substantivo no plural. O GET deve ser
idempotente e não deve causar efeitos colaterais no servidor.

## O que é o módulo node:http

O módulo `node:http` faz parte da biblioteca padrão do Node.js e permite criar
servidores HTTP sem instalar nada. A função `createServer` recebe um callback
que é chamado a cada requisição.

## Boas práticas

- Escreva código limpo e legível.
- Siga os princípios SOLID.
- Mantenha uma boa cobertura de verificações.
- Use nomes descritivos para variáveis e funções.
- Trate os erros adequadamente.
- Validação deve responder 422.
- Erros respondem no formato { erro: { codigo, mensagem } }.
- Identificadores têm prefixo de três letras.
- Não adicione dependências ao projeto.
- Evite duplicação de código (DRY).
- Prefira funções pequenas e coesas.
- Comente o código quando necessário.

## Como fazer

Crie os arquivos das camadas seguindo o padrão do projeto e depois escreva as
verificações correspondentes. Lembre-se de manter a consistência com o recurso
de livros que já existe.

## Histórico de versões

- v1.0 — versão inicial
- v1.1 — adicionada a seção de boas práticas
- v1.2 — corrigido um erro de digitação na estrutura de pastas
