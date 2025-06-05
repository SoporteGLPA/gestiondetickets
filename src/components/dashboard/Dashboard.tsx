
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTickets } from '@/hooks/useTickets';
import { useUsers } from '@/hooks/useUsers';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CreateTicketForm } from '@/components/forms/CreateTicketForm';
import { formatDistanceToNow } from 'date-fns';
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
    case 'cerrado': return 'outline';
    default: return 'default';
  }
};

export function Dashboard() {
  const navigate = useNavigate();
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const { data: tickets = [] } = useTickets();
  const { data: users = [] } = useUsers();

  // Calculate stats from real data
  const activeTickets = tickets.filter(t => ['abierto', 'en_progreso', 'pendiente'].includes(t.status));
  const resolvedTickets = tickets.filter(t => t.status === 'resuelto');
  const totalTickets = tickets.length;
  const recentTickets = tickets.slice(0, 4);

  // Calculate monthly ticket data
  const currentMonth = new Date().getMonth();
  const monthlyTickets = tickets.filter(ticket => {
    const ticketMonth = new Date(ticket.created_at).getMonth();
    return ticketMonth === currentMonth;
  });

  // Generate chart data (simplified for demo)
  const ticketData = [
    { name: 'Ene', total: 45, resueltos: 38 },
    { name: 'Feb', total: 52, resueltos: 41 },
    { name: 'Mar', total: 48, resueltos: 44 },
    { name: 'Abr', total: 61, resueltos: 52 },
    { name: 'May', total: 55, resueltos: 49 },
    { name: 'Jun', total: monthlyTickets.length, resueltos: monthlyTickets.filter(t => t.status === 'resuelto').length },
  ];

  const responseTimeData = [
    { name: 'Lun', tiempo: 2.5 },
    { name: 'Mar', tiempo: 1.8 },
    { name: 'Mié', tiempo: 3.2 },
    { name: 'Jue', tiempo: 2.1 },
    { name: 'Vie', tiempo: 1.9 },
    { name: 'Sáb', tiempo: 4.1 },
    { name: 'Dom', tiempo: 3.8 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general del sistema de soporte técnico
          </p>
        </div>
        <Button onClick={() => setShowCreateTicket(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tickets Activos"
          value={activeTickets.length.toString()}
          description={`${tickets.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length} nuevos hoy`}
          icon={Ticket}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Usuarios"
          value={users.length.toString()}
          description="Usuarios registrados"
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Tickets Resueltos"
          value={resolvedTickets.length.toString()}
          description="Total resueltos"
          icon={CheckCircle}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Satisfacción"
          value="94%"
          description="Promedio usuario"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tickets por Mes</CardTitle>
            <CardDescription>
              Comparación de tickets totales vs resueltos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" />
                <Bar dataKey="resueltos" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiempo de Respuesta</CardTitle>
            <CardDescription>
              Promedio semanal en horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tiempo" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Recientes</CardTitle>
          <CardDescription>
            Últimos tickets reportados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">#{ticket.ticket_number}</span>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority.toUpperCase()}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="font-medium mt-1">{ticket.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {ticket.profiles_customer?.full_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {tickets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay tickets disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTicketForm 
        open={showCreateTicket} 
        onOpenChange={setShowCreateTicket} 
      />
    </div>
  );
}
