
import { DatabaseConfig } from '@/components/database/DatabaseConfig';

export default function Database() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de Base de Datos</h2>
        <p className="text-muted-foreground">
          Configura la conexión a tu base de datos local o utiliza Supabase.
        </p>
      </div>
      
      <DatabaseConfig />
    </div>
  );
}
