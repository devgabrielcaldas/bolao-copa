import { supabaseClient } from "../config/supabase-config.js";

async function testConnection() {
  const { data, error } = await supabaseClient
    .from("predictions")
    .select("*");

  if (error) {
    console.error("Erro ao conectar no Supabase:", error);
    return;
  }

  console.log("Conexão com Supabase funcionando!");
  console.log("Dados:", data);
}

testConnection();