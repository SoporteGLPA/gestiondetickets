
interface TicketDescriptionProps {
  description: string;
}

export function TicketDescription({ description }: TicketDescriptionProps) {
  const renderDescription = (text: string) => {
    // Buscar referencias de imágenes en el formato [IMAGEN:id]
    const imageRegex = /\[IMAGEN:([^\]]+)\]/g;
    const parts = text.split(imageRegex);
    
    return parts.map((part, index) => {
      // Si el índice es impar, es un ID de imagen
      if (index % 2 === 1) {
        // Por ahora, mostrar un placeholder ya que las imágenes están en memoria
        // En una implementación real, necesitarías guardar las imágenes en el servidor
        return (
          <div key={index} className="my-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center text-gray-500">
              <span className="text-sm">Imagen pegada (ID: {part})</span>
            </div>
          </div>
        );
      }
      
      // Si es texto normal, devolverlo tal como está
      return part;
    });
  };

  return (
    <div className="whitespace-pre-wrap">
      {renderDescription(description)}
    </div>
  );
}
