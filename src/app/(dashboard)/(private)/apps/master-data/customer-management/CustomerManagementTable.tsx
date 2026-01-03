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

type Customer = {
  id: number
  uuid: string
  nama: string
  no_hp: string
  email: string | null
  provinsi: string
  kota: string
  kecamatan: string
  alamat: string
  uuid_store: string
  store?: {
    nama_toko: string
    subdomain: string
  }
  created_at: string
  updated_at: string
}

type CustomerWithActionsType = Customer & {
  action?: string
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
const columnHelper = createColumnHelper<CustomerWithActionsType>()

const CustomerManagementTable = () => {
  // RBAC Context
  const { user, isLoading: rbacLoading } = useRBAC()

  // States
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [totalRows, setTotalRows] = useState(0)

  const debouncedSearch = useDebounce(globalFilter, 300)

  // Fetch customers from API - MODIFIED FOR MASTER DATA (NO STORE FILTERING)
  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh || customers.length === 0) {
        setLoading(true)
      }
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.append('page', String(pagination.pageIndex + 1))
      queryParams.append('per_page', String(pagination.pageSize))

      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch)
      }

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

      // MODIFIED: Fetch all customers without store filtering
      const response = await fetch(`${apiUrl}/customers?${queryParams.toString()}`, {
        credentials: 'include',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setCustomers(result.data.data || [])
        setTotalRows(result.data.total || 0)
      } else {
        throw new Error(result.message || 'Failed to fetch customers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, customers.length])

  // Fetch customers when dependencies change
  useEffect(() => {
    if (!rbacLoading) {
      fetchCustomers()
    }
  }, [fetchCustomers, rbacLoading])

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    fetchCustomers(true)
  }, [fetchCustomers])

  // Handle Excel export - MODIFIED FOR MASTER DATA (includes store column)
  const handleExcelExport = () => {
    try {
      const exportData = customers.map((customer, index) => ({
        'No': index + 1,
        'Nama': customer.nama,
        'No HP': customer.no_hp,
        'Email': customer.email || '-',
        'Toko': customer.store?.nama_toko || customer.store?.name || customer.store?.store_name || '-',
        'Subdomain': customer.store?.subdomain || customer.store?.sub_domain || '-',
        'Kota': customer.kota,
        'Kecamatan': customer.kecamatan,
        'Provinsi': customer.provinsi,
        'Alamat': customer.alamat,
        'Dibuat': new Date(customer.created_at).toLocaleDateString('id-ID'),
        'Diperbarui': new Date(customer.updated_at).toLocaleDateString('id-ID')
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 15 }, // No HP
        { wch: 25 }, // Email
        { wch: 20 }, // Toko
        { wch: 20 }, // Subdomain
        { wch: 15 }, // Kota
        { wch: 15 }, // Kecamatan
        { wch: 15 }, // Provinsi
        { wch: 30 }, // Alamat
        { wch: 12 }, // Dibuat
        { wch: 12 }  // Diperbarui
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Customers')

      const today = new Date().toISOString().split('T')[0]
      const filename = `All_Customers_${today}.xlsx`

      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Error exporting to Excel:', err)
      setError('Failed to export data to Excel')
    }
  }

  // Columns - MODIFIED FOR MASTER DATA (added Store column)
  const columns = useMemo<ColumnDef<CustomerWithActionsType, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No',
      cell: ({ row }) => (
        <Typography color="text.primary">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </Typography>
      )
    }),
    columnHelper.accessor('nama', {
      header: 'Nama',
      cell: ({ row }) => (
        <Typography color="text.primary" className="font-medium">
          {row.original.nama}
        </Typography>
      )
    }),
    columnHelper.accessor('no_hp', {
      header: 'No HP',
      cell: ({ row }) => (
        <Typography>{row.original.no_hp}</Typography>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: ({ row }) => (
        <Typography>{row.original.email || '-'}</Typography>
      )
    }),
    // ADDED: Store column - using display to avoid object serialization issues
    columnHelper.display({
      id: 'store',
      header: 'Toko',
      cell: ({ row }) => {
        // Fallback untuk nama toko yang mungkin menggunakan 'nama_toko', 'name', atau 'store_name'
        const storeName = row.original.store?.nama_toko || row.original.store?.name || row.original.store?.store_name || '-'
        // Fallback untuk subdomain yang mungkin menggunakan 'subdomain' atau 'sub_domain'
        const subdomain = row.original.store?.subdomain || row.original.store?.sub_domain || ''

        return (
          <div className="flex flex-col">
            <Typography className="font-medium" color="text.primary">
              {storeName}
            </Typography>
            {subdomain && (
              <Typography variant="caption" color="text.secondary">
                {subdomain}.aidareu.com
              </Typography>
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor('kota', {
      header: 'Kota',
      cell: ({ row }) => (
        <Typography>{row.original.kota}</Typography>
      )
    }),
    columnHelper.accessor('alamat', {
      header: 'Alamat',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <Typography sx={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
            {row.original.alamat}
          </Typography>
        </div>
      )
    })
  ], [pagination.pageIndex, pagination.pageSize])

  // Table setup
  const table = useReactTable({
    data: customers,
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
          </div>
        }
      />
      <Divider />
      <CardContent>
        {/* Filter row skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="rounded" width={80} height={40} />
          <Skeleton variant="rounded" width={200} height={40} />
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton variant="rectangular" width={40} height={20} />
              <Skeleton variant="text" width={50} />
              <Skeleton variant="text" width={150} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={180} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={200} />
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
          <Typography variant="h5">Customer Management (All Stores)</Typography>
          {loading && customers.length > 0 && (
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
            disabled={customers.length === 0 || loading}
            size="small"
            sx={{ minWidth: '90px' }}
          >
            Export
          </Button>
        </div>
      </div>

      <Divider />

      {error && (
        <Alert severity="error" className="m-6">
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
            placeholder="Search Customer"
            className="w-[200px]"
          />
        </div>

        {/* Table */}
        {loading && customers.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton variant="rectangular" width={40} height={20} />
                <Skeleton variant="text" width={50} />
                <Skeleton variant="text" width={150} />
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={180} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={200} />
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
            {customers.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    {loading ? 'Loading...' : 'No customers found'}
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
    </Card>
  )
}

export default CustomerManagementTable
