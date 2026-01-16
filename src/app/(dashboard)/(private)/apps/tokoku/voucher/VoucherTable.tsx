'use client'

// React Imports
import { useEffect, useMemo, useState, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Excel Export
import * as XLSX from 'xlsx'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Hook Imports
import { useDebounce } from '@/hooks/useDebounce'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

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

type VoucherWithActionsType = Voucher & {
  action?: string
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

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper<VoucherWithActionsType>()

const VoucherTable = () => {
  // RBAC Context - get current store
  const { currentStore, isLoading: rbacLoading } = useRBAC()

  // Get store UUID from RBAC context
  const currentStoreUUID = currentStore?.uuid || currentStore?.id || ''

  // States
  const [data, setData] = useState<Voucher[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  const debouncedGlobalFilter = useDebounce(globalFilter, 500)

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    if (!currentStoreUUID) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: currentPage.toString(),
        uuid_store: currentStoreUUID,
        ...(debouncedGlobalFilter && { search: debouncedGlobalFilter })
      })

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
      } else {
        throw new Error(result.message || 'Failed to fetch vouchers')
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching vouchers')
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedGlobalFilter, refreshTrigger, currentStoreUUID])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

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
      'Jenis Voucher': item.jenis_voucher === 'ongkir' ? 'Ongkir' : 'Potongan Harga',
      'Nilai Diskon': item.nilai_diskon,
      Kuota: item.kuota,
      'Kuota Terpakai': item.kuota_terpakai,
      'Sisa Kuota': item.kuota - item.kuota_terpakai,
      'Tanggal Mulai': new Date(item.tgl_mulai).toLocaleDateString('id-ID'),
      'Tanggal Berakhir': new Date(item.tgl_berakhir).toLocaleDateString('id-ID'),
      Status: item.status === 'active' ? 'Aktif' : item.status === 'inactive' ? 'Nonaktif' : 'Expired'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Vouchers_${today}.xlsx`)
  }

  // Define columns
  const columns = useMemo<ColumnDef<VoucherWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'No',
        cell: ({ row }) => {
          return <Typography color='text.primary'>{(currentPage - 1) * perPage + row.index + 1}</Typography>
        },
        size: 50
      }),
      columnHelper.accessor('kode_voucher', {
        header: 'Kode Voucher',
        cell: ({ row }) => (
          <Typography color='text.primary' fontWeight={600}>
            {row.original.kode_voucher}
          </Typography>
        )
      }),
      columnHelper.accessor('keterangan', {
        header: 'Keterangan',
        cell: ({ row }) => (
          <Typography color='text.primary' className='line-clamp-2'>
            {row.original.keterangan}
          </Typography>
        )
      }),
      columnHelper.accessor('jenis_voucher', {
        header: 'Jenis',
        cell: ({ row }) => (
          <Chip
            label={row.original.jenis_voucher === 'ongkir' ? 'Ongkir' : 'Potongan Harga'}
            color={row.original.jenis_voucher === 'ongkir' ? 'info' : 'success'}
            size='small'
          />
        )
      }),
      columnHelper.accessor('nilai_diskon', {
        header: 'Nilai Diskon',
        cell: ({ row }) => {
          if (row.original.jenis_voucher === 'ongkir') {
            return <Typography color='text.primary'>Gratis Ongkir</Typography>
          }

          const displayValue = row.original.tipe_diskon === 'persen'
            ? `${row.original.nilai_diskon}%`
            : `Rp ${Number(row.original.nilai_diskon).toLocaleString('id-ID')}`

          return (
            <div>
              <Typography color='text.primary' fontWeight={600}>
                {displayValue}
              </Typography>
              {row.original.tipe_diskon === 'persen' && row.original.maksimal_diskon && (
                <Typography variant='caption' color='text.secondary'>
                  Max: Rp {Number(row.original.maksimal_diskon).toLocaleString('id-ID')}
                </Typography>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('kuota', {
        header: 'Kuota',
        cell: ({ row }) => {
          const sisaKuota = row.original.kuota - row.original.kuota_terpakai
          return (
            <div>
              <Typography color='text.primary' variant='body2'>
                Sisa: <strong>{sisaKuota}</strong> / {row.original.kuota}
              </Typography>
            </div>
          )
        }
      }),
      columnHelper.accessor('tgl_mulai', {
        header: 'Periode',
        cell: ({ row }) => (
          <div>
            <Typography variant='body2' color='text.primary'>
              {new Date(row.original.tgl_mulai).toLocaleDateString('id-ID')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              s/d {new Date(row.original.tgl_berakhir).toLocaleDateString('id-ID')}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const color =
            status === 'active' ? 'success' :
            status === 'inactive' ? 'warning' :
            'error'
          const label =
            status === 'active' ? 'Aktif' :
            status === 'inactive' ? 'Nonaktif' :
            'Expired'

          return <Chip label={label} color={color} size='small' variant='tonal' />
        }
      }),
      columnHelper.accessor('action', {
        header: 'Aksi',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton
              size='small'
              color='primary'
              onClick={() => handleEdit(row.original)}
            >
              <i className='tabler-edit' />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              onClick={() => handleDeleteClick(row.original)}
            >
              <i className='tabler-trash' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [currentPage, perPage]
  )

  const table = useReactTable({
    data: data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // Show loading while RBAC is loading
  if (rbacLoading) {
    return (
      <Card>
        <CardHeader title='Manajemen Voucher' />
        <Divider />
        <CardContent>
          <div className='flex justify-center items-center p-8'>
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show message if no store selected
  if (!currentStoreUUID) {
    return (
      <Card>
        <CardHeader title='Manajemen Voucher' />
        <Divider />
        <CardContent>
          <Alert severity='warning'>
            Store belum tersedia. Pastikan Anda sudah memiliki toko yang aktif.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader title='Manajemen Voucher' />
        <Divider />

        {error && (
          <Alert severity='error' onClose={() => setError(null)} sx={{ m: 4 }}>
            {error}
          </Alert>
        )}

        <CardContent>
          <div className='flex justify-between gap-4 p-6 flex-col items-start sm:flex-row sm:items-center'>
            <CustomTextField
              select
              value={perPage}
              onChange={e => {
                setPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className='is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
              <MenuItem value='100'>100</MenuItem>
            </CustomTextField>

            <div className='flex items-center gap-4 flex-col !items-start sm:flex-row sm:!items-center'>
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={value => setGlobalFilter(String(value))}
                placeholder='Cari voucher...'
                className='is-full sm:is-auto'
              />
              <div className='flex gap-2'>
                <Button
                  variant='outlined'
                  color='secondary'
                  startIcon={<i className='tabler-refresh' />}
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                >
                  Refresh
                </Button>
                <Button
                  variant='outlined'
                  color='secondary'
                  startIcon={<i className='tabler-file-export' />}
                  onClick={exportToExcel}
                  disabled={data.length === 0}
                >
                  Export Excel
                </Button>
                <Button
                  variant='contained'
                  startIcon={<i className='tabler-plus' />}
                  onClick={handleAdd}
                >
                  Tambah Voucher
                </Button>
              </div>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              {loading ? (
                <tbody>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index}>
                      {columns.map((_, colIndex) => (
                        <td key={colIndex}>
                          <Skeleton variant='text' />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ) : table.getRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      <Typography className='p-4'>Tidak ada data voucher</Typography>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          <TablePagination
            component={() => (
              <TablePaginationComponent
                table={table}
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
            count={totalRecords}
            rowsPerPage={perPage}
            page={currentPage - 1}
            onPageChange={(_, page) => setCurrentPage(page + 1)}
            onRowsPerPageChange={e => {
              setPerPage(parseInt(e.target.value, 10))
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Tambah Voucher'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Kode Voucher'
                value={formData.kode_voucher}
                onChange={e => setFormData({ ...formData, kode_voucher: e.target.value.toUpperCase() })}
                placeholder='Contoh: DISKON50'
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Jenis Voucher</InputLabel>
                <Select
                  value={formData.jenis_voucher}
                  label='Jenis Voucher'
                  onChange={e => setFormData({ ...formData, jenis_voucher: e.target.value as 'ongkir' | 'potongan_harga' })}
                >
                  <MenuItem value='potongan_harga'>Potongan Harga</MenuItem>
                  <MenuItem value='ongkir'>Gratis Ongkir</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
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
              <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={formData.jenis_voucher === 'potongan_harga' ? 6 : 12}>
              <CustomTextField
                fullWidth
                type='number'
                label={
                  formData.jenis_voucher === 'ongkir'
                    ? 'Nilai Ongkir (Rp)'
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
                  formData.tipe_diskon === 'persen'
                    ? 'Masukkan nilai 1-100 untuk persentase diskon'
                    : undefined
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                type='number'
                label='Minimum Pembelian (Opsional)'
                value={formData.minimum_pembelian || ''}
                onChange={e => setFormData({ ...formData, minimum_pembelian: e.target.value ? Number(e.target.value) : undefined })}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                type='number'
                label='Maksimal Diskon (Opsional)'
                value={formData.maksimal_diskon || ''}
                onChange={e => setFormData({ ...formData, maksimal_diskon: e.target.value ? Number(e.target.value) : undefined })}
                inputProps={{ min: 0 }}
                helperText={
                  formData.tipe_diskon === 'persen'
                    ? 'Batasan maksimal potongan harga dalam Rupiah'
                    : 'Tidak digunakan untuk diskon nominal'
                }
                disabled={formData.jenis_voucher === 'ongkir' || formData.tipe_diskon === 'nominal'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12}>
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
    </>
  )
}

export default VoucherTable
