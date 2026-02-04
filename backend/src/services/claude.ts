import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerateRecipesRequest,
  RegenerateRecipeRequest,
  Recipe,
  RecipeCategory,
} from '@recipe-planner/shared';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-5-20250929';

function buildGeneratePrompt(request: GenerateRecipesRequest): string {
  const { mealsCount, categories, personsCount, excludedTags } = request;

  return `Tu es un chef cuisinier expert en planification de repas hebdomadaires équilibrés et économiques en France.

Génère exactement ${mealsCount} recettes avec la répartition suivante :
- ${categories.economique} recette(s) "économique" (budget < 5€ par personne)
- ${categories.gourmand} recette(s) "gourmand" (budget entre 5€ et 10€ par personne)
- ${categories.plaisir} recette(s) "plaisir" (budget > 10€ par personne)

Nombre de personnes : ${personsCount}

${excludedTags.length > 0 ? `EXCLUSIONS STRICTES (allergies/intolérances) - NE PAS utiliser ces ingrédients : ${excludedTags.join(', ')}` : 'Aucune exclusion alimentaire.'}

RÈGLES IMPORTANTES :
1. Adapte toutes les quantités d'ingrédients pour ${personsCount} personne(s)
2. Varie les types de plats : inclure si possible viandes, poissons, plats végétariens
3. Assure un équilibre nutritionnel global (protéines, glucides complexes, légumes)
4. Les prix doivent être réalistes pour le marché français
5. Les recettes doivent être réalisables par un cuisinier amateur
6. Chaque recette doit avoir entre 5 et 12 ingrédients
7. Chaque recette doit avoir entre 3 et 8 étapes de préparation
8. Classe chaque ingrédient dans sa catégorie de courses

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks, sans texte autour) suivant exactement ce format :
{
  "recipes": [
    {
      "id": "un-id-unique",
      "name": "Nom de la recette",
      "category": "economique" | "gourmand" | "plaisir",
      "preparationTime": 30,
      "ingredients": [
        {
          "name": "Nom de l'ingrédient",
          "quantity": 200,
          "unit": "g" | "ml" | "pièce(s)" | "c. à soupe" | "c. à café" | "pincée(s)",
          "category": "fruits-legumes" | "viandes-poissons" | "produits-laitiers" | "epicerie" | "boulangerie" | "surgeles" | "boissons" | "condiments" | "autre"
        }
      ],
      "steps": ["Étape 1...", "Étape 2..."],
      "pricePerPerson": 4.50,
      "nutrition": {
        "calories": 550,
        "proteins": 30,
        "carbs": 45,
        "fats": 20,
        "fiber": 8
      }
    }
  ]
}`;
}

function buildRegeneratePrompt(request: RegenerateRecipeRequest): string {
  const { category, personsCount, excludedTags } = request;

  const budgetRange = {
    economique: 'moins de 5€ par personne',
    gourmand: 'entre 5€ et 10€ par personne',
    plaisir: 'plus de 10€ par personne',
  }[category];

  return `Tu es un chef cuisinier expert. Génère UNE SEULE nouvelle recette de catégorie "${category}" (budget : ${budgetRange}).

Nombre de personnes : ${personsCount}

${excludedTags.length > 0 ? `EXCLUSIONS STRICTES : ${excludedTags.join(', ')}` : 'Aucune exclusion.'}

RÈGLES :
1. Adapte les quantités pour ${personsCount} personne(s)
2. Prix réaliste pour le marché français
3. Recette réalisable par un amateur
4. Entre 5 et 12 ingrédients, 3 à 8 étapes
5. Équilibre nutritionnel

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :
{
  "recipe": {
    "id": "un-id-unique",
    "name": "Nom de la recette",
    "category": "${category}",
    "preparationTime": 30,
    "ingredients": [
      {
        "name": "Nom",
        "quantity": 200,
        "unit": "g",
        "category": "fruits-legumes" | "viandes-poissons" | "produits-laitiers" | "epicerie" | "boulangerie" | "surgeles" | "boissons" | "condiments" | "autre"
      }
    ],
    "steps": ["Étape 1...", "Étape 2..."],
    "pricePerPerson": 4.50,
    "nutrition": {
      "calories": 550,
      "proteins": 30,
      "carbs": 45,
      "fats": 20,
      "fiber": 8
    }
  }
}`;
}

export async function generateRecipes(request: GenerateRecipesRequest): Promise<Recipe[]> {
  const prompt = buildGeneratePrompt(request);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude API');
  }

  const parsed = JSON.parse(textBlock.text);
  return parsed.recipes as Recipe[];
}

export async function regenerateRecipe(request: RegenerateRecipeRequest): Promise<Recipe> {
  const prompt = buildRegeneratePrompt(request);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude API');
  }

  const parsed = JSON.parse(textBlock.text);
  return parsed.recipe as Recipe;
}
