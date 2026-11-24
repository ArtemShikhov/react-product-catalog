import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchProducts, type Product, type ProductFields } from './product'

const API_URL = 'https://dummyjson.com/products?limit=0&select=id,title,description,category,price,rating,brand,stock,thumbnail,images,sku'
const SNAPSHOT_URL = `${import.meta.env.BASE_URL}catalog-snapshot.json`

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface SavedCatalog {
  created: Product[]
  edited: Record<string, Product>
  deletedIds: string[]
  favoriteIds: string[]
}

interface CatalogStore extends SavedCatalog {
  apiProducts: Product[]
  status: LoadStatus
  usingSnapshot: boolean
  loadProducts: () => Promise<void>
  addProduct: (fields: ProductFields) => string
  editProduct: (product: Product, fields: ProductFields) => void
  deleteProduct: (id: string) => void
  toggleFavorite: (id: string) => void
}

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set, get) => ({
      apiProducts: [],
      created: [],
      edited: {},
      deletedIds: [],
      favoriteIds: [],
      status: 'idle',
      usingSnapshot: false,

      loadProducts: async () => {
        if (get().status === 'loading') return
        set({ status: 'loading' })
        try {
          set({ apiProducts: await fetchProducts(API_URL), status: 'ready', usingSnapshot: false })
        } catch {
          if (get().apiProducts.length > 0) {
            set({ status: 'ready', usingSnapshot: true })
            return
          }
          try {
            set({ apiProducts: await fetchProducts(SNAPSHOT_URL), status: 'ready', usingSnapshot: true })
          } catch {
            set({ status: 'error' })
          }
        }
      },

      addProduct: (fields) => {
        const id = `local-${crypto.randomUUID()}`
        set((state) => ({ created: [{ ...fields, id, images: [fields.image] }, ...state.created] }))
        return id
      },

      editProduct: (product, fields) => set((state) => {
        if (state.deletedIds.includes(product.id)) return state
        const updated: Product = {
          ...product,
          ...fields,
          images: fields.image === product.image ? product.images : [fields.image],
        }
        if (state.created.some(({ id }) => id === product.id)) {
          return { created: state.created.map((item) => item.id === product.id ? updated : item) }
        }
        return { edited: { ...state.edited, [product.id]: updated } }
      }),

      deleteProduct: (id) => set((state) => {
        const edited = { ...state.edited }
        delete edited[id]
        return {
          created: state.created.filter((product) => product.id !== id),
          edited,
          deletedIds: id.startsWith('local-') || state.deletedIds.includes(id)
            ? state.deletedIds
            : [...state.deletedIds, id],
          favoriteIds: state.favoriteIds.filter((favoriteId) => favoriteId !== id),
        }
      }),

      toggleFavorite: (id) => set((state) => ({
        favoriteIds: state.favoriteIds.includes(id)
          ? state.favoriteIds.filter((favoriteId) => favoriteId !== id)
          : [...state.favoriteIds, id],
      })),
    }),
    {
      name: 'polka-catalog-v1',
      partialize: ({ created, edited, deletedIds, favoriteIds }): SavedCatalog =>
        ({ created, edited, deletedIds, favoriteIds }),
    },
  ),
)

export function useProducts() {
  const apiProducts = useCatalogStore((state) => state.apiProducts)
  const created = useCatalogStore((state) => state.created)
  const edited = useCatalogStore((state) => state.edited)
  const deletedIds = useCatalogStore((state) => state.deletedIds)

  return useMemo(() => {
    const products = new Map(apiProducts.map((product) => [product.id, product]))
    for (const product of Object.values(edited)) products.set(product.id, product)
    for (const id of deletedIds) products.delete(id)
    return [...created, ...products.values()]
  }, [apiProducts, created, edited, deletedIds])
}
