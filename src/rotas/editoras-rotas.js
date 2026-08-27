import * as controlador from '../controladores/editoras-controlador.js';

export const rotasEditoras = [
  { metodo: 'GET', padrao: /^\/editoras$/, manipulador: controlador.listar },
  { metodo: 'GET', padrao: /^\/editoras\/(?<id>[^/]+)$/, manipulador: controlador.buscarPorId },
  { metodo: 'POST', padrao: /^\/editoras$/, manipulador: controlador.criar },
  { metodo: 'DELETE', padrao: /^\/editoras\/(?<id>[^/]+)$/, manipulador: controlador.remover },
];
