import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, Heart, PackageSearch, Pencil, Star } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ProductImage } from '../components/ProductImage'
import { StatusPanel } from '../components/StatusPanel'
import { categoryName, formatPrice, productPath, type Product } from '../features/products/product'
import { useCatalogStore, useProducts } from '../features/products/store'

export function useProductRoute() {
  const { id } = useParams()
  const { state } = useLocation()
  const products = useProducts()
  const status = useCatalogStore((value) => value.status)
  const retry = useCatalogStore((value) => value.loadProducts)
  const product = products.find((item) => item.id === id)
  const from = typeof state?.catalogLocation === 'string' && /^\/products(?:\?|$)/.test(state.catalogLocation)
    ? String(state.catalogLocation) : '/products'

  return { product, status, retry, from }
}

export function MissingProduct({ status, retry, from }: Omit<ReturnType<typeof useProductRoute>, 'product'>) {
  if (status === 'loading' || status === 'idle') {
    return <p className="page-loading" role="status">Загружаем товар…</p>
  }
  if (status === 'error') {
    return <StatusPanel icon={AlertCircle} title="Не удалось загрузить товар"
      action={<button type="button" className="button button-secondary" onClick={() => void retry()}>Повторить</button>}>
      Не удалось получить данные каталога.
    </StatusPanel>
  }
  return <StatusPanel icon={PackageSearch} title="Товар не найден"
    action={<Link className="button button-primary" to={from}>В каталог</Link>}>
    Возможно, карточка была удалена или ссылка устарела.
  </StatusPanel>
}

export function ProductPage() {
  const route = useProductRoute()

  useEffect(() => {
    document.title = route.product ? `${route.product.title} · Полка` : 'Товар · Полка'
  }, [route.product])

  return (
    <div className="inner-page">
      <Link className="back-link" to={route.from}><ArrowLeft size={19} aria-hidden="true" /> В каталог</Link>
      {route.product ? <ProductDetails key={route.product.id} product={route.product} from={route.from} />
        : <MissingProduct {...route} />}
    </div>
  )
}

function ProductDetails({ product, from }: { product: Product; from: string }) {
  const [selectedImage, setSelectedImage] = useState<string>()
  const favorite = useCatalogStore((state) => state.favoriteIds.includes(product.id))
  const toggleFavorite = useCatalogStore((state) => state.toggleFavorite)
  const images = [...new Set([product.image, ...product.images])]
  const activeImage = selectedImage && images.includes(selectedImage) ? selectedImage : product.image

  return (
    <article className="product-detail">
      <div className="detail-gallery">
        <div className="detail-media" data-category={product.category}>
          <ProductImage product={product} source={activeImage} className="detail-image" eager />
        </div>
        {images.length > 1 && (
          <div className="detail-thumbnails" role="group" aria-label="Изображения товара">
            {images.map((source, index) => (
              <button type="button" key={source} className="detail-thumbnail" aria-pressed={activeImage === source}
                aria-label={`Изображение ${index + 1} из ${images.length}`} onClick={() => setSelectedImage(source)}>
                <ProductImage product={product} source={source} className="thumbnail-image" decorative />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-body">
        <p className="category-label">{categoryName(product.category)}</p>
        <h1>{product.title}</h1>
        <div className="detail-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.rating !== undefined && <span className="rating"><Star size={17} aria-hidden="true" />
            {product.rating.toLocaleString('ru-RU')} <span className="sr-only">из 5</span></span>}
        </div>
        <p className="detail-description">{product.description}</p>
        {(product.brand || product.sku || product.stock !== undefined) && (
          <dl className="detail-specs">
            {product.brand && <div><dt>Бренд</dt><dd>{product.brand}</dd></div>}
            {product.sku && <div><dt>Артикул</dt><dd>{product.sku}</dd></div>}
            {product.stock !== undefined && <div><dt>В наличии</dt><dd>{product.stock} шт.</dd></div>}
          </dl>
        )}
        <div className="detail-actions">
          <button type="button" className="button button-primary favorite-detail" aria-label="Избранное" aria-pressed={favorite}
            onClick={() => toggleFavorite(product.id)}><Heart size={19} aria-hidden="true" />
            {favorite ? 'В избранном' : 'В избранное'}</button>
          <Link className="button button-secondary" to={`${productPath(product.id)}/edit`} state={{ catalogLocation: from }}>
            <Pencil size={17} aria-hidden="true" /> Редактировать
          </Link>
        </div>
      </div>
    </article>
  )
}
