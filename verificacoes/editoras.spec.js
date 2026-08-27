import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar } from '../src/repositorios/editoras-repositorio.js';

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => reiniciar());

async function criarEditora(dados = {}) {
  const resposta = await fetch(`${base}/editoras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Companhia das Letras', cidade: 'São Paulo', ...dados }),
  });
  return { resposta, corpo: await resposta.json() };
}

describe('editoras', () => {
  it('começa com a lista vazia', async () => {
    const resposta = await fetch(`${base}/editoras`);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), []);
  });

  it('cadastra uma editora e devolve 201 com identificador prefixado', async () => {
    const { resposta, corpo } = await criarEditora();
    assert.equal(resposta.status, 201);
    assert.match(corpo.id, /^edi_[0-9a-f]{8}$/);
    assert.equal(corpo.nome, 'Companhia das Letras');
    assert.equal(corpo.cidade, 'São Paulo');
    assert.ok(corpo.criadoEm);
  });

  it('registra criadoEm em formato ISO 8601', async () => {
    const { corpo } = await criarEditora();
    assert.equal(new Date(corpo.criadoEm).toISOString(), corpo.criadoEm);
  });

  it('gera identificadores distintos para cada editora', async () => {
    const { corpo: primeira } = await criarEditora();
    const { corpo: segunda } = await criarEditora({ nome: 'Editora Rocco', cidade: 'Rio de Janeiro' });
    assert.notEqual(primeira.id, segunda.id);
  });

  it('guarda apenas os campos previstos da editora', async () => {
    const { corpo } = await criarEditora({ site: 'https://exemplo.com.br' });
    assert.deepEqual(Object.keys(corpo).sort(), ['cidade', 'criadoEm', 'id', 'nome']);
  });

  it('recusa editora sem nome com 422', async () => {
    const { resposta, corpo } = await criarEditora({ nome: '' });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa editora sem cidade com 422', async () => {
    const { resposta, corpo } = await criarEditora({ cidade: '' });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa editora com o campo nome ausente com 422', async () => {
    const { resposta, corpo } = await criarEditora({ nome: undefined });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa editora com cidade nula com 422', async () => {
    const { resposta, corpo } = await criarEditora({ cidade: null });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa corpo vazio com 422', async () => {
    const resposta = await fetch(`${base}/editoras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(resposta.status, 422);
    assert.equal((await resposta.json()).erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa corpo que não é JSON com 400', async () => {
    const resposta = await fetch(`${base}/editoras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ nome: ',
    });
    assert.equal(resposta.status, 400);
    assert.equal((await resposta.json()).erro.codigo, 'JSON_INVALIDO');
  });

  it('não cadastra a editora quando a validação falha', async () => {
    await criarEditora({ nome: '' });
    const resposta = await fetch(`${base}/editoras`);
    assert.deepEqual(await resposta.json(), []);
  });

  it('lista as editoras cadastradas', async () => {
    await criarEditora();
    await criarEditora({ nome: 'Editora Rocco', cidade: 'Rio de Janeiro' });

    const resposta = await fetch(`${base}/editoras`);
    const editoras = await resposta.json();
    assert.equal(editoras.length, 2);
  });

  it('devolve na listagem a mesma editora que foi cadastrada', async () => {
    const { corpo: criada } = await criarEditora();
    const resposta = await fetch(`${base}/editoras`);
    assert.deepEqual(await resposta.json(), [criada]);
  });

  it('devolve 404 com código próprio para busca de editora por identificador', async () => {
    const resposta = await fetch(`${base}/editoras/edi_00000000`);
    assert.equal(resposta.status, 404);
    assert.equal((await resposta.json()).erro.codigo, 'ROTA_NAO_ENCONTRADA');
  });

  it('devolve 404 com código próprio para método não registrado no recurso', async () => {
    const resposta = await fetch(`${base}/editoras`, { method: 'DELETE' });
    assert.equal(resposta.status, 404);
    assert.equal((await resposta.json()).erro.codigo, 'ROTA_NAO_ENCONTRADA');
  });
});
