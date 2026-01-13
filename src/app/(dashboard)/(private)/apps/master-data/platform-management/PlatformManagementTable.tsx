'use client'

// React Imports
import { useEffect, useMemo, useState, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
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
import Grid from '@mui/material/Grid2'

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
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

// Hook Imports
import { useDebounce } from '@/hooks/useDebounce'

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

type Platform = {
  id: number
  uuid: string
  no_kontrak: string
  judul: string
  username: string
  perusahaan: string
  file?: string
  nama: string
  email: string
  no_hp: string
  lokasi: string
  logo?: string
  logo_footer?: string
  coin_user: number
  kuota_user: number
  domain: string
  tgl_mulai: string
  tgl_akhir: string
  created_at: string
  updated_at: string
}

type PlatformWithActionsType = Platform & {
  action?: string
}

type PlatformFormData = {
  no_kontrak: string
  judul: string
  username: string
  perusahaan: string
  file: File | null
  nama: string
  email: string
  no_hp: string
  lokasi: string
  logo: File | null
  logo_footer: File | null
  coin_user: number
  kuota_user: number
  domain: string
  tgl_mulai: Date | null
  tgl_akhir: Date | null
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
  }, [value, onChange, debounce])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Column Definitions
const columnHelper = createColumnHelper<PlatformWithActionsType>()

