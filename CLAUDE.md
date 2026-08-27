# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Biblioteca API: a REST API for managing a library's book collection, built as a teaching project for AI-agent-assisted development ("aulas de desenvolvimento assistido por agentes de IA"). Requires Node.js >= 20. Zero external dependencies — everything uses Node's built-in `http` module and `node:test`.

Data is stored in memory (a `Map` in the repository layer) and resets whenever the server restarts.

Code, identifiers, and comments are written in Portuguese; keep new code consistent with that convention.

## Commands

- Run the server: `npm run dev` (listens on `http://localhost:3000`; override with the `PORTA` env var)
- Run all tests: `npm test` (runs `node --test "verificacoes/**/*.spec.js"`)
- Run a single test file: `node --test verificacoes/livros.spec.js`
- Run a single test by name: `node --test verificacoes/livros.spec.js --test-name-pattern "nome do teste"`

There is no build step, linter, or bundler configured.

## Architecture

Layered request flow, each layer only calling into the one below it:

```
servidor.js (HTTP server, routing loop, body parsing)
  -> rotas/*-rotas.js (route table: method + regex path -> handler)
    -> controladores/*-controlador.js (extracts req data, calls service, sends response)
      -> servicos/*-servico.js (validation + domain rules, throws ErroDominio)
        -> repositorios/*-repositorio.js (in-memory storage, e.g. the `acervo` Map)
```

Key conventions:

- **Routing**: `servidor.js` holds a flat array of route entries (`{ metodo, padrao, manipulador }`) built from each `rotas/*-rotas.js` module. Path params come from named regex capture groups (e.g. `/^\/livros\/(?<id>[^/]+)$/`). Add a new resource by creating a `rotas/`, `controladores/`, `servicos/`, and `repositorios/` file following this same naming pattern and spreading its route array into `rotas` in `servidor.js`.
- **Errors**: Domain/business errors are thrown as `ErroDominio` (`src/comum/erros.js`) with a `codigo`, `mensagem`, and HTTP `status`. Helpers `naoEncontrado`, `dadosInvalidos`, `conflito` construct the common cases. `servidor.js` catches everything thrown by a handler and routes it through `enviarErro` — services/controllers should just `throw`, never touch `res` directly for errors. Unrecognized errors become a generic 500.
- **Responses**: Always send responses via `enviarJson`/`enviarErro` from `src/comum/respostas.js`, never write to `res` manually. A `204`/`null` body sends an empty response.
- **IDs**: Generated via `novoIdentificador(prefixo)` (`src/comum/identificador.js`), producing `prefixo_<8 hex chars>` (e.g. `liv_a1b2c3d4`).
- **Validation lives in the service layer**, not the controller or repository — see `livros-servico.js`'s `validar`/`exigirExistente` pattern for the convention to follow when adding new resources.
- **Test isolation**: repositories expose a `reiniciar()` function used only by tests (`beforeEach(() => reiniciar())`) to clear state between test cases; it's not part of the public API used by controllers/services.
- Tests in `verificacoes/` spin up a real server via `criarServidor()` on a random port (`listen(0, ...)`) and exercise it with `fetch`, rather than mocking layers.


## Regras específicas do projeto

- Validação utiliza o status HTTP: [404, 422 e 409].
- Respostas de erro seguem exatamente o formato: [Envia um json com o status, o código do erro e a mensagem do erro
].
- Identificadores são formados conforme a regra definida em `src/comum/identificador.js`. Ele tem um prefixo (liv), 4 bytes aleatórios e converte esses bytes pra um código hexadecimal, formando assim um exemplo, “liv_a1b2c3d4”.
- Os testes ficam em `verificacoes/` e seguem o padrão de nomenclatura encontrado no projeto, com sufixo .spec.js.