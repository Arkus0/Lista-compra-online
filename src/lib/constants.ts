import {
  Carrot, Beef, Milk, Cookie, Snowflake,
  Coffee, SprayCan, Sparkles, Dog, Package,
  LucideIcon
} from 'lucide-react'

export type CategoryId =
  | 'fruits-veg' | 'meat-fish' | 'dairy' | 'pantry'
  | 'frozen' | 'beverages' | 'household' | 'hygiene'
  | 'pets' | 'other'

interface CategoryConfig {
  id: CategoryId
  label: string
  icon: LucideIcon
  color: string
  keywords: string[]
}

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  'fruits-veg': {
    id: 'fruits-veg',
    label: 'Frutas y Verduras',
    icon: Carrot,
    color: 'text-green-600 bg-green-50',
    keywords: [
      // Frutas
      'manzana', 'platano', 'banana', 'naranja', 'mandarina', 'clementina', 'limon', 'lima',
      'fresa', 'fresón', 'frambuesa', 'arandano', 'mora', 'cereza', 'melocoton', 'nectarina',
      'ciruela', 'albaricoque', 'uva', 'pera', 'kiwi', 'mango', 'papaya', 'piña', 'coco',
      'sandia', 'melon', 'higo', 'granada', 'caqui', 'chirimoya', 'maracuya', 'fruta pasion',
      'pomelo', 'aguacate', 'datil', 'membrillo',
      // Verduras y hortalizas
      'tomate', 'lechuga', 'escarola', 'rucula', 'canonigo', 'espinaca', 'acelga', 'col',
      'repollo', 'lombarda', 'brocoli', 'coliflor', 'cebolla', 'cebolleta', 'puerro',
      'ajo', 'patata', 'boniato', 'batata', 'zanahoria', 'pimiento', 'pimientos', 'calabacin',
      'berenjena', 'pepino', 'calabaza', 'rabano', 'nabo', 'remolacha', 'apio', 'hinojo',
      'esparrago', 'alcachofa', 'champiñon', 'seta', 'judias verdes', 'guisante', 'haba',
      'maiz', 'endivia', 'berro', 'perejil', 'cilantro', 'albahaca', 'romero', 'tomillo',
      'oregano', 'menta', 'hierbabuena', 'jengibre', 'fruta', 'verdura', 'hortaliza',
      'ensalada', 'vegetal', 'vegetales'
    ]
  },
  'meat-fish': {
    id: 'meat-fish',
    label: 'Carnes y Pescados',
    icon: Beef,
    color: 'text-red-600 bg-red-50',
    keywords: [
      // Carnes
      'pollo', 'pavo', 'ternera', 'vaca', 'cerdo', 'cordero', 'conejo', 'pato',
      'carne', 'carnes', 'filete', 'bistec', 'entrecot', 'chuleton', 'solomillo',
      'chuleta', 'costilla', 'hamburguesa', 'albondiga', 'carne picada', 'picada',
      'higado', 'riñones', 'lengua', 'callos', 'menudo',
      // Embutidos y fiambres
      'jamon', 'serrano', 'iberico', 'york', 'cocido', 'pechuga pavo', 'lacón',
      'chorizo', 'salchichon', 'fuet', 'longaniza', 'morcilla', 'butifarra',
      'mortadela', 'salchicha', 'frankfurt', 'bacon', 'panceta', 'tocino',
      'sobrasada', 'lomo embuchado', 'cecina', 'embutido', 'fiambre',
      // Pescados
      'pescado', 'pescados', 'salmon', 'trucha', 'merluza', 'bacalao', 'lubina',
      'dorada', 'rape', 'lenguado', 'rodaballo', 'besugo', 'sardina', 'boqueron',
      'anchoa', 'atun', 'bonito', 'caballa', 'jurel', 'pez espada', 'emperador',
      // Mariscos
      'marisco', 'gamba', 'langostino', 'camaron', 'cigala', 'bogavante', 'langosta',
      'mejillon', 'almeja', 'berberecho', 'navaja', 'vieira', 'ostra', 'percebe',
      'pulpo', 'calamar', 'chipirón', 'sepia', 'cangrejo', 'centollo', 'nécora'
    ]
  },
  'dairy': {
    id: 'dairy',
    label: 'Lácteos y Huevos',
    icon: Milk,
    color: 'text-yellow-600 bg-yellow-50',
    keywords: [
      // Leche
      'leche', 'lacteo', 'lacteos', 'desnatada', 'semidesnatada', 'entera',
      'sin lactosa', 'evaporada', 'condensada',
      // Huevos
      'huevo', 'huevos', 'clara', 'yema',
      // Yogures
      'yogur', 'yogures', 'yogurt', 'kefir', 'actimel', 'danone', 'bifidus',
      'griego', 'skyr', 'cuajada', 'flan', 'natillas',
      // Quesos
      'queso', 'quesos', 'mozzarella', 'parmesano', 'manchego', 'cheddar',
      'brie', 'camembert', 'roquefort', 'azul', 'gouda', 'edam', 'emmental',
      'gruyere', 'provolone', 'feta', 'burgos', 'fresco', 'rallado', 'fundido',
      'curado', 'semicurado', 'tierno', 'cremoso', 'mascarpone', 'ricotta',
      'requesón', 'cottage',
      // Otros lácteos
      'mantequilla', 'margarina', 'nata', 'crema', 'bechamel', 'batido',
      'horchata', 'leche almendra', 'leche soja', 'leche avena', 'leche coco',
      'bebida vegetal'
    ]
  },
  'pantry': {
    id: 'pantry',
    label: 'Despensa',
    icon: Cookie,
    color: 'text-orange-600 bg-orange-50',
    keywords: [
      // Pan y bollería
      'pan', 'barra', 'baguette', 'chapata', 'molde', 'integral', 'cereales pan',
      'tostada', 'rebanada', 'panecillo', 'bollo', 'croissant', 'ensaimada',
      'magdalena', 'muffin', 'donut', 'berlina', 'palmera', 'pastel',
      // Arroz y cereales
      'arroz', 'basmati', 'integral arroz', 'bomba', 'paella', 'risotto',
      'quinoa', 'cuscus', 'bulgur', 'avena', 'muesli', 'corn flakes',
      'cereales', 'copos', 'granola',
      // Pasta
      'pasta', 'espagueti', 'macarron', 'tallarín', 'lasaña', 'canelón',
      'ravioli', 'tortellini', 'ñoqui', 'fideo', 'penne', 'fusilli',
      'rigatoni', 'farfalle', 'spaghetti', 'macarrones',
      // Legumbres
      'legumbre', 'garbanzo', 'lenteja', 'alubia', 'judion', 'azuki',
      'soja', 'frijol', 'habichuela',
      // Aceites y vinagres
      'aceite', 'oliva', 'girasol', 'coco aceite', 'vinagre', 'vinagreta',
      'balsamico', 'modena',
      // Salsas y condimentos
      'tomate frito', 'salsa tomate', 'ketchup', 'mostaza', 'mayonesa',
      'mahonesa', 'alioli', 'salsa rosa', 'salsa barbacoa', 'soja salsa',
      'tabasco', 'sriracha', 'pesto',
      // Especias y condimentos secos
      'sal', 'pimienta', 'pimenton', 'comino', 'curry', 'canela', 'nuez moscada',
      'clavo', 'laurel', 'azafran', 'especias', 'sazonador', 'caldo', 'pastilla',
      'concentrado',
      // Conservas
      'conserva', 'lata', 'atun lata', 'sardina lata', 'mejillon lata',
      'tomate triturado', 'tomate natural', 'pimiento lata', 'esparrago lata',
      'aceituna', 'pepinillo', 'maiz lata', 'pimiento piquillo',
      // Dulces y snacks
      'azucar', 'sacarina', 'edulcorante', 'stevia', 'miel', 'sirope', 'melaza',
      'mermelada', 'confitura', 'nocilla', 'nutella', 'crema cacao',
      'chocolate', 'cacao', 'tableta', 'bombón', 'galleta', 'galletas',
      'maria', 'digestive', 'oreo', 'cookies', 'barquillo', 'bizcocho',
      'pastas te', 'rosquilla', 'polvoron', 'turron', 'mazapan',
      'caramelo', 'gominola', 'chicle', 'regaliz', 'palomitas', 'patatas chip',
      'nachos', 'frutos secos', 'almendra', 'nuez', 'avellana', 'pistacho',
      'cacahuete', 'anacardo', 'pipa', 'girasol pipa',
      // Harinas y repostería
      'harina', 'trigo', 'maicena', 'maizena', 'levadura', 'bicarbonato',
      'impulsor', 'royal', 'gelatina', 'fondant',
      // Otros
      'sopas', 'pure', 'croquetas preparadas', 'preparado'
    ]
  },
  'frozen': {
    id: 'frozen',
    label: 'Congelados',
    icon: Snowflake,
    color: 'text-blue-400 bg-blue-50',
    keywords: [
      'congelado', 'congelados', 'hielo', 'helado', 'polo', 'tarrina',
      'pizza congelada', 'lasaña congelada', 'croquetas congeladas',
      'nuggets', 'fingers', 'empanadilla', 'san jacobo', 'cordon bleu',
      'verduras congeladas', 'guisantes congelados', 'judias congeladas',
      'menestra', 'salteado', 'wok', 'patatas congeladas', 'carne congelada',
      'pescado congelado', 'marisco congelado', 'langostino congelado',
      'gamba congelada', 'calamar congelado', 'merluza congelada',
      'frozen', 'ultracongelado', 'cubito', 'sorbete', 'granizado'
    ]
  },
  'beverages': {
    id: 'beverages',
    label: 'Bebidas',
    icon: Coffee,
    color: 'text-teal-600 bg-teal-50',
    keywords: [
      // Agua
      'agua', 'mineral', 'con gas', 'sin gas', 'fontvella', 'bezoya', 'aquarius',
      // Refrescos
      'refresco', 'cola', 'coca cola', 'pepsi', 'fanta', 'sprite', '7up',
      'naranjada', 'limonada', 'tonica', 'schweppes', 'gaseosa', 'casera',
      'isotonica', 'energetica', 'red bull', 'monster',
      // Zumos
      'zumo', 'nectar', 'mosto', 'smoothie', 'batido frutas', 'piña zumo',
      'naranja zumo', 'manzana zumo', 'melocoton zumo', 'multifrutas',
      // Cafe y te
      'cafe', 'cappuccino', 'latte', 'espresso', 'descafeinado', 'soluble',
      'nescafe', 'capsulas', 'nespresso', 'dolce gusto', 'cafetera',
      'te', 'infusion', 'manzanilla', 'tila', 'poleo', 'verde te', 'rojo te',
      // Alcohol
      'cerveza', 'sidra', 'vino', 'tinto', 'blanco', 'rosado', 'cava',
      'champagne', 'vermut', 'sangria', 'tinto verano', 'licor', 'ron',
      'whisky', 'vodka', 'ginebra', 'gin', 'brandy', 'coñac', 'orujo',
      'bebida', 'bebidas', 'botella', 'lata bebida', 'brick'
    ]
  },
  'household': {
    id: 'household',
    label: 'Hogar y Limpieza',
    icon: SprayCan,
    color: 'text-purple-600 bg-purple-50',
    keywords: [
      // Limpieza ropa
      'detergente', 'detergente ropa', 'lavadora', 'suavizante', 'quitamanchas',
      'blanqueador', 'lejia ropa', 'ariel', 'skip', 'wipp', 'vernel', 'mimosin',
      // Limpieza hogar
      'limpiador', 'multiusos', 'desengrasante', 'antical', 'lejia', 'amoniaco',
      'cristales', 'cristasol', 'limpiacristales', 'fregasuelos', 'cif', 'cillit',
      'vim', 'don limpio', 'fairy', 'mistol', 'ajax', 'lavavajillas', 'finish',
      'somat', 'pastillas lavavajillas', 'sal lavavajillas', 'abrillantador',
      // Baño
      'desatascador', 'wc', 'inodoro', 'pato', 'harpic', 'sanitario', 'antihongos',
      // Utensilios limpieza
      'estropajo', 'esponja', 'bayeta', 'trapo', 'fregona', 'mopa', 'escoba',
      'recogedor', 'cubo', 'guantes limpieza', 'cepillo', 'desechable',
      // Bolsas y papel
      'bolsa basura', 'basura', 'rollo cocina', 'papel cocina', 'papel aluminio',
      'film', 'plastico transparente', 'papel horno', 'servilleta', 'servilletas',
      'papel higienico', 'pañuelo papel', 'clinex', 'kleenex', 'scottex',
      // Insecticidas
      'insecticida', 'antimosquitos', 'raid', 'cucaracha', 'hormiga', 'polilla',
      'naftalina', 'ambientador', 'incienso', 'vela aromatica',
      // Otros hogar
      'pilas', 'bombilla', 'cerilla', 'mechero', 'encendedor', 'vela',
      'cinta adhesiva', 'pegamento', 'super glue'
    ]
  },
  'hygiene': {
    id: 'hygiene',
    label: 'Higiene Personal',
    icon: Sparkles,
    color: 'text-pink-600 bg-pink-50',
    keywords: [
      // Ducha y baño
      'champu', 'shampoo', 'gel ducha', 'jabon', 'pastilla jabon', 'esponja baño',
      'exfoliante', 'locion', 'acondicionador', 'suavizante pelo', 'mascarilla pelo',
      // Cabello
      'tinte', 'pelo', 'cabello', 'gomina', 'cera pelo', 'laca', 'espuma pelo',
      'secador', 'plancha pelo', 'peine', 'cepillo pelo',
      // Dental
      'pasta dientes', 'dentrifico', 'cepillo dientes', 'enjuague bucal',
      'colutorio', 'hilo dental', 'seda dental', 'blanqueador dental',
      // Desodorante
      'desodorante', 'antitranspirante', 'roll on', 'spray corporal',
      // Afeitado
      'cuchilla', 'maquinilla', 'afeitado', 'espuma afeitar', 'gel afeitar',
      'after shave', 'gillette', 'wilkinson',
      // Cuidado facial
      'crema', 'hidratante', 'facial', 'contorno ojos', 'serum', 'mascarilla facial',
      'limpiador facial', 'tonico', 'desmaquillante', 'protector solar',
      'bronceador', 'aftersun',
      // Cuidado corporal
      'body', 'corporal', 'manos crema', 'pies crema', 'callos', 'depilar',
      'depilacion', 'cera depilatoria', 'crema depilatoria',
      // Maquillaje
      'maquillaje', 'base', 'corrector', 'polvos', 'colorete', 'rimel',
      'mascara', 'sombra ojos', 'perfilador', 'labial', 'pintalabios', 'gloss',
      'esmalte uñas', 'quitaesmalte', 'lima',
      // Higiene intima
      'compresa', 'tampon', 'salvaslip', 'copa menstrual', 'intimo gel',
      // Bebe
      'pañal', 'toallita', 'bebe', 'colonia bebe', 'crema pañal',
      // Otros
      'preservativo', 'condon', 'lubricante', 'pañuelo', 'pañuelos',
      'bastoncillo', 'algodon', 'tirita', 'venda', 'gasa', 'esparadrapo',
      'termometro', 'mascarilla', 'gel hidroalcoholico', 'hidroalcohol'
    ]
  },
  'pets': {
    id: 'pets',
    label: 'Mascotas',
    icon: Dog,
    color: 'text-stone-600 bg-stone-50',
    keywords: [
      // Perros
      'perro', 'cachorro', 'can', 'pienso perro', 'comida perro', 'lata perro',
      'snack perro', 'premio perro', 'hueso perro', 'galleta perro',
      'correa', 'collar perro', 'arnes', 'bozal', 'cama perro', 'caseta',
      'juguete perro', 'pelota perro', 'champú perro',
      // Gatos
      'gato', 'gatito', 'felino', 'pienso gato', 'comida gato', 'lata gato',
      'snack gato', 'arena gato', 'arenero', 'rascador', 'juguete gato',
      // General mascotas
      'mascota', 'pienso', 'comedero', 'bebedero', 'transportin',
      'antiparasitario', 'pulga', 'garrapata', 'desparasitar', 'veterinario',
      // Otros animales
      'pajaro', 'canario', 'periquito', 'loro', 'alpiste', 'semilla pajaro',
      'jaula', 'pez', 'acuario', 'pecera', 'comida peces',
      'hamster', 'conejo', 'conejillo', 'roedor', 'heno', 'viruta'
    ]
  },
  'other': {
    id: 'other',
    label: 'Otros',
    icon: Package,
    color: 'text-gray-600 bg-gray-50',
    keywords: []
  }
}

