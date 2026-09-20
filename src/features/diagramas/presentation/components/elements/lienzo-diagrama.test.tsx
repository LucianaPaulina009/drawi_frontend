import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@xyflow/react", () => ({
  Background: () => null,
  BackgroundVariant: { Dots: "dots" },
  ReactFlow: ({ edges }: { edges: Array<Record<string, unknown>> }) => (
    <output data-testid="react-flow-edges">{JSON.stringify(edges)}</output>
  ),
  useReactFlow: () => ({
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
  }),
}));

import { LienzoDiagrama } from "./lienzo-diagrama";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";

describe("LienzoDiagrama y EstructuraRelacionNm", () => {
  beforeEach(() => {
    useEditorDiagramaStore.getState().limpiar();
    useEditorDiagramaStore.getState().hidratar("usuario:diagrama", {
      id: "diagrama",
      idProyecto: "proyecto",
      nombre: "Página 1",
      numero: 1,
      clases: [
        { id: "a", idDiagrama: "diagrama", nombre: "A", posicionX: 0, posicionY: 300, ancho: 220, atributos: [] },
        { id: "b", idDiagrama: "diagrama", nombre: "B", posicionX: 700, posicionY: 300, ancho: 220, atributos: [] },
        { id: "intermedia", idDiagrama: "diagrama", nombre: "A_B", posicionX: 310, posicionY: 40, ancho: 280, atributos: [] },
      ],
      relaciones: [
        { id: "rel-a", idDiagrama: "diagrama", idClaseOrigen: "a", idClaseDestino: "intermedia", tipoRelacion: "asociacion", cardinalidadOrigen: "1", cardinalidadDestino: "0..*", conectorOrigen: "right", conectorDestino: "left", referenciasFk: [] },
        { id: "rel-b", idDiagrama: "diagrama", idClaseOrigen: "b", idClaseDestino: "intermedia", tipoRelacion: "asociacion", cardinalidadOrigen: "1", cardinalidadDestino: "0..*", conectorOrigen: "left", conectorDestino: "right", referenciasFk: [] },
      ],
      estructurasNm: [{ id: "nm", idDiagrama: "diagrama", idClaseOrigen: "a", idClaseDestino: "b", idClaseIntermedia: "intermedia", idRelacionOrigen: "rel-a", idRelacionDestino: "rel-b" }],
    });
  });

  it("entrega a React Flow una única arista visual compuesta y conserva los datos para dibujar el ramal", () => {
    render(
      <LienzoDiagrama
        idDiagramaActivo="diagrama"
        diagramaActivo={null}
        puedeEditar={true}
        cargandoDetalle={false}
        herramientaActiva="seleccion"
        espacioPresionado={false}
      />
    );

    const edges = JSON.parse(screen.getByTestId("react-flow-edges").textContent ?? "[]");

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: "estructura-nm:nm",
      type: "estructuraNmUml",
      source: "a",
      target: "b",
      sourceHandle: "right",
      targetHandle: "left-target",
      data: {
        estructuraNm: { id: "nm" },
        claseIntermedia: { id: "intermedia" },
      },
    });
    expect(useEditorDiagramaStore.getState().relaciones).toHaveLength(2);
  });
});
