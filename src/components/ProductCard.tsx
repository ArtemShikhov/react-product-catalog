import { ArrowUpRight, Heart, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryName, formatPrice, productPath, type Product } from '../features/products/product'
import { ProductImage } from './ProductImage'

interface ProductCardProps {
  product: Product
  favorite: boolean
  catalogLocation: string
  onFavorite: () => void
  onDelete: () => void
}

export function ProductCard({ product, favorite, catalogLocation, onFavorite, onDelete }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="card-media" data-category={product.category}>
        <ProductImage product={product} className="card-image" decorative />
      </div>
      <div className="card-actions">
        <button type="button" className="icon-button card-favorite" aria-label={`Избранное: ${product.title}`}
          aria-pressed={favorite} title={favorite ? 'Убрать из избранного' : 'В избранное'} onClick={onFavorite}>
          <Heart size={19} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button card-delete" aria-label={`Удалить: ${product.title}`}
          title="Удалить товар" onClick={onDelete}>
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="card-body">
        <p className="category-label">{categoryName(product.category)}</p>
        <h3><Link className="card-link" to={productPath(product.id)} state={{ catalogLocation }}
          title={product.title}>{product.title}</Link></h3>
        <p className="card-description">{product.description}</p>
        <div className="card-bottom">
          <strong>{formatPrice(product.price)}</strong>
          <ArrowUpRight size={19} aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}
