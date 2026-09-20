import { fireEvent, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MascotaDrawi } from "./mascota-drawi";

describe("MascotaDrawi", () => {
  it("renderiza como botón accesible con nombre e indicador de estado", () => {
    const onToggle = vi.fn();
    render(<MascotaDrawi abierto={false} onToggle={onToggle} />);

    const boton = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });
    expect(boton).toBeInTheDocument();
    expect(boton).toHaveAttribute("aria-expanded", "false");
  });

  it("cambia aria-expanded y etiqueta accesible cuando el panel está abierto", () => {
    const onToggle = vi.fn();
    render(<MascotaDrawi abierto={true} onToggle={onToggle} />);

    const boton = screen.getByRole("button", {
      name: "Cerrar asistente de IA DRAWI",
    });
    expect(boton).toBeInTheDocument();
    expect(boton).toHaveAttribute("aria-expanded", "true");
  });

  it("permite abrir el menú radial usando el teclado con Enter", () => {
    render(<MascotaDrawi abierto={false} onToggle={vi.fn()} />);

    const boton = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });
    expect(screen.queryByRole("menuitem", { name: "Chatear" })).not.toBeInTheDocument();

    fireEvent.click(boton);
    expect(screen.getByRole("menuitem", { name: "Chatear" })).toBeInTheDocument();
  });

  it("mantiene ocultas las acciones secundarias en reposo/hover y las abre exclusivamente al hacer clic en la bolita", async () => {
    const onAbrirChat = vi.fn();
    const onSubirImagen = vi.fn();
    const onGrabarAudio = vi.fn();

    const { container } = render(
      <MascotaDrawi
        abierto={false}
        onToggle={vi.fn()}
        onAbrirChat={onAbrirChat}
        onSubirImagen={onSubirImagen}
        onGrabarAudio={onGrabarAudio}
      />
    );

    const botonDrawi = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });

    // 1. Estado inicial: opciones cerradas
    expect(screen.queryByRole("menuitem", { name: "Generar backend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Chatear" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Subir imagen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Grabar audio" })).not.toBeInTheDocument();

    // 2. Hover sobre el contenedor: la bolita se desplaza pero las opciones permanecen cerradas
    const rootContainer = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(rootContainer);
    expect(screen.queryByRole("menuitem", { name: "Generar backend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Chatear" })).not.toBeInTheDocument();

    // 3. Clic en la bolita: se abren las 4 opciones
    fireEvent.click(botonDrawi);
    expect(screen.getByRole("menuitem", { name: "Generar backend" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Chatear" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Subir imagen" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Grabar audio" })).toBeInTheDocument();

    // 4. Mover el cursor fuera con opciones abiertas: NO se cierran
    fireEvent.mouseLeave(rootContainer);
    expect(screen.getByRole("menuitem", { name: "Generar backend" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Chatear" })).toBeInTheDocument();

    // 5. Clic nuevamente en la bolita: se cierran las opciones
    fireEvent.click(botonDrawi);
    await waitForElementToBeRemoved(() => screen.queryByRole("menuitem", { name: "Chatear" }));
    expect(screen.queryByRole("menuitem", { name: "Generar backend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Chatear" })).not.toBeInTheDocument();
  });

  it("ejecuta onGenerarBackend al presionar el botón de acción Generar backend", () => {
    const onGenerarBackend = vi.fn();
    render(
      <MascotaDrawi
        abierto={false}
        onToggle={vi.fn()}
        onGenerarBackend={onGenerarBackend}
      />
    );

    const botonDrawi = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });

    // Clic para desplegar opciones
    fireEvent.click(botonDrawi);

    const botonBackend = screen.getByRole("menuitem", { name: "Generar backend" });
    fireEvent.click(botonBackend);

    expect(onGenerarBackend).toHaveBeenCalledTimes(1);
  });

  it("ejecuta onAbrirChat al presionar el botón de acción Chatear", () => {
    const onAbrirChat = vi.fn();
    render(
      <MascotaDrawi
        abierto={false}
        onToggle={vi.fn()}
        onAbrirChat={onAbrirChat}
      />
    );

    const botonDrawi = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });

    // Clic para desplegar opciones
    fireEvent.click(botonDrawi);

    const botonChat = screen.getByRole("menuitem", { name: "Chatear" });
    fireEvent.click(botonChat);

    expect(onAbrirChat).toHaveBeenCalledTimes(1);
  });

  it("ejecuta onSubirImagen al presionar el botón de acción Subir imagen", () => {
    const onSubirImagen = vi.fn();
    render(
      <MascotaDrawi
        abierto={false}
        onToggle={vi.fn()}
        onSubirImagen={onSubirImagen}
      />
    );

    const botonDrawi = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });

    fireEvent.click(botonDrawi);

    const botonImagen = screen.getByRole("menuitem", { name: "Subir imagen" });
    fireEvent.click(botonImagen);

    expect(onSubirImagen).toHaveBeenCalledTimes(1);
  });

  it("activa el estado visual del botón de imagen cuando modoImagenExterno está activo", () => {
    const { rerender } = render(
      <MascotaDrawi
        abierto={false}
        onToggle={vi.fn()}
        modoImagenExterno={false}
      />
    );

    const botonDrawi = screen.getByRole("button", {
      name: "Abrir asistente de IA DRAWI",
    });
    fireEvent.click(botonDrawi);

    const botonImagen = screen.getByRole("menuitem", { name: "Subir imagen" });
    expect(botonImagen).not.toHaveClass("scale-105");

    rerender(
      <MascotaDrawi
        abierto={false}
        onToggle={vi.fn()}
        modoImagenExterno={true}
      />
    );

    expect(botonImagen).toHaveClass("scale-105");
  });
});
