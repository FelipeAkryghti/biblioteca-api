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

  it('lista as editoras cadastradas', async () => {
    await criarEditora();
    await criarEditora({ nome: 'Editora Rocco', cidade: 'Rio de Janeiro' });

    const resposta = await fetch(`${base}/editoras`);
    const editoras = await resposta.json();
    assert.equal(editoras.length, 2);
  });
});
