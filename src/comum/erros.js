export class ErroDominio extends Error {
  constructor(codigo, mensagem, status) {
    super(mensagem);
    this.name = 'ErroDominio';
    this.codigo = codigo;
    this.status = status;
  }
}

export function naoEncontrado(mensagem) {
  return new ErroDominio('NAO_ENCONTRADO', mensagem, 404);
}

export function dadosInvalidos(mensagem) {
  return new ErroDominio('DADOS_INVALIDOS', mensagem, 422);
}

export function conflito(mensagem) {
  return new ErroDominio('CONFLITO', mensagem, 409);
}
