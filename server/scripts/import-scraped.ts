import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importDreams() {
  const dreamsPath = join(process.cwd(), 'scraped-data', 'dreams.json');
  
  if (!existsSync(dreamsPath)) {
    console.error('dreams.json not found!');
    return;
  }

  const dreams = JSON.parse(readFileSync(dreamsPath, 'utf-8'));
  console.log(`Found ${dreams.length} dreams in JSON file.`);

  // Get or create a default category
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'genel')
    .single();

  let categoryId;
  if (categoryData) {
    categoryId = categoryData.id;
  } else {
    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        id: uuidv4(),
        name: 'Genel',
        slug: 'genel',
        order_index: 100
      })
      .select('id')
      .single();
    categoryId = newCat?.id;
  }

  console.log(`Using category ID: ${categoryId}`);

  // Batch insert
  const batchSize = 50;
  for (let i = 0; i < dreams.length; i += batchSize) {
    const batch = dreams.slice(i, i + batchSize).map((d: any) => ({
      id: uuidv4(),
      title: d.title,
      slug: d.slug + '-' + Math.random().toString(36).substring(2, 5), // Avoid slug conflicts
      content: d.islamic_interpretation || d.psychological_interpretation || 'İçerik yok',
      islamic_interpretation: d.islamic_interpretation || null,
      psychological_interpretation: d.psychological_interpretation || null,
      category_id: categoryId,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('dreams').insert(batch);
    if (error) {
      console.error(`Error in batch ${i / batchSize}:`, error.message);
    } else {
      console.log(`Imported batch ${i / batchSize + 1}/${Math.ceil(dreams.length / batchSize)}`);
    }
  }

  console.log('Import completed!');
}

importDreams().catch(console.error);
