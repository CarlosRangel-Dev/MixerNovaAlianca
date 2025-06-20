function Song(songName, context) {
  // Contexto de áudio Web Audio API
  var audioContext = context;
  // Nome da música
  this.name = songName;
  // URL da música (usada para buscar o JSON da música)
  this.url = "track/" + songName;
  // Lista de faixas (tracks) dessa música
  this.tracks = [];
  // Volume master da música
  this.volume = 1;
  // Tempo decorrido desde o início (em segundos)
  this.elapsedTimeSinceStart;

  // A música está pausada?
  this.paused = true;

  // A música está mutada?
  this.muted = false;

  // Está gravando o mix?
  this.recording = false;

  // Modo loop ativado?
  this.loopMode = false;
  this.loopStartTime;
  this.loopEndTime;

  // Está em modo de gravação do mix?
  this.recordMixMode = false;

  // Lista de buffers de áudio decodificados
  this.decodedAudioBuffers = [];

  // Nós do grafo de áudio Web Audio
  // Nó de volume master
  this.masterVolumeNode = context.createGain();
  // Nós de volume de cada faixa
  this.trackVolumeNodes = [];
  // Nó de análise (visualização de espectro, etc)
  this.analyserNode = context.createAnalyser();
  // Nó de gravação do mix master
  this.masterRecorderNode = new Recorder(this.masterVolumeNode);
  var recIndex = 0; // Para gerar nomes únicos para os arquivos exportados

  // Nós de origem dos samples (usados para start/stop/pause)
  this.sampleNodes = [];

  // Adiciona uma nova faixa (track) à música
  this.addTrack = function (instrument) {
    this.tracks.push(new Track(this.name, instrument));
  };

  // Monta o grafo de áudio (liga os buffers, volumes, etc)
  this.buildGraph = function () {
    var sources = [];

    for (var i = 0; i < this.decodedAudioBuffers.length; i++) {
      var sample = this.decodedAudioBuffers[i];

      // Cria um BufferSource para cada sample
      sources[i] = context.createBufferSource();
      sources[i].buffer = sample;

      // Cria um nó de volume para cada faixa
      this.trackVolumeNodes[i] = context.createGain();
      // Define o volume da faixa (0 se mutada, valor normal se não)
      if (this.tracks[i].muted) {
        this.trackVolumeNodes[i].gain.value = 0;
      } else {
        this.trackVolumeNodes[i].gain.value = this.tracks[i].volume;
      }
      // Conecta o sample ao nó de volume da faixa
      sources[i].connect(this.trackVolumeNodes[i]);

      // Conecta todos os volumes de faixa ao volume master
      this.trackVolumeNodes[i].connect(this.masterVolumeNode);

      // Conecta o volume master ao analisador
      this.masterVolumeNode.connect(this.analyserNode);

      // Conecta o analisador à saída de áudio (alto-falantes)
      this.analyserNode.connect(context.destination);
    }
    // Guarda os nodes para poder controlar start/stop/pause depois
    this.sampleNodes = sources;
  };

  // Inicia a reprodução da música
  this.play = function (startTime) {
    this.buildGraph();

    this.setTrackVolumesDependingOnMuteSoloStatus();

    this.elapsedTimeSinceStart = startTime;

    this.sampleNodes.forEach(function (s) {
      // Inicia cada sample (offset pode ser usado para continuar de onde parou)
      s.start(0, startTime);
    });

    this.paused = false;

    // Se estiver em modo de gravação, inicia a gravação
    if (this.recordMixMode) {
      this.toggleRecording();
    }
  };

  // Para a reprodução da música
  this.stop = function () {
    if (this.paused === true) return; // Não pode parar se já está pausado

    this.sampleNodes.forEach(function (s) {
      // Para cada sample e libera recursos
      s.stop(0);
      delete s;
    });

    this.paused = true;

    // Se estava gravando, para a gravação
    if (this.recordMixMode) {
      this.toggleRecording();
    }
  };

  // Pausa ou retoma a música
  this.pause = function () {
    if (!this.paused) {
      this.stop();
    } else {
      this.play(this.elapsedTimeSinceStart);
    }
  };

  // Salva o mix como arquivo WAV
  this.saveSongAsWav = function (fileName) {
    this.masterRecorderNode.exportWAV(function (blob) {
      clearLog();
      log("Saved mix!");
      log("file: " + fileName);
      Recorder.forceDownload(blob, fileName);
    });
    // Também poderia exportar em mono se quisesse
  };

  // Inicia ou para a gravação do mix
  this.toggleRecording = function (e) {
    if (this.recording) {
      // Para a gravação
      console.log("stopping recording");
      this.masterRecorderNode.stop();

      // Salva o mix ao parar de gravar
      this.saveSongAsWav(this.name + recIndex++ + ".wav");
    } else {
      // Inicia a gravação
      if (!this.masterRecorderNode) return;
      console.log("start recording");
      this.masterRecorderNode.clear();
      this.masterRecorderNode.record();
    }
    this.recording = !this.recording;
  };

  // Define o volume master
  this.setVolume = function (value) {
    this.volume = value;
    this.masterVolumeNode.gain.value = value;
  };

  // Define o volume de uma faixa específica
  this.setVolumeOfTrack = function (value, trackNumber) {
    if (this.trackVolumeNodes[trackNumber] !== undefined) {
      this.trackVolumeNodes[trackNumber].gain.value = value;
      this.tracks[trackNumber].volume = value;
    }
  };

  // Retorna um array com as URLs de todas as faixas (usado pelo BufferLoader)
  this.getUrlsOfTracks = function () {
    var urls = [];
    this.tracks.forEach(function (track) {
      urls.push(track.url);
    });
    return urls;
  };

  // Retorna a duração da música (em segundos)
  this.getDuration = function () {
    if (this.decodedAudioBuffers !== undefined) {
      return this.decodedAudioBuffers[0].duration;
    }
    return undefined;
  };

  // Retorna o número de faixas
  this.getNbTracks = function () {
    return this.tracks.length;
  };

  // Define os buffers de áudio decodificados para cada faixa
  this.setDecodedAudioBuffers = function (buffers) {
    this.decodedAudioBuffers = buffers;

    for (var i = 0; i < this.tracks.length; i++) {
      this.tracks[i].decodedBuffer = this.decodedAudioBuffers[i];
    }
  };

  // Ativa/desativa o modo loop
  this.toggleLoopMode = function () {
    this.loopMode = !this.loopMode;
  };

  // Ativa/desativa o mute master
  this.toggleMute = function () {
    this.muted = !this.muted;

    if (this.muted) {
      this.masterVolumeNode.gain.value = 0;
    } else {
      this.masterVolumeNode.gain.value = this.volume;
    }
  };

  // Ativa/desativa o pause
  this.togglePause = function () {
    this.paused = !this.paused;
  };

  // Ativa/desativa o modo de gravação do mix
  this.toggRecordMixMode = function () {
    this.recordMixMode = !this.recordMixMode;
  };

  // Ajusta volumes das faixas dependendo do mute/solo
  this.setTrackVolumesDependingOnMuteSoloStatus = function () {
    var thereIsSolo = false;
    var nbTracks = this.getNbTracks();

    // Verifica se há pelo menos uma faixa em solo
    for (var i = 0; i < nbTracks; i++) {
      if (this.tracks[i].solo) {
        thereIsSolo = true;
        break;
      }
    }

    // Se houver solo, só as faixas em solo tocam (volume normal), as outras ficam mudas
    if (thereIsSolo) {
      for (i = 0; i < nbTracks; i++) {
        if (this.tracks[i].solo) {
          this.trackVolumeNodes[i].gain.value = this.tracks[i].volume;
        } else {
          this.trackVolumeNodes[i].gain.value = 0;
        }
      }
      return;
    }

    // Se não houver solo, verifica mute de cada faixa
    for (i = 0; i < nbTracks; i++) {
      if (this.tracks[i].muted) {
        this.trackVolumeNodes[i].gain.value = 0;
      } else {
        this.trackVolumeNodes[i].gain.value = this.tracks[i].volume;
      }
    }
  };
}
