'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

// Icon Imports
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'
import type { Variant as ContextVariant } from '@/contexts/ProductFormContext'

// Utils Imports
import { formatCurrency } from '@/utils/currency'

interface VariantOption {
  id: string
  value: string
}

interface Variant {
  id: string
  name: string
  options: VariantOption[]
}

interface VariantPrice {
  variantName: string
  price: number
  stock: number
}

const ProductVariants = () => {
  const { setFormData } = useProductForm()
  const [variants, setVariants] = useState<Variant[]>([])
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [newVariantName, setNewVariantName] = useState('')
  const [newOptionValue, setNewOptionValue] = useState('')
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)

  // For bulk price and stock application
  const [bulkPrice, setBulkPrice] = useState<string>('')
  const [bulkStock, setBulkStock] = useState<string>('')

  // Variant prices and stocks
  const [variantPrices, setVariantPrices] = useState<Record<string, VariantPrice>>({})

  // Add new variant
  const handleAddVariant = () => {
    if (!newVariantName.trim()) return

    const newVariant: Variant = {
      id: Date.now().toString(),
      name: newVariantName,
      options: []
    }

    setVariants([...variants, newVariant])
    setEditingVariantId(newVariant.id)
    setNewVariantName('')
    setShowAddVariant(false)
  }

  // Add option to variant
  const handleAddOption = (variantId: string) => {
    if (!newOptionValue.trim()) return

    setVariants(variants.map(variant => {
      if (variant.id === variantId) {
        const newOption: VariantOption = {
          id: Date.now().toString(),
          value: newOptionValue
        }

        // Initialize price entry for this option
        const variantKey = `${variant.name}-${newOptionValue}`
        setVariantPrices(prev => ({
          ...prev,
          [variantKey]: {
            variantName: newOptionValue,
            price: 0,
            stock: 0
          }
        }))

        return {
          ...variant,
          options: [...variant.options, newOption]
        }
      }
      return variant
    }))

    setNewOptionValue('')
  }

  // Remove option from variant
  const handleRemoveOption = (variantId: string, optionId: string) => {
    setVariants(variants.map(variant => {
      if (variant.id === variantId) {
        const optionToRemove = variant.options.find(opt => opt.id === optionId)
        if (optionToRemove) {
          const variantKey = `${variant.name}-${optionToRemove.value}`
          const newPrices = { ...variantPrices }
          delete newPrices[variantKey]
          setVariantPrices(newPrices)
        }

        return {
          ...variant,
          options: variant.options.filter(opt => opt.id !== optionId)
        }
      }
      return variant
    }))
  }

  // Remove entire variant
  const handleRemoveVariant = (variantId: string) => {
    const variantToRemove = variants.find(v => v.id === variantId)
    if (variantToRemove) {
      // Remove all price entries for this variant
      const newPrices = { ...variantPrices }
      variantToRemove.options.forEach(option => {
        const variantKey = `${variantToRemove.name}-${option.value}`
        delete newPrices[variantKey]
      })
      setVariantPrices(newPrices)
    }

    setVariants(variants.filter(v => v.id !== variantId))
    if (editingVariantId === variantId) {
      setEditingVariantId(null)
    }
  }

  // Apply bulk price and stock to all variants
  const handleApplyBulk = () => {
    if (!bulkPrice && !bulkStock) return

    const newPrices = { ...variantPrices }
    Object.keys(newPrices).forEach(key => {
      if (bulkPrice) {
        newPrices[key].price = parseInt(bulkPrice.replace(/\D/g, '')) || 0
      }
      if (bulkStock) {
        newPrices[key].stock = parseInt(bulkStock) || 0
      }
    })

    setVariantPrices(newPrices)
  }

  // Update individual variant price
  const handlePriceChange = (key: string, value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    const numericValue = digitsOnly ? parseInt(digitsOnly, 10) : 0

    setVariantPrices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        price: numericValue
      }
    }))
  }

  // Update individual variant stock
  const handleStockChange = (key: string, value: string) => {
    const numericValue = parseInt(value) || 0

    setVariantPrices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        stock: numericValue
      }
    }))
  }

  // Get all variant combinations for price table
  const getVariantCombinations = () => {
    const combinations: string[] = []

    variants.forEach(variant => {
      variant.options.forEach(option => {
        combinations.push(`${variant.name}-${option.value}`)
      })
    })

    return combinations
  }

  // Sync variants to context whenever they change
  useEffect(() => {
    const contextVariants: ContextVariant[] = variants.map(variant => ({
      id: variant.id,
      variant_name: variant.name,
      options: variant.options.map(option => {
        const variantKey = `${variant.name}-${option.value}`
        const priceData = variantPrices[variantKey] || { price: 0, stock: 0 }
        return {
          id: option.id,
          option_name: option.value,
          harga: priceData.price,
          stock: priceData.stock
        }
      })
    }))

    setFormData({ variants: contextVariants })
  }, [variants, variantPrices, setFormData])

  return (
    <Card>
      <CardHeader
        title='Varian Produk'
        subheader='Opsional - Tambahkan varian seperti ukuran, warna, dll'
      />
      <CardContent>
        {/* Add Variant Button */}
        {!showAddVariant && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddVariant(true)}
            sx={{ mb: 3 }}
          >
            Tambah Varian
          </Button>
        )}

        {/* Add Variant Form */}
        {showAddVariant && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Nama Varian</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <CustomTextField
                fullWidth
                size="small"
                placeholder="Contoh: Warna, Ukuran, dll"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddVariant()
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddVariant}
                disabled={!newVariantName.trim()}
              >
                Tambah
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddVariant(false)
                  setNewVariantName('')
                }}
              >
                Batal
              </Button>
            </Box>
          </Box>
        )}

        {/* Existing Variants */}
        {variants.map((variant) => (
          <Box
            key={variant.id}
            sx={{
              mb: 3,
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              bgcolor: '#fafafa'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {variant.name}
              </Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveVariant(variant.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Variant Options */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Opsi Varian
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {variant.options.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.value}
                    onDelete={() => handleRemoveOption(variant.id, option.id)}
                    deleteIcon={<CloseIcon />}
                    sx={{ bgcolor: 'white' }}
                  />
                ))}
              </Box>

              {/* Add Option Input */}
              {editingVariantId === variant.id && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CustomTextField
                    size="small"
                    fullWidth
                    placeholder="Contoh: Merah, Kuning, L, XL, dll"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOption(variant.id)
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddOption(variant.id)}
                    disabled={!newOptionValue.trim()}
                  >
                    Tambah Opsi
                  </Button>
                </Box>
              )}

              {editingVariantId !== variant.id && (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setEditingVariantId(variant.id)}
                >
                  Tambah Opsi
                </Button>
              )}
            </Box>
          </Box>
        ))}

        {/* Variant Pricing Table */}
        {variants.length > 0 && getVariantCombinations().length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>Harga & Stok Varian</Typography>

            {/* Bulk Apply */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Terapkan ke Semua Varian
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <CustomTextField
                  size="small"
                  label="Harga"
                  placeholder="100.000"
                  value={formatCurrency(bulkPrice)}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '')
                    setBulkPrice(digitsOnly)
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  }}
                  sx={{ width: 200 }}
                />
                <CustomTextField
                  size="small"
                  type="number"
                  label="Stok"
                  placeholder="100"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  sx={{ width: 150 }}
                />
                <Button
                  variant="contained"
                  onClick={handleApplyBulk}
                  disabled={!bulkPrice && !bulkStock}
                >
                  Terapkan
                </Button>
              </Box>
            </Box>

            {/* Pricing Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Varian</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Harga (Rp)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Stok</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getVariantCombinations().map((combination) => {
                    const variantData = variantPrices[combination] || { price: 0, stock: 0 }
                    const displayName = combination.split('-')[1]

                    return (
                      <TableRow key={combination}>
                        <TableCell>{displayName}</TableCell>
                        <TableCell>
                          <CustomTextField
                            size="small"
                            fullWidth
                            value={formatCurrency(variantData.price)}
                            onChange={(e) => handlePriceChange(combination, e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <CustomTextField
                            size="small"
                            type="number"
                            fullWidth
                            value={variantData.stock}
                            onChange={(e) => handleStockChange(combination, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductVariants
