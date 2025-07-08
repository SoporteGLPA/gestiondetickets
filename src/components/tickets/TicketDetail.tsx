
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Tag, GitMerge } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { TicketChat } from './TicketChat';
import { TicketStatusDropdown } from './TicketStatusDropdown';
import { DueDateField } from './DueDateField';
import { TicketOperations } from './TicketOperations';

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: ticket, isLoading, refetch } = useQuery({
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

  const mergedInfo = ticket.merged_ticket_info as any;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Ticket #{ticket.ticket_number}</h1>
          <p className="text-muted-foreground">{ticket.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <TicketOperations 
            ticketId={ticket.id} 
            ticketNumber={ticket.ticket_number}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Información de tickets fusionados */}
          {mergedInfo && mergedInfo.originalTickets && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitMerge className="h-5 w-5" />
                  Tickets Fusionados
                </CardTitle>
                <CardDescription>
                  Este ticket contiene información de múltiples tickets fusionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mergedInfo.originalTickets.map((originalTicket: any, index: number) => (
                    <div key={originalTicket.id} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">#{originalTicket.ticket_number}</h4>
                        <Badge variant="outline">
                          {originalTicket.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <h5 className="font-medium mb-1">{originalTicket.title}</h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {originalTicket.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Creado: {formatDistanceToNow(new Date(originalTicket.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  ))}
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    Fusionado el {formatDistanceToNow(new Date(mergedInfo.mergedAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                    {mergedInfo.notes && (
                      <span className="block mt-1">Notas: {mergedInfo.notes}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Chat Section */}
          <Card>
            <CardHeader>
              <CardTitle>Conversación</CardTitle>
              <CardDescription>
                Chat con el cliente y equipo de soporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketChat ticketId={ticket.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium">Estado:</span>
                <TicketStatusDropdown 
                  ticketId={ticket.id} 
                  currentStatus={ticket.status} 
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="font-medium">Prioridad:</span>
                <Badge variant={getPriorityColor(ticket.priority)}>
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>

              {ticket.ticket_categories && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Categoría:</span>
                  <Badge variant="outline" style={{ backgroundColor: ticket.ticket_categories.color + '20' }}>
                    {ticket.ticket_categories.name}
                  </Badge>
                </div>
              )}

              {/* Fecha de Vencimiento */}
              <DueDateField 
                ticketId={ticket.id} 
                currentDueDate={ticket.due_date}
                onUpdate={refetch}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                  <p className="text-sm text-muted-foreground break-all">{ticket.profiles_customer?.email}</p>
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
                    <p className="text-sm text-muted-foreground break-all">{ticket.profiles_assignee.email}</p>
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
