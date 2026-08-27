---
name: campo-novo-em-recurso
description: Adiciona um campo novo a um recurso que já existe — valor padrão no repositório, validação no serviço, o PUT e a verificação — sem quebrar o que já estava lá. Use quando pedirem para incluir, guardar ou passar a aceitar um dado novo num recurso existente, por exemplo "o livro precisa ter ISBN", "guarde o email da editora", "adicione páginas ao livro", "o leitor tem que ter telefone".
---

# Campo novo num recurso que já existe

O recurso já funciona. O trabalho não é criar arquivo nenhum: é atravessar quatro
lugares na ordem certa. Pular um deles não gera erro — gera um campo que existe
pela metade.

O que já está no `CLAUDE.md` não se repete aqui.

## As cinco regras

**1. O campo nasce no repositório, dentro de `inserir`.**

```js
export function inserir(dados) {
  const livro = {
    id: novoIdentificador('liv'),
    titulo: dados.titulo,
    isbn: dados.isbn,                    // veio do cliente
    emprestado: false,                   // padrão fixo: NÃO lê de dados
    criadoEm: new Date().toISOString(),
  };
```

Campo com valor padrão (`false`, `0`, `[]`) é chumbado ali, nunca lido de `dados` —
senão o cliente escolhe o estado inicial. O serviço valida e repassa; quem monta o
objeto é o repositório, sempre.

Campo opcional que chega `undefined` some do JSON da resposta. Se ele precisa
aparecer, dê o padrão aqui: `isbn: dados.isbn ?? null`.

**2. A armadilha: `atualizar` lista os campos um a um.**

```js
return repositorio.substituir(id, {
  ...atual,
  titulo: dados.titulo,
  autor: dados.autor,
  ano: dados.ano,
  // isbn não está aqui -> o PUT nunca altera isbn
});
```

O `...atual` **preserva** o que já existe, ele não adota o que veio no corpo. Campo
que você não acrescentar nessa lista fica congelado no valor da criação: o PUT
devolve **200 com o valor velho**, sem erro, sem 500, sem nada no log. É a falha
mais silenciosa do projeto.

Decida explicitamente: campo editável entra na lista; campo que não se edita
(`criadoEm`, estado interno) fica de fora **de propósito**.

**3. Onde a validação entra depende do tipo de regra.**

| a regra é | o que fazer no serviço |
|---|---|
| campo obrigatório | acrescentar o nome em `CAMPOS_OBRIGATORIOS` — o laço já cuida |
| formato ou tipo | `if` próprio depois do laço, com `dadosInvalidos`, no molde do `Number.isInteger(dados.ano)` |
| opcional e sem regra | não tocar em `validar` |

**4. Tornar um campo obrigatório quebra as verificações que já existem.**

Os specs criam o recurso por um helper (`criarLivro`, `criarEditora`) com um objeto
padrão. No instante em que o campo novo entra em `CAMPOS_OBRIGATORIOS`, **todos** os
casos que usam o helper passam a receber 422.

Conserta-se em **um** lugar: o objeto padrão dentro do helper. Nunca caso a caso.

**5. A verificação afirma o campo nas duas pontas.**

- no **201** do POST: o campo voltou com o valor enviado (ou com o padrão);
- no **200** do PUT: o campo voltou com o valor **novo**.

O do PUT é o que pega a regra 2. Sem ele o bug atravessa a revisão inteira.
Se o campo virou obrigatório, mais um caso: ausente devolve 422 e
`corpo.erro.codigo === 'DADOS_INVALIDOS'`.

## A ordem

```
1. repositorio.inserir()      o campo nasce, com padrão se não vier do cliente
2. servico.validar()          só se houver regra
3. servico.atualizar()        entra na lista, ou fica de fora de propósito
4. verificacoes/*.spec.js     helper primeiro, casos depois
5. npm test                   inteiro
```

## Conferência

```
1. Campo em inserir(), padrão chumbado se não vem do cliente
2. Campo na lista do atualizar() — ou fora dela por decisão consciente
3. Obrigatório -> CAMPOS_OBRIGATORIOS; com formato -> if próprio com dadosInvalidos
4. Helper do spec atualizado se o campo virou obrigatório
5. Verificação afirma o campo no 201 E no PUT
6. npm test verde por inteiro, package.json sem mudança
```
