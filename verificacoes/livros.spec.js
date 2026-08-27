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

let sequenciaIsbn = 0;

function proximoIsbn() {
  sequenciaIsbn += 1;
  return `978-0-00-${String(sequenciaIsbn).padStart(6, '0')}-0`;
}

async function criarLivro(dados = {}) {
  const resposta = await fetch(`${base}/livros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: 'Dom Casmurro', autor: 'Machado de Assis', ano: 1899, isbn: proximoIsbn(), ...dados }),
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
    const { resposta, corpo } = await criarLivro({ isbn: '978-85-359-0277-5' });
    assert.equal(resposta.status, 201);
    assert.match(corpo.id, /^liv_[0-9a-f]{8}$/);
    assert.equal(corpo.emprestado, false);
    assert.equal(corpo.isbn, '978-85-359-0277-5');
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

  it('recusa livro sem isbn com 422', async () => {
    const { resposta, corpo } = await criarLivro({ isbn: '' });
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
      body: JSON.stringify({ titulo: 'Quincas Borba', autor: 'Machado de Assis', ano: 1891, isbn: '978-85-359-0277-5' }),
    });
    assert.equal(resposta.status, 200);
    const atualizado = await resposta.json();
    assert.equal(atualizado.titulo, 'Quincas Borba');
    assert.equal(atualizado.id, criado.id);
    assert.equal(atualizado.criadoEm, criado.criadoEm);
  });

  it('altera o isbn pelo PUT', async () => {
    const { corpo: criado } = await criarLivro();
    const resposta = await fetch(`${base}/livros/${criado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Dom Casmurro',
        autor: 'Machado de Assis',
        ano: 1899,
        isbn: '978-85-359-9999-9',
      }),
    });
    assert.equal(resposta.status, 200);
    assert.equal((await resposta.json()).isbn, '978-85-359-9999-9');
  });

  it('recusa POST com isbn ja cadastrado com 409', async () => {
    await criarLivro({ isbn: '978-85-359-0277-5' });
    const { resposta, corpo } = await criarLivro({
      titulo: 'Outro livro',
      isbn: '978-85-359-0277-5',
    });
    assert.equal(resposta.status, 409);
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('trata o isbn ignorando maiusculas e espacos nas pontas', async () => {
    await criarLivro({ isbn: '978-85-359-0277-x' });
    const { resposta, corpo } = await criarLivro({
      titulo: 'Outro livro',
      isbn: '  978-85-359-0277-X  ',
    });
    assert.equal(resposta.status, 409);
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('recusa PUT que troca o isbn para o de outro livro com 409', async () => {
    const { corpo: primeiro } = await criarLivro({ isbn: '978-85-359-0001-1' });
    const { corpo: segundo } = await criarLivro({
      titulo: 'Vidas Secas',
      isbn: '978-85-359-0002-2',
    });
    assert.equal(primeiro.isbn, '978-85-359-0001-1');

    const resposta = await fetch(`${base}/livros/${segundo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Vidas Secas',
        autor: 'Graciliano Ramos',
        ano: 1938,
        isbn: '978-85-359-0001-1',
      }),
    });
    assert.equal(resposta.status, 409);
    assert.equal((await resposta.json()).erro.codigo, 'CONFLITO');
  });

  it('aceita PUT que mantem o proprio isbn com 200', async () => {
    const { corpo: criado } = await criarLivro({ isbn: '978-85-359-0003-3' });
    const resposta = await fetch(`${base}/livros/${criado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Titulo novo',
        autor: 'Machado de Assis',
        ano: 1899,
        isbn: '978-85-359-0003-3',
      }),
    });
    assert.equal(resposta.status, 200);
    const atualizado = await resposta.json();
    assert.equal(atualizado.titulo, 'Titulo novo');
    assert.equal(atualizado.isbn, '978-85-359-0003-3');
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