// Función helper para detectar categoría
export function detectCategory(text: string): CategoryId {
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Buscar en orden de prioridad (hogar primero para evitar confusiones)
  const priorityOrder: CategoryId[] = [
    'household', 'hygiene', 'pets', 'frozen',
    'meat-fish', 'dairy', 'fruits-veg', 'pantry', 'beverages'
  ]

  for (const catId of priorityOrder) {
    const cat = CATEGORIES[catId]
    if (cat.keywords.some(k => normalizedText.includes(k))) {
      return cat.id
    }
  }
  return 'other'
}

// Lista de productos comunes para sugerencias predictivas
export interface CommonProduct {
  name: string
  category: CategoryId
}

export const COMMON_PRODUCTS: CommonProduct[] = [
  // ========== FRUTAS Y VERDURAS ==========
  // Frutas
  { name: 'Manzanas', category: 'fruits-veg' },
  { name: 'Plátanos', category: 'fruits-veg' },
  { name: 'Naranjas', category: 'fruits-veg' },
  { name: 'Mandarinas', category: 'fruits-veg' },
  { name: 'Limones', category: 'fruits-veg' },
  { name: 'Fresas', category: 'fruits-veg' },
  { name: 'Uvas', category: 'fruits-veg' },
  { name: 'Peras', category: 'fruits-veg' },
  { name: 'Kiwis', category: 'fruits-veg' },
  { name: 'Melocotones', category: 'fruits-veg' },
  { name: 'Sandía', category: 'fruits-veg' },
  { name: 'Melón', category: 'fruits-veg' },
  { name: 'Piña', category: 'fruits-veg' },
  { name: 'Mango', category: 'fruits-veg' },
  { name: 'Aguacates', category: 'fruits-veg' },
  { name: 'Cerezas', category: 'fruits-veg' },
  { name: 'Ciruelas', category: 'fruits-veg' },
  { name: 'Arándanos', category: 'fruits-veg' },
  { name: 'Frambuesas', category: 'fruits-veg' },
  { name: 'Granada', category: 'fruits-veg' },
  { name: 'Higos', category: 'fruits-veg' },
  { name: 'Coco', category: 'fruits-veg' },
  { name: 'Papaya', category: 'fruits-veg' },
  // Verduras
  { name: 'Tomates', category: 'fruits-veg' },
  { name: 'Lechuga', category: 'fruits-veg' },
  { name: 'Espinacas', category: 'fruits-veg' },
  { name: 'Cebollas', category: 'fruits-veg' },
  { name: 'Ajos', category: 'fruits-veg' },
  { name: 'Patatas', category: 'fruits-veg' },
  { name: 'Zanahorias', category: 'fruits-veg' },
  { name: 'Pimientos', category: 'fruits-veg' },
  { name: 'Pepinos', category: 'fruits-veg' },
  { name: 'Calabacín', category: 'fruits-veg' },
  { name: 'Berenjenas', category: 'fruits-veg' },
  { name: 'Brócoli', category: 'fruits-veg' },
  { name: 'Coliflor', category: 'fruits-veg' },
  { name: 'Champiñones', category: 'fruits-veg' },
  { name: 'Puerros', category: 'fruits-veg' },
  { name: 'Judías verdes', category: 'fruits-veg' },
  { name: 'Acelgas', category: 'fruits-veg' },
  { name: 'Col', category: 'fruits-veg' },
  { name: 'Repollo', category: 'fruits-veg' },
  { name: 'Calabaza', category: 'fruits-veg' },
  { name: 'Boniato', category: 'fruits-veg' },
  { name: 'Rábanos', category: 'fruits-veg' },
  { name: 'Apio', category: 'fruits-veg' },
  { name: 'Alcachofas', category: 'fruits-veg' },
  { name: 'Espárragos', category: 'fruits-veg' },
  { name: 'Rúcula', category: 'fruits-veg' },
  { name: 'Canónigos', category: 'fruits-veg' },
  { name: 'Ensalada preparada', category: 'fruits-veg' },
  { name: 'Perejil', category: 'fruits-veg' },
  { name: 'Cilantro', category: 'fruits-veg' },
  { name: 'Albahaca', category: 'fruits-veg' },

  // ========== CARNES Y PESCADOS ==========
  // Aves
  { name: 'Pollo', category: 'meat-fish' },
  { name: 'Pechuga de pollo', category: 'meat-fish' },
  { name: 'Muslos de pollo', category: 'meat-fish' },
  { name: 'Alitas de pollo', category: 'meat-fish' },
  { name: 'Pavo', category: 'meat-fish' },
  { name: 'Pechuga de pavo', category: 'meat-fish' },
  // Vacuno
  { name: 'Ternera', category: 'meat-fish' },
  { name: 'Filetes de ternera', category: 'meat-fish' },
  { name: 'Carne picada', category: 'meat-fish' },
  { name: 'Entrecot', category: 'meat-fish' },
  { name: 'Solomillo', category: 'meat-fish' },
  { name: 'Chuletón', category: 'meat-fish' },
  // Cerdo
  { name: 'Chuletas de cerdo', category: 'meat-fish' },
  { name: 'Lomo de cerdo', category: 'meat-fish' },
  { name: 'Costillas', category: 'meat-fish' },
  { name: 'Secreto ibérico', category: 'meat-fish' },
  // Cordero
  { name: 'Cordero', category: 'meat-fish' },
  { name: 'Chuletas de cordero', category: 'meat-fish' },
  // Conejo
  { name: 'Conejo', category: 'meat-fish' },
  // Embutidos
  { name: 'Jamón serrano', category: 'meat-fish' },
  { name: 'Jamón cocido', category: 'meat-fish' },
  { name: 'Jamón ibérico', category: 'meat-fish' },
  { name: 'Chorizo', category: 'meat-fish' },
  { name: 'Salchichón', category: 'meat-fish' },
  { name: 'Fuet', category: 'meat-fish' },
  { name: 'Mortadela', category: 'meat-fish' },
  { name: 'Salchichas', category: 'meat-fish' },
  { name: 'Bacon', category: 'meat-fish' },
  { name: 'Panceta', category: 'meat-fish' },
  { name: 'Sobrasada', category: 'meat-fish' },
  { name: 'Morcilla', category: 'meat-fish' },
  // Pescados
  { name: 'Salmón', category: 'meat-fish' },
  { name: 'Merluza', category: 'meat-fish' },
  { name: 'Bacalao', category: 'meat-fish' },
  { name: 'Lubina', category: 'meat-fish' },
  { name: 'Dorada', category: 'meat-fish' },
  { name: 'Atún fresco', category: 'meat-fish' },
  { name: 'Trucha', category: 'meat-fish' },
  { name: 'Sardinas', category: 'meat-fish' },
  { name: 'Boquerones', category: 'meat-fish' },
  { name: 'Rape', category: 'meat-fish' },
  { name: 'Lenguado', category: 'meat-fish' },
  // Mariscos
  { name: 'Gambas', category: 'meat-fish' },
  { name: 'Langostinos', category: 'meat-fish' },
  { name: 'Mejillones', category: 'meat-fish' },
  { name: 'Almejas', category: 'meat-fish' },
  { name: 'Calamares', category: 'meat-fish' },
  { name: 'Pulpo', category: 'meat-fish' },
  { name: 'Sepia', category: 'meat-fish' },

  // ========== LÁCTEOS Y HUEVOS ==========
  { name: 'Leche', category: 'dairy' },
  { name: 'Leche entera', category: 'dairy' },
  { name: 'Leche semidesnatada', category: 'dairy' },
  { name: 'Leche desnatada', category: 'dairy' },
  { name: 'Leche sin lactosa', category: 'dairy' },
  { name: 'Leche de almendras', category: 'dairy' },
  { name: 'Leche de avena', category: 'dairy' },
  { name: 'Leche de soja', category: 'dairy' },
  { name: 'Huevos', category: 'dairy' },
  { name: 'Huevos camperos', category: 'dairy' },
  { name: 'Yogur natural', category: 'dairy' },
  { name: 'Yogures', category: 'dairy' },
  { name: 'Yogur griego', category: 'dairy' },
  { name: 'Yogures de sabores', category: 'dairy' },
  { name: 'Actimel', category: 'dairy' },
  { name: 'Kéfir', category: 'dairy' },
  { name: 'Natillas', category: 'dairy' },
  { name: 'Flan', category: 'dairy' },
  { name: 'Queso', category: 'dairy' },
  { name: 'Queso fresco', category: 'dairy' },
  { name: 'Queso rallado', category: 'dairy' },
  { name: 'Queso manchego', category: 'dairy' },
  { name: 'Queso en lonchas', category: 'dairy' },
  { name: 'Mozzarella', category: 'dairy' },
  { name: 'Parmesano', category: 'dairy' },
  { name: 'Queso de untar', category: 'dairy' },
  { name: 'Philadelphia', category: 'dairy' },
  { name: 'Mantequilla', category: 'dairy' },
  { name: 'Margarina', category: 'dairy' },
  { name: 'Nata para cocinar', category: 'dairy' },
  { name: 'Nata para montar', category: 'dairy' },
  { name: 'Batido de chocolate', category: 'dairy' },

  // ========== DESPENSA ==========
  // Pan
  { name: 'Pan', category: 'pantry' },
  { name: 'Pan de molde', category: 'pantry' },
  { name: 'Pan integral', category: 'pantry' },
  { name: 'Barra de pan', category: 'pantry' },
  { name: 'Baguette', category: 'pantry' },
  { name: 'Pan rallado', category: 'pantry' },
  { name: 'Tostadas', category: 'pantry' },
  // Arroz y cereales
  { name: 'Arroz', category: 'pantry' },
  { name: 'Arroz integral', category: 'pantry' },
  { name: 'Arroz basmati', category: 'pantry' },
  { name: 'Quinoa', category: 'pantry' },
  { name: 'Cereales', category: 'pantry' },
  { name: 'Avena', category: 'pantry' },
  { name: 'Muesli', category: 'pantry' },
  { name: 'Corn Flakes', category: 'pantry' },
  // Pasta
  { name: 'Pasta', category: 'pantry' },
  { name: 'Espaguetis', category: 'pantry' },
  { name: 'Macarrones', category: 'pantry' },
  { name: 'Tallarines', category: 'pantry' },
  { name: 'Fideos', category: 'pantry' },
  { name: 'Lasaña', category: 'pantry' },
  // Legumbres
  { name: 'Garbanzos', category: 'pantry' },
  { name: 'Lentejas', category: 'pantry' },
  { name: 'Alubias', category: 'pantry' },
  { name: 'Judiones', category: 'pantry' },
  // Aceites
  { name: 'Aceite de oliva', category: 'pantry' },
  { name: 'Aceite de oliva virgen extra', category: 'pantry' },
  { name: 'Aceite de girasol', category: 'pantry' },
  { name: 'Vinagre', category: 'pantry' },
  // Salsas
  { name: 'Tomate frito', category: 'pantry' },
  { name: 'Salsa de tomate', category: 'pantry' },
  { name: 'Tomate triturado', category: 'pantry' },
  { name: 'Ketchup', category: 'pantry' },
  { name: 'Mayonesa', category: 'pantry' },
  { name: 'Mostaza', category: 'pantry' },
  { name: 'Salsa barbacoa', category: 'pantry' },
  { name: 'Salsa de soja', category: 'pantry' },
  { name: 'Pesto', category: 'pantry' },
  // Condimentos
  { name: 'Sal', category: 'pantry' },
  { name: 'Pimienta', category: 'pantry' },
  { name: 'Pimentón', category: 'pantry' },
  { name: 'Orégano', category: 'pantry' },
  { name: 'Especias', category: 'pantry' },
  { name: 'Caldo de pollo', category: 'pantry' },
  { name: 'Caldo de verduras', category: 'pantry' },
  // Conservas
  { name: 'Atún en lata', category: 'pantry' },
  { name: 'Sardinas en lata', category: 'pantry' },
  { name: 'Maíz en lata', category: 'pantry' },
  { name: 'Aceitunas', category: 'pantry' },
  { name: 'Pepinillos', category: 'pantry' },
  { name: 'Pimientos del piquillo', category: 'pantry' },
  { name: 'Espárragos en lata', category: 'pantry' },
  // Dulces
  { name: 'Azúcar', category: 'pantry' },
  { name: 'Miel', category: 'pantry' },
  { name: 'Mermelada', category: 'pantry' },
  { name: 'Nocilla', category: 'pantry' },
  { name: 'Nutella', category: 'pantry' },
  { name: 'Chocolate', category: 'pantry' },
  { name: 'Cacao en polvo', category: 'pantry' },
  { name: 'Galletas', category: 'pantry' },
  { name: 'Galletas María', category: 'pantry' },
  { name: 'Oreo', category: 'pantry' },
  { name: 'Magdalenas', category: 'pantry' },
  { name: 'Bizcocho', category: 'pantry' },
  { name: 'Croissants', category: 'pantry' },
  { name: 'Donuts', category: 'pantry' },
  // Snacks
  { name: 'Patatas fritas', category: 'pantry' },
  { name: 'Frutos secos', category: 'pantry' },
  { name: 'Almendras', category: 'pantry' },
  { name: 'Nueces', category: 'pantry' },
  { name: 'Cacahuetes', category: 'pantry' },
  { name: 'Pipas', category: 'pantry' },
  { name: 'Nachos', category: 'pantry' },
  { name: 'Palomitas', category: 'pantry' },
  // Repostería
  { name: 'Harina', category: 'pantry' },
  { name: 'Levadura', category: 'pantry' },
  { name: 'Maicena', category: 'pantry' },

  // ========== CONGELADOS ==========
  { name: 'Pizza congelada', category: 'frozen' },
  { name: 'Lasaña congelada', category: 'frozen' },
  { name: 'Croquetas', category: 'frozen' },
  { name: 'Nuggets de pollo', category: 'frozen' },
  { name: 'San Jacobos', category: 'frozen' },
  { name: 'Empanadillas', category: 'frozen' },
  { name: 'Palitos de pescado', category: 'frozen' },
  { name: 'Verduras congeladas', category: 'frozen' },
  { name: 'Guisantes congelados', category: 'frozen' },
  { name: 'Judías verdes congeladas', category: 'frozen' },
  { name: 'Menestra', category: 'frozen' },
  { name: 'Patatas congeladas', category: 'frozen' },
  { name: 'Pescado congelado', category: 'frozen' },
  { name: 'Merluza congelada', category: 'frozen' },
  { name: 'Langostinos congelados', category: 'frozen' },
  { name: 'Helado', category: 'frozen' },
  { name: 'Helado de vainilla', category: 'frozen' },
  { name: 'Helado de chocolate', category: 'frozen' },
  { name: 'Polos', category: 'frozen' },
  { name: 'Cubitos de hielo', category: 'frozen' },

  // ========== BEBIDAS ==========
  { name: 'Agua mineral', category: 'beverages' },
  { name: 'Agua con gas', category: 'beverages' },
  { name: 'Refrescos', category: 'beverages' },
  { name: 'Coca-Cola', category: 'beverages' },
  { name: 'Pepsi', category: 'beverages' },
  { name: 'Fanta', category: 'beverages' },
  { name: 'Sprite', category: 'beverages' },
  { name: 'Tónica', category: 'beverages' },
  { name: 'Aquarius', category: 'beverages' },
  { name: 'Nestea', category: 'beverages' },
  { name: 'Zumo de naranja', category: 'beverages' },
  { name: 'Zumo de piña', category: 'beverages' },
  { name: 'Zumo de melocotón', category: 'beverages' },
  { name: 'Zumo multifrutas', category: 'beverages' },
  { name: 'Mosto', category: 'beverages' },
  { name: 'Café', category: 'beverages' },
  { name: 'Café molido', category: 'beverages' },
  { name: 'Café en cápsulas', category: 'beverages' },
  { name: 'Nespresso', category: 'beverages' },
  { name: 'Café soluble', category: 'beverages' },
  { name: 'Té', category: 'beverages' },
  { name: 'Infusiones', category: 'beverages' },
  { name: 'Manzanilla', category: 'beverages' },
  { name: 'Cerveza', category: 'beverages' },
  { name: 'Cerveza sin alcohol', category: 'beverages' },
  { name: 'Vino tinto', category: 'beverages' },
  { name: 'Vino blanco', category: 'beverages' },
  { name: 'Vino rosado', category: 'beverages' },
  { name: 'Cava', category: 'beverages' },
  { name: 'Sangría', category: 'beverages' },
  { name: 'Sidra', category: 'beverages' },
  { name: 'Vermut', category: 'beverages' },

  // ========== HOGAR Y LIMPIEZA ==========
  { name: 'Detergente ropa', category: 'household' },
  { name: 'Detergente líquido', category: 'household' },
  { name: 'Detergente en cápsulas', category: 'household' },
  { name: 'Suavizante', category: 'household' },
  { name: 'Quitamanchas', category: 'household' },
  { name: 'Lejía', category: 'household' },
  { name: 'Lavavajillas', category: 'household' },
  { name: 'Pastillas lavavajillas', category: 'household' },
  { name: 'Fairy', category: 'household' },
  { name: 'Limpiador multiusos', category: 'household' },
  { name: 'Limpia cristales', category: 'household' },
  { name: 'Fregasuelos', category: 'household' },
  { name: 'Desengrasante', category: 'household' },
  { name: 'Limpiador baño', category: 'household' },
  { name: 'Limpiador WC', category: 'household' },
  { name: 'Antical', category: 'household' },
  { name: 'Amoniaco', category: 'household' },
  { name: 'Papel higiénico', category: 'household' },
  { name: 'Papel de cocina', category: 'household' },
  { name: 'Servilletas', category: 'household' },
  { name: 'Pañuelos de papel', category: 'household' },
  { name: 'Bolsas de basura', category: 'household' },
  { name: 'Papel de aluminio', category: 'household' },
  { name: 'Film transparente', category: 'household' },
  { name: 'Papel de horno', category: 'household' },
  { name: 'Estropajo', category: 'household' },
  { name: 'Esponja', category: 'household' },
  { name: 'Bayeta', category: 'household' },
  { name: 'Fregona', category: 'household' },
  { name: 'Escoba', category: 'household' },
  { name: 'Recogedor', category: 'household' },
  { name: 'Guantes de limpieza', category: 'household' },
  { name: 'Ambientador', category: 'household' },
  { name: 'Insecticida', category: 'household' },
  { name: 'Pilas', category: 'household' },
  { name: 'Bombillas', category: 'household' },
  { name: 'Velas', category: 'household' },
  { name: 'Cerillas', category: 'household' },
  { name: 'Mechero', category: 'household' },

  // ========== HIGIENE PERSONAL ==========
  { name: 'Gel de ducha', category: 'hygiene' },
  { name: 'Champú', category: 'hygiene' },
  { name: 'Acondicionador', category: 'hygiene' },
  { name: 'Jabón de manos', category: 'hygiene' },
  { name: 'Jabón en pastilla', category: 'hygiene' },
  { name: 'Pasta de dientes', category: 'hygiene' },
  { name: 'Cepillo de dientes', category: 'hygiene' },
  { name: 'Enjuague bucal', category: 'hygiene' },
  { name: 'Hilo dental', category: 'hygiene' },
  { name: 'Desodorante', category: 'hygiene' },
  { name: 'Crema hidratante', category: 'hygiene' },
  { name: 'Crema de manos', category: 'hygiene' },
  { name: 'Protector solar', category: 'hygiene' },
  { name: 'Cuchillas de afeitar', category: 'hygiene' },
  { name: 'Espuma de afeitar', category: 'hygiene' },
  { name: 'Maquinilla', category: 'hygiene' },
  { name: 'Compresas', category: 'hygiene' },
  { name: 'Tampones', category: 'hygiene' },
  { name: 'Pañales', category: 'hygiene' },
  { name: 'Toallitas húmedas', category: 'hygiene' },
  { name: 'Algodón', category: 'hygiene' },
  { name: 'Bastoncillos', category: 'hygiene' },
  { name: 'Tiritas', category: 'hygiene' },
  { name: 'Gel hidroalcohólico', category: 'hygiene' },
  { name: 'Mascarillas', category: 'hygiene' },
  { name: 'Colonia', category: 'hygiene' },
  { name: 'Laca pelo', category: 'hygiene' },
  { name: 'Gomina', category: 'hygiene' },
  { name: 'Crema facial', category: 'hygiene' },
  { name: 'Desmaquillante', category: 'hygiene' },

  // ========== MASCOTAS ==========
  { name: 'Comida para perro', category: 'pets' },
  { name: 'Pienso perro', category: 'pets' },
  { name: 'Latas perro', category: 'pets' },
  { name: 'Snacks perro', category: 'pets' },
  { name: 'Comida para gato', category: 'pets' },
  { name: 'Pienso gato', category: 'pets' },
  { name: 'Latas gato', category: 'pets' },
  { name: 'Arena para gatos', category: 'pets' },
  { name: 'Snacks gato', category: 'pets' },
  { name: 'Bolsas para excrementos', category: 'pets' },
  { name: 'Champú mascota', category: 'pets' },
  { name: 'Antiparasitario', category: 'pets' },
]

