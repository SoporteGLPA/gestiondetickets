
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DueDateFieldProps {
  ticketId: string;
  currentDueDate?: string | null;
  onUpdate?: () => void;
}

export function DueDateField({ ticketId, currentDueDate, onUpdate }: DueDateFieldProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [dueDate, setDueDate] = useState(
    currentDueDate ? format(new Date(currentDueDate), 'yyyy-MM-dd') : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Solo agentes y administradores pueden editar la fecha de vencimiento
  const canEdit = profile?.role === 'agent' || profile?.role === 'admin';

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          due_date: dueDate ? new Date(dueDate).toISOString() : null 
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Fecha actualizada",
        description: "La fecha de vencimiento ha sido actualizada",
      });

      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la fecha de vencimiento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDueDate(currentDueDate ? format(new Date(currentDueDate), 'yyyy-MM-dd') : '');
    setIsEditing(false);
  };

  if (!canEdit && !currentDueDate) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <Calendar className="h-4 w-4" />
      <span className="font-medium">Fecha de Vencimiento:</span>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-auto border-black"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-[#047857] hover:bg-[#047857]/90 border border-black"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {currentDueDate ? (
            <span className="text-sm">
              {format(new Date(currentDueDate), 'dd/MM/yyyy', { locale: es })}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No establecida</span>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
