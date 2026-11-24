import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cachedImage, type Product } from '../features/products/product'

interface ProductImageProps {
  product: Product
  source?: string
  className: string
  decorative?: boolean
  eager?: boolean
}

export function ProductImage({ product, source = product.image, className, decorative, eager }: ProductImageProps) {
  const cached = cachedImage(product)
  const urls = source === product.image && cached ? [cached, source] : [source, cached]
  return (
    <ImageWithFallback
      key={JSON.stringify(urls)}
      urls={urls}
      alt={decorative ? '' : product.title}
      className={className}
      eager={eager}
    />
  )
}

function ImageWithFallback({ urls, alt, className, eager }: {
  urls: (string | undefined)[]
  alt: string
  className: string
  eager?: boolean
}) {
  const [index, setIndex] = useState(0)
  const url = urls[index]
  return url
    ? <img className={className} src={url} alt={alt} loading={eager ? 'eager' : 'lazy'}
        decoding="async" referrerPolicy="no-referrer" onError={() => setIndex((value) => value + 1)} />
    : <span className={`${className} image-placeholder`} role={alt ? 'img' : undefined}
        aria-label={alt ? `Изображение недоступно: ${alt}` : undefined}><ImageOff aria-hidden="true" /></span>
}