// Función de búsqueda predictiva mejorada
export function searchProducts(query: string, maxResults: number = 5): CommonProduct[] {
  if (!query || query.length < 2) return []

  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Buscar coincidencias
  const matches = COMMON_PRODUCTS.filter(product => {
    const normalizedName = product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return normalizedName.includes(normalizedQuery)
  })

  // Ordenar por relevancia (coincidencias al inicio primero)
  matches.sort((a, b) => {
    const aName = a.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const bName = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const aStartsWith = aName.startsWith(normalizedQuery)
    const bStartsWith = bName.startsWith(normalizedQuery)

    if (aStartsWith && !bStartsWith) return -1
    if (!aStartsWith && bStartsWith) return 1
    return aName.localeCompare(bName)
  })

  return matches.slice(0, maxResults)
}

// ============================================
// SUGERENCIAS INTELIGENTES
// ============================================

// Mapa de productos relacionados (comprados frecuentemente juntos)
const PRODUCT_ASSOCIATIONS: Record<string, string[]> = {
  // Desayuno
  'leche': ['cereales', 'café', 'cacao', 'galletas', 'tostadas', 'colacao', 'nesquik'],
  'cereales': ['leche', 'yogur', 'plátanos', 'fresas'],
  'café': ['leche', 'azúcar', 'galletas', 'tostadas', 'croissants'],
  'tostadas': ['mantequilla', 'mermelada', 'aceite de oliva', 'tomate'],
  'pan': ['mantequilla', 'mermelada', 'embutido', 'queso', 'aceite', 'tomate'],
  'pan de molde': ['jamón', 'queso', 'mayonesa', 'lechuga', 'tomate'],
  'croissants': ['mantequilla', 'mermelada', 'chocolate', 'café'],

  // Comidas principales
  'pasta': ['tomate frito', 'queso rallado', 'carne picada', 'aceite de oliva', 'orégano'],
  'espaguetis': ['tomate frito', 'carne picada', 'queso parmesano', 'albahaca'],
  'macarrones': ['tomate frito', 'queso rallado', 'bacon', 'nata'],
  'lasaña': ['carne picada', 'tomate', 'bechamel', 'queso'],
  'arroz': ['pollo', 'verduras', 'aceite', 'sal', 'caldo'],
  'paella': ['arroz', 'mariscos', 'pollo', 'judías verdes', 'azafrán'],
  'pollo': ['arroz', 'patatas', 'ensalada', 'limón', 'especias'],
  'pechuga de pollo': ['arroz', 'ensalada', 'limón', 'aceite'],
  'carne picada': ['pasta', 'tomate', 'cebolla', 'ajo', 'especias'],
  'ternera': ['patatas', 'pimientos', 'cebolla', 'vino'],
  'cerdo': ['patatas', 'manzana', 'mostaza'],
  'salmón': ['limón', 'eneldo', 'patatas', 'espárragos'],
  'merluza': ['limón', 'perejil', 'patatas', 'ajo'],
  'huevos': ['bacon', 'patatas', 'aceite', 'sal', 'pan'],
  'tortilla': ['huevos', 'patatas', 'cebolla', 'aceite'],
  'patatas': ['huevos', 'cebolla', 'aceite', 'sal'],

  // Ensaladas
  'lechuga': ['tomate', 'cebolla', 'aceite de oliva', 'vinagre', 'atún'],
  'tomate': ['lechuga', 'cebolla', 'aceite de oliva', 'mozzarella', 'albahaca'],
  'ensalada': ['tomate', 'aceitunas', 'atún', 'huevo', 'vinagreta'],
  'aguacate': ['tomate', 'limón', 'cebolla', 'cilantro'],

  // Pizza y comida rápida
  'pizza': ['refrescos', 'cerveza', 'ensalada'],
  'hamburguesa': ['pan', 'queso', 'lechuga', 'tomate', 'ketchup', 'patatas fritas'],

  // Snacks y meriendas
  'galletas': ['leche', 'café', 'chocolate', 'té'],
  'chocolate': ['leche', 'galletas', 'frutos secos', 'fresas'],
  'patatas fritas': ['refrescos', 'cerveza', 'salsas', 'nachos'],
  'nachos': ['guacamole', 'queso', 'salsa', 'jalapeños'],
  'refrescos': ['patatas fritas', 'pizza', 'snacks', 'hielo'],
  'frutos secos': ['cerveza', 'vino', 'chocolate'],

  // Postres
  'helado': ['galletas', 'chocolate', 'fruta', 'nata'],
  'yogur': ['fruta', 'miel', 'cereales', 'frutos secos'],
  'fruta': ['yogur', 'nata', 'chocolate', 'helado'],

  // Bebidas
  'cerveza': ['patatas fritas', 'aceitunas', 'frutos secos', 'queso', 'jamón'],
  'vino': ['queso', 'jamón', 'pan', 'aceitunas', 'embutido'],
  'vino tinto': ['queso manchego', 'jamón ibérico', 'chorizo'],
  'cava': ['mariscos', 'jamón', 'queso'],
  'agua': ['refrescos', 'zumo', 'limón'],
  'zumo': ['galletas', 'tostadas', 'cereales'],
  'té': ['galletas', 'miel', 'limón', 'pastas'],

  // Cocina asiática
  'arroz basmati': ['curry', 'pollo', 'verduras', 'salsa de soja'],
  'fideos': ['verduras', 'salsa de soja', 'gambas', 'pollo'],
  'salsa de soja': ['arroz', 'fideos', 'tofu', 'jengibre'],

  // Cocina italiana
  'mozzarella': ['tomate', 'albahaca', 'aceite de oliva', 'pizza'],
  'parmesano': ['pasta', 'risotto', 'ensalada cesar'],
  'pesto': ['pasta', 'pan', 'queso'],

  // Cocina mexicana
  'tortillas': ['carne', 'queso', 'guacamole', 'salsa', 'crema agria'],

  // Higiene y limpieza
  'papel higiénico': ['servilletas', 'papel de cocina', 'jabón', 'ambientador'],
  'jabón': ['champú', 'gel de ducha', 'crema'],
  'champú': ['acondicionador', 'gel de ducha', 'mascarilla pelo'],
  'gel de ducha': ['champú', 'esponja', 'crema corporal'],
  'pasta de dientes': ['cepillo de dientes', 'enjuague bucal', 'hilo dental'],
  'detergente': ['suavizante', 'lejía', 'quitamanchas'],
  'detergente ropa': ['suavizante', 'lejía', 'quitamanchas'],
  'lavavajillas': ['estropajo', 'guantes', 'bayeta', 'abrillantador'],
  'fregasuelos': ['fregona', 'cubo', 'lejía'],
  'limpiador': ['bayeta', 'guantes', 'estropajo'],

  // Bebé
  'pañales': ['toallitas', 'crema pañal', 'biberón'],
  'toallitas': ['pañales', 'crema', 'jabón bebé'],
}

