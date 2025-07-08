
import { TicketReportsTable } from '@/components/reports/TicketReportsTable';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Analíticas</h1>
        <p className="text-muted-foreground">
          Análisis detallado del rendimiento del sistema de soporte
        </p>
      </div>

      <TicketReportsTable />
    </div>
  );
};

export default Reports;
