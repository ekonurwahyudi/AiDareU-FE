'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
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

// Excel Export
import * as XLSX from 'xlsx'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

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

const VoucherTable = () => {
  // RBAC Context - get current store
  const { currentStore, isLoading: rbacLoading } = useRBAC()

  // Get store UUID from RBAC context
  const currentStoreUUID = currentStore?.uuid || currentStore?.id || ''

  // States
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Summary states
  const [summary, setSummary] = useState<VoucherSummary>({
    total_voucher: 0,
    voucher_aktif: 0,
    voucher_expired: 0,
    total_kuota: 0,
    total_terpakai: 0
  })

  // Pagination states (client-side like helpdesk)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  // Format number with thousand separator (no decimal)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num)
  }

  // Format currency with thousand separator (no decimal)
  const formatRupiah = (num: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num)}`
  }

  // Format number for input display (with thousand separator)
  const formatInputNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return ''
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)
  }

  // Parse formatted number string to number
  const parseInputNumber = (value: string): number => {
    const cleanValue = value.replace(/[^\d-]/g, '')
    const parsed = parseInt(cleanValue, 10)
    return isNaN(parsed) ? 0 : parsed
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

  // Fetch all vouchers (client-side pagination like helpdesk)
  const fetchVouchers = async () => {
    if (!currentStoreUUID) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokoku/vouchers?uuid_store=${currentStoreUUID}&per_page=1000&_t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          cache: 'no-store'
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const vouchers = result.data.data || result.data || []
        setAllVouchers(vouchers)

        // Calculate summary from all vouchers
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const voucherStats = vouchers.reduce(
          (acc: VoucherSummary, v: Voucher) => {
            acc.total_voucher++
            if (v.status === 'active') acc.voucher_aktif++
            const endDate = new Date(v.tgl_berakhir)
            if (v.status === 'expired' || endDate < today) acc.voucher_expired++
            acc.total_kuota += v.kuota
            acc.total_terpakai += v.kuota_terpakai
            return acc
          },
          { total_voucher: 0, voucher_aktif: 0, voucher_expired: 0, total_kuota: 0, total_terpakai: 0 }
        )

        setSummary(voucherStats)
      } else {
        throw new Error(result.message || 'Failed to fetch vouchers')
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching vouchers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentStoreUUID) {
      fetchVouchers()
    }
  }, [currentStoreUUID])

  // Client-side paginated vouchers
  const paginatedVouchers = allVouchers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalPages = Math.ceil(allVouchers.length / rowsPerPage)

  // Handle form submit
  const handleSubmit = async () => {
    if (!currentStoreUUID) {
      setFormError('Store belum dipilih. Silakan pilih store terlebih dahulu.')
      return
    }

    if (!formData.kode_voucher || !formData.keterangan || !formData.tgl_mulai || !formData.tgl_berakhir) {
      setFormError('Mohon lengkapi semua field yang diperlukan')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)

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
      resetForm()
      fetchVouchers() // Refresh data
    } catch (err) {
      console.error('Error saving voucher:', err)
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving voucher')
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
      fetchVouchers() // Refresh data
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
    setFormError(null)
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
    setFormError(null)
    setOpenDialog(true)
  }

  // Handle delete click
  const handleDeleteClick = (voucher: Voucher) => {
    setDeletingVoucher(voucher)
    setOpenDeleteDialog(true)
  }

  // Export to Excel
  const exportToExcel = () => {
    const exportData = allVouchers.map((item, index) => ({
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

      {/* Table */}
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
                  disabled={allVouchers.length === 0}
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
            {/* Show dropdown */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <CustomTextField
                select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(0)
                }}
                sx={{ minWidth: 120 }}
                size='small'
              >
                <MenuItem value={10}>Show 10</MenuItem>
                <MenuItem value={25}>Show 25</MenuItem>
                <MenuItem value={50}>Show 50</MenuItem>
                <MenuItem value={100}>Show 100</MenuItem>
              </CustomTextField>
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
            ) : allVouchers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color='text.secondary' sx={{ mb: 3 }}>
                  Belum ada voucher
                </Typography>
                <Button variant='contained' onClick={handleAdd}>
                  Buat Voucher Pertama
                </Button>
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
                        <th className='text-center'>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVouchers.map((voucher, index) => {
                        const sisaKuota = voucher.kuota - voucher.kuota_terpakai

                        return (
                          <tr key={voucher.uuid}>
                            <td>{page * rowsPerPage + index + 1}</td>
                            <td>
                              <Typography fontWeight={600} color='text.primary'>
                                {voucher.kode_voucher}
                              </Typography>
                            </td>
                            <td>
                              <Typography variant='body2' className='line-clamp-2' sx={{ maxWidth: 200 }}>
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
                            <td className='text-center'>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
                  </table>
                </div>

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mt: 4, gap: 2 }}>
                  <Typography color='text.disabled' sx={{ fontSize: '0.8125rem' }}>
                    {`Showing ${allVouchers.length === 0 ? 0 : page * rowsPerPage + 1} to ${Math.min(
                      (page + 1) * rowsPerPage,
                      allVouchers.length
                    )} of ${allVouchers.length} entries`}
                  </Typography>
                  <Pagination
                    shape='rounded'
                    color='primary'
                    variant='tonal'
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, newPage) => setPage(newPage - 1)}
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
      <Dialog
        open={openDialog}
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ width: 40, height: 40 }}>
              <Icon icon={editingVoucher ? 'tabler:edit' : 'tabler:ticket-plus'} fontSize={24} />
            </CustomAvatar>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                {editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {editingVoucher ? 'Ubah informasi voucher' : 'Buat voucher diskon untuk pelanggan Anda'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 4 }}>
          {formError && (
            <Alert severity='error' sx={{ mb: 3 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Info Section */}
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Informasi Dasar
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Kode Voucher'
                    value={formData.kode_voucher}
                    onChange={e => setFormData({ ...formData, kode_voucher: e.target.value.toUpperCase() })}
                    placeholder='Contoh: DISKON50'
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='tabler:ticket' fontSize={18} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Jenis Voucher</InputLabel>
                    <Select
                      value={formData.jenis_voucher}
                      label='Jenis Voucher'
                      onChange={e => setFormData({ ...formData, jenis_voucher: e.target.value as 'ongkir' | 'potongan_harga' })}
                    >
                      <MenuItem value='potongan_harga'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon icon='tabler:discount-2' fontSize={18} />
                          Potongan Harga
                        </Box>
                      </MenuItem>
                      <MenuItem value='ongkir'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon icon='tabler:truck-delivery' fontSize={18} />
                          Diskon Ongkir
                        </Box>
                      </MenuItem>
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
                    rows={2}
                    placeholder='Deskripsi voucher untuk pelanggan...'
                    required
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Discount Section */}
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Pengaturan Diskon
              </Typography>
              <Grid container spacing={3}>
                {formData.jenis_voucher === 'potongan_harga' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size='small'>
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
                  {formData.tipe_diskon === 'persen' && formData.jenis_voucher !== 'ongkir' ? (
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Nilai Diskon'
                      value={formData.nilai_diskon}
                      onChange={e => setFormData({ ...formData, nilai_diskon: Number(e.target.value) })}
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>%</InputAdornment>
                      }}
                      inputProps={{ min: 0, max: 100 }}
                      required
                    />
                  ) : (
                    <CustomTextField
                      fullWidth
                      label={formData.jenis_voucher === 'ongkir' ? 'Nilai Diskon Ongkir' : 'Nilai Diskon'}
                      value={formatInputNumber(formData.nilai_diskon)}
                      onChange={e => setFormData({ ...formData, nilai_diskon: parseInputNumber(e.target.value) })}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>Rp</InputAdornment>
                      }}
                      required
                      placeholder='0'
                    />
                  )}
                </Grid>
                {formData.jenis_voucher === 'potongan_harga' && formData.tipe_diskon === 'persen' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      label='Maksimal Diskon'
                      value={formData.maksimal_diskon ? formatInputNumber(formData.maksimal_diskon) : ''}
                      onChange={e => {
                        const val = e.target.value
                        setFormData({ ...formData, maksimal_diskon: val ? parseInputNumber(val) : undefined })
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>Rp</InputAdornment>
                      }}
                      helperText='Opsional - Batas maksimal potongan'
                      placeholder='0'
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Minimum Pembelian'
                    value={formData.minimum_pembelian ? formatInputNumber(formData.minimum_pembelian) : ''}
                    onChange={e => {
                      const val = e.target.value
                      setFormData({ ...formData, minimum_pembelian: val ? parseInputNumber(val) : undefined })
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>Rp</InputAdornment>
                    }}
                    helperText='Opsional - Minimal belanja'
                    placeholder='0'
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Kuota Voucher'
                    value={formatInputNumber(formData.kuota)}
                    onChange={e => {
                      const val = parseInputNumber(e.target.value)
                      setFormData({ ...formData, kuota: val > 0 ? val : 1 })
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='tabler:users' fontSize={18} />
                        </InputAdornment>
                      )
                    }}
                    required
                    helperText='Jumlah penggunaan voucher'
                    placeholder='1'
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Period & Status Section */}
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Periode & Status
              </Typography>
              <Grid container spacing={3}>
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
                  <FormControl fullWidth size='small'>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label='Status'
                      onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'expired' })}
                    >
                      <MenuItem value='active'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label='Aktif' color='success' size='small' />
                        </Box>
                      </MenuItem>
                      <MenuItem value='inactive'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label='Nonaktif' color='warning' size='small' />
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
            variant='outlined'
            color='secondary'
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:check' />}
          >
            {submitting ? 'Menyimpan...' : editingVoucher ? 'Update Voucher' : 'Simpan Voucher'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !submitting && setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2, maxWidth: 400 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <CustomAvatar skin='light' variant='rounded' color='error' sx={{ width: 56, height: 56, mx: 'auto', mb: 2 }}>
            <Icon icon='tabler:trash' fontSize={32} />
          </CustomAvatar>
          <Typography variant='h6'>Hapus Voucher?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <DialogContentText>
            Voucher <strong>{deletingVoucher?.kode_voucher}</strong> akan dihapus secara permanen.
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={submitting}
            variant='outlined'
            color='secondary'
          >
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            color='error'
            variant='contained'
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:trash' />}
          >
            {submitting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default VoucherTable
