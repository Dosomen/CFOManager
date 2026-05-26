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
      importe: {
        Row: {
          anzahl_konten: number
          anzahl_salden: number
          created_at: string
          created_by: string
          dateiname: string
          error_message: string | null
          id: string
          mandant_id: string
          periode_jahr: number
          periode_monat: number
          status: Database["public"]["Enums"]["import_status"]
          summe_haben: number
          summe_soll: number
        }
        Insert: {
          anzahl_konten?: number
          anzahl_salden?: number
          created_at?: string
          created_by: string
          dateiname: string
          error_message?: string | null
          id?: string
          mandant_id: string
          periode_jahr: number
          periode_monat: number
          status: Database["public"]["Enums"]["import_status"]
          summe_haben?: number
          summe_soll?: number
        }
        Update: {
          anzahl_konten?: number
          anzahl_salden?: number
          created_at?: string
          created_by?: string
          dateiname?: string
          error_message?: string | null
          id?: string
          mandant_id?: string
          periode_jahr?: number
          periode_monat?: number
          status?: Database["public"]["Enums"]["import_status"]
          summe_haben?: number
          summe_soll?: number
        }
        Relationships: [
          {
            foreignKeyName: "importe_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandanten"
            referencedColumns: ["id"]
          },
        ]
      }
      konten: {
        Row: {
          bezeichnung: string
          created_at: string
          id: string
          mandant_id: string
          nummer: string
          typ: Database["public"]["Enums"]["konten_typ"]
          updated_at: string
        }
        Insert: {
          bezeichnung: string
          created_at?: string
          id?: string
          mandant_id: string
          nummer: string
          typ: Database["public"]["Enums"]["konten_typ"]
          updated_at?: string
        }
        Update: {
          bezeichnung?: string
          created_at?: string
          id?: string
          mandant_id?: string
          nummer?: string
          typ?: Database["public"]["Enums"]["konten_typ"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "konten_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandanten"
            referencedColumns: ["id"]
          },
        ]
      }
      mandant_users: {
        Row: {
          created_at: string
          mandant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mandant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          mandant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandant_users_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandanten"
            referencedColumns: ["id"]
          },
        ]
      }
      mandanten: {
        Row: {
          basiswaehrung: string
          created_at: string
          created_by: string
          diamant_mandantennummer: string | null
          geschaeftsjahr_start: string
          id: string
          name: string
          rechtsform: Database["public"]["Enums"]["rechtsform"]
          ust_idnr: string | null
        }
        Insert: {
          basiswaehrung?: string
          created_at?: string
          created_by: string
          diamant_mandantennummer?: string | null
          geschaeftsjahr_start?: string
          id?: string
          name: string
          rechtsform: Database["public"]["Enums"]["rechtsform"]
          ust_idnr?: string | null
        }
        Update: {
          basiswaehrung?: string
          created_at?: string
          created_by?: string
          diamant_mandantennummer?: string | null
          geschaeftsjahr_start?: string
          id?: string
          name?: string
          rechtsform?: Database["public"]["Enums"]["rechtsform"]
          ust_idnr?: string | null
        }
        Relationships: []
      }
      salden: {
        Row: {
          created_at: string
          eb_haben: number
          eb_soll: number
          id: string
          import_id: string
          jahr: number
          konto_id: string
          mandant_id: string
          monat: number
          saldo_haben: number
          saldo_soll: number
          vk_haben: number
          vk_soll: number
        }
        Insert: {
          created_at?: string
          eb_haben?: number
          eb_soll?: number
          id?: string
          import_id: string
          jahr: number
          konto_id: string
          mandant_id: string
          monat: number
          saldo_haben?: number
          saldo_soll?: number
          vk_haben?: number
          vk_soll?: number
        }
        Update: {
          created_at?: string
          eb_haben?: number
          eb_soll?: number
          id?: string
          import_id?: string
          jahr?: number
          konto_id?: string
          mandant_id?: string
          monat?: number
          saldo_haben?: number
          saldo_soll?: number
          vk_haben?: number
          vk_soll?: number
        }
        Relationships: [
          {
            foreignKeyName: "salden_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "importe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salden_konto_id_fkey"
            columns: ["konto_id"]
            isOneToOne: false
            referencedRelation: "konten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salden_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandanten"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active_mandant_id: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_mandant_id?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_mandant_id?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_active_mandant_id_fkey"
            columns: ["active_mandant_id"]
            isOneToOne: false
            referencedRelation: "mandanten"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      salden_monthly_by_typ: {
        Row: {
          anzahl_konten: number | null
          jahr: number | null
          mandant_id: string | null
          monat: number | null
          sum_eb_haben: number | null
          sum_eb_soll: number | null
          sum_saldo_haben: number | null
          sum_saldo_soll: number | null
          sum_vk_haben: number | null
          sum_vk_soll: number | null
          typ: Database["public"]["Enums"]["konten_typ"] | null
        }
        Relationships: [
          {
            foreignKeyName: "salden_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandanten"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      import_salden: {
        Args: {
          p_dateiname: string
          p_jahr: number
          p_konten: Json
          p_mandant_id: string
          p_monat: number
          p_salden: Json
          p_summe_haben: number
          p_summe_soll: number
        }
        Returns: Json
      }
      user_has_mandant_access: {
        Args: { p_mandant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      import_status: "erfolgreich" | "ueberschrieben" | "fehlgeschlagen"
      konten_typ: "Aktiva" | "Passiva" | "Aufwand" | "Ertrag"
      rechtsform:
        | "GmbH"
        | "AG"
        | "UG"
        | "GmbH_und_Co_KG"
        | "Einzelunternehmen"
        | "Sonstiges"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      import_status: ["erfolgreich", "ueberschrieben", "fehlgeschlagen"],
      konten_typ: ["Aktiva", "Passiva", "Aufwand", "Ertrag"],
      rechtsform: [
        "GmbH",
        "AG",
        "UG",
        "GmbH_und_Co_KG",
        "Einzelunternehmen",
        "Sonstiges",
      ],
    },
  },
} as const
