"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileCode, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { ResultadoImportacionEa } from "../../../domain/entities/intercambio-enterprise-architect.entity";
import { importarDiagramaEaAction } from "../../actions/intercambio-enterprise-architect.action";

export interface ModalImportarEnterpriseArchitectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idProyecto: string;
  idDiagrama: string;
  onImportacionExitosa?: (resultado: ResultadoImportacionEa) => void;
}

export function ModalImportarEnterpriseArchitect({
  open,
  onOpenChange,
  idProyecto,
  idDiagrama,
  onImportacionExitosa,
}: ModalImportarEnterpriseArchitectProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setArchivo(null);
    setIsPending(false);
    setErrorLocal(null);
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nombre = file.name.toLowerCase();
    if (!nombre.endsWith(".xml") && !nombre.endsWith(".xmi")) {
      setErrorLocal("El archivo debe tener extensión .xml o .xmi.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorLocal("El archivo supera el tamaño máximo permitido de 10 MB.");
      return;
    }

    setErrorLocal(null);
    setArchivo(file);
  };

  const handleImportar = async () => {
    if (!archivo) {
      setErrorLocal("Por favor selecciona un archivo para importar.");
      return;
    }

    setIsPending(true);
    setErrorLocal(null);

    try {
      const res = await importarDiagramaEaAction(
        idDiagrama,
        idProyecto,
        archivo
      );

      if (!res.ok) {
        const mensaje =
          res.error.errors?.[0] || "No se pudo importar el archivo de Enterprise Architect.";
        setErrorLocal(mensaje);
        appToast.error("Error al importar", mensaje);
        return;
      }

      appToast.success(
        `Importación exitosa: Se importaron ${res.data.clasesImportadas} clases y ${res.data.relacionesImportadas} relaciones.`
      );

      if (res.data.advertencias && res.data.advertencias.length > 0) {
        appToast.info(
          `Avisos de importación: ${res.data.advertencias.slice(0, 2).join(" ")}`
        );
      }

      resetState();
      onOpenChange(false);
      onImportacionExitosa?.(res.data);
    } catch {
      const errorMsg = "Ocurrió un error inesperado al procesar el archivo.";
      setErrorLocal(errorMsg);
      appToast.error("Error", errorMsg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nuevaApertura) => {
        if (!isPending) {
          if (!nuevaApertura) resetState();
          onOpenChange(nuevaApertura);
        }
      }}
      title="Importar desde Enterprise Architect"
      description="Carga un archivo XML o XMI 2.1 exportado de Enterprise Architect en el lienzo en blanco."
      size="md"
    >
      <div className="space-y-4 p-5">
        {/* Zona de selección de archivo */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            archivo
              ? "border-primary/50 bg-primary/5"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.xmi"
            className="hidden"
            onChange={handleSeleccionarArchivo}
            disabled={isPending}
          />
          {archivo ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <FileCode className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {archivo.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {(archivo.size / 1024).toFixed(1)} KB
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:underline h-7 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Cambiar archivo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-100 text-slate-500 rounded-full">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-700">
                Haz clic para buscar tu archivo <span className="font-semibold text-slate-900">.xml</span> o <span className="font-semibold text-slate-900">.xmi</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Tamaño máximo permitido: 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Mensaje informativo / reglas */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Reconstrucción inteligente</p>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Las clases mantendrán su geometría. DRAWI genera llaves primarias
              automáticas y materializa las foráneas según las relaciones
              detectadas.
            </p>
          </div>
        </div>

        {/* Mensaje de error si aplica */}
        {errorLocal && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{errorLocal}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImportar}
            disabled={!archivo || isPending}
            className="text-xs"
          >
            {isPending ? "Importando modelo..." : "Importar modelo"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