// Normalizar nombre para búsqueda
function normalizeForSearch(text: string): string {
  return text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/s$/, '') // Quitar plural simple
}

/**
 * Obtiene sugerencias inteligentes basadas en los items ya en la lista
 * @param currentItems - Nombres de items actuales en la lista
 * @param maxSuggestions - Número máximo de sugerencias
 * @returns Array de productos sugeridos
 */
export function getSmartSuggestions(
  currentItems: string[],
  maxSuggestions: number = 4
): CommonProduct[] {
  if (!currentItems.length) return []

  const suggestions = new Map<string, number>() // producto -> puntuación
  const currentItemsNormalized = new Set(currentItems.map(normalizeForSearch))

  // Para cada item en la lista, buscar productos relacionados
  currentItems.forEach(item => {
    const normalizedItem = normalizeForSearch(item)

    // Buscar en las asociaciones
    Object.entries(PRODUCT_ASSOCIATIONS).forEach(([key, related]) => {
      const normalizedKey = normalizeForSearch(key)

      // Si el item de la lista coincide con una clave de asociación
      if (normalizedItem.includes(normalizedKey) || normalizedKey.includes(normalizedItem)) {
        related.forEach(relatedProduct => {
          const normalizedRelated = normalizeForSearch(relatedProduct)
          // No sugerir algo que ya está en la lista
          if (!currentItemsNormalized.has(normalizedRelated)) {
            const currentScore = suggestions.get(relatedProduct) || 0
            suggestions.set(relatedProduct, currentScore + 1)
          }
        })
      }
    })
  })

  // Ordenar por puntuación y convertir a CommonProduct
  const sortedSuggestions = Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSuggestions)
    .map(([name]) => {
      // Buscar en COMMON_PRODUCTS para obtener la categoría
      const found = COMMON_PRODUCTS.find(p =>
        normalizeForSearch(p.name).includes(normalizeForSearch(name))
      )
      return {
        name: found?.name || name.charAt(0).toUpperCase() + name.slice(1),
        category: found?.category || detectCategory(name)
      }
    })

  return sortedSuggestions
}
