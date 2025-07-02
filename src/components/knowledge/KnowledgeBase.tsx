
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, FileImage, File } from 'lucide-react';

export function KnowledgeBase() {
  const { hasRole } = useAuth();
  const [description, setDescription] = useState('');

  // Miniaturas de ejemplo
  const sampleFiles = [
    {
      id: 1,
      name: 'imagen_ejemplo.jpg',
      type: 'image',
      icon: FileImage,
      preview: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&h=150&fit=crop'
    },
    {
      id: 2,
      name: 'documento.pdf',
      type: 'pdf',
      icon: FileText,
      preview: null
    },
    {
      id: 3,
      name: 'reporte.docx',
      type: 'document',
      icon: File,
      preview: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-blue-900 mb-2">
            Gestión de Documentos
          </h1>
        </div>

        {/* Cuerpo principal */}
        <div className="space-y-8">
          {/* Sección Descripción */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                Descripción
              </h2>
              <Textarea
                placeholder="Ingrese una descripción del documento o proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] bg-white border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 resize-none"
              />
            </CardContent>
          </Card>

          {/* Sección Archivos Adjuntos */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-gray-800">
                  Archivos Adjuntos
                </h2>
                <Button className="bg-[#047857] hover:bg-[#047857]/90 text-white border-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {/* Miniaturas de archivos */}
              <div className="grid grid-cols-3 gap-6">
                {sampleFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-square bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center justify-center">
                      {file.preview ? (
                        <div className="w-full h-full rounded-md overflow-hidden">
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <file.icon className="h-12 w-12 text-gray-400 mb-3" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Área de arrastre (opcional para futuras mejoras) */}
              <div className="mt-8 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50/50">
                <div className="text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">
                    Arrastra y suelta archivos aquí o usa el botón "Agregar"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
