# Capela votiva a São Padre Pio — landing page

Página de apresentação e arrecadação para a construção da Capela votiva a São Padre Pio,
no local da sede da Obra Refúgio de Maria (Av. José Leon, 2038, Fortaleza–CE).

## O que publicar

- **`index.html`**: a página completa em um único arquivo, com imagens, QR Code Pix e passeio 3D.
  Basta hospedar esse arquivo (no site da ORM, na Vercel, no GitHub Pages etc.).
  O passeio 3D e as fontes carregam da internet (jsDelivr e Google Fonts).
- **`video/`**: o passeio 3D em 1080p, numa versão leve para WhatsApp e numa vertical para Status e Reels. Cada uma existe com legendas e sem legendas (`-sem-legenda`). A versão sem legenda mantém só as cartelas de abertura e de encerramento. No site, o passeio 3D aparece sem legendas.

## Site no ar

- Endereço provisório (GitHub Pages): https://rciribelli.github.io/capela-sao-padre-pio/
- O GitHub Pages publica o `index.html` da raiz do branch `main`. Cada `git push` atualiza o site em 1 ou 2 minutos.
- `compartilhar.jpg` é a imagem que aparece quando o link é compartilhado no WhatsApp e nas redes sociais.

### Para usar o domínio próprio

1. No provedor do domínio, crie um registro CNAME apontando para `rciribelli.github.io`. Se for um domínio raiz, crie registros A para os IPs do GitHub Pages.
2. No GitHub, abra Settings › Pages › Custom domain, informe o domínio e marque "Enforce HTTPS".
3. Em `fonte/index.html`, troque o endereço provisório nas tags `og:url`, `og:image` e `canonical`. Depois rode `node fonte/ferramentas/montar.js` e faça o push.

## Como editar

Os arquivos-fonte ficam em `fonte/`:

- `fonte/index.html`: textos e layout da página
- `fonte/tour3d.js`: o modelo 3D. A nave mede 8 × 15 m, com bancos voltados para o altar em duas alas e corredor central. O corredor de 1 m fica à esquerda, segue ao lado da sede até o fundo e passa pela lojinha.
- `fonte/esculturas.js`: o Cristo crucificado esculpido em 3D. O `montar.js` embute este arquivo no `index.html`.
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

## Dados do Pix (conferidos no QR Code)

- Favorecido: Associação Obra Refúgio de Maria (no QR aparece abreviado: "ASSOCIACAO OBRA REFUGIO D")
- CNPJ: 60.638.183/0001-05
- Instituição: Sicredi Veredas Cooperativa de Crédito
- Chave Pix do QR: celular +55 85 98445-2025
- Mensagem: "Futura Capela Sao Padre Pio - ORM"
- Identificador (txid): PadrePio
- Valor: livre (o doador digita)

O botão "Copiar código Pix" usa exatamente o mesmo código do QR Code. O CRC foi validado.
