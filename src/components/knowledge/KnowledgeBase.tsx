
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Eye, 
  Edit, 
  Star,
  Calendar,
  User,
  ThumbsUp
} from 'lucide-react';

const articles = [
  {
    id: '1',
    title: 'Configuración de Correo Corporativo en Outlook',
    summary: 'Guía paso a paso para configurar cuentas de correo corporativo en Microsoft Outlook.',
    category: 'Email',
    author: 'Juan Pérez',
    created: '2024-05-15',
    updated: '2024-06-01',
    views: 245,
    rating: 4.8,
    votes: 32
  },
  {
    id: '2',
    title: 'Solución de Problemas de Conectividad VPN',
    summary: 'Pasos para diagnosticar y solucionar problemas comunes de conexión VPN.',
    category: 'Red',
    author: 'Ana Martín',
    created: '2024-05-20',
    updated: '2024-05-25',
    views: 189,
    rating: 4.6,
    votes: 28
  },
  {
    id: '3',
    title: 'Instalación y Configuración de Impresoras de Red',
    summary: 'Instrucciones completas para instalar y configurar impresoras en la red corporativa.',
    category: 'Hardware',
    author: 'Carlos Ruiz',
    created: '2024-05-10',
    updated: '2024-05-30',
    views: 156,
    rating: 4.9,
    votes: 19
  },
  {
    id: '4',
    title: 'Procedimientos de Seguridad y Backup',
    summary: 'Guía de mejores prácticas para mantener la seguridad de datos y realizar respaldos.',
    category: 'Seguridad',
    author: 'María García',
    created: '2024-04-25',
    updated: '2024-06-02',
    views: 298,
    rating: 4.7,
    votes: 41
  },
  {
    id: '5',
    title: 'Uso del Sistema de Tickets Interno',
    summary: 'Manual de usuario para el sistema de gestión de tickets de soporte técnico.',
    category: 'Software',
    author: 'Juan Pérez',
    created: '2024-06-01',
    updated: '2024-06-03',
    views: 87,
    rating: 4.5,
    votes: 15
  }
];

const categories = [
  { name: 'Todos', count: articles.length },
  { name: 'Email', count: articles.filter(a => a.category === 'Email').length },
  { name: 'Red', count: articles.filter(a => a.category === 'Red').length },
  { name: 'Hardware', count: articles.filter(a => a.category === 'Hardware').length },
  { name: 'Software', count: articles.filter(a => a.category === 'Software').length },
  { name: 'Seguridad', count: articles.filter(a => a.category === 'Seguridad').length },
];

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'Email': 'default',
    'Red': 'secondary',
    'Hardware': 'outline',
    'Software': 'destructive',
    'Seguridad': 'default'
  };
  return colors[category] || 'default';
};

export function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Conocimientos</h1>
          <p className="text-muted-foreground">
            Artículos y guías para resolver problemas comunes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Artículo
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Buscar Artículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por título o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Artículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">Publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vistas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.reduce((sum, article) => sum + article.views, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.name} value={category.name}>
              {category.name} ({category.count})
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.name} value={category.name}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant={getCategoryColor(article.category)} className="mb-2">
                          {article.category}
                        </Badge>
                        <CardTitle className="text-lg leading-tight">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {article.summary}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Rating */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm font-medium">{article.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({article.votes} votos)
                        </span>
                        <div className="flex items-center ml-auto">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-xs text-muted-foreground">{article.views}</span>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          Autor: {article.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Actualizado: {article.updated}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Button variant="default" size="sm" className="flex-1">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Leer
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron artículos</h3>
            <p className="text-muted-foreground text-center">
              No hay artículos que coincidan con tu búsqueda. 
              <br />
              Intenta con otros términos o explora las categorías disponibles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
