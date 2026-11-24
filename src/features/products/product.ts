export interface ProductFields {
  title: string
  description: string
  category: string
  price: number
  image: string
}

export interface Product extends ProductFields {
  id: string
  images: string[]
  brand?: string
  rating?: number
  stock?: number
  sku?: string
}

interface ApiProduct {
  id: number
  title: string
  description: string
  category: string
  price: number
  thumbnail: string
  images: string[]
  brand?: string
  rating?: number
  stock?: number
  sku?: string
}

const cachedImages = new Set(['11', '12', '13', '14', '43', '45', '46', '47', '49', '53', '61', '69'])
const featuredIds = ['12', '47', '46', '14', '13', '43', '11', '45', '49', '53', '61', '69']

export const categoryNames: Record<string, string> = {
  beauty: 'Косметика',
  fragrances: 'Парфюмерия',
  furniture: 'Мебель',
  groceries: 'Продукты',
  'home-decoration': 'Декор',
  'kitchen-accessories': 'Для кухни',
  laptops: 'Ноутбуки',
  'mens-shirts': 'Мужские рубашки',
  'mens-shoes': 'Мужская обувь',
  'mens-watches': 'Мужские часы',
  'mobile-accessories': 'Аксессуары для телефонов',
  motorcycle: 'Мотоциклы',
  'skin-care': 'Уход за кожей',
  smartphones: 'Смартфоны',
  'sports-accessories': 'Спорт',
  sunglasses: 'Солнцезащитные очки',
  tablets: 'Планшеты',
  tops: 'Топы',
  vehicle: 'Автомобили',
  'womens-bags': 'Женские сумки',
  'womens-dresses': 'Платья',
  'womens-jewellery': 'Украшения',
  'womens-shoes': 'Женская обувь',
  'womens-watches': 'Женские часы',
}

export function categoryName(category: string) {
  return Object.hasOwn(categoryNames, category) ? categoryNames[category] : category
}

export const formatPrice = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
}).format

export const productPath = (id: string) => `/products/${encodeURIComponent(id)}`

export function productCount(count: number) {
  const word = { one: 'товар', few: 'товара', many: 'товаров', other: 'товара' }
  const plural = new Intl.PluralRules('ru-RU').select(count)
  return `${count} ${word[plural as keyof typeof word]}`
}

export function cachedImage(product: Product) {
  return cachedImages.has(product.id) && product.image.startsWith('https://cdn.dummyjson.com/')
    ? `${import.meta.env.BASE_URL}images/product-${product.id}.webp`
    : undefined
}

function isApiProduct(value: unknown): value is ApiProduct {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ApiProduct>
  return Number.isInteger(item.id) && typeof item.title === 'string' &&
    typeof item.description === 'string' && typeof item.category === 'string' &&
    typeof item.price === 'number' && Number.isFinite(item.price) &&
    typeof item.thumbnail === 'string' && Array.isArray(item.images) &&
    item.images.every((image) => typeof image === 'string') &&
    (item.brand === undefined || typeof item.brand === 'string') &&
    (item.rating === undefined || typeof item.rating === 'number') &&
    (item.stock === undefined || typeof item.stock === 'number') &&
    (item.sku === undefined || typeof item.sku === 'string')
}

export async function fetchProducts(url: string): Promise<Product[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!response.ok) throw new Error(`Catalog request failed with status ${response.status}`)

  const data = await response.json() as { products?: unknown }
  if (!Array.isArray(data?.products) || !data.products.every(isApiProduct)) {
    throw new Error('Unexpected catalog response')
  }

  const products = data.products.map(({ id, thumbnail, ...product }) => ({
    ...product,
    id: String(id),
    image: thumbnail,
  }))
  const priority = new Map(featuredIds.map((id, index) => [id, index]))
  return products.sort((left, right) =>
    (priority.get(left.id) ?? featuredIds.length) - (priority.get(right.id) ?? featuredIds.length),
  )
}
