import * as repositorio from '../repositorios/livros-repositorio.js';
import { dadosInvalidos, naoEncontrado } from '../comum/erros.js';

const CAMPOS_OBRIGATORIOS = ['titulo', 'autor', 'ano'];

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

function exigirExistente(id) {
  const livro = repositorio.buscarPorId(id);
  if (!livro) {
    throw naoEncontrado(`Não existe livro com o identificador "${id}".`);
  }
  return livro;
}

export function listar({ autor } = {}) {
  const livros = repositorio.listar();
  if (!autor) return livros;
  const procurado = autor.toLowerCase();
  return livros.filter((livro) => livro.autor.toLowerCase().includes(procurado));
}

export function buscarPorId(id) {
  return exigirExistente(id);
}

export function criar(dados) {
  validar(dados);
  return repositorio.inserir(dados);
}

export function atualizar(id, dados) {
  const atual = exigirExistente(id);
  validar(dados);
  return repositorio.substituir(id, {
    ...atual,
    titulo: dados.titulo,
    autor: dados.autor,
    ano: dados.ano,
  });
}

export function remover(id) {
  exigirExistente(id);
  repositorio.remover(id);
}
