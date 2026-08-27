import * as repositorio from '../repositorios/editoras-repositorio.js';
import { dadosInvalidos } from '../comum/erros.js';

const CAMPOS_OBRIGATORIOS = ['nome', 'cidade'];

function validar(dados) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || valor === '') {
      throw dadosInvalidos(`O campo "${campo}" é obrigatório.`);
    }
  }
}

export function listar() {
  return repositorio.listar();
}

export function criar(dados) {
  validar(dados);
  return repositorio.inserir(dados);
}
