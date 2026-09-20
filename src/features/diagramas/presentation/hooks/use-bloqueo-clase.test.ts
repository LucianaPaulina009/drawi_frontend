import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColaboracionStore } from "../stores/colaboracion.store";
import { useBloqueoClase } from "./use-bloqueo-clase";
import { colaboracionSocketService } from "../../infrastructure/websocket/colaboracion-socket.service";

describe("useBloqueoClase", () => {
  beforeEach(() => {
    useColaboracionStore.getState().resetear();
    vi.spyOn(colaboracionSocketService, "solicitarBloqueoClase").mockImplementation(() => {});
    vi.spyOn(colaboracionSocketService, "renovarBloqueoClase").mockImplementation(() => {});
    vi.spyOn(colaboracionSocketService, "liberarBloqueoClase").mockImplementation(() => {});
  });

  it("solicita bloqueo para una clase no bloqueada", () => {
    useColaboracionStore.setState({ miUsuarioId: "usr-1", puedeEditar: true });

    const { result } = renderHook(() => useBloqueoClase());

    let exito = false;
    act(() => {
      exito = result.current.solicitarBloqueo("clase-1");
    });

    expect(exito).toBe(true);
    expect(colaboracionSocketService.solicitarBloqueoClase).toHaveBeenCalledWith("clase-1");
  });

  it("deniega solicitud local si la clase está bloqueada por otro usuario activo", () => {
    useColaboracionStore.setState({
      miUsuarioId: "usr-1",
      puedeEditar: true,
      bloqueosClases: {
        "clase-1": {
          idClase: "clase-1",
          idUsuario: "usr-2",
          nombreUsuario: "Usuario 2",
          expiraEn: Date.now() + 30000,
        },
      },
    });

    const { result } = renderHook(() => useBloqueoClase());

    let exito = false;
    act(() => {
      exito = result.current.solicitarBloqueo("clase-1");
    });

    expect(exito).toBe(false);
    expect(colaboracionSocketService.solicitarBloqueoClase).not.toHaveBeenCalled();
  });

  it("permite solicitar si el bloqueo anterior expiró por TTL", () => {
    useColaboracionStore.setState({
      miUsuarioId: "usr-1",
      puedeEditar: true,
      bloqueosClases: {
        "clase-1": {
          idClase: "clase-1",
          idUsuario: "usr-2",
          nombreUsuario: "Usuario 2",
          expiraEn: Date.now() - 5000, // Expirado hace 5 segundos
        },
      },
    });

    const { result } = renderHook(() => useBloqueoClase());

    let exito = false;
    act(() => {
      exito = result.current.solicitarBloqueo("clase-1");
    });

    expect(exito).toBe(true);
    expect(colaboracionSocketService.solicitarBloqueoClase).toHaveBeenCalledWith("clase-1");

    const info = result.current.obtenerInfoBloqueo("clase-1");
    expect(info.estaBloqueada).toBe(false);
  });

  it("libera automáticamente el lock cuando la clase activa cambia o se desmonta", () => {
    useColaboracionStore.setState({
      miUsuarioId: "usr-1",
      puedeEditar: true,
      bloqueosClases: {
        "clase-1": {
          idClase: "clase-1",
          idUsuario: "usr-1",
          nombreUsuario: "Usuario 1",
          expiraEn: Date.now() + 30000,
        },
      },
      misBloqueos: new Set(["clase-1"]),
    });

    const { rerender, unmount } = renderHook(
      ({ idClase }) => useBloqueoClase(idClase),
      { initialProps: { idClase: "clase-1" } }
    );

    // Cambiar a otra clase
    rerender({ idClase: "clase-2" });
    expect(colaboracionSocketService.liberarBloqueoClase).toHaveBeenCalledWith("clase-1");

    // Simular que clase-2 es de mi propiedad
    useColaboracionStore.setState({
      bloqueosClases: {
        "clase-2": {
          idClase: "clase-2",
          idUsuario: "usr-1",
          nombreUsuario: "Usuario 1",
          expiraEn: Date.now() + 30000,
        },
      },
      misBloqueos: new Set(["clase-2"]),
    });

    // Desmontar el hook
    unmount();
    expect(colaboracionSocketService.liberarBloqueoClase).toHaveBeenCalledWith("clase-2");
  });
});
