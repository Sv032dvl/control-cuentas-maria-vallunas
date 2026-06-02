export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      arqueo_billetes: {
        Row: {
          cantidad: number
          cierre_id: string
          denominacion_id: string
          id: string
          subtotal: number
        }
        Insert: {
          cantidad?: number
          cierre_id: string
          denominacion_id: string
          id?: string
          subtotal?: number
        }
        Update: {
          cantidad?: number
          cierre_id?: string
          denominacion_id?: string
          id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "arqueo_billetes_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_diarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqueo_billetes_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "v_alertas_admin"
            referencedColumns: ["cierre_id"]
          },
          {
            foreignKeyName: "arqueo_billetes_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "v_cuadre_diario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqueo_billetes_denominacion_id_fkey"
            columns: ["denominacion_id"]
            isOneToOne: false
            referencedRelation: "denominaciones_billete"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_egreso: {
        Row: {
          activo: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      cierres_diarios: {
        Row: {
          base_inicial: number
          created_at: string
          cuadrado: boolean
          diferencia: number
          efectivo_contado: number
          efectivo_esperado: number
          empleado_id: string
          estado: string
          fecha: string
          id: string
          ingresos_digitales_total: number
          nota_diferencia: string | null
          updated_at: string
          ventas_tpv_total: number
        }
        Insert: {
          base_inicial?: number
          created_at?: string
          cuadrado?: boolean
          diferencia?: number
          efectivo_contado?: number
          efectivo_esperado?: number
          empleado_id: string
          estado?: string
          fecha: string
          id?: string
          ingresos_digitales_total?: number
          nota_diferencia?: string | null
          updated_at?: string
          ventas_tpv_total?: number
        }
        Update: {
          base_inicial?: number
          created_at?: string
          cuadrado?: boolean
          diferencia?: number
          efectivo_contado?: number
          efectivo_esperado?: number
          empleado_id?: string
          estado?: string
          fecha?: string
          id?: string
          ingresos_digitales_total?: number
          nota_diferencia?: string | null
          updated_at?: string
          ventas_tpv_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cierres_diarios_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      denominaciones_billete: {
        Row: {
          activo: boolean
          id: string
          valor: number
        }
        Insert: {
          activo?: boolean
          id?: string
          valor: number
        }
        Update: {
          activo?: boolean
          id?: string
          valor?: number
        }
        Relationships: []
      }
      egresos: {
        Row: {
          categoria_id: string
          cierre_id: string
          concepto: string
          id: string
          metodo_pago: string
          monto: number
          unidad_id: string
        }
        Insert: {
          categoria_id: string
          cierre_id: string
          concepto: string
          id?: string
          metodo_pago: string
          monto: number
          unidad_id: string
        }
        Update: {
          categoria_id?: string
          cierre_id?: string
          concepto?: string
          id?: string
          metodo_pago?: string
          monto?: number
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "egresos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_egreso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egresos_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_diarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egresos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      ingresos_digitales: {
        Row: {
          cierre_id: string
          descripcion: string | null
          id: string
          metodo: string
          monto: number
        }
        Insert: {
          cierre_id: string
          descripcion?: string | null
          id?: string
          metodo: string
          monto: number
        }
        Update: {
          cierre_id?: string
          descripcion?: string | null
          id?: string
          metodo?: string
          monto?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingresos_digitales_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_diarios"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_pizza: {
        Row: {
          created_at: string
          diferencia: number | null
          empleado_id: string
          fecha: string
          horneada: number
          id: string
          notas: string | null
          porciones_final: number
          porciones_inicio: number
          porciones_vendidas_tpv: number | null
          ruedas_final: number
          ruedas_inicio: number
        }
        Insert: {
          created_at?: string
          diferencia?: number | null
          empleado_id: string
          fecha: string
          horneada?: number
          id?: string
          notas?: string | null
          porciones_final?: number
          porciones_inicio?: number
          porciones_vendidas_tpv?: number | null
          ruedas_final?: number
          ruedas_inicio?: number
        }
        Update: {
          created_at?: string
          diferencia?: number | null
          empleado_id?: string
          fecha?: string
          horneada?: number
          id?: string
          notas?: string | null
          porciones_final?: number
          porciones_inicio?: number
          porciones_vendidas_tpv?: number | null
          ruedas_final?: number
          ruedas_inicio?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventario_pizza_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          precio: number
          unidad_id: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          precio: number
          unidad_id: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          precio?: number
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          role: string
        }
        Insert: {
          activo?: boolean
          id: string
          nombre: string
          role?: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          role?: string
        }
        Relationships: []
      }
      reglas_prorrateo: {
        Row: {
          activo: boolean
          config_json: Json
          id: string
          regla_tipo: string
          unidad_origen: string
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean
          config_json?: Json
          id?: string
          regla_tipo: string
          unidad_origen: string
          vigente_desde: string
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean
          config_json?: Json
          id?: string
          regla_tipo?: string
          unidad_origen?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reglas_prorrateo_unidad_origen_fkey"
            columns: ["unidad_origen"]
            isOneToOne: false
            referencedRelation: "unidades_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_negocio: {
        Row: {
          activo: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      ventas_producto: {
        Row: {
          cantidad: number
          cierre_id: string
          id: string
          precio_unitario: number
          producto_id: string
          total: number | null
        }
        Insert: {
          cantidad: number
          cierre_id: string
          id?: string
          precio_unitario: number
          producto_id: string
          total?: number | null
        }
        Update: {
          cantidad?: number
          cierre_id?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_producto_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_diarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_producto_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_alertas_admin: {
        Row: {
          cierre_id: string | null
          detalle: string | null
          empleado: string | null
          fecha: string | null
          magnitud: number | null
          tipo_alerta: string | null
        }
        Relationships: []
      }
      v_cuadre_diario: {
        Row: {
          base_inicial: number | null
          cuadrado: boolean | null
          diferencia: number | null
          efectivo_arqueo: number | null
          efectivo_esperado: number | null
          egresos_efectivo_total: number | null
          egresos_transferencia_total: number | null
          empleado_id: string | null
          empleado_nombre: string | null
          estado: string | null
          fecha: string | null
          id: string | null
          ingresos_digitales_total: number | null
          nota_diferencia: string | null
          ventas_tpv_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cierres_diarios_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rentabilidad_unidad: {
        Row: {
          compartidos_prorrateados: number | null
          digitales_prorrateados: number | null
          egresos_directos: number | null
          egresos_totales: number | null
          fecha: string | null
          ingresos_totales: number | null
          rentabilidad_neta: number | null
          unidad_id: string | null
          unidad_nombre: string | null
          ventas_directas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
      is_my_cierre: { Args: { p_cierre_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
