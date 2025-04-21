export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          game_id: string
          creator_name: string
          question: string
          answer: string
          created_at: string
        }
        Insert: {
          game_id?: string
          creator_name: string
          question: string
          answer: string
          created_at?: string
        }
        Update: {
          game_id?: string
          creator_name?: string
          question?: string
          answer?: string
          created_at?: string
        }
      }
      players: {
        Row: {
          player_id: string
          player_name: string
          game_id: string
          joined_at: string
        }
        Insert: {
          player_id?: string
          player_name: string
          game_id: string
          joined_at?: string
        }
        Update: {
          player_id?: string
          player_name?: string
          game_id?: string
          joined_at?: string
        }
      }
    }
  }
}