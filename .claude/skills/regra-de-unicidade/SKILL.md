---
name: regra-de-unicidade
description: Impede valor repetido num campo de um recurso e responde 409 CONFLITO, inclusive no PUT, que não pode conflitar com o próprio registro. Use quando pedirem que um campo seja único, não se repita, não aceite duplicado ou recuse algo já cadastrado — "não pode ter dois livros com o mesmo ISBN", "o email do leitor é único", "recuse editora com nome repetido".
---

# Campo único, com 409

`conflito()` é o terceiro status do projeto e hoje não é chamado em lugar nenhum —
está declarado em `src/comum/erros.js` e nunca usado. Toda regra de unicidade é o
que estreia esse caminho, e é sempre o mesmo procedimento.

O que já está no `CLAUDE.md` não se repete aqui.

## As cinco regras

**1. A checagem mora no serviço. O repositório não muda.**

O repositório é um `Map`: ele não tem índice único e não vai ganhar um. Quem varre é
o serviço, com `repositorio.listar()`:

```js
import { conflito, dadosInvalidos } from '../comum/erros.js';

function normalizar(valor) {
  return String(valor).trim().toLowerCase();
}

function exigirUnico(campo, valor, idIgnorado = null) {
  const procurado = normalizar(valor);
  const colisao = repositorio
    .listar()
    .find((item) => item.id !== idIgnorado && normalizar(item[campo]) === procurado);

  if (colisao) {
    throw conflito(`Já existe livro com o ${campo} "${valor}".`);
  }
}
```

**2. A armadilha: no `atualizar`, o próprio id vai como `idIgnorado`.**

```js
export function criar(dados) {
  validar(dados);
  exigirUnico('isbn', dados.isbn);
  return repositorio.inserir(dados);
}

export function atualizar(id, dados) {
  const atual = exigirExistente(id);
  validar(dados);
  exigirUnico('isbn', dados.isbn, id);   // <- sem o id, o registro colide consigo mesmo
  ...
}
```

Sem o terceiro argumento, qualquer PUT que **não** mude o campo único encontra o
próprio registro na varredura e devolve 409. O usuário troca só o título e leva
"ISBN já cadastrado" — apontando para o livro que ele está editando.

**3. Ordem: valida primeiro (422), confere unicidade depois (409).**

- **422** é campo malformado: vazio, ausente, tipo errado.
- **409** é campo bem-formado que colide com um registro que já existe.

`validar(dados)` vem antes de `exigirUnico(...)` nas duas funções. Campo vazio é 422
mesmo que exista outro registro vazio — nunca 409.

**4. Normalize dos dois lados da comparação.**

Comparar `item[campo] === valor` cru deixa passar `"ABC-123"` contra `"abc-123 "`.
A normalização é a mesma ideia do filtro `?autor=` do serviço de livros (que usa
`toLowerCase`), só que aqui a comparação é exata, não `includes`.

Escreva a decisão na mensagem do erro e no spec: "ISBN único, ignorando maiúsculas e
espaços nas pontas".

**5. A verificação cobre três casos, não um.**

```
a) POST com valor já usado          -> 409, corpo.erro.codigo === 'CONFLITO'
b) PUT trocando para valor de OUTRO -> 409
c) PUT mantendo o próprio valor     -> 200
```

O caso **(c)** é o que prova a regra 2, e é o único que falha em silêncio se ela for
esquecida. Um spec com só o caso (a) passa com a implementação errada.

Vale ainda um caso de normalização, se a regra 4 valer: mesmo valor em maiúsculas
também dá 409.

## A ordem

```
1. servico: normalizar() + exigirUnico()   uma vez por recurso
2. servico.criar()                         exigirUnico depois de validar
3. servico.atualizar()                     exigirUnico(campo, valor, id)
4. verificacoes/*.spec.js                  os três casos
5. npm test                                inteiro
```

## Conferência

```
1. A varredura está no serviço; repositório intocado
2. atualizar() passa o próprio id como idIgnorado
3. validar() antes de exigirUnico() em criar E em atualizar
4. Os dois lados da comparação normalizados
5. Spec tem o caso "PUT mantendo o próprio valor -> 200"
6. As afirmações são sobre corpo.erro.codigo, não sobre o texto da mensagem
7. npm test verde por inteiro, package.json sem mudança
```
