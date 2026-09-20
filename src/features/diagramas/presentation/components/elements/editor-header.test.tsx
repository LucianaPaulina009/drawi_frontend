import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
    signOut: vi.fn(),
  },
}));

vi.mock("../../hooks/use-salida-editor-pendiente", () => ({
  useSalidaEditorPendiente: () => ({
    modalSalidaAbierto: false,
    setModalSalidaAbierto: vi.fn(),
    solicitarSalida: (accion: () => void) => accion(),
    confirmarSalida: vi.fn(),
    totalPendientes: 0,
  }),
}));

vi.mock("./estado-sincronizacion-editor", () => ({
  EstadoSincronizacionEditor: () => <div data-testid="estado-sincronizacion-editor" />,
}));

vi.mock("./navegacion-paginas", () => ({
  NavegacionPaginas: () => <div data-testid="navegacion-paginas" />,
}));

import { EditorHeader } from "./editor-header";

describe("EditorHeader", () => {
  it("renderiza la cabecera del proyecto con el indicador de sincronizacion", () => {
    render(
      <EditorHeader
        proyecto={{ id: "proyecto-1", nombre: "Proyecto Test", slug: "proyecto-test" } as never}
        diagramas={[]}
        diagramaActivoId={null}
        creandoPagina={false}
        onSeleccionarDiagrama={vi.fn()}
        onCrearPagina={vi.fn()}
        onRenombrarPagina={vi.fn()}
        onEliminarPagina={vi.fn()}
      />
    );

    expect(screen.getByText("Proyecto Test")).toBeInTheDocument();
    expect(screen.getByTestId("estado-sincronizacion-editor")).toBeInTheDocument();
  });
});
