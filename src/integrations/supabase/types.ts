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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      estagios: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          data_renovacao: string | null
          duracao_meses: number | null
          id: string
          instituicao: string | null
          matricula: string | null
          meses_texto: string | null
          modalidade: string | null
          nome_estagiario: string | null
          pessoa_id: string | null
          renovacao_manual: boolean
          setor: string | null
          status: string | null
          tipo_estagio: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_renovacao?: string | null
          duracao_meses?: number | null
          id?: string
          instituicao?: string | null
          matricula?: string | null
          meses_texto?: string | null
          modalidade?: string | null
          nome_estagiario?: string | null
          pessoa_id?: string | null
          renovacao_manual?: boolean
          setor?: string | null
          status?: string | null
          tipo_estagio?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_renovacao?: string | null
          duracao_meses?: number | null
          id?: string
          instituicao?: string | null
          matricula?: string | null
          meses_texto?: string | null
          modalidade?: string | null
          nome_estagiario?: string | null
          pessoa_id?: string | null
          renovacao_manual?: boolean
          setor?: string | null
          status?: string | null
          tipo_estagio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estagios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "Pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      ferias: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          data_SIAPE: string | null
          dias: number | null
          exercicio: number | null
          id: string
          numero_processo: string | null
          periodo_gozo: string | null
          pessoa_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_SIAPE?: string | null
          dias?: number | null
          exercicio?: number | null
          id?: string
          numero_processo?: string | null
          periodo_gozo?: string | null
          pessoa_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_SIAPE?: string | null
          dias?: number | null
          exercicio?: number | null
          id?: string
          numero_processo?: string | null
          periodo_gozo?: string | null
          pessoa_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferias_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "Pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      Pessoas: {
        Row: {
          ativo: string
          cargo: string | null
          cpf: string
          created_at: string
          data_admissao: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          telefone: string | null
          tipo_vinculo: string
          updated_at: string
        }
        Insert: {
          ativo: string
          cargo?: string | null
          cpf: string
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          telefone?: string | null
          tipo_vinculo: string
          updated_at?: string
        }
        Update: {
          ativo?: string
          cargo?: string | null
          cpf?: string
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          telefone?: string | null
          tipo_vinculo?: string
          updated_at?: string
        }
        Relationships: []
      }
      processos: {
        Row: {
          created_at: string
          data_solicitacao: string | null
          desligamento: string | null
          estagio_id: string | null
          id: string
          link_documento: string | null
          motivo: string | null
          observacoes: string | null
          pessoa_id: string
          renovacoes: number
          sei_protocolo: string | null
          status: string | null
          tipo_processo: string
        }
        Insert: {
          created_at?: string
          data_solicitacao?: string | null
          desligamento?: string | null
          estagio_id?: string | null
          id?: string
          link_documento?: string | null
          motivo?: string | null
          observacoes?: string | null
          pessoa_id: string
          renovacoes?: number
          sei_protocolo?: string | null
          status?: string | null
          tipo_processo: string
        }
        Update: {
          created_at?: string
          data_solicitacao?: string | null
          desligamento?: string | null
          estagio_id?: string | null
          id?: string
          link_documento?: string | null
          motivo?: string | null
          observacoes?: string | null
          pessoa_id?: string
          renovacoes?: number
          sei_protocolo?: string | null
          status?: string | null
          tipo_processo?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_estagio_id_fkey"
            columns: ["estagio_id"]
            isOneToOne: false
            referencedRelation: "estagios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "Pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "colaborador"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "colaborador"],
    },
  },
} as const
