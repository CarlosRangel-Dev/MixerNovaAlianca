# Mixer Nova Aliança

Um player web de multitracks para músicos, ministérios de louvor e igrejas. Permite tocar, mixar, mutar, solo e controlar o volume de cada faixa de áudio de músicas separadas por instrumentos.

## Funcionalidades

- Seleção de músicas multitrack
- Controle individual de volume, mute e solo por faixa
- Visualização de formas de onda e espectro
- Loop de trechos selecionados
- Gravação do mix final em WAV
- Interface web responsiva

## Estrutura do Projeto

```
myExpressApp/
├── app.js / server.js      # Backend Node.js/Express
├── client/
│   ├── index.html          # Interface principal
│   ├── js/                 # Scripts do player
│   ├── css/                # Estilos
│   └── multitrack/         # Pastas das músicas e faixas
│       └── nome_da_musica/
│           ├── faixa1.mp3
│           ├── faixa2.mp3
│           └── song.json
├── public/                 # Arquivos públicos
├── routes/                 # Rotas do backend
├── views/                  # Templates (se usar)
├── package.json
```

## Como rodar localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/CarlosRangel-Dev/MixerNovaAlianca.git
   cd MixerNovaAlianca/myExpressApp
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Adicione suas músicas e faixas em `client/multitrack/` seguindo o exemplo de `song.json`.**

4. **Inicie o servidor:**
   ```bash
   node app.js
   ```
   ou
   ```bash
   npm start
   ```

5. **Acesse no navegador:**  
   [http://localhost:3000](http://localhost:3000)

## Exemplo de song.json

```json
{
  "name": "exemplo_musica",
  "instruments": [
    { "name": "Guitarra", "url": "Guitarra.mp3" },
    { "name": "Bateria", "url": "Bateria.mp3" },
    { "name": "Baixo", "url": "Baixo.mp3" }
  ]
}
```

## Observações

- Para muitos arquivos de áudio, considere usar links externos (Google Drive, S3, etc).
- O projeto aceita arquivos `.mp3` e `.wav`.
- Para dúvidas ou sugestões,
