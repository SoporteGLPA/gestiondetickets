
import { useState } from 'react';
import { useTicketOperations } from '@/hooks/useTicketOperations';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Trash2, GitMerge, UserPlus, ArrowRightLeft } from 'lucide-react';

interface TicketOperationsProps {
  ticketId: string;
  ticketNumber: string;
}

export function TicketOperations({ ticketId, ticketNumber }: TicketOperationsProps) {
  const { hasRole } = useAuth();
  const { data: tickets } = useTickets();
  const {
    deleteTicketMutation,
    mergeTicketsMutation,
    assignTicketMutation,
    transferTicketMutation,
    availableAgents,
  } = useTicketOperations();

  const [dialogType, setDialogType] = useState<'merge' | 'assign' | 'transfer' | null>(null);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [notes, setNotes] = useState('');

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar el ticket #${ticketNumber}?`)) {
      await deleteTicketMutation.mutateAsync(ticketId);
    }
  };

  const handleOperation = async () => {
    try {
      switch (dialogType) {
        case 'merge':
          if (selectedTicket) {
            await mergeTicketsMutation.mutateAsync({
              sourceTicketId: ticketId,
              targetTicketId: selectedTicket,
              notes,
            });
          }
          break;
        case 'assign':
          if (selectedAgent) {
            await assignTicketMutation.mutateAsync({
              ticketId,
              assigneeId: selectedAgent,
              notes,
            });
          }
          break;
        case 'transfer':
          if (selectedAgent) {
            await transferTicketMutation.mutateAsync({
              ticketId,
              newAssigneeId: selectedAgent,
              notes,
            });
          }
          break;
      }
      closeDialog();
    } catch (error) {
      console.error('Error performing operation:', error);
    }
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedTicket('');
    setSelectedAgent('');
    setNotes('');
  };

  const availableTickets = tickets?.filter(t => t.id !== ticketId && t.status !== 'cerrado');

  if (!hasRole(['admin', 'agent'])) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setDialogType('assign')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Asignar Agente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('transfer')}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transferir Ticket
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('merge')}>
            <GitMerge className="h-4 w-4 mr-2" />
            Unir Tickets
          </DropdownMenuItem>
          {hasRole(['admin']) && (
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Ticket
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogType !== null} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'merge' && 'Unir Tickets'}
              {dialogType === 'assign' && 'Asignar Agente'}
              {dialogType === 'transfer' && 'Transferir Ticket'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'merge' && 'Selecciona el ticket destino para unir este ticket'}
              {dialogType === 'assign' && 'Selecciona un agente para asignar este ticket'}
              {dialogType === 'transfer' && 'Selecciona un agente para transferir este ticket'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogType === 'merge' && (
              <div>
                <Label htmlFor="target-ticket">Ticket Destino</Label>
                <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTickets?.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        #{ticket.ticket_number} - {ticket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(dialogType === 'assign' || dialogType === 'transfer') && (
              <div>
                <Label htmlFor="agent">
                  {dialogType === 'assign' ? 'Agente' : 'Nuevo Agente'}
                </Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade notas sobre esta operación..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button 
                onClick={handleOperation}
                disabled={
                  (dialogType === 'merge' && !selectedTicket) ||
                  ((dialogType === 'assign' || dialogType === 'transfer') && !selectedAgent)
                }
              >
                {dialogType === 'merge' && 'Unir Tickets'}
                {dialogType === 'assign' && 'Asignar'}
                {dialogType === 'transfer' && 'Transferir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
