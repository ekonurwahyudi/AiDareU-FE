'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

// Utils Imports
import { formatCurrency, parseCurrency, cleanCurrencyInput } from '@/utils/currency'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const ProductPricing = () => {
  const { formData, setFormData, errors } = useProductForm()

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Only allow digits
    const digitsOnly = inputValue.replace(/\D/g, '')
    if (digitsOnly) {
      const numericValue = parseInt(digitsOnly, 10)
      setFormData({ harga_produk: numericValue })
    } else {
      setFormData({ harga_produk: '' })
    }
  }

  const handleDiscountPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Only allow digits
    const digitsOnly = inputValue.replace(/\D/g, '')
    if (digitsOnly) {
      const numericValue = parseInt(digitsOnly, 10)
      setFormData({ harga_diskon: numericValue })
    } else {
      setFormData({ harga_diskon: '' })
    }
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Only allow digits
    const digitsOnly = inputValue.replace(/\D/g, '')
    if (digitsOnly) {
      const numericValue = parseInt(digitsOnly, 10)
      setFormData({ berat_produk: numericValue })
    } else {
      setFormData({ berat_produk: '' })
    }
  }

  return (
    <Card>
      <CardHeader title='Harga Produk' />
      <CardContent>
        <div className='flex flex-col gap-6'>
          <div>
            <CustomTextField
              fullWidth
              label='Harga Produk'
              placeholder='100.000'
              value={formatCurrency(formData.harga_produk)}
              onChange={handlePriceChange}
              error={!!errors.harga_produk}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
            />
            {errors.harga_produk && (
              <FormHelperText error>{errors.harga_produk}</FormHelperText>
            )}
          </div>

          <div>
            <CustomTextField
              fullWidth
              label='Harga Diskon'
              placeholder='80.000'
              value={formatCurrency(formData.harga_diskon)}
              onChange={handleDiscountPriceChange}
              error={!!errors.harga_diskon}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
              }}
              helperText={!errors.harga_diskon ? 'Optional - Harga setelah diskon' : undefined}
            />
            {errors.harga_diskon && (
              <FormHelperText error>{errors.harga_diskon}</FormHelperText>
            )}
          </div>

          <div>
            <CustomTextField
              fullWidth
              type="number"
              label='Berat Produk'
              placeholder='1000'
              value={formData.berat_produk || 1000}
              onChange={handleWeightChange}
              error={!!errors.berat_produk}
              InputProps={{
                endAdornment: <InputAdornment position="end">gram</InputAdornment>,
              }}
              helperText={!errors.berat_produk ? 'Default: 1000 gram (1 kg)' : undefined}
            />
            {errors.berat_produk && (
              <FormHelperText error>{errors.berat_produk}</FormHelperText>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductPricing
