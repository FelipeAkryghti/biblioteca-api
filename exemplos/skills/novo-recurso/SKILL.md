---
name: novo-recurso
description: Cria um recurso REST completo na Biblioteca API — repositório, serviço, controlador, rotas e verificações — e registra no servidor. Use quando pedirem para adicionar um recurso, uma entidade ou um conjunto de endpoints novo, por exemplo "adicione autores", "crie o CRUD de editoras", "quero um recurso de leitores".
---

# Recurso novo na Biblioteca API

Espelhe os arquivos de `livros` — eles são o padrão. O que não dá para copiar de lá
são as seis regras abaixo. Elas são o motivo desta skill existir.

O que já está no `AGENTS.md` não se repete aqui.

## As seis regras

**1. Rota não é `Router`. É objeto num array.**

```js
{ metodo: 'GET', padrao: /^\/leitores\/(?<id>[^/]+)$/, manipulador: controlador.buscarPorId }
```

O `padrao` é regex, e o grupo nomeado `(?<id>...)` é de onde sai `parametros.id`.

**2. O manipulador recebe UM objeto, não `(req, res)`.**

```js
export function buscarPorId({ res, parametros }) { ... }
export function listar({ res, consulta }) { ... }   // consulta.get('nome')
export function criar({ res, corpo }) { ... }       // corpo já vem convertido
```

**3. O controlador não tem `try/catch`. Nenhum.**

O serviço **lança** (`dadosInvalidos`, `naoEncontrado`, de `src/comum/erros.js`) e o
`criarServidor()` captura e traduz. Try/catch no controlador quebra esse caminho.

**4. DELETE é exatamente isto:**

```js
servico.remover(parametros.id);
enviarJson(res, 204, null);
```

O terceiro argumento é `null`. Não é `res.end()` nem 200 com mensagem de sucesso.

**5. `atualizar` preserva o que o cliente não manda, com spread do atual.**

```js
const atual = exigirExistente(id);
return repositorio.substituir(id, { ...atual, nome, email, anoDeNascimento });
```

Sem o `...atual` você perde `id` e `criadoEm`. Não monte o objeto do zero.

**6. Registrar em `src/servidor.js` — DOIS lugares.**

```js
import { rotasLeitores } from './rotas/leitores-rotas.js';   // 1
const rotas = [...rotasLivros, ...rotasLeitores];            // 2
```

Se esquecer: **tudo** responde 404 `ROTA_NAO_ENCONTRADA` e parece que o recurso
inteiro está errado, quando falta uma linha.

## A ordem

```
1. src/repositorios/<recursos>-repositorio.js    Map + reiniciar()
2. src/servicos/<recursos>-servico.js            validação mora aqui
3. src/controladores/<recursos>-controlador.js   cinco funções finas
4. src/rotas/<recursos>-rotas.js                 array de cinco objetos
5. src/servidor.js                               regra 6
6. verificacoes/<recursos>.spec.js               espelhe livros.spec.js
7. npm test
```

## Checklist

```
1. Rota é objeto com padrao regex e grupo nomeado (?<id>...)
2. Manipuladores recebem { res, parametros, corpo, consulta }
3. Zero try/catch no controlador
4. DELETE usa enviarJson(res, 204, null)
5. atualizar faz spread do atual
6. Import E espalhamento em src/servidor.js
7. npm test verde por inteiro, package.json intacto
```
