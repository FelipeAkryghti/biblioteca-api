---
name: revisar-camadas
description: Audita se o código da Biblioteca API respeita as camadas, o contrato de erro e os status permitidos — as violações que o `npm test` não pega. Use quando pedirem para revisar, auditar ou conferir o padrão do projeto, e depois de criar ou alterar um recurso, por exemplo "revise o recurso de editoras", "está seguindo a arquitetura?", "confere se ficou no padrão".
---

# Auditoria de camadas da Biblioteca API

Estas violações passam no `npm test`. Por isso precisam de revisão explícita.

Fluxo permitido, uma seta por camada, sem pular:

```
servidor.js -> rotas -> controladores -> servicos -> repositorios
                                             \-> comum/erros.js
```

## As nove violações

**1. `try/catch` no controlador.**

```bash
grep -rn "try\|catch" src/controladores/
```

Qualquer resultado é erro. O serviço lança, `criarServidor()` captura, `enviarErro`
traduz. Um `catch` no meio engole o `ErroDominio` e vira 500 — ou pior, 200 com corpo torto.

**2. Escrita crua em `res` fora de `src/comum/respostas.js`.**

```bash
grep -rn "res\.writeHead\|res\.end\|res\.setHeader\|writeHead" src/controladores/ src/servicos/ src/rotas/
```

Zero resultados. Só `enviarJson` e `enviarErro`.

**3. Controlador importando repositório.**

```bash
grep -rn "repositorios/" src/controladores/
```

Zero. Controlador só conhece o seu serviço e `respostas.js`.

**4. Validação fora do serviço.**

```bash
grep -rln "dadosInvalidos\|naoEncontrado\|conflito" src/
```

Só pode listar arquivos de `src/servicos/` e o próprio `src/comum/erros.js`.
Validação em controlador ou repositório está no lugar errado, mesmo que funcione.

**5. Status fora da tabela.**

```bash
grep -rn "enviarJson(res," src/controladores/
```

Permitido: `200`, `201`, `204`, `404`, `422`, `409`. Nada de `400` ou `500` na mão —
`400 JSON_INVALIDO` é do `servidor.js` e `500` é o fallback do `enviarErro`.
Sucesso de POST é `201`. `DELETE` é exatamente `enviarJson(res, 204, null)`.

**6. `atualizar` sem `...atual`.**

```bash
grep -rn -A6 "export function atualizar" src/servicos/
```

Tem que haver `exigirExistente(id)` antes e spread do atual no `substituir`.
Sem o spread, `id` e `criadoEm` somem no PUT.

**7. Recurso registrado em um lugar só.**

```bash
grep -n "rotas" src/servidor.js
```

O `import` **e** o espalhamento em `const rotas` têm que existir para cada recurso.
Faltando um, o recurso inteiro responde 404 `ROTA_NAO_ENCONTRADA`.

**8. Identificador fabricado fora do repositório.**

```bash
grep -rn "novoIdentificador\|criadoEm" src/
```

`novoIdentificador` e `criadoEm` só aparecem em `src/repositorios/` (e em `comum/identificador.js`).
Serviço não inventa id nem data.

**9. Dependência nova.**

```bash
grep -rn "^import" src/ verificacoes/ | grep -v "node:" | grep -v "\.\./\|\./"
```

Zero. `package.json` sem `dependencies`. Verificação usa `node:test` e `fetch`, nunca supertest.

## Campo novo: o trio

Campo adicionado em `inserir` do repositório tem que aparecer também em:

```
1. CAMPOS_OBRIGATORIOS (ou a regra de tipo) do serviço
2. o objeto montado em atualizar
3. um caso 422 no .spec.js do recurso
```

Campo que entra só no repositório é aceito sem validação e some no PUT.

## Como reportar

Uma linha por achado, nada de elogio:

```
src/controladores/leitores-controlador.js:14 — try/catch engole ErroDominio — remover o bloco, deixar o serviço lançar
src/servicos/leitores-servico.js:41 — atualizar monta objeto do zero — usar { ...atual, ... }
```

Corrigir só se pedirem. Depois de corrigir, `npm test` inteiro.

## Checklist

```
1. zero try/catch em controladores
2. zero escrita crua em res fora de respostas.js
3. controlador não importa repositório
4. erros de domínio só nascem em servicos/
5. status só 200/201/204/404/422/409
6. atualizar com exigirExistente + spread do atual
7. import E espalhamento em servidor.js
8. id e criadoEm só no repositório
9. nenhuma dependência externa
10. campo novo presente em repositório, serviço, atualizar e verificação
```
