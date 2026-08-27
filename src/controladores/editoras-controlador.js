import * as servico from '../servicos/editoras-servico.js';
import { enviarJson } from '../comum/respostas.js';

export function listar({ res }) {
  enviarJson(res, 200, servico.listar());
}

export function criar({ res, corpo }) {
  enviarJson(res, 201, servico.criar(corpo));
}
