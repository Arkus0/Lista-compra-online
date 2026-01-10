import { NextRequest, NextResponse } from 'next/server'
import { TheMealDBRecipe, RecipeIngredient } from '@/lib/supabase/types'

// Traducciones inglés -> español (extensivas)
const TRANSLATIONS: Record<string, string> = {
  // Categorías
  'Beef': 'Ternera', 'Chicken': 'Pollo', 'Dessert': 'Postre', 'Lamb': 'Cordero',
  'Miscellaneous': 'Varios', 'Pasta': 'Pasta', 'Pork': 'Cerdo', 'Seafood': 'Mariscos',
  'Side': 'Guarnición', 'Starter': 'Entrante', 'Vegan': 'Vegano', 'Vegetarian': 'Vegetariano',
  'Breakfast': 'Desayuno', 'Goat': 'Cabra',

  // Cocinas
  'American': 'Americana', 'British': 'Británica', 'Canadian': 'Canadiense',
  'Chinese': 'China', 'Croatian': 'Croata', 'Dutch': 'Holandesa', 'Egyptian': 'Egipcia',
  'Filipino': 'Filipina', 'French': 'Francesa', 'Greek': 'Griega', 'Indian': 'India',
  'Irish': 'Irlandesa', 'Italian': 'Italiana', 'Jamaican': 'Jamaicana', 'Japanese': 'Japonesa',
  'Kenyan': 'Keniata', 'Malaysian': 'Malasia', 'Mexican': 'Mexicana', 'Moroccan': 'Marroquí',
  'Polish': 'Polaca', 'Portuguese': 'Portuguesa', 'Russian': 'Rusa', 'Spanish': 'Española',
  'Thai': 'Tailandesa', 'Tunisian': 'Tunecina', 'Turkish': 'Turca', 'Vietnamese': 'Vietnamita',
  'Unknown': 'Desconocida',

  // Carnes y proteínas
  'chicken': 'pollo', 'chicken breast': 'pechuga de pollo', 'chicken thighs': 'muslos de pollo',
  'chicken legs': 'muslos de pollo', 'chicken wings': 'alitas de pollo', 'chicken stock': 'caldo de pollo',
  'beef': 'ternera', 'beef stock': 'caldo de ternera', 'beef mince': 'carne picada de ternera',
  'minced beef': 'carne picada', 'ground beef': 'carne picada', 'steak': 'filete',
  'pork': 'cerdo', 'pork chops': 'chuletas de cerdo', 'pork mince': 'carne picada de cerdo',
  'lamb': 'cordero', 'lamb mince': 'carne picada de cordero', 'lamb chops': 'chuletas de cordero',
  'turkey': 'pavo', 'duck': 'pato', 'goose': 'ganso', 'rabbit': 'conejo', 'venison': 'venado',
  'bacon': 'bacon', 'ham': 'jamón', 'sausage': 'salchicha', 'sausages': 'salchichas',
  'chorizo': 'chorizo', 'prosciutto': 'jamón serrano', 'pancetta': 'panceta',

  // Pescados y mariscos
  'fish': 'pescado', 'salmon': 'salmón', 'tuna': 'atún', 'cod': 'bacalao', 'haddock': 'eglefino',
  'sea bass': 'lubina', 'trout': 'trucha', 'mackerel': 'caballa', 'sardines': 'sardinas',
  'anchovies': 'anchoas', 'herring': 'arenque', 'sole': 'lenguado', 'halibut': 'fletán',
  'shrimp': 'gambas', 'prawns': 'langostinos', 'crab': 'cangrejo', 'lobster': 'langosta',
  'mussels': 'mejillones', 'clams': 'almejas', 'oysters': 'ostras', 'scallops': 'vieiras',
  'squid': 'calamar', 'octopus': 'pulpo', 'calamari': 'calamares',

  // Lácteos y huevos
  'egg': 'huevo', 'eggs': 'huevos', 'egg yolk': 'yema de huevo', 'egg yolks': 'yemas',
  'egg white': 'clara de huevo', 'egg whites': 'claras',
  'milk': 'leche', 'whole milk': 'leche entera', 'skimmed milk': 'leche desnatada',
  'cream': 'nata', 'heavy cream': 'nata para montar', 'double cream': 'nata espesa',
  'sour cream': 'nata agria', 'whipping cream': 'nata para montar', 'single cream': 'nata líquida',
  'butter': 'mantequilla', 'unsalted butter': 'mantequilla sin sal',
  'cheese': 'queso', 'cheddar': 'cheddar', 'parmesan': 'parmesano', 'mozzarella': 'mozzarella',
  'feta': 'feta', 'goat cheese': 'queso de cabra', 'cream cheese': 'queso crema',
  'ricotta': 'ricotta', 'mascarpone': 'mascarpone', 'brie': 'brie', 'gruyere': 'gruyère',
  'grated cheese': 'queso rallado', 'parmesan cheese': 'queso parmesano',
  'yogurt': 'yogur', 'greek yogurt': 'yogur griego', 'natural yogurt': 'yogur natural',

  // Verduras
  'onion': 'cebolla', 'onions': 'cebollas', 'red onion': 'cebolla morada', 'spring onion': 'cebolleta',
  'spring onions': 'cebolletas', 'shallot': 'chalota', 'shallots': 'chalotas', 'leek': 'puerro', 'leeks': 'puerros',
  'garlic': 'ajo', 'garlic clove': 'diente de ajo', 'garlic cloves': 'dientes de ajo',
  'tomato': 'tomate', 'tomatoes': 'tomates', 'cherry tomatoes': 'tomates cherry',
  'tomato puree': 'concentrado de tomate', 'tomato paste': 'pasta de tomate',
  'chopped tomatoes': 'tomate triturado', 'sun-dried tomatoes': 'tomates secos',
  'potato': 'patata', 'potatoes': 'patatas', 'sweet potato': 'boniato', 'sweet potatoes': 'boniatos',
  'carrot': 'zanahoria', 'carrots': 'zanahorias', 'celery': 'apio', 'celery stalk': 'rama de apio',
  'bell pepper': 'pimiento', 'red pepper': 'pimiento rojo', 'green pepper': 'pimiento verde',
  'yellow pepper': 'pimiento amarillo', 'red bell pepper': 'pimiento rojo',
  'chili pepper': 'guindilla', 'jalapeno': 'jalapeño',
  'mushroom': 'champiñón', 'mushrooms': 'champiñones', 'button mushrooms': 'champiñones',
  'portobello mushrooms': 'setas portobello', 'shiitake mushrooms': 'setas shiitake',
  'spinach': 'espinacas', 'lettuce': 'lechuga', 'cabbage': 'col', 'red cabbage': 'col lombarda',
  'kale': 'kale', 'chard': 'acelgas', 'rocket': 'rúcula', 'arugula': 'rúcula',
  'broccoli': 'brócoli', 'cauliflower': 'coliflor', 'brussels sprouts': 'coles de bruselas',
  'zucchini': 'calabacín', 'courgette': 'calabacín', 'eggplant': 'berenjena', 'aubergine': 'berenjena',
  'cucumber': 'pepino', 'squash': 'calabaza', 'butternut squash': 'calabaza butternut',
  'pumpkin': 'calabaza', 'asparagus': 'espárragos', 'artichoke': 'alcachofa',
  'corn': 'maíz', 'sweetcorn': 'maíz dulce', 'peas': 'guisantes', 'green peas': 'guisantes',
  'green beans': 'judías verdes', 'french beans': 'judías verdes', 'runner beans': 'judías',
  'broad beans': 'habas', 'bean sprouts': 'brotes de soja',
  'radish': 'rábano', 'beetroot': 'remolacha', 'turnip': 'nabo', 'parsnip': 'chirivía',
  'fennel': 'hinojo', 'celeriac': 'apio nabo', 'kohlrabi': 'colinabo',
  'avocado': 'aguacate', 'olive': 'aceituna', 'olives': 'aceitunas', 'capers': 'alcaparras',

  // Legumbres
  'beans': 'judías', 'lentils': 'lentejas', 'chickpeas': 'garbanzos',
  'kidney beans': 'alubias rojas', 'black beans': 'alubias negras', 'white beans': 'alubias blancas',
  'cannellini beans': 'alubias blancas', 'borlotti beans': 'alubias pintas',
  'butter beans': 'judiones', 'haricot beans': 'alubias blancas',
  'red lentils': 'lentejas rojas', 'green lentils': 'lentejas verdes', 'puy lentils': 'lentejas pardinas',

  // Frutas
  'apple': 'manzana', 'apples': 'manzanas', 'banana': 'plátano', 'bananas': 'plátanos',
  'orange': 'naranja', 'oranges': 'naranjas', 'lemon': 'limón', 'lemons': 'limones',
  'lemon juice': 'zumo de limón', 'lemon zest': 'ralladura de limón',
  'lime': 'lima', 'lime juice': 'zumo de lima', 'lime zest': 'ralladura de lima',
  'grapefruit': 'pomelo', 'tangerine': 'mandarina', 'clementine': 'clementina',
  'strawberry': 'fresa', 'strawberries': 'fresas', 'raspberry': 'frambuesa', 'raspberries': 'frambuesas',
  'blueberry': 'arándano', 'blueberries': 'arándanos', 'blackberry': 'mora', 'blackberries': 'moras',
  'grape': 'uva', 'grapes': 'uvas', 'cherry': 'cereza', 'cherries': 'cerezas',
  'peach': 'melocotón', 'peaches': 'melocotones', 'apricot': 'albaricoque', 'apricots': 'albaricoques',
  'plum': 'ciruela', 'plums': 'ciruelas', 'nectarine': 'nectarina',
  'pear': 'pera', 'pears': 'peras', 'mango': 'mango', 'pineapple': 'piña',
  'watermelon': 'sandía', 'melon': 'melón', 'cantaloupe': 'melón cantalupo',
  'kiwi': 'kiwi', 'papaya': 'papaya', 'passion fruit': 'maracuyá', 'pomegranate': 'granada',
  'fig': 'higo', 'figs': 'higos', 'dates': 'dátiles', 'raisins': 'pasas', 'sultanas': 'pasas sultanas',
  'dried fruit': 'fruta seca', 'mixed fruit': 'fruta variada',

  // Hierbas y especias
  'parsley': 'perejil', 'fresh parsley': 'perejil fresco', 'basil': 'albahaca', 'fresh basil': 'albahaca fresca',
  'oregano': 'orégano', 'thyme': 'tomillo', 'fresh thyme': 'tomillo fresco',
  'rosemary': 'romero', 'fresh rosemary': 'romero fresco', 'sage': 'salvia',
  'cilantro': 'cilantro', 'coriander': 'cilantro', 'fresh coriander': 'cilantro fresco',
  'mint': 'menta', 'fresh mint': 'menta fresca', 'dill': 'eneldo', 'tarragon': 'estragón',
  'chives': 'cebollino', 'bay leaf': 'hoja de laurel', 'bay leaves': 'hojas de laurel',
  'cumin': 'comino', 'ground cumin': 'comino molido', 'cumin seeds': 'semillas de comino',
  'paprika': 'pimentón', 'smoked paprika': 'pimentón ahumado', 'sweet paprika': 'pimentón dulce',
  'chili': 'chile', 'chili powder': 'chile en polvo', 'chili flakes': 'escamas de chile', 'cayenne': 'cayena',
  'cayenne pepper': 'pimienta de cayena', 'red pepper flakes': 'copos de pimiento rojo',
  'ginger': 'jengibre', 'fresh ginger': 'jengibre fresco', 'ground ginger': 'jengibre molido',
  'turmeric': 'cúrcuma', 'ground turmeric': 'cúrcuma molida',
  'cinnamon': 'canela', 'ground cinnamon': 'canela molida', 'cinnamon stick': 'rama de canela',
  'nutmeg': 'nuez moscada', 'cloves': 'clavos', 'ground cloves': 'clavos molidos',
  'allspice': 'pimienta de jamaica', 'cardamom': 'cardamomo', 'star anise': 'anís estrellado',
  'coriander seeds': 'semillas de cilantro', 'mustard seeds': 'semillas de mostaza',
  'fennel seeds': 'semillas de hinojo', 'caraway seeds': 'semillas de alcaravea',
  'saffron': 'azafrán', 'vanilla': 'vainilla', 'vanilla extract': 'extracto de vainilla',
  'mixed herbs': 'hierbas mixtas', 'italian seasoning': 'condimento italiano',
  'curry powder': 'curry en polvo', 'garam masala': 'garam masala', 'chinese five spice': 'cinco especias chinas',

  // Condimentos y salsas
  'salt': 'sal', 'sea salt': 'sal marina', 'pepper': 'pimienta', 'black pepper': 'pimienta negra',
  'white pepper': 'pimienta blanca', 'ground pepper': 'pimienta molida',
  'soy sauce': 'salsa de soja', 'fish sauce': 'salsa de pescado', 'oyster sauce': 'salsa de ostras',
  'worcestershire sauce': 'salsa worcestershire', 'hot sauce': 'salsa picante', 'tabasco': 'tabasco',
  'vinegar': 'vinagre', 'white vinegar': 'vinagre blanco', 'red wine vinegar': 'vinagre de vino tinto',
  'balsamic vinegar': 'vinagre balsámico', 'apple cider vinegar': 'vinagre de manzana',
  'mustard': 'mostaza', 'dijon mustard': 'mostaza dijon', 'english mustard': 'mostaza inglesa',
  'wholegrain mustard': 'mostaza en grano', 'ketchup': 'ketchup', 'mayonnaise': 'mayonesa',
  'tomato sauce': 'salsa de tomate', 'tomato ketchup': 'ketchup', 'bbq sauce': 'salsa barbacoa',
  'honey': 'miel', 'maple syrup': 'sirope de arce', 'golden syrup': 'melaza dorada',
  'brown sugar': 'azúcar moreno', 'white sugar': 'azúcar blanco', 'caster sugar': 'azúcar glas fino',
  'icing sugar': 'azúcar glas', 'powdered sugar': 'azúcar glas',

  // Aceites y grasas
  'oil': 'aceite', 'olive oil': 'aceite de oliva', 'extra virgin olive oil': 'aceite de oliva virgen extra',
  'vegetable oil': 'aceite vegetal', 'sunflower oil': 'aceite de girasol', 'sesame oil': 'aceite de sésamo',
  'coconut oil': 'aceite de coco', 'rapeseed oil': 'aceite de colza', 'peanut oil': 'aceite de cacahuete',

  // Cereales y harinas
  'rice': 'arroz', 'white rice': 'arroz blanco', 'brown rice': 'arroz integral',
  'basmati rice': 'arroz basmati', 'jasmine rice': 'arroz jazmín', 'arborio rice': 'arroz arborio',
  'risotto rice': 'arroz para risotto', 'wild rice': 'arroz salvaje',
  'pasta': 'pasta', 'spaghetti': 'espaguetis', 'penne': 'penne', 'fusilli': 'fusilli',
  'tagliatelle': 'tagliatelle', 'fettuccine': 'fettuccine', 'linguine': 'linguine',
  'macaroni': 'macarrones', 'lasagne sheets': 'láminas de lasaña', 'lasagna': 'lasaña',
  'noodles': 'fideos', 'egg noodles': 'fideos al huevo', 'rice noodles': 'fideos de arroz',
  'bread': 'pan', 'white bread': 'pan blanco', 'wholemeal bread': 'pan integral',
  'breadcrumbs': 'pan rallado', 'panko breadcrumbs': 'panko',
  'flour': 'harina', 'plain flour': 'harina normal', 'all-purpose flour': 'harina todo uso',
  'self-raising flour': 'harina con levadura', 'bread flour': 'harina de fuerza',
  'cornflour': 'maicena', 'cornstarch': 'maicena', 'cornmeal': 'harina de maíz',
  'oats': 'avena', 'rolled oats': 'copos de avena', 'oatmeal': 'harina de avena',
  'couscous': 'cuscús', 'quinoa': 'quinoa', 'bulgur': 'bulgur', 'barley': 'cebada',
  'polenta': 'polenta',

  // Frutos secos y semillas
  'almond': 'almendra', 'almonds': 'almendras', 'ground almonds': 'almendra molida', 'flaked almonds': 'almendras laminadas',
  'walnut': 'nuez', 'walnuts': 'nueces', 'pecan': 'nuez pecana', 'pecans': 'nueces pecanas',
  'hazelnut': 'avellana', 'hazelnuts': 'avellanas', 'cashew': 'anacardo', 'cashews': 'anacardos',
  'peanut': 'cacahuete', 'peanuts': 'cacahuetes', 'pistachio': 'pistacho', 'pistachios': 'pistachos',
  'pine nuts': 'piñones', 'macadamia': 'macadamia', 'chestnut': 'castaña', 'chestnuts': 'castañas',
  'coconut': 'coco', 'desiccated coconut': 'coco rallado', 'coconut milk': 'leche de coco', 'coconut cream': 'crema de coco',
  'sesame seeds': 'semillas de sésamo', 'sunflower seeds': 'pipas de girasol', 'pumpkin seeds': 'pipas de calabaza',
  'chia seeds': 'semillas de chía', 'flax seeds': 'semillas de lino', 'poppy seeds': 'semillas de amapola',

  // Panadería y repostería
  'baking powder': 'levadura química', 'baking soda': 'bicarbonato', 'bicarbonate of soda': 'bicarbonato',
  'yeast': 'levadura', 'active dry yeast': 'levadura seca', 'instant yeast': 'levadura instantánea',
  'chocolate': 'chocolate', 'dark chocolate': 'chocolate negro', 'milk chocolate': 'chocolate con leche',
  'white chocolate': 'chocolate blanco', 'chocolate chips': 'pepitas de chocolate',
  'cocoa': 'cacao', 'cocoa powder': 'cacao en polvo', 'unsweetened cocoa': 'cacao sin azúcar',
  'peanut butter': 'mantequilla de cacahuete', 'almond butter': 'mantequilla de almendra',
  'jam': 'mermelada', 'marmalade': 'mermelada de naranja', 'jelly': 'gelatina',
  'gelatin': 'gelatina', 'agar': 'agar',

  // Bebidas y líquidos
  'water': 'agua', 'broth': 'caldo', 'stock': 'caldo', 'vegetable stock': 'caldo de verduras',
  'wine': 'vino', 'red wine': 'vino tinto', 'white wine': 'vino blanco', 'cooking wine': 'vino de cocinar',
  'beer': 'cerveza', 'cider': 'sidra', 'sherry': 'jerez', 'port': 'oporto', 'brandy': 'brandy',
  'rum': 'ron', 'whiskey': 'whisky', 'vodka': 'vodka', 'sake': 'sake',
  'coffee': 'café', 'espresso': 'espresso', 'tea': 'té', 'green tea': 'té verde',
  'juice': 'zumo', 'orange juice': 'zumo de naranja', 'apple juice': 'zumo de manzana',

  // Unidades y medidas
  'cup': 'taza', 'cups': 'tazas', 'tbsp': 'cucharada', 'tsp': 'cucharadita',
  'tablespoon': 'cucharada', 'tablespoons': 'cucharadas',
  'teaspoon': 'cucharadita', 'teaspoons': 'cucharaditas',
  'oz': 'oz', 'ounce': 'onza', 'ounces': 'onzas',
  'lb': 'lb', 'pound': 'libra', 'pounds': 'libras',
  'kg': 'kg', 'g': 'g', 'gram': 'gramo', 'grams': 'gramos',
  'ml': 'ml', 'l': 'l', 'liter': 'litro', 'liters': 'litros',
  'piece': 'pieza', 'pieces': 'piezas', 'clove': 'diente',
  'pinch': 'pizca', 'bunch': 'manojo', 'handful': 'puñado', 'sprig': 'ramita', 'sprigs': 'ramitas',
  'slice': 'rodaja', 'slices': 'rodajas', 'can': 'lata', 'cans': 'latas', 'tin': 'lata', 'tins': 'latas',
  'packet': 'paquete', 'pack': 'paquete', 'bag': 'bolsa', 'jar': 'tarro', 'bottle': 'botella',
  'small': 'pequeño', 'medium': 'mediano', 'large': 'grande', 'extra large': 'extra grande',
  'fresh': 'fresco', 'dried': 'seco', 'frozen': 'congelado', 'chopped': 'picado', 'sliced': 'en rodajas',
  'diced': 'en dados', 'minced': 'picado', 'grated': 'rallado', 'crushed': 'machacado',
  'to taste': 'al gusto', 'as needed': 'según sea necesario', 'optional': 'opcional',
}

