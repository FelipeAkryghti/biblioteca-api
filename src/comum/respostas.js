import { ErroDominio } from './erros.js';

export function enviarJson(res, status, corpo) {
  if (status === 204 || corpo === null) {
    res.writeHead(204);
    res.end();
    return;
  }
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
  });
  res.end(texto);
}

export function enviarErro(res, erro) {
  if (erro instanceof ErroDominio) {
    enviarJson(res, erro.status, {
      erro: { codigo: erro.codigo, mensagem: erro.message },
    });
    return;
  }
  enviarJson(res, 500, {
    erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro inesperado no servidor.' },
  });
}
