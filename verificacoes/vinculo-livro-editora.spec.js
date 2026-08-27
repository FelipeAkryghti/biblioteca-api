import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar as reiniciarLivros } from '../src/repositorios/livros-repositorio.js';
import { reiniciar as reiniciarEditoras } from '../src/repositorios/editoras-repositorio.js';

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => {
  reiniciarLivros();
  reiniciarEditoras();
});

async function criarEditora(dados = {}) {
  const resposta = await fetch(`${base}/editoras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Companhia das Letras', cidade: 'São Paulo', ...dados }),
  });
  return { resposta, corpo: await resposta.json() };
}

async function criarLivro(dados = {}) {
  const resposta = await fetch(`${base}/livros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      ano: 1899,
      isbn: '978-85-359-0277-5',
      ...dados,
    }),
  });
  return { resposta, corpo: await resposta.json() };
}

describe('vínculo livro -> editora', () => {
  it('cria livro apontando para uma editora existente', async () => {
    const { corpo: editora } = await criarEditora();
    const { resposta, corpo: livro } = await criarLivro({ editoraId: editora.id });

    assert.equal(resposta.status, 201);
    assert.equal(livro.editoraId, editora.id);
  });

  it('recusa editoraId inexistente com 422, não 404', async () => {
    const { resposta, corpo } = await criarLivro({ editoraId: 'edi_00000000' });

    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa apagar editora que ainda tem livros com 409', async () => {
    const { corpo: editora } = await criarEditora();
    await criarLivro({ editoraId: editora.id });

    const resposta = await fetch(`${base}/editoras/${editora.id}`, { method: 'DELETE' });
    assert.equal(resposta.status, 409);
    assert.equal((await resposta.json()).erro.codigo, 'CONFLITO');
  });

  it('apaga editora sem livros vinculados com 204', async () => {
    const { corpo: editora } = await criarEditora();

    const resposta = await fetch(`${base}/editoras/${editora.id}`, { method: 'DELETE' });
    assert.equal(resposta.status, 204);
    assert.equal(await resposta.text(), '');

    const conferencia = await fetch(`${base}/editoras/${editora.id}`);
    assert.equal(conferencia.status, 404);
  });

  it('altera o editoraId pelo PUT', async () => {
    const { corpo: primeira } = await criarEditora();
    const { corpo: segunda } = await criarEditora({ nome: 'Editora Rocco', cidade: 'Rio de Janeiro' });
    const { corpo: livro } = await criarLivro({ editoraId: primeira.id });

    const resposta = await fetch(`${base}/livros/${livro.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Dom Casmurro',
        autor: 'Machado de Assis',
        ano: 1899,
        isbn: '978-85-359-0277-5',
        editoraId: segunda.id,
      }),
    });

    assert.equal(resposta.status, 200);
    assert.equal((await resposta.json()).editoraId, segunda.id);
  });
});
