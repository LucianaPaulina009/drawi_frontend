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

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, disabled, onClick, ...props }: any) => (
    <button role="menuitem" disabled={disabled} aria-disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

const mockClases: any[] = [];
vi.mock("../../stores/editor-diagrama.store", () => ({
  useEditorDiagramaStore: (selector: any) => selector({ clases: mockClases }),
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

  it("en lienzo en blanco: Importar EA está habilitado y Exportar EA está deshabilitado", () => {
    mockClases.length = 0; // 0 clases

    render(
      <EditorHeader
        proyecto={{ id: "proyecto-1", nombre: "Proyecto Test", slug: "proyecto-test" } as never}
        diagramas={[{ id: "diag-1", nombre: "Página 1" } as never]}
        diagramaActivoId="diag-1"
        creandoPagina={false}
        onSeleccionarDiagrama={vi.fn()}
        onCrearPagina={vi.fn()}
        onRenombrarPagina={vi.fn()}
        onEliminarPagina={vi.fn()}
      />
    );

    const btnImportar = screen.getByText("Importar (Enterprise Architect)").closest("button");
    const btnExportar = screen.getByText("Exportar (Enterprise Architect)").closest("button");

    expect(btnImportar).toBeEnabled();
    expect(btnExportar).toBeDisabled();
  });

  it("con elementos en el lienzo: Importar EA está deshabilitado y Exportar EA está habilitado", () => {
    mockClases.length = 0;
    mockClases.push({ id: "c1", nombre: "Producto" }); // 1 clase

    render(
      <EditorHeader
        proyecto={{ id: "proyecto-1", nombre: "Proyecto Test", slug: "proyecto-test" } as never}
        diagramas={[{ id: "diag-1", nombre: "Página 1" } as never]}
        diagramaActivoId="diag-1"
        creandoPagina={false}
        onSeleccionarDiagrama={vi.fn()}
        onCrearPagina={vi.fn()}
        onRenombrarPagina={vi.fn()}
        onEliminarPagina={vi.fn()}
      />
    );

    const btnImportar = screen.getByText("Importar (Enterprise Architect)").closest("button");
    const btnExportar = screen.getByText("Exportar (Enterprise Architect)").closest("button");

    expect(btnImportar).toBeDisabled();
    expect(btnExportar).toBeEnabled();
  });
});
