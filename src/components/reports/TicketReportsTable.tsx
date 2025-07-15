import { useState } from 'react';
import { useTicketReports, type ReportFilters } from '@/hooks/useTicketReports';
import { useDepartments } from '@/hooks/useDepartments';
import { useCategories } from '@/hooks/useCategories';
import { useTicketStatusOptions } from '@/hooks/useTicketStatusOptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Filter, X, FileText, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Filters {
  title?: string;
  department_id?: string;
  category_id?: string;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'alta': return 'destructive';
    case 'media': return 'default';
    case 'baja': return 'secondary';
    default: return 'default';
  }
};

export function TicketReportsTable() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const { data: tickets } = useTicketReports(filters);
  const { data: departments } = useDepartments();
  const { data: categories } = useCategories();
  const { data: statusOptions } = useTicketStatusOptions();

  const handleFilterChange = (key: keyof ReportFilters, value: string | undefined) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportToPDF = async () => {
    if (!tickets || tickets.length === 0) return;

    try {
      // Importación dinámica para evitar problemas de SSR
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      // Verificar que autoTable esté disponible
      if (typeof autoTable === 'function') {
        // Agregar el plugin manualmente si es necesario
        (jsPDF as any).autoTable = autoTable;
      }

      const doc = new jsPDF();

      // Configurar fuente y título
      doc.setFontSize(16);
      doc.text('Reporte de Tickets', 14, 15);

      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 25);

      // Preparar datos para la tabla
      const tableData = tickets.map(ticket => [
        ticket.ticket_number,
        ticket.title,
        ticket.customer_name,
        ticket.assignee_name || 'Sin asignar',
        ticket.priority,
        ticket.status,
        ticket.category_name || 'Sin categoría',
        ticket.department_name || 'Sin departamento',
        ticket.response_time_hours ? `${ticket.response_time_hours.toFixed(1)}h` : 'N/A',
        ticket.resolution_time_hours ? `${ticket.resolution_time_hours.toFixed(1)}h` : 'N/A',
        new Date(ticket.created_at).toLocaleDateString('es-ES')
      ]);

      // Verificar si autoTable está disponible en el objeto doc
      const autoTableFunction = (doc as any).autoTable || autoTable;
      
      if (typeof autoTableFunction === 'function') {
        autoTableFunction(doc, {
          head: [[
            'Ticket',
            'Título',
            'Cliente',
            'Asignado',
            'Prioridad',
            'Estado',
            'Categoría',
            'Departamento',
            'T. Respuesta',
            'T. Resolución',
            'Creado'
          ]],
          body: tableData,
          startY: 35,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [16, 185, 129] },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 15 },
            5: { cellWidth: 15 },
            6: { cellWidth: 20 },
            7: { cellWidth: 20 },
            8: { cellWidth: 15 },
            9: { cellWidth: 15 },
            10: { cellWidth: 20 }
          }
        });
      } else {
        // Fallback sin autoTable
        doc.setFontSize(10);
        doc.text('Error: No se pudo generar la tabla. Los datos están disponibles en formato simple:', 14, 40);
        
        let yPosition = 50;
        tickets.slice(0, 20).forEach((ticket, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`, 14, yPosition);
          yPosition += 8;
        });
      }

      doc.save(`reporte-tickets-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Reporte exportado",
        description: "El reporte PDF ha sido descargado exitosamente",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el reporte PDF",
      });
    }
  };

  if (!tickets) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
          <p className="text-muted-foreground">No se encontraron tickets con los filtros aplicados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Reportes de Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Input
            placeholder="Buscar por título..."
            value={filters.title || ''}
            onChange={(e) => handleFilterChange('title', e.target.value)}
            className="focus:ring-emerald-500 focus:border-emerald-500"
          />

          <Select value={filters.department_id || ''} onValueChange={(value) => handleFilterChange('department_id', value || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.category_id || ''} onValueChange={(value) => handleFilterChange('category_id', value || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {statusOptions?.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priority || ''} onValueChange={(value) => handleFilterChange('priority', value || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={Object.keys(filters).length === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button onClick={exportToPDF} disabled={!tickets || tickets.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filtros de fecha */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Fecha desde:</label>
            <Input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
              className="focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Fecha hasta:</label>
            <Input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
              className="focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filtros activos */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {value}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange(key as keyof ReportFilters, undefined)}
                  />
                </Badge>
              );
            })}
          </div>
        )}

        {/* Tabla */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Asignado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>T. Respuesta</TableHead>
                <TableHead>T. Resolución</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                  <TableCell>{ticket.customer_name}</TableCell>
                  <TableCell>{ticket.assignee_name || 'Sin asignar'}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: statusOptions?.find(s => s.value === ticket.status)?.color || '#6b7280'
                        }}
                      />
                      <span className="text-sm">
                        {statusOptions?.find(s => s.value === ticket.status)?.label || ticket.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{ticket.category_name || 'Sin categoría'}</TableCell>
                  <TableCell>{ticket.department_name || 'Sin departamento'}</TableCell>
                  <TableCell>
                    {ticket.response_time_hours ? (
                      <span className="text-sm">
                        {ticket.response_time_hours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.resolution_time_hours ? (
                      <span className="text-sm">
                        {ticket.resolution_time_hours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {tickets?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron tickets con los filtros aplicados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
