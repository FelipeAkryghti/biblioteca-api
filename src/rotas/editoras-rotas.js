import * as controlador from '../controladores/editoras-controlador.js';

export const rotasEditoras = [
  { metodo: 'GET', padrao: /^\/editoras$/, manipulador: controlador.listar },
  { metodo: 'POST', padrao: /^\/editoras$/, manipulador: controlador.criar },
];
