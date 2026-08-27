import * as repositorio from '../repositorios/livros-repositorio.js';
import * as editorasServico from './editoras-servico.js';
import { conflito, dadosInvalidos, naoEncontrado } from '../comum/erros.js';

const CAMPOS_OBRIGATORIOS = ['titulo', 'autor', 'ano', 'isbn'];

function validar(dados) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || valor === '') {
      throw dadosInvalidos(`O campo "${campo}" é obrigatório.`);
    }
  }
  if (!Number.isInteger(dados.ano)) {
    throw dadosInvalidos('O campo "ano" precisa ser um número inteiro.');
  }
}

function normalizar(valor) {
  return String(valor).trim().toLowerCase();
}

function exigirUnico(campo, valor, idIgnorado = null) {
  const procurado = normalizar(valor);
  const colisao = repositorio
    .listar()
    .find((item) => item.id !== idIgnorado && normalizar(item[campo]) === procurado);

  if (colisao) {
    throw conflito(`Já existe livro com o ${campo} "${valor}".`);
  }
}

function exigirVinculo(dados) {
  const { editoraId } = dados;
  if (editoraId === undefined || editoraId === null || editoraId === '') return;
  try {
    editorasServico.buscarPorId(editoraId);
  } catch {
    throw dadosInvalidos(`Não existe editora com o identificador "${editoraId}".`);
  }
}

function exigirExistente(id) {
  const livro = repositorio.buscarPorId(id);
  if (!livro) {
    throw naoEncontrado(`Não existe livro com o identificador "${id}".`);
  }
  return livro;
}

export function listar({ autor, editoraId } = {}) {
  let livros = repositorio.listar();
  if (editoraId) livros = livros.filter((livro) => livro.editoraId === editoraId);
  if (!autor) return livros;
  const procurado = autor.toLowerCase();
  return livros.filter((livro) => livro.autor.toLowerCase().includes(procurado));
}

export function buscarPorId(id) {
  return exigirExistente(id);
}

export function criar(dados) {
  validar(dados);
  exigirVinculo(dados);
  exigirUnico('isbn', dados.isbn);
  return repositorio.inserir(dados);
}

export function atualizar(id, dados) {
  const atual = exigirExistente(id);
  validar(dados);
  exigirVinculo(dados);
  exigirUnico('isbn', dados.isbn, id);
  return repositorio.substituir(id, {
    ...atual,
    titulo: dados.titulo,
    autor: dados.autor,
    ano: dados.ano,
    isbn: dados.isbn,
    editoraId: dados.editoraId ?? null,
  });
}

export function remover(id) {
  exigirExistente(id);
  repositorio.remover(id);
}
