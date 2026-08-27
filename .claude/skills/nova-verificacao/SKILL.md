---
name: nova-verificacao
description: Escreve ou amplia verificações em `verificacoes/` da Biblioteca API — servidor real em porta aleatória, isolamento com `reiniciar()` e assertivas do contrato de erro. Use quando pedirem para testar, verificar ou cobrir um endpoint, um recurso ou um caso de erro, por exemplo "escreva os testes de leitores", "cubra o filtro por autor", "faltou verificação do 404".
---

# Verificações na Biblioteca API

Não há mock de camada. Sobe servidor de verdade e bate com `fetch`.
Espelhe `verificacoes/livros.spec.js` — é o arquivo mais completo.

## Esqueleto obrigatório

```js
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar } from '../src/repositorios/leitores-repositorio.js';

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => reiniciar());
```

## As sete regras

**1. `listen(0)`, nunca 3000.**

A porta sai depois do listen, de `servidor.address().port`. Porta fixa faz `EADDRINUSE`
quando dois arquivos `.spec.js` rodam juntos no `npm test`. `PORTA` não entra aqui.

**2. `after(() => servidor.close())` não é opcional.**

Sem ele o processo do `node --test` fica pendurado e a suíte nunca termina.

**3. `reiniciar()` é o do repositório que você está testando.**

Cada spec importa o seu. Se um caso precisa de dois recursos, importe os dois com alias:

```js
import { reiniciar as reiniciarLivros } from '../src/repositorios/livros-repositorio.js';
import { reiniciar as reiniciarEditoras } from '../src/repositorios/editoras-repositorio.js';

beforeEach(() => {
  reiniciarLivros();
  reiniciarEditoras();
});
```

Estado em `Map` é global ao processo. Sem `beforeEach` um caso enxerga o lixo do anterior.

**4. Helper de criação com spread por último.**

```js
async function criarLeitor(dados = {}) {
  const resposta = await fetch(`${base}/leitores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Ana Prado', email: 'ana@exemplo.com', ...dados }),
  });
  return { resposta, corpo: await resposta.json() };
}
```

O `...dados` no fim é o que deixa o caso ruim sobrescrever um campo só:
`criarLeitor({ nome: '' })`. Devolva sempre `{ resposta, corpo }` — quem chama precisa
do status **e** do corpo.

**5. 204 não tem corpo. `.json()` lança.**

```js
assert.equal(resposta.status, 204);
assert.equal(await resposta.text(), '');
```

**6. Erro se lê em `corpo.erro.codigo`.**

Nunca em `corpo.codigo`, nunca comparando a mensagem literal — mensagem muda, código não.

| Situação | status | codigo |
|---|---|---|
| campo obrigatório ou tipo errado | 422 | `DADOS_INVALIDOS` |
| identificador que não existe | 404 | `NAO_ENCONTRADO` |
| duplicidade / regra de estado | 409 | `CONFLITO` |
| caminho que nenhuma rota casa | 404 | `ROTA_NAO_ENCONTRADA` |
| corpo que não é JSON | 400 | `JSON_INVALIDO` |

**7. Identificador se verifica por formato, não por valor.**

```js
assert.match(corpo.id, /^lei_[0-9a-f]{8}$/);
```

Prefixo do recurso, `_`, 8 hexadecimais. Para o 404, invente um id **no formato**:
`/leitores/lei_00000000`.

## Cobertura mínima de um recurso

```
1. lista começa vazia                         200 e []
2. cria                                       201, id no formato, criadoEm presente
3. cada campo obrigatório vazio                422 DADOS_INVALIDOS (um caso por campo)
4. campo com tipo errado                       422 DADOS_INVALIDOS
5. busca por id                                200 com o registro
6. busca de id inexistente                     404 NAO_ENCONTRADO
7. filtro de consulta, se o controlador lê     lista só o que casa
8. PUT                                         200, e id + criadoEm iguais aos da criação
9. DELETE                                      204 sem corpo, e GET seguinte dá 404
10. rota que não existe                        404 ROTA_NAO_ENCONTRADA
```

O caso 8 é o que pega `atualizar` montado do zero, sem `...atual`. Não pule:

```js
assert.equal(atualizado.id, criado.id);
assert.equal(atualizado.criadoEm, criado.criadoEm);
```

## Rodar

```bash
npm test
node --test verificacoes/leitores.spec.js
node --test verificacoes/leitores.spec.js --test-name-pattern "remove"
```

## Checklist

```
1. listen(0) e base montada depois do listen
2. after fecha o servidor
3. beforeEach chama o reiniciar do repositório certo
4. helper de criação com ...dados por último, devolve { resposta, corpo }
5. 204 conferido com text() === '', nunca json()
6. erro conferido em corpo.erro.codigo, nunca pela mensagem
7. id conferido por regex de formato
8. PUT confere id e criadoEm preservados
9. os dez casos da cobertura mínima
10. npm test verde por inteiro, zero dependência nova
```
