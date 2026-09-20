import { getJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import {
  FrameServidorWSSchema,
  type FrameServidorWS,
} from "../schemas/colaboracion.schemas";

export type EstadoSocket = "desconectado" | "conectando" | "conectado" | "error";

export class ColaboracionSocketService {
  private socket: WebSocket | null = null;
  private diagramaId: string | null = null;
  private messageListeners = new Set<(frame: FrameServidorWS) => void>();
  private statusListeners = new Set<(estado: EstadoSocket) => void>();
  private estadoActual: EstadoSocket = "desconectado";
  private reconexionTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private intentosReconexion = 0;
  private desconexionIntencional = false;

  private resolverWsUrl(diagramaId: string, token?: string | null): string {
    const rawBackendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const httpUrl = rawBackendUrl.replace(/\/+$/, "");
    const wsBase = httpUrl.startsWith("https://")
      ? httpUrl.replace(/^https:\/\//, "wss://")
      : httpUrl.replace(/^http:\/\//, "ws://");

    const endpointBase = wsBase.endsWith("/api")
      ? `${wsBase}/diagramas/${diagramaId}/colaboracion`
      : `${wsBase}/api/diagramas/${diagramaId}/colaboracion`;

    if (token) {
      return `${endpointBase}?token=${encodeURIComponent(token)}`;
    }
    return endpointBase;
  }

  private notificarEstado(nuevoEstado: EstadoSocket): void {
    this.estadoActual = nuevoEstado;
    for (const listener of this.statusListeners) {
      try {
        listener(nuevoEstado);
      } catch (e) {
        console.debug("[WebSocket Colaboración] Error en listener de estado:", e);
      }
    }
  }

  public obtenerEstado(): EstadoSocket {
    return this.estadoActual;
  }

  public suscribirMensaje(callback: (frame: FrameServidorWS) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  public suscribirEstado(callback: (estado: EstadoSocket) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.estadoActual);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public conectar(
    diagramaId: string,
    onFrame?: (frame: FrameServidorWS) => void,
    onStatusChange?: (estado: EstadoSocket) => void
  ): void {
    if (onFrame) {
      this.suscribirMensaje(onFrame);
    }
    if (onStatusChange) {
      this.suscribirEstado(onStatusChange);
    }

    // Si ya estamos conectados al mismo diagrama, no recrear conexión
    if (
      this.socket &&
      this.diagramaId === diagramaId &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.desconectar();
    this.diagramaId = diagramaId;
    this.desconexionIntencional = false;

    void this.iniciarConexion();
  }

  private async iniciarConexion(): Promise<void> {
    if (!this.diagramaId || this.desconexionIntencional) return;

    this.notificarEstado("conectando");

    try {
      // 1. Obtener JWT firmado de sesión de Better Auth
      const token = await getJWT();
      if (!token) {
        console.warn("[WebSocket Colaboración] No se pudo obtener JWT de sesión; intentando reconectar...");
        this.notificarEstado("error");
        this.programarReconexion();
        return;
      }

      if (this.desconexionIntencional || !this.diagramaId) return;

      const url = this.resolverWsUrl(this.diagramaId, token);
      console.log(`[WebSocket Colaboración] Conectando a sala: ${this.diagramaId}`);
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.intentosReconexion = 0;
        console.log(`[WebSocket Colaboración] Conexión establecida con éxito (OPEN) en sala ${this.diagramaId}`);
        this.notificarEstado("conectado");
        this.iniciarPing();
      };

      this.socket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const parseado = FrameServidorWSSchema.safeParse(rawData);
          if (parseado.success) {
            for (const listener of this.messageListeners) {
              try {
                listener(parseado.data);
              } catch (e) {
                console.error("[WebSocket Colaboración] Error en listener procesando frame:", e);
              }
            }
          } else {
            console.warn("[WebSocket Colaboración] Frame recibido no coincide con esquema:", parseado.error, rawData);
          }
        } catch (e) {
          console.error("[WebSocket Colaboración] Error parseando frame JSON:", e);
        }
      };

      this.socket.onclose = (event) => {
        this.limpiarPing();
        this.socket = null;

        if (this.desconexionIntencional) {
          console.log("[WebSocket Colaboración] Desconexión intencional completada.");
          this.notificarEstado("desconectado");
          return;
        }

        console.warn(`[WebSocket Colaboración] Socket cerrado (código=${event.code}, razón="${event.reason}").`);

        // Si fue código de autorización denegada (4001 / 4003 / 4004), no reintentar en bucle
        if (event.code === 4001 || event.code === 4003 || event.code === 4004) {
          this.notificarEstado("error");
          return;
        }

        this.notificarEstado("desconectado");
        this.programarReconexion();
      };

      this.socket.onerror = (err) => {
        console.error("[WebSocket Colaboración] Error en conexión WebSocket:", err);
        this.notificarEstado("error");
      };
    } catch (err) {
      console.error("[WebSocket Colaboración] Error al inicializar conexión:", err);
      this.notificarEstado("error");
      this.programarReconexion();
    }
  }

  private programarReconexion(): void {
    if (this.desconexionIntencional || !this.diagramaId) return;

    if (this.reconexionTimer) {
      clearTimeout(this.reconexionTimer);
    }

    this.intentosReconexion += 1;
    // Backoff exponencial entre 1s y 10s
    const retraso = Math.min(1000 * Math.pow(1.5, this.intentosReconexion - 1), 10000);
    console.log(`[WebSocket Colaboración] Reintentando conexión en ${Math.round(retraso)}ms (intento ${this.intentosReconexion})...`);

    this.reconexionTimer = setTimeout(() => {
      void this.iniciarConexion();
    }, retraso);
  }

  private iniciarPing(): void {
    this.limpiarPing();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 20000);
  }

  private limpiarPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public desconectar(): void {
    this.desconexionIntencional = true;
    this.limpiarPing();
    if (this.reconexionTimer) {
      clearTimeout(this.reconexionTimer);
      this.reconexionTimer = null;
    }
    if (this.socket) {
      this.socket.close(1000, "Desconexión intencional");
      this.socket = null;
    }
    this.diagramaId = null;
    this.intentosReconexion = 0;
    this.notificarEstado("desconectado");
  }

  public enviar(tipo: string, payload?: unknown): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ tipo, payload: payload || {} }));
    }
  }

  public solicitarBloqueoClase(idClase: string): void {
    this.enviar("SOLICITAR_BLOQUEO_CLASE", { idClase });
  }

  public solicitarBloqueo(idClase: string): void {
    this.solicitarBloqueoClase(idClase);
  }

  public renovarBloqueoClase(idClase: string): void {
    this.enviar("RENOVAR_BLOQUEO_CLASE", { idClase });
  }

  public renovarBloqueo(idClase: string): void {
    this.renovarBloqueoClase(idClase);
  }

  public liberarBloqueoClase(idClase: string): void {
    this.enviar("LIBERAR_BLOQUEO_CLASE", { idClase });
  }

  public liberarBloqueo(idClase: string): void {
    this.liberarBloqueoClase(idClase);
  }

  public moverCursor(x: number, y: number): void {
    this.enviar("MOVER_CURSOR", { x, y });
  }

  public arrastrarClasePreview(idClase: string, posicionX: number, posicionY: number): void {
    this.enviar("ARRASTRAR_CLASE_PREVIEW", { idClase, posicionX, posicionY });
  }

  public ping(): void {
    this.enviar("PING");
  }
}

export const colaboracionSocketService = new ColaboracionSocketService();
