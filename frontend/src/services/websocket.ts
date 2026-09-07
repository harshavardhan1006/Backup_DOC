import type { AlgorithmEvent } from '../types';

export type EventHandler = (event: AlgorithmEvent) => void;
export type StatusHandler = (status: 'connected' | 'disconnected' | 'error') => void;

export class SolverWebSocket {
  private ws: WebSocket | null = null;
  private eventHandlers: EventHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private isConnecting = false;
  private connectPromise: Promise<void> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private getWsUrls(): string[] {
    if (typeof window === 'undefined') {
      return ['ws://localhost:8000/ws/solve', 'ws://127.0.0.1:8000/ws/solve'];
    }
    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host; // e.g. localhost:5173
    const hostname = window.location.hostname; // e.g. localhost or 127.0.0.1

    return [
      // Direct to FastAPI on port 8000 using IPv4 loopback
      `${proto}//127.0.0.1:8000/ws/solve`,
      // Direct using hostname
      `${proto}//${hostname}:8000/ws/solve`,
      // Via Vite dev server proxy (/ws -> localhost:8000)
      `${proto}//${host}/ws/solve`,
      // Direct localhost fallback
      `${proto}//localhost:8000/ws/solve`,
    ];
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.isConnecting && this.connectPromise) {
      return this.connectPromise;
    }

    this.isConnecting = true;
    const urls = this.getWsUrls();

    this.connectPromise = new Promise(async (resolve, reject) => {
      let lastErr: any = null;

      for (const url of urls) {
        try {
          await this.tryConnectUrl(url);
          this.isConnecting = false;
          this.statusHandlers.forEach(h => h('connected'));
          resolve();
          return;
        } catch (err) {
          lastErr = err;
        }
      }

      this.isConnecting = false;
      this.statusHandlers.forEach(h => h('error'));
      reject(lastErr || new Error('All WebSocket connection candidates failed'));
    });

    return this.connectPromise;
  }

  private tryConnectUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);

        const timer = setTimeout(() => {
          socket.close();
          reject(new Error(`Timeout connecting to ${url}`));
        }, 3000);

        socket.onopen = () => {
          clearTimeout(timer);
          this.ws = socket;
          this.setupSocketHandlers(socket);
          resolve();
        };

        socket.onerror = (e) => {
          clearTimeout(timer);
          reject(e);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private setupSocketHandlers(socket: WebSocket) {
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AlgorithmEvent;
        this.eventHandlers.forEach(h => h(data));
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    socket.onerror = (error) => {
      console.warn('Active WebSocket error:', error);
      this.statusHandlers.forEach(h => h('error'));
    };

    socket.onclose = () => {
      if (this.ws === socket) {
        this.ws = null;
        this.statusHandlers.forEach(h => h('disconnected'));
      }
    };
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async send(command: string, data: Record<string, any>) {
    if (!this.isConnected) {
      try {
        await this.connect();
      } catch (err) {
        console.error('WebSocket connection failed during send:', err);
        const errEvent: AlgorithmEvent = {
          type: 'ERROR' as any,
          timestamp: Date.now(),
          message: 'Unable to connect to backend WebSocket server. Please ensure Python backend is running at http://localhost:8000',
        };
        this.eventHandlers.forEach(h => h(errEvent));
        return;
      }
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command, ...data }));
    }
  }

  runExact(graphId: string, config: { time_limit?: number }) {
    this.send('run_exact', { graph_id: graphId, config });
  }

  runMCTS(graphId: string, config: {
    iterations?: number;
    time_limit?: number;
    exploration?: number;
    strategy?: string;
    seed?: number;
  }) {
    this.send('run_mcts', { graph_id: graphId, config });
  }

  runComparison(graphId: string, configs: any[]) {
    this.send('run_comparison', { graph_id: graphId, configs });
  }

  onEvent(handler: EventHandler) {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const solverWS = new SolverWebSocket();
