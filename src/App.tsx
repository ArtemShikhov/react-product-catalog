import { useEffect } from 'react'
import { PackageSearch, Plus } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StatusPanel } from './components/StatusPanel'
import { useCatalogStore } from './features/products/store'
import { CatalogPage } from './pages/CatalogPage'
import { ProductPage } from './pages/ProductPage'
import { ProductFormPage } from './pages/ProductFormPage'

export function App() {
  const { pathname } = useLocation()
  const loadProducts = useCatalogStore((state) => state.loadProducts)

  useEffect(() => { void loadProducts() }, [loadProducts])
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/products" aria-label="Полка — каталог товаров">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} width="36" height="36" alt="" />
            <span>Полка<span className="brand-dot">.</span></span>
          </Link>
          <Link className="button button-primary header-add" to="/create-product">
            <Plus size={19} aria-hidden="true" /> Добавить товар
          </Link>
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/products/:id/edit" element={<ProductFormPage editing />} />
          <Route path="/create-product" element={<ProductFormPage />} />
          <Route path="*" element={<StatusPanel icon={PackageSearch} title="Страница не найдена"
            action={<Link className="button button-primary" to="/products">В каталог</Link>}>
            Проверьте адрес или вернитесь к списку товаров.
          </StatusPanel>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>Полка · Каталог товаров</span>
          <a href="https://dummyjson.com/docs/products">Источник данных — DummyJSON</a>
        </div>
      </footer>
    </>
  )
}
