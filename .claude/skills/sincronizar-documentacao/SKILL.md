---
name: sincronizar-documentacao
description: Regenera a tabela de endpoints e os exemplos do README.md da Biblioteca API a partir das rotas realmente registradas em `src/servidor.js`. Use depois de adicionar, remover ou mudar rota, e quando pedirem para documentar endpoints ou atualizar o README, por exemplo "documenta o recurso novo", "atualiza o README", "a tabela está desatualizada".
---

# Documentação a partir das rotas reais

Documentação aqui não se escreve de memória: se lê do código. Rota que existe no
arquivo de rotas mas não foi espalhada em `servidor.js` **não é endpoint** — responde 404.

## Fonte da verdade, nesta ordem

```
1. src/servidor.js       const rotas = [...]   quais recursos estão de fato no ar
2. src/rotas/*-rotas.js   metodo + padrao       cada linha da tabela
3. src/controladores/     consulta.get('x')     os parâmetros de consulta
4. src/servicos/          CAMPOS_OBRIGATORIOS   o corpo dos exemplos curl
5. src/repositorios/      inserir()             os campos que voltam na resposta
```

Levantar tudo:

```bash
grep -n "const rotas" src/servidor.js
grep -rn "metodo:" src/rotas/
grep -rn "consulta.get" src/controladores/
grep -rn "CAMPOS_OBRIGATORIOS" src/servicos/
```

## As quatro regras

**1. Só entra na tabela o recurso espalhado em `const rotas`.**

Recurso com arquivo de rotas pronto e sem espalhamento é bug, não documentação:
aponte e pare. Não documente o que responde 404.

**2. Uma linha por objeto de rota, na ordem do array.**

O `padrao` vira caminho legível: `/^\/livros\/(?<id>[^/]+)$/` é `/livros/:id`.
Formato exato, descrição em minúscula, sem ponto final:

```markdown
| Método | Rota | Descrição |
|---|---|---|
| GET | `/livros` | lista o acervo. Aceita `?autor=` para filtrar |
| GET | `/livros/:id` | busca um livro |
```

**3. Parâmetro de consulta só existe se o controlador lê.**

`?autor=` está documentado porque `livros-controlador.js` chama `consulta.get('autor')`.
Sem essa chamada, o parâmetro é ignorado pelo servidor — não documente.

**4. `curl` de exemplo com os campos obrigatórios reais.**

Copie os nomes de `CAMPOS_OBRIGATORIOS` do serviço do recurso. Um bloco por recurso novo,
no mesmo estilo do que já está no README:

```bash
curl -X POST http://localhost:3000/editoras \
  -H "Content-Type: application/json" \
  -d '{"nome": "Companhia das Letras", "cidade": "São Paulo"}'
```

## O que não vai para o README

- `reiniciar()` — existe só para as verificações, não é endpoint.
- Endpoint planejado, "em breve", comentado ou em branch. Só o que está no ar.
- A lista de camadas e convenções internas — isso é `CLAUDE.md`.

## CLAUDE.md

Só encoste nele se **a arquitetura** mudou: camada nova, convenção de erro diferente,
regra de identificador diferente, comando de teste diferente. Endpoint novo sozinho
não muda `CLAUDE.md` — a tabela vive no README e em um lugar só.

## Conferir depois

```bash
npm run dev
```

Em outro terminal, um `curl` por linha nova da tabela. O status tem que bater com o
documentado, e o corpo do POST tem que aceitar exatamente os campos do exemplo.

## Checklist

```
1. tabela bate 1:1 com os arrays espalhados em const rotas
2. regex traduzida para /recurso/:id
3. parâmetro de consulta só se o controlador chama consulta.get
4. curl por recurso, com os campos de CAMPOS_OBRIGATORIOS
5. nada de reiniciar() nem endpoint planejado
6. CLAUDE.md intocado se só entrou endpoint
7. curl conferido contra o servidor rodando
```