const PlatformManagementTable = () => {
  // RBAC Context
  const { user, isLoading: rbacLoading } = useRBAC()

  // States
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [totalRows, setTotalRows] = useState(0)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [platformToDelete, setPlatformToDelete] = useState<Platform | null>(null)
  const [platformToEdit, setPlatformToEdit] = useState<Platform | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [formData, setFormData] = useState<PlatformFormData>({
    no_kontrak: '',
    judul: '',
    username: '',
    perusahaan: '',
    file: null,
    nama: '',
    email: '',
    no_hp: '',
    lokasi: '',
    logo: null,
    logo_footer: null,
    coin_user: 0,
    kuota_user: 0,
    domain: '',
    tgl_mulai: null,
    tgl_akhir: null
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFooterPreview, setLogoFooterPreview] = useState<string | null>(null)

  const debouncedSearch = useDebounce(globalFilter, 300)

  // Fetch platforms from API
  const fetchPlatforms = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh || platforms.length === 0) {
        setLoading(true)
      }
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.append('page', String(pagination.pageIndex + 1))
      queryParams.append('per_page', String(pagination.pageSize))

      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch)
      }

      // Add cache-busting parameter to prevent browser caching
      queryParams.append('_t', String(Date.now()))

      // Get auth headers
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

      const response = await fetch(`${apiUrl}/management/platforms?${queryParams.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setPlatforms(result.data.data || [])
        setTotalRows(result.data.total || 0)
      } else {
        throw new Error(result.message || 'Failed to fetch platforms')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch platforms')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, platforms.length])

  // Fetch platforms when dependencies change
  useEffect(() => {
    if (!rbacLoading) {
      fetchPlatforms()
    }
  }, [fetchPlatforms, rbacLoading])

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    fetchPlatforms(true)
  }, [fetchPlatforms])

  // Handle Excel export
  const handleExcelExport = () => {
    try {
      const exportData = platforms.map((platform, index) => ({
        'No': index + 1,
        'No Kontrak': platform.no_kontrak,
        'Judul': platform.judul,
        'Username': platform.username,
        'Perusahaan': platform.perusahaan,
        'Nama': platform.nama,
        'Email': platform.email,
        'No HP': platform.no_hp,
        'Lokasi': platform.lokasi,
        'Coin User': platform.coin_user,
        'Kuota User': platform.kuota_user,
        'Domain': platform.domain,
        'Tgl Mulai': new Date(platform.tgl_mulai).toLocaleDateString('id-ID'),
        'Tgl Akhir': new Date(platform.tgl_akhir).toLocaleDateString('id-ID'),
        'Created': new Date(platform.created_at).toLocaleDateString('id-ID')
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 5 },  // No
        { wch: 15 }, // No Kontrak
        { wch: 25 }, // Judul
        { wch: 15 }, // Username
        { wch: 25 }, // Perusahaan
        { wch: 20 }, // Nama
        { wch: 30 }, // Email
        { wch: 15 }, // No HP
        { wch: 20 }, // Lokasi
        { wch: 10 }, // Coin User
        { wch: 10 }, // Kuota User
        { wch: 25 }, // Domain
        { wch: 12 }, // Tgl Mulai
        { wch: 12 }, // Tgl Akhir
        { wch: 12 }  // Created
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Platforms')

      const today = new Date().toISOString().split('T')[0]
      const filename = `Platforms_${today}.xlsx`

      XLSX.writeFile(wb, filename)
    } catch (err) {
      setError('Failed to export data to Excel')
    }
  }

  // Handle add platform
  const handleAddPlatform = () => {
    setPlatformToEdit(null)
    setFormData({
      no_kontrak: '',
      judul: '',
      username: '',
      perusahaan: '',
      file: null,
      nama: '',
      email: '',
      no_hp: '',
      lokasi: '',
      logo: null,
      logo_footer: null,
      coin_user: 0,
      kuota_user: 0,
      domain: '',
      tgl_mulai: null,
      tgl_akhir: null
    })
    setFormErrors({})
    setLogoPreview(null)
    setLogoFooterPreview(null)
    setDialogOpen(true)
  }

  // Handle edit platform
  const handleEditPlatform = (platform: Platform) => {
    setPlatformToEdit(platform)
    setFormData({
      no_kontrak: platform.no_kontrak,
      judul: platform.judul,
      username: platform.username,
      perusahaan: platform.perusahaan,
      file: null,
      nama: platform.nama,
      email: platform.email,
      no_hp: platform.no_hp,
      lokasi: platform.lokasi,
      logo: null,
      logo_footer: null,
      coin_user: platform.coin_user,
      kuota_user: platform.kuota_user,
      domain: platform.domain,
      tgl_mulai: new Date(platform.tgl_mulai),
      tgl_akhir: new Date(platform.tgl_akhir)
    })
    setFormErrors({})

    // Set preview for existing images
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    if (platform.logo) {
      setLogoPreview(`${backendUrl}/storage/${platform.logo}`)
    } else {
      setLogoPreview(null)
    }
    if (platform.logo_footer) {
      setLogoFooterPreview(`${backendUrl}/storage/${platform.logo_footer}`)
    } else {
      setLogoFooterPreview(null)
    }

    setDialogOpen(true)
  }

  // Handle save platform
  const handleSavePlatform = async () => {
    // Validate form
    const errors: Record<string, string> = {}
    if (!formData.no_kontrak.trim()) {
      errors.no_kontrak = 'No Kontrak is required'
    }
    if (!formData.judul.trim()) {
      errors.judul = 'Judul is required'
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }
    if (!formData.perusahaan.trim()) {
      errors.perusahaan = 'Perusahaan is required'
    }
    if (!formData.nama.trim()) {
      errors.nama = 'Nama is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.no_hp.trim()) {
      errors.no_hp = 'No HP is required'
    }
    if (!formData.lokasi.trim()) {
      errors.lokasi = 'Lokasi is required'
    }
    if (!formData.domain.trim()) {
      errors.domain = 'Domain is required'
    }
    if (!formData.tgl_mulai) {
      errors.tgl_mulai = 'Tgl Mulai is required'
    }
    if (!formData.tgl_akhir) {
      errors.tgl_akhir = 'Tgl Akhir is required'
    } else if (formData.tgl_mulai && formData.tgl_akhir && formData.tgl_akhir <= formData.tgl_mulai) {
      errors.tgl_akhir = 'Tgl Akhir must be after Tgl Mulai'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Get auth headers
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

      // Prepare FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('no_kontrak', formData.no_kontrak)
      formDataToSend.append('judul', formData.judul)
      formDataToSend.append('username', formData.username)
      formDataToSend.append('perusahaan', formData.perusahaan)
      formDataToSend.append('nama', formData.nama)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('no_hp', formData.no_hp)
      formDataToSend.append('lokasi', formData.lokasi)
      formDataToSend.append('coin_user', String(formData.coin_user))
      formDataToSend.append('kuota_user', String(formData.kuota_user))
      formDataToSend.append('domain', formData.domain)

      // Format dates to YYYY-MM-DD
      if (formData.tgl_mulai) {
        const tglMulai = new Date(formData.tgl_mulai)
        formDataToSend.append('tgl_mulai', tglMulai.toISOString().split('T')[0])
      }
      if (formData.tgl_akhir) {
        const tglAkhir = new Date(formData.tgl_akhir)
        formDataToSend.append('tgl_akhir', tglAkhir.toISOString().split('T')[0])
      }

      if (formData.file) {
        formDataToSend.append('file', formData.file)
      }
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo)
      }
      if (formData.logo_footer) {
        formDataToSend.append('logo_footer', formData.logo_footer)
      }

      const url = platformToEdit
        ? `${apiUrl}/management/platforms/${platformToEdit.uuid}`
        : `${apiUrl}/management/platforms`

      const method = platformToEdit ? 'PUT' : 'POST'

      // For PUT requests with FormData, we need to use POST with _method override
      if (platformToEdit) {
        formDataToSend.append('_method', 'PUT')
      }

      const response = await fetch(url, {
        method: platformToEdit ? 'POST' : 'POST',
        credentials: 'include',
        headers,
        body: formDataToSend
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setDialogOpen(false)
        fetchPlatforms(true)
      } else {
        throw new Error(result.message || 'Failed to save platform')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save platform')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete platform
  const handleDeleteClick = (platform: Platform) => {
    setPlatformToDelete(platform)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!platformToDelete) return

    try {
      setDeleting(true)
      setError(null)

      // Get auth headers
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

      const response = await fetch(`${apiUrl}/management/platforms/${platformToDelete.uuid}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setDeleteDialogOpen(false)
        setPlatformToDelete(null)
        fetchPlatforms(true)
      } else {
        throw new Error(result.message || 'Failed to delete platform')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete platform')
    } finally {
      setDeleting(false)
    }
  }

  // Columns
  const columns = useMemo<ColumnDef<PlatformWithActionsType, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No',
      cell: ({ row }) => (
        <Typography color="text.primary">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </Typography>
      )
    }),
    columnHelper.accessor('no_kontrak', {
      header: 'No Kontrak',
      cell: ({ row }) => (
        <Typography color="text.primary" className="font-medium">
          {row.original.no_kontrak}
        </Typography>
      )
    }),
    columnHelper.accessor('judul', {
      header: 'Judul',
      cell: ({ row }) => (
        <Typography>{row.original.judul}</Typography>
      )
    }),
    columnHelper.accessor('perusahaan', {
      header: 'Perusahaan',
      cell: ({ row }) => (
        <Typography>{row.original.perusahaan}</Typography>
      )
    }),
    columnHelper.accessor('domain', {
      header: 'Domain',
      cell: ({ row }) => (
        <Typography className="font-mono">{row.original.domain}</Typography>
      )
    }),
    columnHelper.accessor('tgl_mulai', {
      header: 'Tgl Mulai',
      cell: ({ row }) => (
        <Typography>
          {new Date(row.original.tgl_mulai).toLocaleDateString('id-ID')}
        </Typography>
      )
    }),
    columnHelper.accessor('tgl_akhir', {
      header: 'Tgl Akhir',
      cell: ({ row }) => (
        <Typography>
          {new Date(row.original.tgl_akhir).toLocaleDateString('id-ID')}
        </Typography>
      )
    }),
    columnHelper.display({
      id: 'action',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center">
          <IconButton onClick={() => handleEditPlatform(row.original)} title="Edit Platform">
            <i className="tabler-edit text-textSecondary" />
          </IconButton>
          <IconButton onClick={() => handleDeleteClick(row.original)} title="Delete Platform">
            <i className="tabler-trash text-textSecondary" />
          </IconButton>
        </div>
      ),
      enableSorting: false
    })
  ], [pagination.pageIndex, pagination.pageSize])

  // Table setup
  const table = useReactTable({
    data: platforms,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: {
      globalFilter,
      pagination
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: Math.ceil(totalRows / pagination.pageSize)
  })

  // Skeleton loading component
  const renderSkeleton = () => (
    <Card>
      <CardHeader
        title={<Skeleton variant="text" width={150} height={32} />}
        action={
          <div className="flex gap-3">
            <Skeleton variant="rounded" width={100} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
            <Skeleton variant="rounded" width={100} height={40} />
          </div>
        }
      />
      <Divider />
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="rounded" width={80} height={40} />
          <Skeleton variant="rounded" width={200} height={40} />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton variant="rectangular" width={40} height={20} />
              <Skeleton variant="text" width={150} />
              <Skeleton variant="text" width={200} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rectangular" width={40} height={20} />
              <Skeleton variant="circular" width={32} height={32} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Show loading state
  if (rbacLoading) {
    return renderSkeleton()
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Typography variant="h5">Platform Management</Typography>
          {loading && platforms.length > 0 && (
            <CircularProgress size={16} className="text-primary" />
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end items-center">
          <Button
            variant="outlined"
            startIcon={<i className='tabler-refresh' />}
            onClick={handleManualRefresh}
            disabled={loading}
            size="small"
            sx={{ minWidth: { xs: '90px', sm: '100px' } }}
          >
            <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<i className='tabler-file-excel' />}
            onClick={handleExcelExport}
            disabled={platforms.length === 0 || loading}
            size="small"
            sx={{ minWidth: '90px' }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<i className='tabler-plus' />}
            onClick={handleAddPlatform}
            size="small"
            sx={{ minWidth: '120px' }}
          >
            Add Platform
          </Button>
        </div>
      </div>

      <Divider />

      {error && (
        <Alert severity="error" className="m-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Row */}
      <CardContent>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <CustomTextField
            select
            value={pagination.pageSize}
            onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
            className="w-[100px]"
          >
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="25">25</MenuItem>
            <MenuItem value="50">50</MenuItem>
            <MenuItem value="100">100</MenuItem>
          </CustomTextField>

          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={val => setGlobalFilter(String(val))}
            placeholder="Search Platform"
            className="w-[200px]"
          />
        </div>

        {/* Table */}
        {loading && platforms.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton variant="rectangular" width={40} height={20} />
                <Skeleton variant="text" width={150} />
                <Skeleton variant="text" width={200} />
                <Skeleton variant="text" width={120} />
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rectangular" width={40} height={20} />
                <Skeleton variant="circular" width={32} height={32} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                            asc: <i className="tabler-chevron-up text-xl" />,
                            desc: <i className="tabler-chevron-down text-xl" />
                          }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {platforms.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    {loading ? 'Loading...' : 'No platforms found'}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        )}
      </CardContent>

      {/* Pagination */}
      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={totalRows}
        rowsPerPage={pagination.pageSize}
        page={pagination.pageIndex}
        onPageChange={(_, page) => {
          setPagination(prev => ({ ...prev, pageIndex: page }))
        }}
      />

      {/* Add/Edit Platform Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {platformToEdit ? 'Edit Platform' : 'Add New Platform'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} className="pt-2">
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="No Kontrak"
                required
                value={formData.no_kontrak}
                onChange={e => setFormData(prev => ({ ...prev, no_kontrak: e.target.value }))}
                error={!!formErrors.no_kontrak}
                helperText={formErrors.no_kontrak}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Judul"
                required
                value={formData.judul}
                onChange={e => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                error={!!formErrors.judul}
                helperText={formErrors.judul}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Username"
                required
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                error={!!formErrors.username}
                helperText={formErrors.username}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Perusahaan"
                required
                value={formData.perusahaan}
                onChange={e => setFormData(prev => ({ ...prev, perusahaan: e.target.value }))}
                error={!!formErrors.perusahaan}
                helperText={formErrors.perusahaan}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Nama (Contact Person)"
                required
                value={formData.nama}
                onChange={e => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                error={!!formErrors.nama}
                helperText={formErrors.nama}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Email"
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="No HP"
                required
                value={formData.no_hp}
                onChange={e => setFormData(prev => ({ ...prev, no_hp: e.target.value }))}
                error={!!formErrors.no_hp}
                helperText={formErrors.no_hp}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Lokasi"
                required
                value={formData.lokasi}
                onChange={e => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
                error={!!formErrors.lokasi}
                helperText={formErrors.lokasi}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Domain"
                required
                value={formData.domain}
                onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                error={!!formErrors.domain}
                helperText={formErrors.domain}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Coin User (Default)"
                required
                type="number"
                value={formData.coin_user}
                onChange={e => setFormData(prev => ({ ...prev, coin_user: parseInt(e.target.value) || 0 }))}
                error={!!formErrors.coin_user}
                helperText={formErrors.coin_user}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Kuota User (Default)"
                required
                type="number"
                value={formData.kuota_user}
                onChange={e => setFormData(prev => ({ ...prev, kuota_user: parseInt(e.target.value) || 0 }))}
                error={!!formErrors.kuota_user}
                helperText={formErrors.kuota_user}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                selected={formData.tgl_mulai}
                id='tgl-mulai'
                placeholderText='MM/DD/YYYY'
                dateFormat='MM/dd/yyyy'
                onChange={(date: Date | null) => setFormData(prev => ({ ...prev, tgl_mulai: date }))}
                customInput={
                  <CustomTextField
                    label='Tgl Mulai *'
                    fullWidth
                    error={!!formErrors.tgl_mulai}
                    helperText={formErrors.tgl_mulai}
                  />
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                selected={formData.tgl_akhir}
                id='tgl-akhir'
                placeholderText='MM/DD/YYYY'
                dateFormat='MM/dd/yyyy'
                onChange={(date: Date | null) => setFormData(prev => ({ ...prev, tgl_akhir: date }))}
                customInput={
                  <CustomTextField
                    label='Tgl Akhir *'
                    fullWidth
                    error={!!formErrors.tgl_akhir}
                    helperText={formErrors.tgl_akhir}
                  />
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" className="mb-2">
                File Kontrak (PDF/DOC)
              </Typography>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<i className='tabler-upload' />}
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData(prev => ({ ...prev, file }))
                      }
                    }}
                  />
                </Button>
                {formData.file && (
                  <Typography variant="caption" className="text-success">
                    {formData.file.name}
                  </Typography>
                )}
                {platformToEdit?.file && !formData.file && (
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    startIcon={<i className='tabler-file-text' />}
                    onClick={() => {
                      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
                      window.open(`${backendUrl}/storage/${platformToEdit.file}`, '_blank')
                    }}
                  >
                    View Document
                  </Button>
                )}
              </div>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" className="mb-2">
                Logo (PNG/JPG)
              </Typography>
              <div className="flex flex-col gap-2">
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<i className='tabler-upload' />}
                >
                  Upload Logo
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData(prev => ({ ...prev, logo: file }))
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setLogoPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </Button>
                {formData.logo && (
                  <Typography variant="caption" className="text-success">
                    {formData.logo.name}
                  </Typography>
                )}
                {logoPreview && (
                  <div className="relative inline-block w-32 h-32">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain border rounded"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      className="absolute -top-2 -right-2 bg-white"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, logo: null }))
                        setLogoPreview(null)
                      }}
                    >
                      <i className='tabler-x' />
                    </IconButton>
                  </div>
                )}
              </div>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" className="mb-2">
                Logo Footer (PNG/JPG)
              </Typography>
              <div className="flex flex-col gap-2">
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<i className='tabler-upload' />}
                >
                  Upload Logo Footer
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData(prev => ({ ...prev, logo_footer: file }))
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setLogoFooterPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </Button>
                {formData.logo_footer && (
                  <Typography variant="caption" className="text-success">
                    {formData.logo_footer.name}
                  </Typography>
                )}
                {logoFooterPreview && (
                  <div className="relative inline-block w-32 h-32">
                    <img
                      src={logoFooterPreview}
                      alt="Logo footer preview"
                      className="w-full h-full object-contain border rounded"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      className="absolute -top-2 -right-2 bg-white"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, logo_footer: null }))
                        setLogoFooterPreview(null)
                      }}
                    >
                      <i className='tabler-x' />
                    </IconButton>
                  </div>
                )}
              </div>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="p-4 pt-0">
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePlatform}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <i className="tabler-loader animate-spin" /> : <i className="tabler-device-floppy" />}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <i className="tabler-alert-triangle text-warning text-xl" />
            Confirm Delete
          </div>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete platform <strong>{platformToDelete?.judul}</strong> ({platformToDelete?.no_kontrak})?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-4 pt-0">
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <i className="tabler-loader animate-spin" /> : <i className="tabler-trash" />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PlatformManagementTable
