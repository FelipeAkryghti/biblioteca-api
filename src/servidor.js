import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

import { rotasLivros } from './rotas/livros-rotas.js';
import { enviarErro, enviarJson } from './comum/respostas.js';
import { ErroDominio } from './comum/erros.js';

const rotas = [...rotasLivros];

const METODOS_COM_CORPO = new Set(['POST', 'PUT', 'PATCH']);

async function lerCorpo(req) {
  const pedacos = [];
  for await (const pedaco of req) pedacos.push(pedaco);
  if (pedacos.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(pedacos).toString('utf8'));
  } catch {
    throw new ErroDominio('JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.', 400);
  }
}

export function criarServidor() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    for (const rota of rotas) {
      if (rota.metodo !== req.method) continue;
      const encontrado = rota.padrao.exec(url.pathname);
      if (!encontrado) continue;

      try {
        const corpo = METODOS_COM_CORPO.has(req.method) ? await lerCorpo(req) : {};
        await rota.manipulador({
          res,
          parametros: encontrado.groups ?? {},
          corpo,
          consulta: url.searchParams,
        });
      } catch (erro) {
        enviarErro(res, erro);
      }
      return;
    }

    enviarJson(res, 404, {
      erro: {
        codigo: 'ROTA_NAO_ENCONTRADA',
        mensagem: `Não existe ${req.method} ${url.pathname}.`,
      },
    });
  });
}

const executadoDiretamente =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (executadoDiretamente) {
  const porta = Number(process.env.PORTA ?? 3000);
  criarServidor().listen(porta, () => {
    console.log(`Biblioteca API ouvindo em http://localhost:${porta}`);
  });
}
