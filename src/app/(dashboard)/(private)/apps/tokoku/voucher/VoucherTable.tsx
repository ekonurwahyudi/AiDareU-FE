'use client'

// React Imports
import { useEffect, useState, useCallback, forwardRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import Pagination from '@mui/material/Pagination'
import InputAdornment from '@mui/material/InputAdornment'

// Third-party Imports
import { format } from 'date-fns'

// Excel Export
import * as XLSX from 'xlsx'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Hook Imports
import { useDebounce } from '@/hooks/useDebounce'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Icon Imports
import { Icon } from '@iconify/react'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type Voucher = {
  id: number
  uuid: string
  uuid_store: string
  kode_voucher: string
  keterangan: string
  kuota: number
  kuota_terpakai: number
  tgl_mulai: string
  tgl_berakhir: string
  status: 'active' | 'inactive' | 'expired'
  jenis_voucher: 'ongkir' | 'potongan_harga'
  tipe_diskon: 'persen' | 'nominal'
  nilai_diskon: number
  minimum_pembelian?: number
  maksimal_diskon?: number
  created_at: string
  updated_at: string
}

type VoucherFormData = {
  uuid_store: string
  kode_voucher: string
  keterangan: string
  kuota: number
  tgl_mulai: string
  tgl_berakhir: string
  status: 'active' | 'inactive' | 'expired'
  jenis_voucher: 'ongkir' | 'potongan_harga'
  tipe_diskon: 'persen' | 'nominal'
  nilai_diskon: number
  minimum_pembelian?: number
  maksimal_diskon?: number
}

type VoucherSummary = {
  total_voucher: number
  voucher_aktif: number
  voucher_expired: number
  total_kuota: number
  total_terpakai: number
}

// Custom Input Props Type
type CustomInputProps = TextFieldProps & {
  label: string
  end: Date | number
  start: Date | number
}

// Custom Input Component for Date Range
const CustomInput = forwardRef((props: CustomInputProps, ref) => {
  const { label, start, end, ...rest } = props

  const startDate = start ? format(start, 'dd/MM/yyyy') : ''
  const endDate = end !== null && end ? ` - ${format(end, 'dd/MM/yyyy')}` : null

  const value = startDate ? `${startDate}${endDate !== null ? endDate : ''}` : 'Pilih Range Tanggal'

  return <CustomTextField fullWidth inputRef={ref} {...rest} label={label} value={value} size='small' />
})

const VoucherTable = () => {
  // RBAC Context - get current store
  const { currentStore, isLoading: rbacLoading } = useRBAC()

  // Get store UUID from RBAC context
  const currentStoreUUID = currentStore?.uuid || currentStore?.id || ''

  // States
  const [data, setData] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Summary states
  const [summary, setSummary] = useState<VoucherSummary>({
    total_voucher: 0,
    voucher_aktif: 0,
    voucher_expired: 0,
    total_kuota: 0,
    total_terpakai: 0
  })

  // Filter states
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState<Date | null | undefined>(null)
  const [endDate, setEndDate] = useState<Date | null | undefined>(null)

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState<VoucherFormData>({
    uuid_store: '',
    kode_voucher: '',
    keterangan: '',
    kuota: 1,
    tgl_mulai: '',
    tgl_berakhir: '',
    status: 'active',
    jenis_voucher: 'potongan_harga',
    tipe_diskon: 'nominal',
    nilai_diskon: 0,
    minimum_pembelian: undefined,
    maksimal_diskon: undefined
  })

  const debouncedSearch = useDebounce(search, 500)

  // Convert Date to string format for API
  const formatDateForAPI = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Handle date range change
  const handleOnChangeRange = (dates: any) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  // Format currency
  const formatRupiah = (num: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    if (!currentStoreUUID) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: currentPage.toString(),
        uuid_store: currentStoreUUID
      })

      if (debouncedSearch) params.append('search', debouncedSearch)

      const startDateStr = formatDateForAPI(startDate as Date | null)
      const endDateStr = formatDateForAPI(endDate as Date | null)
      if (startDateStr) params.append('start_date', startDateStr)
      if (endDateStr) params.append('end_date', endDateStr)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tokoku/vouchers?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setData(result.data.data || [])
        setTotalPages(result.data.last_page || 0)
        setTotalRecords(result.data.total || 0)

        // Calculate summary from data
        const allVouchers = result.data.data || []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const aktif = allVouchers.filter((v: Voucher) => v.status === 'active').length
        const expired = allVouchers.filter((v: Voucher) => {
          const endDate = new Date(v.tgl_berakhir)
          return v.status === 'expired' || endDate < today
        }).length
        const totalKuota = allVouchers.reduce((sum: number, v: Voucher) => sum + v.kuota, 0)
        const totalTerpakai = allVouchers.reduce((sum: number, v: Voucher) => sum + v.kuota_terpakai, 0)

        setSummary({
          total_voucher: result.data.total || allVouchers.length,
          voucher_aktif: aktif,
          voucher_expired: expired,
          total_kuota: totalKuota,
          total_terpakai: totalTerpakai
        })
      } else {
        throw new Error(result.message || 'Failed to fetch vouchers')
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching vouchers')
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, refreshTrigger, currentStoreUUID, startDate, endDate])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  // Handle search submit
  const handleSearchSubmit = () => {
    setCurrentPage(1)
    fetchVouchers()
  }

  // Handle filter reset
  const handleResetFilter = () => {
    setSearch('')
    setStartDate(null)
    setEndDate(null)
    setCurrentPage(1)
    setTimeout(() => {
      fetchVouchers()
    }, 100)
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!currentStoreUUID) {
      setError('Store belum dipilih. Silakan pilih store terlebih dahulu.')
      return
    }

    if (!formData.kode_voucher || !formData.keterangan || !formData.tgl_mulai || !formData.tgl_berakhir) {
      setError('Mohon lengkapi semua field yang diperlukan')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const submitData = {
        ...formData,
        uuid_store: currentStoreUUID
      }

      const url = editingVoucher
        ? `${process.env.NEXT_PUBLIC_API_URL}/tokoku/vouchers/${editingVoucher.uuid}`
        : `${process.env.NEXT_PUBLIC_API_URL}/tokoku/vouchers`

      const method = editingVoucher ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save voucher')
      }

      setOpenDialog(false)
      setRefreshTrigger(prev => prev + 1)
      resetForm()
    } catch (err) {
      console.error('Error saving voucher:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while saving voucher')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingVoucher) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokoku/vouchers/${deletingVoucher.uuid}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete voucher')
      }

      setOpenDeleteDialog(false)
      setDeletingVoucher(null)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error deleting voucher:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while deleting voucher')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      uuid_store: '',
      kode_voucher: '',
      keterangan: '',
      kuota: 1,
      tgl_mulai: '',
      tgl_berakhir: '',
      status: 'active',
      jenis_voucher: 'potongan_harga',
      tipe_diskon: 'nominal',
      nilai_diskon: 0,
      minimum_pembelian: undefined,
      maksimal_diskon: undefined
    })
    setEditingVoucher(null)
    setError(null)
  }

  // Handle add
  const handleAdd = () => {
    resetForm()
    setOpenDialog(true)
  }

  // Handle edit
  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setFormData({
      uuid_store: voucher.uuid_store,
      kode_voucher: voucher.kode_voucher,
      keterangan: voucher.keterangan,
      kuota: voucher.kuota,
      tgl_mulai: voucher.tgl_mulai.split('T')[0],
      tgl_berakhir: voucher.tgl_berakhir.split('T')[0],
      status: voucher.status,
      jenis_voucher: voucher.jenis_voucher,
      tipe_diskon: voucher.tipe_diskon,
      nilai_diskon: voucher.nilai_diskon,
      minimum_pembelian: voucher.minimum_pembelian,
      maksimal_diskon: voucher.maksimal_diskon
    })
    setOpenDialog(true)
  }

  // Handle delete click
  const handleDeleteClick = (voucher: Voucher) => {
    setDeletingVoucher(voucher)
    setOpenDeleteDialog(true)
  }

  // Export to Excel
  const exportToExcel = () => {
    const exportData = data.map((item, index) => ({
      No: index + 1,
      'Kode Voucher': item.kode_voucher,
      Keterangan: item.keterangan,
      'Jenis Voucher': item.jenis_voucher === 'ongkir' ? 'Diskon Ongkir' : 'Potongan Harga',
      'Tipe Diskon': item.tipe_diskon === 'persen' ? 'Persentase' : 'Nominal',
      'Nilai Diskon': item.tipe_diskon === 'persen' ? `${item.nilai_diskon}%` : formatRupiah(item.nilai_diskon),
      Kuota: item.kuota,
      'Kuota Terpakai': item.kuota_terpakai,
      'Sisa Kuota': item.kuota - item.kuota_terpakai,
      'Tanggal Mulai': formatDate(item.tgl_mulai),
      'Tanggal Berakhir': formatDate(item.tgl_berakhir),
      Status: item.status === 'active' ? 'Aktif' : item.status === 'inactive' ? 'Nonaktif' : 'Expired'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Vouchers_${today}.xlsx`)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'warning'
      case 'expired':
        return 'error'
      default:
        return 'default'
    }
  }

  // Show loading while RBAC is loading
  if (rbacLoading) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <div className='flex justify-center items-center p-8'>
                <CircularProgress />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  // Show message if no store selected
  if (!currentStoreUUID) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Alert severity='warning'>
                Store belum tersedia. Pastikan Anda sudah memiliki toko yang aktif.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Manajemen Voucher
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Kelola voucher diskon untuk toko Anda
        </Typography>
      </Grid>

      {/* Summary Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ width: 56, height: 56 }}>
                <Icon icon='tabler:ticket' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatNumber(summary.total_voucher)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Voucher
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='success' sx={{ width: 56, height: 56 }}>
                <Icon icon='tabler:check' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatNumber(summary.voucher_aktif)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Voucher Aktif
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='warning' sx={{ width: 56, height: 56 }}>
                <Icon icon='tabler:chart-pie' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {formatNumber(summary.total_terpakai)} / {formatNumber(summary.total_kuota)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Kuota Terpakai
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Table with Filters */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Daftar Voucher'
            action={
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='outlined'
                  onClick={exportToExcel}
                  startIcon={<Icon icon='tabler:file-export' />}
                  disabled={data.length === 0}
                >
                  Export Excel
                </Button>
                <Button
                  variant='contained'
                  onClick={handleAdd}
                  startIcon={<Icon icon='tabler:plus' />}
                >
                  Tambah Voucher
                </Button>
              </Box>
            }
            sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
          />
          <Divider />

          <CardContent>
            {/* Filter Row */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left Side - Rows Per Page */}
              <CustomTextField
                select
                value={perPage}
                onChange={e => {
                  setPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                sx={{ minWidth: 100 }}
                size='small'
              >
                <MenuItem value={10}>Show 10</MenuItem>
                <MenuItem value={25}>Show 25</MenuItem>
                <MenuItem value={50}>Show 50</MenuItem>
                <MenuItem value={100}>Show 100</MenuItem>
              </CustomTextField>

              {/* Right Side - Search and Filters */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <TextField
                  size='small'
                  placeholder='Cari voucher...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit()
                    }
                  }}
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:search' fontSize={18} />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Date Range Picker */}
                <Box sx={{ minWidth: 280 }}>
                  <AppReactDatepicker
                    selectsRange
                    monthsShown={2}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    endDate={endDate as Date}
                    selected={startDate}
                    startDate={startDate as Date}
                    shouldCloseOnSelect={false}
                    id='voucher-date-range'
                    dateFormat='dd/MM/yyyy'
                    onChange={handleOnChangeRange}
                    customInput={
                      <CustomInput
                        label='Filter Tanggal'
                        end={endDate as Date | number}
                        start={startDate as Date | number}
                      />
                    }
                  />
                </Box>

                {/* Filter & Reset Buttons */}
                <Button
                  size='small'
                  variant='contained'
                  onClick={handleSearchSubmit}
                  startIcon={<Icon icon='tabler:filter' fontSize={18} />}
                  sx={{ height: '40px', px: 2.5 }}
                >
                  Filter
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={handleResetFilter}
                  startIcon={<Icon icon='tabler:refresh' fontSize={18} />}
                  sx={{ height: '40px', px: 2.5 }}
                >
                  Reset
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity='error' onClose={() => setError(null)} sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>NO</th>
                        <th>KODE VOUCHER</th>
                        <th>KETERANGAN</th>
                        <th>JENIS</th>
                        <th>NILAI DISKON</th>
                        <th>KUOTA</th>
                        <th>PERIODE</th>
                        <th>STATUS</th>
                        <th>AKSI</th>
                      </tr>
                    </thead>
                    {data.length === 0 ? (
                      <tbody>
                        <tr>
                          <td colSpan={9} className='text-center'>
                            <Typography variant='body2' color='text.secondary' sx={{ py: 4 }}>
                              Tidak ada data voucher
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody>
                        {data.map((voucher, index) => {
                          const sisaKuota = voucher.kuota - voucher.kuota_terpakai

                          return (
                            <tr key={voucher.id}>
                              <td>{(currentPage - 1) * perPage + index + 1}</td>
                              <td>
                                <Typography fontWeight={600} color='text.primary'>
                                  {voucher.kode_voucher}
                                </Typography>
                              </td>
                              <td>
                                <Typography variant='body2' className='line-clamp-2'>
                                  {voucher.keterangan}
                                </Typography>
                              </td>
                              <td>
                                <Chip
                                  label={voucher.jenis_voucher === 'ongkir' ? 'Diskon Ongkir' : 'Potongan Harga'}
                                  color={voucher.jenis_voucher === 'ongkir' ? 'info' : 'success'}
                                  size='small'
                                  variant='tonal'
                                />
                              </td>
                              <td>
                                {voucher.jenis_voucher === 'ongkir' ? (
                                  <Typography color='text.primary' fontWeight={600}>
                                    {formatRupiah(voucher.nilai_diskon)}
                                  </Typography>
                                ) : (
                                  <Box>
                                    <Typography color='text.primary' fontWeight={600}>
                                      {voucher.tipe_diskon === 'persen'
                                        ? `${voucher.nilai_diskon}%`
                                        : formatRupiah(voucher.nilai_diskon)}
                                    </Typography>
                                    {voucher.tipe_diskon === 'persen' && voucher.maksimal_diskon && (
                                      <Typography variant='caption' color='text.secondary'>
                                        Max: {formatRupiah(voucher.maksimal_diskon)}
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </td>
                              <td>
                                <Typography variant='body2'>
                                  Sisa: <strong>{sisaKuota}</strong> / {voucher.kuota}
                                </Typography>
                              </td>
                              <td>
                                <Typography variant='body2'>
                                  {formatDate(voucher.tgl_mulai)}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  s/d {formatDate(voucher.tgl_berakhir)}
                                </Typography>
                              </td>
                              <td>
                                <Chip
                                  label={
                                    voucher.status === 'active' ? 'Aktif' :
                                    voucher.status === 'inactive' ? 'Nonaktif' : 'Expired'
                                  }
                                  color={getStatusColor(voucher.status)}
                                  size='small'
                                  variant='tonal'
                                />
                              </td>
                              <td>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size='small'
                                    color='primary'
                                    onClick={() => handleEdit(voucher)}
                                  >
                                    <Icon icon='tabler:edit' />
                                  </IconButton>
                                  <IconButton
                                    size='small'
                                    color='error'
                                    onClick={() => handleDeleteClick(voucher)}
                                  >
                                    <Icon icon='tabler:trash' />
                                  </IconButton>
                                </Box>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    )}
                  </table>
                </div>

                {/* Custom Pagination */}
                <Box className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
                  <Typography color='text.disabled' sx={{ fontSize: '0.8125rem' }}>
                    {`Showing ${totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1} to ${Math.min(
                      currentPage * perPage,
                      totalRecords
                    )} of ${totalRecords} entries`}
                  </Typography>
                  <Pagination
                    shape='rounded'
                    color='primary'
                    variant='tonal'
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, newPage) => setCurrentPage(newPage)}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Tambah Voucher'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Kode Voucher'
                value={formData.kode_voucher}
                onChange={e => setFormData({ ...formData, kode_voucher: e.target.value.toUpperCase() })}
                placeholder='Contoh: DISKON50'
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Jenis Voucher</InputLabel>
                <Select
                  value={formData.jenis_voucher}
                  label='Jenis Voucher'
                  onChange={e => setFormData({ ...formData, jenis_voucher: e.target.value as 'ongkir' | 'potongan_harga' })}
                >
                  <MenuItem value='potongan_harga'>Potongan Harga</MenuItem>
                  <MenuItem value='ongkir'>Diskon Ongkir</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Keterangan'
                value={formData.keterangan}
                onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                multiline
                rows={3}
                placeholder='Deskripsi voucher...'
                required
              />
            </Grid>

            {formData.jenis_voucher === 'potongan_harga' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipe Diskon</InputLabel>
                  <Select
                    value={formData.tipe_diskon}
                    label='Tipe Diskon'
                    onChange={e => setFormData({ ...formData, tipe_diskon: e.target.value as 'persen' | 'nominal' })}
                  >
                    <MenuItem value='nominal'>Nominal (Rp)</MenuItem>
                    <MenuItem value='persen'>Persentase (%)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: formData.jenis_voucher === 'potongan_harga' ? 6 : 12 }}>
              <CustomTextField
                fullWidth
                type='number'
                label={
                  formData.jenis_voucher === 'ongkir'
                    ? 'Nilai Diskon Ongkir (Rp)'
                    : formData.tipe_diskon === 'persen'
                    ? 'Nilai Diskon (%)'
                    : 'Nilai Diskon (Rp)'
                }
                value={formData.nilai_diskon}
                onChange={e => setFormData({ ...formData, nilai_diskon: Number(e.target.value) })}
                inputProps={{
                  min: 0,
                  max: formData.tipe_diskon === 'persen' ? 100 : undefined
                }}
                required
                helperText={
                  formData.jenis_voucher === 'ongkir'
                    ? 'Nilai maksimal diskon ongkir dalam Rupiah'
                    : formData.tipe_diskon === 'persen'
                    ? 'Masukkan nilai 1-100 untuk persentase diskon'
                    : undefined
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label='Kuota'
                value={formData.kuota}
                onChange={e => setFormData({ ...formData, kuota: Number(e.target.value) })}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label='Minimum Pembelian (Opsional)'
                value={formData.minimum_pembelian || ''}
                onChange={e => setFormData({ ...formData, minimum_pembelian: e.target.value ? Number(e.target.value) : undefined })}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {formData.jenis_voucher === 'potongan_harga' && formData.tipe_diskon === 'persen' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Maksimal Diskon (Opsional)'
                  value={formData.maksimal_diskon || ''}
                  onChange={e => setFormData({ ...formData, maksimal_diskon: e.target.value ? Number(e.target.value) : undefined })}
                  inputProps={{ min: 0 }}
                  helperText='Batasan maksimal potongan harga dalam Rupiah'
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='date'
                label='Tanggal Mulai'
                value={formData.tgl_mulai}
                onChange={e => setFormData({ ...formData, tgl_mulai: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='date'
                label='Tanggal Berakhir'
                value={formData.tgl_berakhir}
                onChange={e => setFormData({ ...formData, tgl_berakhir: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label='Status'
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'expired' })}
                >
                  <MenuItem value='active'>Aktif</MenuItem>
                  <MenuItem value='inactive'>Nonaktif</MenuItem>
                  <MenuItem value='expired'>Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} variant='contained' disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : editingVoucher ? 'Update' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => !submitting && setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus voucher <strong>{deletingVoucher?.kode_voucher}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleDelete} color='error' variant='contained' disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default VoucherTable
