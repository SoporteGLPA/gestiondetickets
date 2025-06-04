
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

const ticketData = [
  { name: 'Ene', total: 45, resueltos: 38 },
  { name: 'Feb', total: 52, resueltos: 41 },
  { name: 'Mar', total: 48, resueltos: 44 },
  { name: 'Abr', total: 61, resueltos: 52 },
  { name: 'May', total: 55, resueltos: 49 },
  { name: 'Jun', total: 67, resueltos: 58 },
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

const recentTickets = [
  { id: '001', title: 'Problema con correo corporativo', priority: 'Alta', status: 'Abierto', customer: 'María García', time: '5 min' },
  { id: '002', title: 'Error en sistema de ventas', priority: 'Media', status: 'En Progreso', customer: 'Juan López', time: '15 min' },
  { id: '003', title: 'Solicitud de acceso VPN', priority: 'Baja', status: 'Pendiente', customer: 'Ana Martín', time: '1 hora' },
  { id: '004', title: 'Configuración de impresora', priority: 'Media', status: 'Resuelto', customer: 'Carlos Ruiz', time: '2 horas' },
];

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
    default: return 'default';
  }
};

export function Dashboard() {
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tickets Activos"
          value="23"
          description="12 nuevos hoy"
          icon={Ticket}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Tiempo Promedio"
          value="2.3h"
          description="Tiempo de respuesta"
          icon={Clock}
          trend={{ value: 15, isPositive: false }}
        />
        <StatsCard
          title="Tickets Resueltos"
          value="156"
          description="Este mes"
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
                      <span className="font-medium">#{ticket.id}</span>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium mt-1">{ticket.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {ticket.customer}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    hace {ticket.time}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
