import { supabase } from '../src/config/database.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    const migrationsDir = join(process.cwd(), 'server', 'database');
    const migrationFiles = [
      'notifications_migration.sql',
    ];
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`Warning executing statement: ${error.message}`);
          }
        }
      }
      
      console.log(`Completed migration: ${file}`);
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
