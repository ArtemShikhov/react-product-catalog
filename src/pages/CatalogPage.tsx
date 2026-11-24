import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ChevronDown, Grid2X2, Heart, PackageSearch, Search, X } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Pagination } from '../components/Pagination'
import { ProductCard } from '../components/ProductCard'
import { StatusPanel } from '../components/StatusPanel'
import { categoryName, productCount } from '../features/products/product'
import { useCatalogStore, useProducts } from '../features/products/store'

const PAGE_SIZE = 12
const collator = new Intl.Collator('ru-RU')
const initialFilters = { view: '', q: '', category: '', sort: '', page: '' }

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const { search } = useLocation()
  const products = useProducts()
  const favoriteIds = useCatalogStore((state) => state.favoriteIds)
  const toggleFavorite = useCatalogStore((state) => state.toggleFavorite)
  const removeProduct = useCatalogStore((state) => state.deleteProduct)
  const loadProducts = useCatalogStore((state) => state.loadProducts)
  const status = useCatalogStore((state) => state.status)
  const usingSnapshot = useCatalogStore((state) => state.usingSnapshot)
  const [notice, setNotice] = useState('')
  const section = useRef<HTMLElement>(null)
  const favoritesOnly = params.get('view') === 'favorites'
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const sort = params.get('sort') ?? ''
  const requestedPage = Number(params.get('page'))

  useEffect(() => {
    document.title = 'Полка · Каталог товаров'
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds])
  const favoriteCount = products.filter(({ id }) => favoriteSet.has(id)).length
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))]
    .sort((left, right) => collator.compare(categoryName(left), categoryName(right))), [products])

  const filtered = useMemo(() => {
    const keywords = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
    const result = products.filter((product) => {
      if (favoritesOnly && !favoriteSet.has(product.id)) return false
      if (category && product.category !== category) return false
      const text = [product.title, product.description, product.brand, categoryName(product.category)]
        .join(' ').toLocaleLowerCase()
      return keywords.every((keyword) => text.includes(keyword))
    })

    if (sort === 'price-asc') return result.sort((left, right) => left.price - right.price)
    if (sort === 'price-desc') return result.sort((left, right) => right.price - left.price)
    if (sort === 'title') return result.sort((left, right) => collator.compare(left.title, right.title))
    return result
  }, [category, favoriteSet, favoritesOnly, products, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Number.isInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, totalPages)) : 1
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = Boolean(query || category || sort)
  const isLoading = status === 'idle' || status === 'loading'

  function updateFilters(changes: Partial<typeof initialFilters>, replace = true) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries({ page: '', ...changes })) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace })
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return
    updateFilters({ page: nextPage === 1 ? '' : String(nextPage) }, false)
    section.current?.scrollIntoView({ block: 'start' })
  }

  function deleteProduct(id: string) {
    removeProduct(id)
    setNotice('Товар удалён')
  }

  return (
    <div className="catalog-page">
      <section className="catalog-hero" aria-labelledby="catalog-title">
        <div className="hero-content">
          <h1 id="catalog-title">Каталог товаров</h1>
          <p>Находите товары и сохраняйте<br className="hero-break" /> их в избранном.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit hero-orbit-outer" />
          <div className="hero-orbit hero-orbit-inner" />
          <div className="hero-disc" />
          <img className="hero-sofa" src={`${import.meta.env.BASE_URL}images/product-12.webp`} alt="" />
          <img className="hero-lamp" src={`${import.meta.env.BASE_URL}images/product-47.webp`} alt="" />
        </div>
      </section>

      <section className="catalog-section" ref={section} aria-labelledby="results-heading">
        <div className="catalog-controls">
          <div className="view-switch" role="group" aria-label="Подборка товаров">
            <button type="button" aria-pressed={!favoritesOnly} onClick={() => updateFilters({ view: '' })}>
              <Grid2X2 size={17} aria-hidden="true" /> Все товары
            </button>
            <button type="button" aria-pressed={favoritesOnly} onClick={() => updateFilters({ view: 'favorites' })}>
              <Heart size={17} aria-hidden="true" /> Избранное
              {favoriteCount > 0 && <span className="favorite-count">{favoriteCount}</span>}
            </button>
          </div>
          <div className="filter-controls">
            <div className="search-field">
              <Search size={18} aria-hidden="true" />
              <input type="search" aria-label="Поиск товаров" placeholder="Поиск товаров" value={query}
                onChange={(event) => updateFilters({ q: event.target.value })} />
              {query && <button type="button" className="clear-search" aria-label="Очистить поиск"
                onClick={() => updateFilters({ q: '' })}><X size={16} aria-hidden="true" /></button>}
            </div>
            <label className="select-field">
              <select aria-label="Категория" value={category} onChange={(event) => updateFilters({ category: event.target.value })}>
                <option value="">Все категории</option>
                {category && !categories.includes(category) && <option value={category}>{categoryName(category)}</option>}
                {categories.map((key) => <option key={key} value={key}>{categoryName(key)}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </div>
        </div>

        <div className="results-header">
          <h2 id="results-heading">{favoritesOnly ? 'Избранное' : 'Все товары'}</h2>
          {!isLoading && <span className="results-count" role="status">{productCount(filtered.length)}</span>}
          <label className="select-field sort-field">
            <select aria-label="Сортировка" value={sort} onChange={(event) => updateFilters({ sort: event.target.value })}>
              <option value="">По умолчанию</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="title">По названию</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        </div>

        {usingSnapshot && (
          <div className="load-notice" role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>Показана сохранённая версия каталога.</span>
            <button type="button" className="text-button" onClick={() => void loadProducts()} disabled={isLoading}>Обновить</button>
          </div>
        )}
        {status === 'error' && (
          <StatusPanel icon={AlertCircle} title="Не удалось загрузить каталог"
            action={<button type="button" className="button button-secondary" onClick={() => void loadProducts()}>Повторить</button>}>
            Попробуйте загрузить список ещё раз.
          </StatusPanel>
        )}
        {visible.length > 0 && (
          <>
            <div className="product-grid">
              {visible.map((product) => (
                <ProductCard product={product} key={product.id} catalogLocation={`/products${search}`}
                  favorite={favoriteSet.has(product.id)} onFavorite={() => toggleFavorite(product.id)}
                  onDelete={() => deleteProduct(product.id)} />
              ))}
            </div>
            <Pagination page={page} total={totalPages} onChange={changePage} />
          </>
        )}
        {isLoading && visible.length === 0 && (
          <div className="product-grid" role="status" aria-label="Загрузка товаров">
            {[1, 2, 3].map((index) => <div className="card-skeleton" key={index} />)}
          </div>
        )}
        {status === 'ready' && visible.length === 0 && (
          <StatusPanel icon={favoritesOnly && !hasFilters ? Heart : PackageSearch}
            title={favoritesOnly && !hasFilters ? 'В избранном пока пусто' : 'Товары не найдены'}
            action={hasFilters
              ? <button type="button" className="button button-secondary" onClick={() => updateFilters({ q: '', category: '', sort: '' })}>Сбросить фильтры</button>
              : favoritesOnly && <button type="button" className="button button-secondary" onClick={() => updateFilters({ view: '' })}>Все товары</button>}>
            {favoritesOnly && !hasFilters ? 'Нажмите на сердечко на карточке, чтобы сохранить товар.'
              : hasFilters ? 'Попробуйте другой запрос или категорию.' : 'Добавьте товар, чтобы он появился в каталоге.'}
          </StatusPanel>
        )}
      </section>
      <div className="toast-region" role="status">{notice && <span className="toast">{notice}</span>}</div>
    </div>
  )
}
