
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Image, FileX } from 'lucide-react';
import { useState } from 'react';

export function ArticleReader() {
  const [description, setDescription] = useState('');

  const mockAttachments = [
    { id: 1, name: 'imagen-ejemplo.jpg', type: 'image', icon: Image },
    { id: 2, name: 'documento-ejemplo.pdf', type: 'pdf', icon: FileText },
    { id: 3, name: 'archivo-ejemplo.docx', type: 'document', icon: FileX }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-blue-900">Gestión de Documentos</h1>
        </div>

        {/* Description Section */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-800">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ingrese la descripción del documento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-100 resize-none"
            />
          </CardContent>
        </Card>

        {/* Attachments Section */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-800">Archivos Adjuntos</CardTitle>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {mockAttachments.map((attachment) => (
                <div key={attachment.id} className="group">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <attachment.icon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 truncate w-full">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize mt-1">
                          {attachment.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
