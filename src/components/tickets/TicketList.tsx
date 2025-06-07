
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Calendar, User } from 'lucide-react';
import { CreateTicketForm } from '@/components/forms/CreateTicketForm';
import { TicketStatusDropdown } from '@/components/tickets/TicketStatusDropdown';
import { TicketOperations } from '@/components/tickets/TicketOperations';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function TicketList() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { data: tickets, isLoading } = useTickets();
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
          <p className="text-muted-foreground">
            Gestiona y da seguimiento a los tickets de soporte
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      <div className="grid gap-4">
        {tickets?.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-sm text-muted-foreground">
                      #{ticket.ticket_number}
                    </span>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                    <TicketStatusDropdown 
                      ticketId={ticket.id} 
                      currentStatus={ticket.status} 
                    />
                    {ticket.ticket_categories && (
                      <Badge variant="outline" style={{ backgroundColor: ticket.ticket_categories.color + '20' }}>
                        {ticket.ticket_categories.name}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{ticket.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{ticket.profiles_customer?.full_name}</span>
                    </div>
                    {ticket.profiles_assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Asignado a: {ticket.profiles_assignee.full_name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(ticket.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalle
                </Button>
                <TicketOperations 
                  ticketId={ticket.id} 
                  ticketNumber={ticket.ticket_number}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tickets?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No hay tickets</h3>
            <p className="text-muted-foreground mb-4">Crea tu primer ticket para comenzar</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Ticket
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateTicketForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
      />
    </div>
  );
}
