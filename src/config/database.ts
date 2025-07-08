
export interface DatabaseConfig {
  type: 'supabase' | 'postgres';
  supabase?: {
    url: string;
    anonKey: string;
  };
  postgres?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

// Configuración por defecto
const defaultConfig: DatabaseConfig = {
  type: 'supabase',
  supabase: {
    url: "https://uujdekzsunzvkramesvs.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amRla3pzdW56dmtyYW1lc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTgwOTMsImV4cCI6MjA2NDYzNDA5M30.dk6ZYUtIk3cmyTrvoEB-ww1jgTvya0U8W2BOhAN2gTU"
  }
};

// Configuración para desarrollo local
const localConfig: DatabaseConfig = {
  type: 'postgres',
  postgres: {
    host: localStorage.getItem('DB_HOST') || 'localhost',
    port: parseInt(localStorage.getItem('DB_PORT') || '5432'),
    database: localStorage.getItem('DB_NAME') || 'tickets_db',
    username: localStorage.getItem('DB_USER') || 'postgres',
    password: localStorage.getItem('DB_PASSWORD') || 'postgres',
    ssl: false
  }
};

// Función para obtener la configuración actual
export function getDatabaseConfig(): DatabaseConfig {
  const useLocal = localStorage.getItem('USE_LOCAL_DB') === 'true';
  return useLocal ? localConfig : defaultConfig;
}

// Función para cambiar entre configuraciones
export function toggleDatabaseMode(useLocal: boolean) {
  localStorage.setItem('USE_LOCAL_DB', useLocal.toString());
  window.location.reload(); // Reiniciar para aplicar cambios
}

// Función para actualizar configuración de PostgreSQL
export function updatePostgresConfig(config: DatabaseConfig['postgres']) {
  if (config) {
    localStorage.setItem('DB_HOST', config.host);
    localStorage.setItem('DB_PORT', config.port.toString());
    localStorage.setItem('DB_NAME', config.database);
    localStorage.setItem('DB_USER', config.username);
    localStorage.setItem('DB_PASSWORD', config.password);
  }
}
