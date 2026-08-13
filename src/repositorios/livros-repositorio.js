import { novoIdentificador } from '../comum/identificador.js';

const acervo = new Map();

export function listar() {
  return [...acervo.values()];
}

export function buscarPorId(id) {
  return acervo.get(id) ?? null;
}

export function inserir(dados) {
  const livro = {
    id: novoIdentificador('liv'),
    titulo: dados.titulo,
    autor: dados.autor,
    ano: dados.ano,
    emprestado: false,
    criadoEm: new Date().toISOString(),
  };
  acervo.set(livro.id, livro);
  return livro;
}

export function substituir(id, livro) {
  acervo.set(id, livro);
  return livro;
}

export function remover(id) {
  return acervo.delete(id);
}

/** Usado apenas pelas verificações, para isolar um caso do outro. */
export function reiniciar() {
  acervo.clear();
}