function translate(text: string): string {
  if (!text) return text

  // Primero buscar traducción exacta
  const lowerText = text.toLowerCase().trim()
  if (TRANSLATIONS[lowerText]) {
    return TRANSLATIONS[lowerText]
  }

  // Intentar traducir palabra por palabra
  let translated = text.toLowerCase()
  const sortedKeys = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi')
    translated = translated.replace(regex, TRANSLATIONS[key])
  }

  // Capitalizar primera letra
  return translated.charAt(0).toUpperCase() + translated.slice(1)
}

function parseIngredients(meal: any): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = []

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]

    if (ingredient && ingredient.trim()) {
      const translatedIngredient = translate(ingredient)
      const translatedMeasure = measure ? translate(measure.trim()) : ''

      // Intentar separar cantidad y unidad
      const measureMatch = translatedMeasure.match(/^([\d.,/\s]+)?\s*(.*)$/)
      const quantity = measureMatch?.[1]?.trim() || ''
      const unit = measureMatch?.[2]?.trim() || ''

      ingredients.push({
        name: translatedIngredient,
        quantity: quantity || '1',
        unit: unit,
      })
    }
  }

  return ingredients
}

function normalizeMeal(meal: any): TheMealDBRecipe {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    category: translate(meal.strCategory || 'Unknown'),
    cuisine: translate(meal.strArea || 'Unknown'),
    instructions: meal.strInstructions || '',
    image_url: meal.strMealThumb || '',
    ingredients: parseIngredients(meal),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const category = searchParams.get('category')
  const random = searchParams.get('random')

  try {
    let apiUrl: string

    if (random === 'true') {
      // Obtener varias recetas aleatorias
      const randomRecipes: TheMealDBRecipe[] = []
      for (let i = 0; i < 6; i++) {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        const data = await res.json()
        if (data.meals?.[0]) {
          randomRecipes.push(normalizeMeal(data.meals[0]))
        }
      }
      return NextResponse.json({ recipes: randomRecipes })
    } else if (category) {
      apiUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`
    } else if (query) {
      apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    } else {
      // Por defecto, buscar recetas populares
      apiUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s='
    }

    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!data.meals) {
      return NextResponse.json({ recipes: [] })
    }

    // Si es filter por categoría, solo tenemos ID, nombre e imagen
    // Necesitamos hacer fetch de detalles para cada uno
    if (category) {
      const detailedRecipes: TheMealDBRecipe[] = []
      const meals = data.meals.slice(0, 12) // Limitar a 12

      for (const meal of meals) {
        const detailRes = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        )
        const detailData = await detailRes.json()
        if (detailData.meals?.[0]) {
          detailedRecipes.push(normalizeMeal(detailData.meals[0]))
        }
      }

      return NextResponse.json({ recipes: detailedRecipes })
    }

    const recipes = data.meals.map(normalizeMeal)
    return NextResponse.json({ recipes })

  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Error al buscar recetas' },
      { status: 500 }
    )
  }
}

// GET categories
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(
      'https://www.themealdb.com/api/json/v1/1/categories.php'
    )
    const data = await response.json()

    const categories = data.categories?.map((cat: any) => ({
      id: cat.strCategory,
      name: translate(cat.strCategory),
      image: cat.strCategoryThumb,
      description: cat.strCategoryDescription,
    })) || []

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}
