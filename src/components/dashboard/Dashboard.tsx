
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
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CreateTicketForm } from '@/components/forms/CreateTicketForm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMonthlyTicketStats, useResponseTimeStats } from '@/hooks/useDashboardStats';

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
  const { user, hasRole } = useAuth();
  
  // Usar hooks para datos reales de gráficos
  const { data: monthlyStats = [], isLoading: loadingMonthly } = useMonthlyTicketStats();
  const { data: responseTimeData = [], isLoading: loadingResponseTime } = useResponseTimeStats();

  // Filter tickets based on user role
  const userTickets = hasRole(['user']) ? tickets.filter(t => t.customer_id === user?.id) : tickets;
  
  // Calculate stats from filtered data
  const activeTickets = userTickets.filter(t => ['abierto', 'en_progreso', 'pendiente'].includes(t.status));
  const resolvedTickets = userTickets.filter(t => t.status === 'resuelto');
  const recentTickets = userTickets.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {hasRole(['user']) ? 'Resumen de tus tickets y actividad' : 'Resumen general del sistema de soporte técnico'}
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
          title={hasRole(['user']) ? "Mis Tickets Activos" : "Tickets Activos"}
          value={activeTickets.length.toString()}
          description={`${userTickets.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length} nuevos hoy`}
          icon={Ticket}
          trend={{ value: 8, isPositive: true }}
        />
        {!hasRole(['user']) && (
          <StatsCard
            title="Total Usuarios"
            value={users.length.toString()}
            description="Usuarios registrados"
            icon={Users}
            trend={{ value: 15, isPositive: true }}
          />
        )}
        <StatsCard
          title={hasRole(['user']) ? "Mis Tickets Resueltos" : "Tickets Resueltos"}
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
            <CardTitle>{hasRole(['user']) ? 'Mis Tickets por Mes' : 'Tickets por Mes'}</CardTitle>
            <CardDescription>
              Comparación de tickets totales vs resueltos (últimos 6 meses)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  <Bar dataKey="resueltos" fill="#10b981" name="Resueltos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiempo de Respuesta</CardTitle>
            <CardDescription>
              Promedio semanal en horas (últimos 7 días)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingResponseTime ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} horas`, 'Tiempo promedio']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tiempo" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                    name="Tiempo de respuesta"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>{hasRole(['user']) ? 'Mis Tickets Recientes' : 'Tickets Recientes'}</CardTitle>
          <CardDescription>
            {hasRole(['user']) ? 'Tus últimos tickets reportados' : 'Últimos tickets reportados en el sistema'}
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
                    {!hasRole(['user']) && (
                      <p className="text-sm text-muted-foreground">
                        Cliente: {ticket.profiles_customer?.full_name}
                      </p>
                    )}
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

          {userTickets.length === 0 && (
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
