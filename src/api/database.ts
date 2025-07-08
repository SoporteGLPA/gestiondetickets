
import { Pool } from 'pg';

interface DatabaseQuery {
  table: string;
  query: {
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    columns?: string;
    data?: any;
    where?: Array<{ column: string; operator: string; value: any }>;
    order?: { column: string; ascending: boolean };
    limit?: number;
    single?: boolean;
  };
  config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

class PostgresHandler {
  private pool: Pool | null = null;

  private getPool(config: DatabaseQuery['config']) {
    if (!this.pool) {
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl
      });
    }
    return this.pool;
  }

  async executeQuery(request: DatabaseQuery) {
    const pool = this.getPool(request.config);
    const { table, query } = request;

    let sql = '';
    let values: any[] = [];

    switch (query.action) {
      case 'SELECT':
        sql = `SELECT ${query.columns || '*'} FROM ${table}`;
        break;
      
      case 'INSERT':
        const insertColumns = Object.keys(query.data);
        const insertPlaceholders = insertColumns.map((_, i) => `$${i + 1}`);
        sql = `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`;
        values = Object.values(query.data);
        break;
      
      case 'UPDATE':
        const updateColumns = Object.keys(query.data);
        const updatePlaceholders = updateColumns.map((col, i) => `${col} = $${i + 1}`);
        sql = `UPDATE ${table} SET ${updatePlaceholders.join(', ')}`;
        values = Object.values(query.data);
        break;
      
      case 'DELETE':
        sql = `DELETE FROM ${table}`;
        break;
    }

    // Agregar WHERE
    if (query.where && query.where.length > 0) {
      const whereClause = query.where.map((w, i) => {
        const paramIndex = values.length + i + 1;
        values.push(w.value);
        return `${w.column} ${w.operator} $${paramIndex}`;
      }).join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    // Agregar ORDER BY
    if (query.order) {
      sql += ` ORDER BY ${query.order.column} ${query.order.ascending ? 'ASC' : 'DESC'}`;
    }

    // Agregar LIMIT
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    // Si es INSERT o UPDATE, agregar RETURNING
    if (query.action === 'INSERT' || query.action === 'UPDATE') {
      sql += ' RETURNING *';
    }

    try {
      const result = await pool.query(sql, values);
      
      return {
        data: query.single ? result.rows[0] : result.rows,
        error: null
      };
    } catch (error) {
      console.error('Database query error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }
}

const handler = new PostgresHandler();

export default async function databaseHandler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const result = await handler.executeQuery(body);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
