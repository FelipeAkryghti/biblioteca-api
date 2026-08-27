import { novoIdentificador } from '../comum/identificador.js';

const editoras = new Map();

export function listar() {
  return [...editoras.values()];
}

export function buscarPorId(id) {
  return editoras.get(id) ?? null;
}

export function inserir(dados) {
  const editora = {
    id: novoIdentificador('edi'),
    nome: dados.nome,
    cidade: dados.cidade,
    criadoEm: new Date().toISOString(),
  };
  editoras.set(editora.id, editora);
  return editora;
}

export function remover(id) {
  return editoras.delete(id);
}

/** Usado apenas pelas verificações, para isolar um caso do outro. */
export function reiniciar() {
  editoras.clear();
}
