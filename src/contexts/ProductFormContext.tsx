'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Editor } from '@tiptap/core'
import { useRBAC } from '@/contexts/rbacContext'

export interface VariantOption {
  id: string
  option_name: string
  harga: number
  stock: number
}

export interface Variant {
  id: string
  variant_name: string
  options: VariantOption[]
}

export interface ProductFormData {
  nama_produk: string
  deskripsi: string
  jenis_produk: 'digital' | 'fisik' | 'affiliate' | 'jasa'
  url_produk?: string
  harga_produk: number | ''
  harga_diskon: number | ''
  berat_produk?: number | ''
  category_id: number | ''
  status_produk: 'active' | 'inactive' | 'draft'
  images: File[]
  existingImages: string[] // Add support for existing images
  stock?: number | ''
  variants?: Variant[]
  sizeGuideImage?: File | null
}

interface ProductFormContextType {
  formData: ProductFormData
  setFormData: (data: Partial<ProductFormData>) => void
  resetForm: () => void
  errors: Record<string, string>
  setErrors: (errors: Record<string, string>) => void
  isSubmitting: boolean
  setIsSubmitting: (value: boolean) => void
  isLoading: boolean
  editor: Editor | null
  setEditor: (editor: Editor | null) => void
  submitForm: () => Promise<void>
  isEdit: boolean
  productUuid?: string
  successMessage: string
  setSuccessMessage: (message: string) => void
}

const initialFormData: ProductFormData = {
  nama_produk: '',
  deskripsi: '',
  jenis_produk: 'digital',
  url_produk: '',
  harga_produk: '',
  harga_diskon: '',
  berat_produk: 1000,
  category_id: '',
  status_produk: 'draft',
  images: [],
  existingImages: [],
  stock: 0,
  variants: [],
  sizeGuideImage: null
}

const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined)

interface ProductFormProviderProps {
  children: ReactNode
  productUuid?: string
  isEdit?: boolean
}

