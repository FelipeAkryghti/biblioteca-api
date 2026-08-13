import { randomBytes } from 'node:crypto';

export function novoIdentificador(prefixo) {
  return `${prefixo}_${randomBytes(4).toString('hex')}`;
}
