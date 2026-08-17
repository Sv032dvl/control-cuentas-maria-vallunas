import { loadBaseInicialHistorico } from "@/features/dashboard/loaders";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const datos = await loadBaseInicialHistorico(90);

    // Calcular variación respecto al día anterior
    const datosConVariacion = datos.map((row, idx) => {
      const anterior = idx > 0 ? datos[idx - 1] : null;
      const variacion = anterior ? row.base_inicial - anterior.base_inicial : 0;
      const variacionPct = anterior && anterior.base_inicial !== 0
        ? ((variacion / anterior.base_inicial) * 100).toFixed(1)
        : null;

      return {
        fecha: row.fecha,
        empleado: row.empleado_nombre,
        billetes: row.base_billetes,
        monedas: row.base_monedas,
        base: row.base_inicial,
        variacion,
        variacionPct,
        diferencia: row.diferencia,
        cuadrado: row.cuadrado,
        estado: row.estado,
      };
    });

    return NextResponse.json(datosConVariacion);
  } catch (error) {
    console.error("Error en /api/reports/base-inicial:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
