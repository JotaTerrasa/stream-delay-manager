import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OBSWebSocket from 'obs-websocket-js';
import {
  Wifi, WifiOff, Loader2, Clock, Play, Square, Monitor, Video, Film,
  Clapperboard, Settings, Zap, Timer, Radio, Layers, Link2, Unlink
} from 'lucide-react';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/Select';
import { Slider } from './components/Slider';

// Custom hook for localStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) { }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Tab component
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
        ? 'bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary)] text-white shadow-lg glow-purple'
        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function App() {
  const obsRef = useRef(null);
  const [activeTab, setActiveTab] = useState('connection');

  // Persisted settings
  const [port, setPort] = useLocalStorage('obs:port', '4455');
  const [password, setPassword] = useLocalStorage('obs:password', '');
  const [delayInput, setDelayInput] = useLocalStorage('obs:delayInput', '');
  const [bridgeInput, setBridgeInput] = useLocalStorage('obs:bridgeInput', '');
  const [recordScene, setRecordScene] = useLocalStorage('obs:recordScene', '');
  const [delayScene, setDelayScene] = useLocalStorage('obs:delayScene', '');
  const [delaySec, setDelaySec] = useLocalStorage('obs:delaySec', 30);

  // Connection state
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [delayActive, setDelayActive] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const getObs = () => obsRef.current;

  const requireObs = () => {
    if (!getObs()) throw new Error('OBS no conectado');
  };

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (delayActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(c => c > 0 ? c - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [delayActive, countdown]);

  const connect = async () => {
    setStatus('connecting');
    setError('');

    try {
      const obs = new OBSWebSocket();
      await obs.connect(`ws://localhost:${port}`, password || undefined, {
        rpcVersion: 1,
        eventSubscriptions: 1 | 64 | 4
      });

      obsRef.current = obs;
      setStatus('connected');
      setActiveTab('config');

      obs.on('ConnectionClosed', () => {
        setStatus('disconnected');
        setActiveTab('connection');
      });

      const [{ inputs: inputList }, { scenes: sceneList }] = await Promise.all([
        obs.call('GetInputList', {}),
        obs.call('GetSceneList', {})
      ]);

      const inputNames = inputList.map(i => i.inputName);
      const sceneNames = sceneList.map(s => s.sceneName);

      setInputs(inputNames);
      setScenes(sceneNames);

      setDelayInput(prev => prev || inputNames[0] || '');
      setBridgeInput(prev => prev || inputNames[1] || '');
      setRecordScene(prev => prev || sceneNames[0] || '');
      setDelayScene(prev => prev || sceneNames[1] || sceneNames[0] || '');

    } catch (e) {
      setStatus('error');
      setError(String(e?.message || e));
    }
  };

  const disconnect = () => {
    if (getObs()) {
      getObs().disconnect();
      obsRef.current = null;
    }
    setStatus('disconnected');
    setActiveTab('connection');
  };

  const setSourceEnabled = async (sceneName, sourceName, enabled) => {
    if (!sceneName || !sourceName) return;
    requireObs();

    try {
      const { sceneItems } = await getObs().call('GetSceneItemList', { sceneName });
      for (const item of sceneItems.filter(i => i.sourceName === sourceName)) {
        await getObs().call('SetSceneItemEnabled', {
          sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: enabled
        });
      }
    } catch (e) {
      console.warn(`No se pudo actualizar ${sourceName} en ${sceneName}`, e);
    }
  };

  const isSourceEnabled = async (sceneName, sourceName) => {
    if (!sceneName || !sourceName) return false;
    requireObs();

    try {
      const { sceneItems } = await getObs().call('GetSceneItemList', { sceneName });
      const item = sceneItems.find(i => i.sourceName === sourceName);
      return item?.sceneItemEnabled ?? false;
    } catch (e) {
      return false;
    }
  };

  const pulseMediaSource = async (inputName) => {
    if (!inputName) return;
    requireObs();

    try {
      const { inputSettings } = await getObs().call('GetInputSettings', { inputName });
      const fileKey = inputSettings.local_file !== undefined ? 'local_file'
        : inputSettings.file !== undefined ? 'file'
          : inputSettings.path !== undefined ? 'path' : null;

      if (!fileKey) return;

      const originalPath = inputSettings[fileKey];
      const updateSettings = async (path) =>
        getObs().call('SetInputSettings', {
          inputName,
          inputSettings: { ...inputSettings, [fileKey]: path },
          overlay: false
        });

      await updateSettings('');
      await new Promise(r => setTimeout(r, 300));
      await updateSettings(originalPath);
    } catch (e) {
      console.warn(`No se pudo pulsar ${inputName}`, e);
    }
  };

  const activateDelay = async () => {
    if (!getObs() || status !== 'connected' || !delayScene) return;
    setError('');

    try {
      await getObs().call('StartVirtualCam').catch(() => { });

      if (await isSourceEnabled(delayScene, bridgeInput)) {
        await pulseMediaSource(bridgeInput);
      } else {
        await setSourceEnabled(delayScene, bridgeInput, true);
      }

      if (await isSourceEnabled(delayScene, delayInput)) {
        await setSourceEnabled(delayScene, delayInput, false);
      }

      await getObs().call('SetCurrentProgramScene', { sceneName: delayScene });
      setDelayActive(true);
      setCountdown(delaySec);

      setTimeout(async () => {
        try {
          await setSourceEnabled(delayScene, delayInput, true);
          await setSourceEnabled(delayScene, bridgeInput, false);
        } catch (e) {
          console.error('Error al cambiar sources tras delay:', e);
        }
      }, delaySec * 1000);

    } catch (e) {
      setError(e?.message || 'Error al activar delay');
    }
  };

  const deactivateDelay = async () => {
    if (!getObs() || status !== 'connected') return;
    setError('');

    try {
      await getObs().call('StopVirtualCam').catch(() => { });

      if (recordScene) {
        await getObs().call('SetCurrentProgramScene', { sceneName: recordScene });
      }

      await setSourceEnabled(delayScene, delayInput, false);
      setDelayActive(false);
      setCountdown(0);
    } catch (e) {
      setError(e?.message || 'Error al quitar delay');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeLabel = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary)] shadow-lg glow-purple">
              <Timer className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold gradient-text">Stream Delay Manager</h1>
              <p className="text-sm text-[var(--muted-foreground)]">Control de delay para OBS</p>
            </div>
          </motion.div>

          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium ${status === 'connected'
              ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
              : status === 'connecting'
                ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30'
                : status === 'error'
                  ? 'bg-[var(--destructive)]/10 text-[var(--destructive)] border border-[var(--destructive)]/30'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]'
              }`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'connected' ? 'bg-[var(--success)] pulse-ring'
                  : status === 'connecting' ? 'bg-[var(--warning)] animate-ping'
                    : status === 'error' ? 'bg-[var(--destructive)]'
                      : 'bg-[var(--muted-foreground)]'
                  }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'connected' ? 'bg-[var(--success)]'
                  : status === 'connecting' ? 'bg-[var(--warning)]'
                    : status === 'error' ? 'bg-[var(--destructive)]'
                      : 'bg-[var(--muted-foreground)]'
                  }`}></span>
              </span>
              {status === 'connected' ? 'Conectado a OBS'
                : status === 'connecting' ? 'Conectando...'
                  : status === 'error' ? 'Error de conexión'
                    : 'Desconectado'}
            </div>
          </motion.div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="animated-border overflow-hidden"
        >
          <div className="bg-[var(--card)] rounded-xl">
            {/* Tab Navigation */}
            <div className="flex gap-1 p-2 border-b border-[var(--border)] bg-[var(--background)]/50">
              <Tab
                active={activeTab === 'connection'}
                onClick={() => setActiveTab('connection')}
                icon={status === 'connected' ? Link2 : Unlink}
                label="Conexión"
              />
              <Tab
                active={activeTab === 'config'}
                onClick={() => status === 'connected' && setActiveTab('config')}
                icon={Settings}
                label="Configuración"
              />
              <Tab
                active={activeTab === 'control'}
                onClick={() => status === 'connected' && setActiveTab('control')}
                icon={Zap}
                label="Control"
              />
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Connection Tab */}
                {activeTab === 'connection' && (
                  <motion.div
                    key="connection"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="text-center py-4">
                      <div className={`inline-flex p-5 rounded-full mb-4 ${status === 'connected'
                        ? 'bg-[var(--success)]/10'
                        : 'bg-[var(--muted)]'
                        }`}>
                        {status === 'connected'
                          ? <Wifi className="w-10 h-10 text-[var(--success)]" />
                          : <WifiOff className="w-10 h-10 text-[var(--muted-foreground)]" />
                        }
                      </div>
                      <h2 className="text-xl font-semibold mb-2">
                        {status === 'connected' ? '¡Conectado!' : 'Conectar a OBS Studio'}
                      </h2>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {status === 'connected'
                          ? 'La conexión WebSocket está activa'
                          : 'Introduce los datos de conexión WebSocket'
                        }
                      </p>
                    </div>

                    {status !== 'connected' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                            Puerto
                          </label>
                          <Input
                            value={port}
                            onChange={e => setPort(e.target.value)}
                            placeholder="4455"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                            Contraseña
                          </label>
                          <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/30">
                        <p className="text-sm text-[var(--destructive)]">{error}</p>
                      </div>
                    )}

                    <Button
                      onClick={status === 'connected' ? disconnect : connect}
                      disabled={status === 'connecting'}
                      variant={status === 'connected' ? 'danger' : 'gradient'}
                      className="w-full h-12"
                    >
                      {status === 'connecting' ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : status === 'connected' ? (
                        <>
                          <Unlink className="w-5 h-5 mr-2" />
                          Desconectar
                        </>
                      ) : (
                        <>
                          <Link2 className="w-5 h-5 mr-2" />
                          Conectar a OBS
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Configuration Tab */}
                {activeTab === 'config' && status === 'connected' && (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Scenes Configuration */}
                    <div className="p-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-5 h-5 text-[var(--primary)]" />
                        <h3 className="font-semibold">Escenas</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-2">
                            Escena Principal
                          </label>
                          <Select value={recordScene} onValueChange={setRecordScene}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {scenes.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-2">
                            Escena con Delay
                          </label>
                          <Select value={delayScene} onValueChange={setDelayScene}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {scenes.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Sources Configuration */}
                    <div className="p-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Film className="w-5 h-5 text-[var(--primary)]" />
                        <h3 className="font-semibold">Sources de Video</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-2">
                            Video con Delay
                          </label>
                          <Select value={delayInput} onValueChange={setDelayInput}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar source..." />
                            </SelectTrigger>
                            <SelectContent>
                              {inputs.map(i => (
                                <SelectItem key={i} value={i}>{i}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-2">
                            Video de Transición
                          </label>
                          <Select value={bridgeInput} onValueChange={setBridgeInput}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar source..." />
                            </SelectTrigger>
                            <SelectContent>
                              {inputs.map(i => (
                                <SelectItem key={i} value={i}>{i}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Delay Time Configuration */}
                    <div className="p-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-[var(--primary)]" />
                          <h3 className="font-semibold">Tiempo de Delay</h3>
                        </div>
                        <span className="text-2xl font-bold font-mono gradient-text">
                          {formatTimeLabel(delaySec)}
                        </span>
                      </div>
                      <Slider
                        value={[delaySec]}
                        min={5}
                        max={300}
                        step={5}
                        onValueChange={([val]) => setDelaySec(val)}
                      />
                      <div className="flex justify-between mt-2 text-xs text-[var(--muted-foreground)]">
                        <span>5 seg</span>
                        <span>5 min</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Control Tab */}
                {activeTab === 'control' && status === 'connected' && (
                  <motion.div
                    key="control"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Big Timer Display */}
                    <div className="text-center py-8">
                      <div className={`inline-flex flex-col items-center justify-center p-8 rounded-full transition-all duration-500 ${delayActive
                        ? 'bg-gradient-to-br from-[var(--primary-dark)]/20 to-[var(--primary)]/20 glow-purple'
                        : 'bg-[var(--muted)]'
                        }`}>
                        <span className={`text-6xl font-bold font-mono ${delayActive ? 'gradient-text' : 'text-[var(--muted-foreground)]'}`}>
                          {delayActive ? formatTime(countdown) : formatTime(delaySec)}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)] mt-2">
                          {delayActive ? 'Delay Activo' : 'Delay Configurado'}
                        </span>
                      </div>
                    </div>

                    {/* Status Banner */}
                    <AnimatePresence>
                      {delayActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-[var(--primary-dark)]/20 to-[var(--primary)]/20 border border-[var(--primary)]/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-[var(--primary)]/20">
                              <Radio className="w-5 h-5 text-[var(--primary)] animate-pulse" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--primary-light)]">
                                Cámara Virtual Activa
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                Transmitiendo con {formatTimeLabel(delaySec)} de delay
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Control Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={activateDelay}
                        disabled={delayActive}
                        variant={delayActive ? 'muted' : 'success'}
                        className="h-14 text-base"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Activar Delay
                      </Button>
                      <Button
                        onClick={deactivateDelay}
                        disabled={!delayActive}
                        variant={!delayActive ? 'muted' : 'danger'}
                        className="h-14 text-base"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Detener Delay
                      </Button>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-[var(--muted)]">
                        <p className="text-lg font-semibold">{scenes.length}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Escenas</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--muted)]">
                        <p className="text-lg font-semibold">{inputs.length}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Sources</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--muted)]">
                        <p className="text-lg font-semibold">{formatTimeLabel(delaySec)}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Delay</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-[var(--muted-foreground)]">
            Fork de{' '}
            <a
              href="https://www.obsdelay.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
            >
              OBS Delay Controller
            </a>
            {' '}por{' '}
            <a
              href="https://x.com/STANIXDOR"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
            >
              @STANIXDOR
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default App;
