---
name: vinculo-entre-recursos
description: Liga um recurso a outro por identificador (livro -> editora), validando o vínculo no serviço e protegendo com 409 a remoção do lado referenciado. Use quando pedirem que um recurso pertença a, referencie, aponte para ou guarde o id de outro — "o livro tem uma editora", "o empréstimo aponta para o leitor e para o livro", "não deixe apagar editora que ainda tem livros".
---

# Vínculo entre dois recursos

Sempre há um **lado que aponta** (o livro, que ganha `editoraId`) e um **lado
apontado** (a editora). As regras dos dois lados são diferentes, e as duas metades
precisam ser feitas — vínculo só de um lado deixa apagar o que ainda está em uso.

O que já está no `CLAUDE.md` não se repete aqui.

## As cinco regras

**1. O campo chama `<recurso>Id`, no singular, e entra como campo novo.**

`editoraId`, `leitorId`, `livroId`. Ele nasce no `inserir` do repositório e precisa
entrar na lista do `atualizar` do serviço — o procedimento completo é o da skill
`campo-novo-em-recurso`. Aqui só se acrescenta a validação do vínculo.

**2. Quem valida é o serviço que aponta, chamando o SERVIÇO do outro lado.**

```js
// src/servicos/livros-servico.js
import * as editorasServico from './editoras-servico.js';   // serviço, nunca repositório
```

Importar `../repositorios/editoras-repositorio.js` daqui pula uma camada e leva
junto toda a validação que mora no serviço. Se o outro serviço ainda não expõe busca
por id (o de editoras não expõe), **crie lá** o `exigirExistente`/`buscarPorId` no
molde do `livros-servico.js`. Não contorne indo direto no repositório alheio.

**3. Id de vínculo inexistente é 422, não 404.**

O **404** é do recurso da própria rota: `GET /livros/liv_inexistente`. Um `editoraId`
que não existe chegou dentro do **corpo** — isso é dado inválido, **422**.

Como o serviço de editoras lança `naoEncontrado` (404), esse erro não pode vazar.
Traduza na fronteira:

```js
function exigirEditora(editoraId) {
  try {
    return editorasServico.buscarPorId(editoraId);
  } catch {
    throw dadosInvalidos(`Não existe editora com o identificador "${editoraId}".`);
  }
}
```

Sem essa tradução, `POST /livros` com editora errada responde 404 — como se a rota
`/livros` não existisse.

**4. Apagar o lado apontado que ainda tem dependentes é 409.**

O `remover` do serviço de editoras pergunta ao serviço de livros antes de apagar:

```js
// src/servicos/editoras-servico.js
import * as livrosServico from './livros-servico.js';

export function remover(id) {
  exigirExistente(id);
  if (livrosServico.listar({ editoraId: id }).length > 0) {
    throw conflito(`A editora "${id}" ainda tem livros vinculados.`);
  }
  repositorio.remover(id);
}
```

Isso fecha um **ciclo de import**: livros importa editoras e editoras importa livros.
Em ESM isso funciona, com duas condições que precisam ser respeitadas:

- as duas pontas exportam com `export function` (declaração é içada). Trocar por
  `export const remover = () => {}` quebra o ciclo com
  `Cannot access ... before initialization`;
- a chamada acontece em tempo de requisição, dentro da função. Nunca no topo do
  módulo, durante a carga.

**5. O spec reinicia OS DOIS repositórios.**

```js
import { reiniciar as reiniciarLivros } from '../src/repositorios/livros-repositorio.js';
import { reiniciar as reiniciarEditoras } from '../src/repositorios/editoras-repositorio.js';

beforeEach(() => {
  reiniciarLivros();
  reiniciarEditoras();
});
```

Um spec que limpa só o próprio recurso deixa livro de um caso anterior segurando a
editora do caso seguinte: o 204 esperado vira 409, e a falha muda conforme a ordem
dos casos.

Os casos a cobrir:

```
a) cria editora, cria livro com o editoraId real   -> 201
b) POST com editoraId inexistente                  -> 422 DADOS_INVALIDOS (não 404)
c) DELETE na editora que tem livro                 -> 409 CONFLITO
d) DELETE na editora sem livros                    -> 204
```

O id do vínculo sai sempre da resposta do POST anterior. Id escrito na mão
(`edi_00000000`) só serve para o caso (b).

## A ordem

```
1. campo <recurso>Id no repositório e no atualizar   (skill campo-novo-em-recurso)
2. serviço do lado apontado: buscarPorId/exigirExistente, se ainda não houver
3. serviço que aponta: exigirVinculo() traduzindo 404 -> 422, chamado em criar e atualizar
4. serviço apontado: remover() com a guarda de 409
5. spec: os dois reiniciar() e os quatro casos
6. npm test inteiro
```

## Conferência

```
1. Nenhum import de repositório de outro recurso — só serviço com serviço
2. Vínculo inválido responde 422, não 404
3. remover() do lado apontado protegido com conflito()
4. Ciclo de import só com export function, chamada dentro da função
5. beforeEach reinicia os dois repositórios
6. Ids vêm da resposta anterior, não escritos na mão
7. npm test verde por inteiro, package.json sem mudança
```
