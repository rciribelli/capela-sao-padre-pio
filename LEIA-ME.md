# Capela dedicada a São Padre Pio — landing page

Página de apresentação e arrecadação para a construção da Capela dedicada a São Padre Pio,
no local da sede da Obra Refúgio de Maria (Av. José Leon, 2038, Fortaleza–CE).

## O que publicar

- **`index.html`** + a pasta **`fonte/`**: o site. As imagens e o QR Code Pix estão embutidos no `index.html`. O passeio 3D carrega `fonte/tour3d.js` e a cópia local do three.js (`fonte/vendor/three`). Por isso o passeio só funciona quando o site é servido por um servidor (GitHub Pages ou `servidor.js`), e não abrindo o arquivo com dois cliques.
- **`video/`**: o passeio 3D em 1080p, numa versão leve para WhatsApp e numa vertical para Status e Reels. Cada uma existe com legendas e sem legendas (`-sem-legenda`). A versão sem legenda mantém só as cartelas de abertura e de encerramento. No site, o passeio 3D aparece sem legendas.

## Site no ar

- Endereço provisório (GitHub Pages): https://capela.obrarefugiodemaria.com.br/
- O GitHub Pages publica o `index.html` da raiz do branch `main`. Cada `git push` atualiza o site em 1 ou 2 minutos.
- `compartilhar.jpg` é a imagem que aparece quando o link é compartilhado no WhatsApp e nas redes sociais.

### Para usar o domínio próprio

1. No provedor do domínio, crie um registro CNAME apontando para `rciribelli.github.io`. Se for um domínio raiz, crie registros A para os IPs do GitHub Pages.
2. No GitHub, abra Settings › Pages › Custom domain, informe o domínio e marque "Enforce HTTPS".
3. Em `fonte/index.html`, troque o endereço provisório nas tags `og:url`, `og:image` e `canonical`. Depois rode `node fonte/ferramentas/montar.js` e faça o push.

## Como editar

Os arquivos-fonte ficam em `fonte/`:

- `fonte/index.html`: textos e layout da página
- `fonte/tour3d.js`: o modelo 3D, que segue a imagem de referência da fachada (`fonte/img/fachada.webp`). Tem frontão com porta dupla em arco, placa "Capela de São Padre Pio · Comunidade Católica", medalhão com o retrato, campanário com sino à direita, cerca de ripas, jardim e caminho de pedras. O telhado é de telha colonial e, por dentro, tem forro e tesouras de madeira. A nave mede 8 × 15 m, com bancos voltados para o altar em duas alas e corredor central. O corredor de 1 m fica à esquerda, segue ao lado da sede até o fundo e passa pela lojinha.
- `fonte/esculturas.js`: o Cristo crucificado esculpido em 3D.
- `fonte/vendor/three/`: a cópia local do three.js 0.169.0 (licença MIT), só com os arquivos usados. Cada um foi conferido e é idêntico ao do CDN.
- `fonte/img/`: as imagens. A fachada e o corredor já estão espelhados, com o corredor à esquerda. As fotos `interior.webp` e `lojinha.webp` foram renderizadas a partir do modelo 3D.

## Créditos das imagens de domínio público

Estas imagens são de domínio público, via Wikimedia Commons:

- **São Padre Pio**: "Padre Pio portraitFXD.jpg" (origem: vatican.va). Aparece no quadro do passeio 3D, no letreiro da fachada e nas fotos do altar e da fachada.
- **Nossa Senhora de Fátima**: "Our Lady of Fatima Statue.jpg", da Conferencia Episcopal Española. Foi recortada e aplicada no passeio 3D.

Depois de editar, gere o `index.html` final:

```
node fonte/ferramentas/montar.js
```

Para ver a página e o passeio 3D localmente, rode `node fonte/ferramentas/servidor.js` e abra
http://localhost:5178/.

Para regravar os quadros do vídeo, abra
http://localhost:5178/ferramentas/gravar.html?gravar=1&duplo=1&w=1920&h=1080
(`duplo=1` grava ao mesmo tempo os quadros com e sem legenda).
Os quadros vão para `render/quadros/` (apague a pasta depois de gerar o MP4 com o ffmpeg).

## Segurança

- **CSP:** o `montar.js` coloca no `index.html` uma política de segurança (Content-Security-Policy). Ela só permite scripts do próprio site e os 3 scripts da página, identificados por hash. Um script injetado ou alterado é bloqueado pelo navegador, então ninguém consegue trocar o Pix por script.
- **Scripts de terceiros:** o único JavaScript de fora é o Meta Pixel (id 1105777588506985), liberado na CSP só para connect.facebook.net e www.facebook.com. Ele envia o PageView normalmente. O script da Meta também tenta falar com servidores extras em nuvem (*.on.aws, *.run.app), e a CSP bloqueia isso de propósito. As outras origens externas são as fontes do Google (só CSS e arquivos de fonte).
- **Privacidade:** como o Meta Pixel usa cookies, o ideal é ter um aviso de privacidade/cookies (LGPD).
- **Sempre use o montar.js:** depois de editar `fonte/index.html`, rode `node fonte/ferramentas/montar.js`. Ele recalcula os hashes. Se o `index.html` for editado à mão, os scripts alterados param de funcionar até rodar o montar.js de novo.
- **Conta GitHub:** quem controla a conta controla o Pix publicado. Mantenha a verificação em duas etapas ativa.
- **Repositório:** a wiki e os Projects estão desativados, para ninguém publicar conteúdo (como um Pix falso) dentro do repositório. Os commits usam o e-mail oculto do GitHub.

## Dados do Pix (conferidos no QR Code)

- Favorecido: Associação Obra Refúgio de Maria (no QR aparece abreviado: "ASSOCIACAO OBRA REFUGIO D")
- CNPJ: 60.638.183/0001-05
- Instituição: Sicredi Veredas Cooperativa de Crédito
- Chave Pix do QR: celular +55 85 98445-2025
- Mensagem: "Futura Capela Sao Padre Pio - ORM"
- Identificador (txid): PadrePio
- Valor: livre (o doador digita)

O botão "Copiar código Pix" usa exatamente o mesmo código do QR Code. O CRC foi validado.
