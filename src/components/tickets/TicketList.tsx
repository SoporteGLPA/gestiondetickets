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
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  User,
  Clock
} from 'lucide-react';

const tickets: TicketType[] = [
  {
    id: '001',
    title: 'Problema con correo corporativo',
    description: 'No puedo acceder a mi cuenta de correo desde Outlook',
    priority: 'Alta',
    status: 'Abierto',
    category: 'Email',
    customer: 'María García',
    assignee: 'Juan Pérez',
    created: '2024-06-04 09:30',
    updated: '2024-06-04 10:15'
  },
  {
    id: '002',
    title: 'Error en sistema de ventas',
    description: 'El sistema se bloquea al intentar generar reportes',
    priority: 'Media',
    status: 'En Progreso',
    category: 'Software',
    customer: 'Juan López',
    assignee: 'Ana Martín',
    created: '2024-06-04 08:45',
    updated: '2024-06-04 09:20'
  },
  {
    id: '003',
    title: 'Solicitud de acceso VPN',
    description: 'Necesito acceso VPN para trabajar desde casa',
    priority: 'Baja',
    status: 'Pendiente',
    category: 'Red',
    customer: 'Ana Martín',
    assignee: null,
    created: '2024-06-03 16:20',
    updated: '2024-06-03 16:20'
  },
  {
    id: '004',
    title: 'Configuración de impresora',
    description: 'No puedo imprimir desde mi equipo',
    priority: 'Media',
    status: 'Resuelto',
    category: 'Hardware',
    customer: 'Carlos Ruiz',
    assignee: 'Juan Pérez',
    created: '2024-06-03 14:30',
    updated: '2024-06-04 11:00'
  }
];

type TicketType = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  customer: string;
  assignee: string | null;
  created: string;
  updated: string;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Alta': return 'destructive';
    case 'Media': return 'default';
    case 'Baja': return 'secondary';
    default: return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Abierto': return 'destructive';
    case 'En Progreso': return 'default';
    case 'Pendiente': return 'secondary';
    case 'Resuelto': return 'outline';
    case 'Cerrado': return 'secondary';
    default: return 'default';
  }
};

export function TicketList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTicketsByStatus = (status: string) => {
    if (status === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === status);
  };

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
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
                <SelectItem value="Abierto">Abierto</SelectItem>
                <SelectItem value="En Progreso">En Progreso</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Resuelto">Resuelto</SelectItem>
                <SelectItem value="Cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
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
          <TabsTrigger value="Abierto">
            Abiertos ({getTicketsByStatus('Abierto').length})
          </TabsTrigger>
          <TabsTrigger value="En Progreso">
            En Progreso ({getTicketsByStatus('En Progreso').length})
          </TabsTrigger>
          <TabsTrigger value="Pendiente">
            Pendientes ({getTicketsByStatus('Pendiente').length})
          </TabsTrigger>
          <TabsTrigger value="Resuelto">
            Resueltos ({getTicketsByStatus('Resuelto').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TicketTable tickets={filteredTickets} />
        </TabsContent>
        <TabsContent value="Abierto">
          <TicketTable tickets={getTicketsByStatus('Abierto')} />
        </TabsContent>
        <TabsContent value="En Progreso">
          <TicketTable tickets={getTicketsByStatus('En Progreso')} />
        </TabsContent>
        <TabsContent value="Pendiente">
          <TicketTable tickets={getTicketsByStatus('Pendiente')} />
        </TabsContent>
        <TabsContent value="Resuelto">
          <TicketTable tickets={getTicketsByStatus('Resuelto')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketTable({ tickets }: { tickets: TicketType[] }) {
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
                    <span className="font-mono text-sm text-muted-foreground">#{ticket.id}</span>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{ticket.title}</h3>
                  <p className="text-muted-foreground text-sm">{ticket.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center">
                      <User className="mr-1 h-3 w-3" />
                      Cliente: {ticket.customer}
                    </div>
                    {ticket.assignee && (
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        Asignado: {ticket.assignee}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Creado: {ticket.created}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      Actualizado: {ticket.updated}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
