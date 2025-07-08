
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

async function migrateFromSupabase() {
  // Configuración de Supabase
  const supabaseUrl = "https://uujdekzsunzvkramesvs.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amRla3pzdW56dmtyYW1lc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTgwOTMsImV4cCI6MjA2NDYzNDA5M30.dk6ZYUtIk3cmyTrvoEB-ww1jgTvya0U8W2BOhAN2gTU";
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Configuración de PostgreSQL local
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tickets_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true'
  });

  const tables = [
    'profiles',
    'company_settings',
    'departments',
    'department_categories',
    'collaboration_areas',
    'user_collaboration_areas',
    'ticket_categories',
    'custom_ticket_statuses',
    'tickets',
    'ticket_comments',
    'ticket_attachments',
    'ticket_operations',
    'knowledge_articles',
    'article_attachments',
    'article_links',
    'article_ratings',
    'notification_views',
    'push_subscriptions'
  ];

  try {
    console.log('🔄 Iniciando migración desde Supabase...');

    for (const table of tables) {
      console.log(`📦 Migrando tabla: ${table}`);
      
      // Obtener datos de Supabase
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`❌ Error obteniendo datos de ${table}:`, error.message);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`  ⚠️  No hay datos en ${table}`);
        continue;
      }

      // Limpiar tabla local
      await pool.query(`DELETE FROM ${table}`);

      // Insertar datos en PostgreSQL local
      for (const row of data) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`);

        const query = `
          INSERT INTO ${table} (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT DO NOTHING
        `;

        try {
          await pool.query(query, values);
        } catch (insertError) {
          console.error(`❌ Error insertando en ${table}:`, insertError.message);
        }
      }

      console.log(`  ✅ ${data.length} registros migrados`);
    }

    console.log('\n🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateFromSupabase();
