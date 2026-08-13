import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar } from '../src/repositorios/livros-repositorio.js';

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => reiniciar());

async function criarLivro(dados = {}) {
  const resposta = await fetch(`${base}/livros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: 'Dom Casmurro', autor: 'Machado de Assis', ano: 1899, ...dados }),
  });
  return { resposta, corpo: await resposta.json() };
}

describe('livros', () => {
  it('começa com o acervo vazio', async () => {
    const resposta = await fetch(`${base}/livros`);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), []);
  });

  it('cria um livro e devolve 201 com identificador prefixado', async () => {
    const { resposta, corpo } = await criarLivro();
    assert.equal(resposta.status, 201);
    assert.match(corpo.id, /^liv_[0-9a-f]{8}$/);
    assert.equal(corpo.emprestado, false);
    assert.ok(corpo.criadoEm);
  });

  it('recusa livro sem título com 422', async () => {
    const { resposta, corpo } = await criarLivro({ titulo: '' });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa ano que não é inteiro com 422', async () => {
    const { resposta, corpo } = await criarLivro({ ano: 'mil e novecentos' });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('busca um livro pelo identificador', async () => {
    const { corpo: criado } = await criarLivro();
    const resposta = await fetch(`${base}/livros/${criado.id}`);
    assert.equal(resposta.status, 200);
    assert.equal((await resposta.json()).titulo, 'Dom Casmurro');
  });

  it('devolve 404 para identificador inexistente', async () => {
    const resposta = await fetch(`${base}/livros/liv_00000000`);
    assert.equal(resposta.status, 404);
    assert.equal((await resposta.json()).erro.codigo, 'NAO_ENCONTRADO');
  });

  it('filtra a listagem por autor', async () => {
    await criarLivro();
    await criarLivro({ titulo: 'Vidas Secas', autor: 'Graciliano Ramos', ano: 1938 });

    const resposta = await fetch(`${base}/livros?autor=graciliano`);
    const livros = await resposta.json();
    assert.equal(livros.length, 1);
    assert.equal(livros[0].titulo, 'Vidas Secas');
  });

  it('atualiza um livro existente', async () => {
    const { corpo: criado } = await criarLivro();
    const resposta = await fetch(`${base}/livros/${criado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Quincas Borba', autor: 'Machado de Assis', ano: 1891 }),
    });
    assert.equal(resposta.status, 200);
    const atualizado = await resposta.json();
    assert.equal(atualizado.titulo, 'Quincas Borba');
    assert.equal(atualizado.id, criado.id);
    assert.equal(atualizado.criadoEm, criado.criadoEm);
  });

  it('remove um livro e devolve 204 sem corpo', async () => {
    const { corpo: criado } = await criarLivro();
    const resposta = await fetch(`${base}/livros/${criado.id}`, { method: 'DELETE' });
    assert.equal(resposta.status, 204);
    assert.equal(await resposta.text(), '');

    const conferencia = await fetch(`${base}/livros/${criado.id}`);
    assert.equal(conferencia.status, 404);
  });

  it('devolve 404 com código próprio para rota inexistente', async () => {
    const resposta = await fetch(`${base}/revistas`);
    assert.equal(resposta.status, 404);
    assert.equal((await resposta.json()).erro.codigo, 'ROTA_NAO_ENCONTRADA');
  });
});
