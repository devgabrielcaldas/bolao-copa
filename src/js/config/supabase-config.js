const SUPABASE_URL = "https://ytnqlexkqxqjcfmyyasj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bnFsZXhrcXhxamNmbXl5YXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODQwMTQsImV4cCI6MjA5NDI2MDAxNH0.tQmiXyE6kcBkq_nx7rLSComV8QKXOYPWOxpRc2lghRM";

export const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);