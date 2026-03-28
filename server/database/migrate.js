import { pool } from '../src/config/database.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('Starting migrations...');
    
    // Get all migration files
    const migrationsDir = join(process.cwd(), 'server', 'database', 'migrations');
    // In a real app, you'd read the directory, but for now we'll hardcode
    const migrationFiles = [
      'notifications_migration.sql',
      'add_indexes.sql'
    ];
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement) {
          await connection.execute(statement);
        }
      }
      
      console.log(`Completed migration: ${file}`);
    }
    
    await connection.commit();
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('Error during migrations:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default runMigrations;