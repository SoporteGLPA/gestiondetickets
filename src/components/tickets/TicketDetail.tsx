
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) throw new Error('No ticket ID provided');
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles_customer:profiles!customer_id(full_name, email),
          profiles_assignee:profiles!assignee_id(full_name, email),
          ticket_categories(name, color)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Ticket no encontrado</h1>
          <Button onClick={() => navigate('/tickets')} className="mt-4">
            Volver a tickets
          </Button>
        </div>
      </div>
    );
  }

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
      case 'resuelto': return 'default';
      case 'cerrado': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ticket #{ticket.ticket_number}</h1>
          <p className="text-muted-foreground">{ticket.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {ticket.resolution_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas de Resolución</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.resolution_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Estado:</span>
                <Badge variant={getStatusColor(ticket.status)}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="font-medium">Prioridad:</span>
                <Badge variant={getPriorityColor(ticket.priority)}>
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>

              {ticket.ticket_categories && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Categoría:</span>
                  <Badge variant="outline" style={{ backgroundColor: ticket.ticket_categories.color + '20' }}>
                    {ticket.ticket_categories.name}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Creado:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Cliente:</span>
                </div>
                <div className="ml-6">
                  <p className="font-medium">{ticket.profiles_customer?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{ticket.profiles_customer?.email}</p>
                </div>
              </div>

              {ticket.profiles_assignee && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Asignado a:</span>
                  </div>
                  <div className="ml-6">
                    <p className="font-medium">{ticket.profiles_assignee.full_name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.profiles_assignee.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
