
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Calendar,
  User,
  Clock,
  Loader2
} from 'lucide-react';
import { useTickets, Ticket } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'alta': return 'destructive';
    case 'media': return 'default';
    case 'baja': return 'secondary';
    default: return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'abierto': return 'destructive';
    case 'en_progreso': return 'default';
    case 'pendiente': return 'secondary';
    case 'resuelto': return 'outline';
    case 'cerrado': return 'secondary';
    default: return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'abierto': return 'Abierto';
    case 'en_progreso': return 'En Progreso';
    case 'pendiente': return 'Pendiente';
    case 'resuelto': return 'Resuelto';
    case 'cerrado': return 'Cerrado';
    default: return status;
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'alta': return 'Alta';
    case 'media': return 'Media';
    case 'baja': return 'Baja';
    default: return priority;
  }
};

export function TicketList() {
  const { data: tickets = [], isLoading, error } = useTickets();
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.profiles_customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTicketsByStatus = (status: string) => {
    if (status === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando tickets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error al cargar tickets</h3>
          <p className="text-muted-foreground">Por favor, intenta nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Tickets</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a todos los tickets del sistema
          </p>
        </div>
        {hasRole(['admin', 'agent', 'user']) && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por ID, título o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Todos ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="abierto">
            Abiertos ({getTicketsByStatus('abierto').length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso">
            En Progreso ({getTicketsByStatus('en_progreso').length})
          </TabsTrigger>
          <TabsTrigger value="pendiente">
            Pendientes ({getTicketsByStatus('pendiente').length})
          </TabsTrigger>
          <TabsTrigger value="resuelto">
            Resueltos ({getTicketsByStatus('resuelto').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TicketTable tickets={filteredTickets} />
        </TabsContent>
        <TabsContent value="abierto">
          <TicketTable tickets={getTicketsByStatus('abierto')} />
        </TabsContent>
        <TabsContent value="en_progreso">
          <TicketTable tickets={getTicketsByStatus('en_progreso')} />
        </TabsContent>
        <TabsContent value="pendiente">
          <TicketTable tickets={getTicketsByStatus('pendiente')} />
        </TabsContent>
        <TabsContent value="resuelto">
          <TicketTable tickets={getTicketsByStatus('resuelto')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const { hasRole } = useAuth();

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold mb-2">No hay tickets</h3>
          <p className="text-muted-foreground text-center">
            No se encontraron tickets que coincidan con los filtros aplicados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-6 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-4 flex-1">
                <div className="flex flex-col space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm text-muted-foreground">#{ticket.ticket_number}</span>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {getPriorityLabel(ticket.priority)}
                    </Badge>
                    <Badge variant={getStatusColor(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                    {ticket.ticket_categories && (
                      <Badge variant="outline" style={{ color: ticket.ticket_categories.color }}>
                        {ticket.ticket_categories.name}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{ticket.title}</h3>
                  <p className="text-muted-foreground text-sm">{ticket.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center">
                      <User className="mr-1 h-3 w-3" />
                      Cliente: {ticket.profiles_customer.full_name}
                    </div>
                    {ticket.profiles_assignee && (
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        Asignado: {ticket.profiles_assignee.full_name}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Creado: {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      Actualizado: {format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                {hasRole(['admin', 'agent']) && (
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
