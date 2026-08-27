import * as repositorio from '../repositorios/editoras-repositorio.js';
import * as livrosServico from './livros-servico.js';
import { conflito, dadosInvalidos, naoEncontrado } from '../comum/erros.js';

const CAMPOS_OBRIGATORIOS = ['nome', 'cidade'];

function validar(dados) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || valor === '') {
      throw dadosInvalidos(`O campo "${campo}" é obrigatório.`);
    }
  }
}

function exigirExistente(id) {
  const editora = repositorio.buscarPorId(id);
  if (!editora) {
    throw naoEncontrado(`Não existe editora com o identificador "${id}".`);
  }
  return editora;
}

export function listar() {
  return repositorio.listar();
}

export function buscarPorId(id) {
  return exigirExistente(id);
}

export function criar(dados) {
  validar(dados);
  return repositorio.inserir(dados);
}

export function remover(id) {
  exigirExistente(id);
  if (livrosServico.listar({ editoraId: id }).length > 0) {
    throw conflito(`A editora "${id}" ainda tem livros vinculados.`);
  }
  repositorio.remover(id);
}
