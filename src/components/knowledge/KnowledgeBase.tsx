
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeArticles } from '@/hooks/useKnowledge';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Star, User, Calendar } from 'lucide-react';
import { CreateArticleForm } from '@/components/forms/CreateArticleForm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function KnowledgeBase() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { data: articles, isLoading } = useKnowledgeArticles();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles?.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors = {
      email: 'bg-blue-100 text-blue-800',
      red: 'bg-green-100 text-green-800',
      hardware: 'bg-orange-100 text-orange-800',
      software: 'bg-purple-100 text-purple-800',
      seguridad: 'bg-red-100 text-red-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold tracking-tight">Base de Conocimiento</h1>
          <p className="text-muted-foreground">
            Encuentra respuestas y soluciones a problemas comunes
          </p>
        </div>
        {hasRole(['admin', 'agent']) && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Artículo
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles?.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  {article.summary && (
                    <CardDescription>{article.summary}</CardDescription>
                  )}
                </div>
                <Badge className={getCategoryColor(article.category)}>
                  {article.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.content}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {article.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{article.rating.toFixed(1)}</span>
                        <span>({article.votes_count})</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{article.profiles?.full_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(article.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/knowledge/${article.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Leer Artículo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No hay artículos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No se encontraron artículos que coincidan con tu búsqueda' : 'Crea el primer artículo para comenzar'}
            </p>
            {hasRole(['admin', 'agent']) && !searchTerm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Artículo
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateArticleForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
      />
    </div>
  );
}
