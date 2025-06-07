
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Calendar, User, Filter, Archive } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
            Tickets de Soporte
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona y da seguimiento a los tickets de soporte
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant={showClosedTickets ? "default" : "outline"}
            onClick={() => setShowClosedTickets(!showClosedTickets)}
            className={`w-full sm:w-auto ${showClosedTickets ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'}`}
          >
            {showClosedTickets ? (
              <>
                <Filter className="mr-2 h-4 w-4" />
                Tickets Activos
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Tickets Cerrados
              </>
            )}
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4">
        {tickets?.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-2 md:space-y-0">
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
                      <Badge variant="outline" style={{ backgroundColor: ticket.ticket_categories.color + '20' }} className="text-xs">
                        {ticket.ticket_categories.name}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base md:text-lg leading-tight">{ticket.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{ticket.profiles_customer?.full_name}</span>
                    </div>
                    {ticket.profiles_assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Asignado a: {ticket.profiles_assignee.full_name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>
                        {formatDistanceToNow(new Date(ticket.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2 md:pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="flex-1 md:flex-none border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Ver Detalle</span>
                    <span className="sm:hidden">Ver</span>
                  </Button>
                  <TicketOperations 
                    ticketId={ticket.id} 
                    ticketNumber={ticket.ticket_number}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tickets?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
            <h3 className="text-base md:text-lg font-semibold mb-2">
              {showClosedTickets ? 'No hay tickets cerrados' : 'No hay tickets activos'}
            </h3>
            <p className="text-muted-foreground mb-4 text-center text-sm md:text-base">
              {showClosedTickets 
                ? 'No se encontraron tickets cerrados' 
                : 'Crea tu primer ticket para comenzar'
              }
            </p>
            {!showClosedTickets && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
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
