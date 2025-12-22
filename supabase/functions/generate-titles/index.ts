import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TitleGenerationRequest {
  productInfo: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    keywords?: string[];
  };
  promptId?: string;
  customPrompt?: string;
  apis?: string[];
}

interface GeneratedTitle {
  api: string;
  titles: string[];
  success: boolean;
  error?: string;
}

// Dummy title generation functions
function generateDummyGeminiTitles(productInfo: any, prompt: string): string[] {
  const baseTitle = productInfo.title || 'Product';
  const keywords = productInfo.keywords?.join(', ') || '';
  
  return [
    `[Gemini] Premium ${baseTitle} - High Quality ${keywords} | Best Value`,
    `[Gemini] ${baseTitle} - Professional Grade ${keywords} | Top Rated`
  ];
}

function generateDummyDeepseekTitles(productInfo: any, prompt: string): string[] {
  const baseTitle = productInfo.title || 'Product';
  const category = productInfo.category || 'General';
  
  return [
    `[Deepseek] ${baseTitle} | ${category} Essential | Fast Shipping`,
    `[Deepseek] Authentic ${baseTitle} - ${category} Must-Have | Free Returns`
  ];
}

function generateDummyOpenAITitles(productInfo: any, prompt: string): string[] {
  const baseTitle = productInfo.title || 'Product';
  const price = productInfo.price ? `$${productInfo.price}` : '';
  
  return [
    `[OpenAI] ${baseTitle} - Exceptional Quality ${price} | Limited Stock`,
    `[OpenAI] Premium ${baseTitle} Collection - Best Seller ${price}`
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productInfo, promptId, customPrompt, apis = ['gemini', 'deepseek', 'openai'] }: TitleGenerationRequest = await req.json();

    // Get prompt from database if promptId is provided
    let prompt = customPrompt || 'Generate SEO-optimized product titles';
    
    if (promptId) {
      const { data: promptData } = await supabase
        .from('prompts')
        .select('content')
        .eq('id', promptId)
        .single();
      
      if (promptData) {
        prompt = promptData.content;
      }
    }

    console.log('Generating titles with prompt:', prompt);
    console.log('Product info:', productInfo);
    console.log('Using APIs:', apis);

    const results: GeneratedTitle[] = [];

    // Generate titles from each selected API (using dummy implementations)
    for (const api of apis) {
      try {
        let titles: string[] = [];
        
        switch (api.toLowerCase()) {
          case 'gemini':
            titles = generateDummyGeminiTitles(productInfo, prompt);
            break;
          case 'deepseek':
            titles = generateDummyDeepseekTitles(productInfo, prompt);
            break;
          case 'openai':
            titles = generateDummyOpenAITitles(productInfo, prompt);
            break;
          default:
            throw new Error(`Unknown API: ${api}`);
        }

        results.push({
          api,
          titles,
          success: true
        });
      } catch (error) {
        console.error(`Error generating titles with ${api}:`, error);
        results.push({
          api,
          titles: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      prompt,
      note: 'Using dummy API responses - connect real APIs by adding API keys'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-titles function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
