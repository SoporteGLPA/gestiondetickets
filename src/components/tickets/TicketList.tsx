
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Calendar, User, Archive, ArchiveRestore } from 'lucide-react';
import { CreateTicketForm } from '@/components/forms/CreateTicketForm';
import { TicketStatusDropdown } from '@/components/tickets/TicketStatusDropdown';
import { TicketOperations } from '@/components/tickets/TicketOperations';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function TicketList() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showClosedTickets, setShowClosedTickets] = useState(false);
  const { data: tickets, isLoading } = useTickets(showClosedTickets);

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
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {showClosedTickets ? 'Tickets Cerrados' : 'Tickets de Soporte'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {showClosedTickets 
              ? 'Historial de tickets resueltos y cerrados'
              : 'Gestiona y da seguimiento a los tickets de soporte'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant={showClosedTickets ? "default" : "outline"}
            onClick={() => setShowClosedTickets(!showClosedTickets)}
            className="w-full sm:w-auto"
          >
            {showClosedTickets ? (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Ver Tickets Activos
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Ver Tickets Cerrados
              </>
            )}
          </Button>
          {!showClosedTickets && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:gap-4">
        {tickets?.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                  <div className="flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-xs md:text-sm text-muted-foreground">
                        #{ticket.ticket_number}
                      </span>
                      <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
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
                    <h3 className="font-semibold text-base md:text-lg mb-1">{ticket.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {ticket.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{ticket.profiles_customer?.full_name}</span>
                      </div>
                      {ticket.profiles_assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">Asignado a: {ticket.profiles_assignee.full_name}</span>
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalle
                  </Button>
                  {!showClosedTickets && (
                    <TicketOperations 
                      ticketId={ticket.id} 
                      ticketNumber={ticket.ticket_number}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tickets?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
            <h3 className="text-lg font-semibold mb-2">
              {showClosedTickets ? 'No hay tickets cerrados' : 'No hay tickets'}
            </h3>
            <p className="text-muted-foreground mb-4 text-center">
              {showClosedTickets 
                ? 'No se encontraron tickets cerrados en el sistema'
                : 'Crea tu primer ticket para comenzar'
              }
            </p>
            {!showClosedTickets && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Ticket
              </Button>
            )}
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
