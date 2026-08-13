import * as controlador from '../controladores/livros-controlador.js';

export const rotasLivros = [
  { metodo: 'GET', padrao: /^\/livros$/, manipulador: controlador.listar },
  { metodo: 'GET', padrao: /^\/livros\/(?<id>[^/]+)$/, manipulador: controlador.buscarPorId },
  { metodo: 'POST', padrao: /^\/livros$/, manipulador: controlador.criar },
  { metodo: 'PUT', padrao: /^\/livros\/(?<id>[^/]+)$/, manipulador: controlador.atualizar },
  { metodo: 'DELETE', padrao: /^\/livros\/(?<id>[^/]+)$/, manipulador: controlador.remover },
];
