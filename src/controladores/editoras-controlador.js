import * as servico from '../servicos/editoras-servico.js';
import { enviarJson } from '../comum/respostas.js';

export function listar({ res }) {
  enviarJson(res, 200, servico.listar());
}

export function buscarPorId({ res, parametros }) {
  enviarJson(res, 200, servico.buscarPorId(parametros.id));
}

export function criar({ res, corpo }) {
  enviarJson(res, 201, servico.criar(corpo));
}

export function remover({ res, parametros }) {
  servico.remover(parametros.id);
  enviarJson(res, 204, null);
}
