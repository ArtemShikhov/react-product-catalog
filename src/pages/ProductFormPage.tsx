import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ChevronDown, ImagePlus, Plus, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductImage } from '../components/ProductImage'
import { categoryName, categoryNames, productPath, type Product, type ProductFields } from '../features/products/product'
import { useCatalogStore, useProducts } from '../features/products/store'
import { MissingProduct, useProductRoute } from './ProductPage'

const emptyValues = { title: '', category: '', price: '', image: '', description: '' }
type FormValues = typeof emptyValues
type FieldName = keyof FormValues
type Errors = Partial<Record<FieldName, string>>

function imageUrl(input: string) {
  try {
    const url = new URL(input.trim())
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}

function validate(values: FormValues): Errors {
  const errors: Errors = {}
  if (values.title.trim().length < 2) errors.title = 'Введите название из двух или более символов.'
  if (!values.category) errors.category = 'Выберите категорию.'
  const price = values.price.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0 || Number(price) > 99999999) {
    errors.price = 'Введите цену от 0,01 до 99 999 999 $ с точностью до цента.'
  }
  if (!imageUrl(values.image)) errors.image = 'Укажите ссылку, начинающуюся с https://.'
  if (values.description.trim().length < 10) errors.description = 'Введите хотя бы 10 символов.'
  return errors
}

export function ProductFormPage({ editing = false }: { editing?: boolean }) {
  const route = useProductRoute()
  const back = editing && route.product ? productPath(route.product.id) : route.from
  const heading = editing ? 'Редактировать товар' : 'Добавить товар'

  useEffect(() => {
    document.title = `${heading} · Полка`
  }, [heading])

  return (
    <div className="inner-page">
      <Link className="back-link" to={back} state={{ catalogLocation: route.from }}>
        <ArrowLeft size={19} aria-hidden="true" /> {editing && route.product ? 'К товару' : 'В каталог'}
      </Link>
      {editing && !route.product ? <MissingProduct {...route} /> : (
        <>
          <h1 className="form-title">{heading}</h1>
          <ProductForm key={route.product?.id ?? 'new'} product={route.product} back={back} from={route.from} />
        </>
      )}
    </div>
  )
}

function ProductForm({ product, back, from }: { product?: Product; back: string; from: string }) {
  const navigate = useNavigate()
  const products = useProducts()
  const addProduct = useCatalogStore((state) => state.addProduct)
  const editProduct = useCatalogStore((state) => state.editProduct)
  const [values, setValues] = useState<FormValues>(() => product
    ? { title: product.title, category: product.category, price: String(product.price), image: product.image, description: product.description }
    : emptyValues)
  const [errors, setErrors] = useState<Errors>({})
  const [preview, setPreview] = useState(product?.image ?? '')
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const categories = [...new Set([...Object.keys(categoryNames), ...products.map(({ category }) => category),
    ...(product ? [product.category] : [])])].sort((a, b) => categoryName(a).localeCompare(categoryName(b), 'ru'))

  function update(name: FieldName, value: string) {
    const next = { ...values, [name]: value }
    setValues(next)
    if (submitted) setErrors(validate(next))
  }

  function fieldProps(name: FieldName) {
    return {
      name,
      id: `field-${name}`,
      value: values[name],
      required: true,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `error-${name}` : undefined,
    }
  }

  function errorMessage(name: FieldName) {
    return errors[name] && <span id={`error-${name}`} className="form-error">{errors[name]}</span>
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      const field = formRef.current?.elements.namedItem(firstError)
      if (field instanceof HTMLElement) field.focus()
      return
    }

    const fields: ProductFields = {
      title: values.title.trim(),
      category: values.category,
      price: Number(values.price.trim().replace(',', '.')),
      image: imageUrl(values.image),
      description: values.description.trim(),
    }
    const id = product?.id ?? addProduct(fields)
    if (product) editProduct(product, fields)
    navigate(productPath(id), { replace: true, state: { catalogLocation: from } })
  }

  const previewProduct = { id: product?.id ?? '', title: values.title || 'Фото товара',
    description: values.description, category: values.category, price: 0, image: preview, images: [preview] }

  return (
    <form className="product-form" noValidate ref={formRef} onSubmit={submit}>
      <div className="form-fields">
        <div className="form-field">
          <label htmlFor="field-title">Название</label>
          <input {...fieldProps('title')} maxLength={100} placeholder="Например, настольная лампа"
            onChange={(event) => update('title', event.target.value)} />
          {errorMessage('title')}
        </div>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="field-category">Категория</label>
            <span className="select-field">
              <select {...fieldProps('category')} onChange={(event) => update('category', event.target.value)}>
                <option value="">Выберите категорию</option>
                {categories.map((key) => <option key={key} value={key}>{categoryName(key)}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </span>
            {errorMessage('category')}
          </div>
          <div className="form-field">
            <label htmlFor="field-price">Цена, $</label>
            <input {...fieldProps('price')} inputMode="decimal" maxLength={11} placeholder="0,00"
              onChange={(event) => update('price', event.target.value)} />
            {errorMessage('price')}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="field-image">Ссылка на изображение</label>
          <input {...fieldProps('image')} type="url" maxLength={2000} placeholder="https://..."
            onBlur={() => setPreview(imageUrl(values.image))}
            onChange={(event) => update('image', event.target.value)} />
          {errorMessage('image')}
        </div>
        <div className="form-field">
          <label htmlFor="field-description">Описание</label>
          <textarea {...fieldProps('description')} rows={5} maxLength={2000} placeholder="Расскажите о товаре"
            onChange={(event) => update('description', event.target.value)} />
          {errorMessage('description')}
        </div>
        <div className="form-actions">
          <button type="submit" className="button button-primary">
            {product ? <Save size={18} aria-hidden="true" /> : <Plus size={19} aria-hidden="true" />}
            {product ? 'Сохранить изменения' : 'Создать товар'}
          </button>
          <Link className="button button-secondary" to={back} state={{ catalogLocation: from }}>Отмена</Link>
        </div>
      </div>
      <aside className="form-preview" aria-label="Предпросмотр изображения">
        <div className="form-preview-media" data-category={values.category}>
          {preview
            ? <ProductImage product={previewProduct} className="detail-image" />
            : <div className="form-preview-empty"><ImagePlus size={27} aria-hidden="true" /><span>Фото товара</span></div>}
        </div>
      </aside>
    </form>
  )
}