export const ProductFormProvider = ({ children, productUuid, isEdit = false }: ProductFormProviderProps) => {
  const router = useRouter()
  const { currentStore } = useRBAC()
  const [formData, setFormDataState] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  const setFormData = (data: Partial<ProductFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }))
    // Clear errors for fields that are being updated
    const newErrors = { ...errors }
    Object.keys(data).forEach(key => {
      delete newErrors[key]
    })
    setErrors(newErrors)
  }

  const resetForm = () => {
    setFormDataState(initialFormData)
    setErrors({})
    setIsSubmitting(false)
    if (editor) {
      editor.commands.setContent('<p>Deskripsi produk singkat dan jelas tentang produk yang dijual.</p>')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nama_produk.trim()) {
      newErrors.nama_produk = 'Nama produk wajib diisi'
    }

    if (!formData.harga_produk || Number(formData.harga_produk) <= 0) {
      newErrors.harga_produk = 'Harga produk harus lebih dari 0'
    }

    if (formData.harga_diskon && Number(formData.harga_diskon) >= Number(formData.harga_produk)) {
      newErrors.harga_diskon = 'Harga diskon harus lebih kecil dari harga produk'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategori wajib dipilih'
    }

    if ((formData.jenis_produk === 'digital' || formData.jenis_produk === 'affiliate') && !formData.url_produk?.trim()) {
      newErrors.url_produk = 'URL produk wajib diisi untuk produk digital dan affiliate'
    }

    if (formData.jenis_produk === 'fisik' && (!formData.stock || formData.stock < 0)) {
      newErrors.stock = 'Stock harus diisi untuk produk fisik'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submitForm = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Get store UUID from RBAC context
      const storeUuid = currentStore?.uuid || currentStore?.id

      if (!storeUuid) {
        throw new Error('Store not found. Please ensure you have a store set up.')
      }

      // Prepare form data
      const submitData = new FormData()
      submitData.append('uuid_store', storeUuid)
      submitData.append('nama_produk', formData.nama_produk)
      
      // Get content from editor
      if (editor) {
        submitData.append('deskripsi', editor.getHTML())
      } else if (isEdit) {
        submitData.append('deskripsi', '') // Send empty string for updates
      }
      
      submitData.append('jenis_produk', formData.jenis_produk)
      
      // Always send URL produk in edit mode, for create only if digital
      if (formData.url_produk || isEdit) {
        submitData.append('url_produk', formData.url_produk || '')
      }
      
      submitData.append('harga_produk', formData.harga_produk.toString())
      
      // Always send discount price in edit mode, including empty values
      if (formData.harga_diskon || isEdit) {
        submitData.append('harga_diskon', formData.harga_diskon ? formData.harga_diskon.toString() : '')
      }
      
      submitData.append('category_id', formData.category_id.toString())
      submitData.append('status_produk', formData.status_produk)
      
      // Always send stock for physical products or in edit mode
      if (formData.jenis_produk === 'fisik' || isEdit) {
        submitData.append('stock', formData.stock ? formData.stock.toString() : '0')
      }

      // Add berat produk
      if (formData.berat_produk) {
        submitData.append('berat_produk', formData.berat_produk.toString())
      }

      // Add images
      formData.images.forEach((file, index) => {
        submitData.append(`images[${index}]`, file)
      })

      // Add size guide image
      if (formData.sizeGuideImage) {
        submitData.append('size_guide_image', formData.sizeGuideImage)
      }

      // Add variants
      if (formData.variants && formData.variants.length > 0) {
        formData.variants.forEach((variant, variantIndex) => {
          submitData.append(`variants[${variantIndex}][variant_name]`, variant.variant_name)

          variant.options.forEach((option, optionIndex) => {
            submitData.append(`variants[${variantIndex}][options][${optionIndex}][option_name]`, option.option_name)
            submitData.append(`variants[${variantIndex}][options][${optionIndex}][harga]`, option.harga.toString())
            submitData.append(`variants[${variantIndex}][options][${optionIndex}][stock]`, option.stock.toString())
          })
        })
      }

      // For Laravel compatibility with FormData PUT requests
      if (isEdit) {
        submitData.append('_method', 'PUT')
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const endpoint = isEdit && productUuid ? `/api/public/products/${productUuid}` : '/api/public/products'
      const fullUrl = `${backendUrl}${endpoint}`

      const response = await fetch(fullUrl, {
        method: 'POST', // Always POST for FormData, Laravel will handle _method
        body: submitData,
        credentials: 'include'
      })

      let result
      try {
        const responseText = await response.text()
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.')
      }

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 422 && result.errors) {
          // Convert Laravel validation errors to our format
          const validationErrors: Record<string, string> = {}

          Object.keys(result.errors).forEach(key => {
            const errorMessages = result.errors[key]
            // Take the first error message for each field
            validationErrors[key] = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages
          })

          setErrors(validationErrors)

          // Set a general error message
          throw new Error(result.message || 'Validasi gagal. Mohon periksa kembali data yang Anda masukkan.')
        }

        throw new Error(result.message || `Server error: ${response.status}`)
      }

      if (result.status === 'success') {
        // Set success message
        setSuccessMessage(isEdit ? 'Produk berhasil diperbarui!' : 'Produk berhasil dibuat!')

        // Clear any errors
        setErrors({})

        // Success - redirect using Next.js router after a short delay to show success message
        setTimeout(() => {
          if (isEdit) {
            // For edit, add refresh parameter to force fresh data fetch
            router.push('/apps/tokoku/products?refresh=true')
          } else {
            // For create, redirect to list page
            router.push('/apps/tokoku/products')
          }
        }, 1500)
      } else {
        throw new Error(result.message || (isEdit ? 'Gagal menyimpan produk' : 'Gagal membuat produk'))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (isEdit ? 'Gagal menyimpan produk' : 'Gagal membuat produk')
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load product data for edit mode
  useEffect(() => {
    if (isEdit && productUuid) {
      const loadProductData = async () => {
        setIsLoading(true)
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
          const response = await fetch(`${backendUrl}/api/public/products/${productUuid}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.status === 'success' && result.data) {
              const product = result.data
              
              // Process existing images
              let existingImages: string[] = []
              if (product.upload_gambar_produk) {
                if (typeof product.upload_gambar_produk === 'string') {
                  try {
                    const parsed = JSON.parse(product.upload_gambar_produk)
                    existingImages = Array.isArray(parsed) ? parsed : []
                  } catch {
                    existingImages = [product.upload_gambar_produk]
                  }
                } else if (Array.isArray(product.upload_gambar_produk)) {
                  existingImages = product.upload_gambar_produk
                }
              }
              
              setFormDataState({
                nama_produk: product.nama_produk || '',
                deskripsi: product.deskripsi || '',
                jenis_produk: product.jenis_produk || 'digital',
                url_produk: product.url_produk || '',
                harga_produk: product.harga_produk || '',
                harga_diskon: product.harga_diskon || '',
                category_id: product.category_id || '',
                status_produk: product.status_produk || 'draft',
                images: [], // New uploaded images
                existingImages: existingImages, // Existing images from database
                stock: product.stock || 0
              })
              
              // Set editor content if available - this will be handled by the component
              // when the editor is ready and formData.deskripsi is available
            }
          }
        } catch (error) {
          setErrors({ submit: 'Gagal memuat data produk. Silakan refresh halaman.' })
        } finally {
          setIsLoading(false)
        }
      }

      loadProductData()
    }
  }, [isEdit, productUuid, editor])

  const contextValue: ProductFormContextType = {
    formData,
    setFormData,
    resetForm,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    editor,
    setEditor,
    submitForm,
    isEdit,
    productUuid,
    successMessage,
    setSuccessMessage
  }

  return (
    <ProductFormContext.Provider value={contextValue}>
      {children}
    </ProductFormContext.Provider>
  )
}

export const useProductForm = (): ProductFormContextType => {
  const context = useContext(ProductFormContext)
  if (!context) {
    throw new Error('useProductForm must be used within ProductFormProvider')
  }
  return context
}