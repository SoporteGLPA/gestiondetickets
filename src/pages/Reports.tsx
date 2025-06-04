
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const categoryData = [
    { name: 'Email', value: 35, color: '#3b82f6' },
    { name: 'Software', value: 25, color: '#10b981' },
    { name: 'Hardware', value: 20, color: '#f59e0b' },
    { name: 'Red', value: 15, color: '#ef4444' },
    { name: 'Seguridad', value: 5, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Analíticas</h1>
        <p className="text-muted-foreground">
          Análisis detallado del rendimiento del sistema de soporte
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tickets por Categoría</CardTitle>
            <CardDescription>Distribución de tickets por tipo de problema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satisfacción del Cliente</CardTitle>
            <CardDescription>Promedio mensual de satisfacción</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">94%</div>
              <p className="text-lg text-muted-foreground">Satisfacción General</p>
              <p className="text-sm text-muted-foreground mt-2">Basado en 156 evaluaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
