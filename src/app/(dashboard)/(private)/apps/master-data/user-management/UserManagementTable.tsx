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
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

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

type User = {
  id: number
  uuid: string
  name: string
  nama_lengkap?: string
  email: string
  no_hp?: string
  roles?: string[] | string
  is_active: boolean
  alasan_gabung?: string
  info_dari?: string
  location?: string
  address?: string
  paket?: string
  store_name?: string
  created_at: string
  updated_at: string
}

type UserWithActionsType = User & {
  action?: string
}

type UserFormData = {
  name: string
  nama_lengkap?: string
  email: string
  no_hp?: string
  password?: string
  roles: string[]
  is_active: boolean
  alasan_gabung?: string
  info_dari?: string
  location?: string
  address?: string
  paket?: string
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

// Available roles
const AVAILABLE_ROLES = ['owner', 'admin', 'user', 'manager', 'staff']

// Column Definitions
const columnHelper = createColumnHelper<UserWithActionsType>()

const UserManagementTable = () => {
  // RBAC Context
  const { user, isLoading: rbacLoading } = useRBAC()

  // States
  const [users, setUsers] = useState<User[]>([])
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    nama_lengkap: '',
    email: '',
    no_hp: '',
    password: '',
    roles: ['user'],
    is_active: true,
    alasan_gabung: '',
    info_dari: '',
    location: '',
    address: '',
    paket: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const debouncedSearch = useDebounce(globalFilter, 300)

  // Fetch users from API
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh || users.length === 0) {
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

      const response = await fetch(`${apiUrl}/management/users?${queryParams.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        // Debug: Log raw data
//         console.log('Raw API Response:', result.data.data)

        // Sanitize user data to ensure roles is always an array of strings
        const sanitizedUsers = (result.data.data || []).map((user: any) => {
          // Handle roles that might be objects
          let roles: string[] = []

          if (Array.isArray(user.roles)) {
            roles = user.roles.map((role: any) => {
              // If role is an object with name property, extract the name
              if (typeof role === 'object' && role !== null && role.name) {
                return String(role.name)
              }
              // If role is already a string, use it
              if (typeof role === 'string') {
                return role
              }
              return ''
            }).filter((r: string) => r !== '')
          }

//           console.log('User:', user.name, 'Roles:', roles)

          return {
            ...user,
            roles
          }
        })

        setUsers(sanitizedUsers)
        setTotalRows(result.data.total || 0)
      } else {
        throw new Error(result.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, users.length])

  // Fetch users when dependencies change
  useEffect(() => {
    if (!rbacLoading) {
      fetchUsers()
    }
  }, [fetchUsers, rbacLoading])

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    fetchUsers(true)
  }, [fetchUsers])

  // Handle Excel export
  const handleExcelExport = () => {
    try {
      const exportData = users.map((user, index) => ({
        'No': index + 1,
        'Name': user.name,
        'Full Name': user.nama_lengkap || '-',
        'Email': user.email,
        'Phone': user.no_hp || '-',
        'Roles': Array.isArray(user.roles) ? user.roles.join(', ') : (user.roles || '-'),
        'Status': user.is_active ? 'Active' : 'Inactive',
        'Created': new Date(user.created_at).toLocaleDateString('id-ID'),
        'Updated': new Date(user.updated_at).toLocaleDateString('id-ID')
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 5 },  // No
        { wch: 20 }, // Name
        { wch: 25 }, // Full Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Roles
        { wch: 10 }, // Status
        { wch: 12 }, // Created
        { wch: 12 }  // Updated
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Users')

      const today = new Date().toISOString().split('T')[0]
      const filename = `Users_${today}.xlsx`

      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Error exporting to Excel:', err)
      setError('Failed to export data to Excel')
    }
  }

  // Handle add user
  const handleAddUser = () => {
    setUserToEdit(null)
    setFormData({
      name: '',
      nama_lengkap: '',
      email: '',
      no_hp: '',
      password: '',
      roles: ['user'],
      is_active: true,
      alasan_gabung: '',
      info_dari: '',
      location: '',
      address: '',
      paket: ''
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  // Handle edit user
  const handleEditUser = (user: User) => {
    setUserToEdit(user)
    setFormData({
      name: user.name,
      nama_lengkap: user.nama_lengkap || '',
      email: user.email,
      no_hp: user.no_hp || '',
      password: '',
      roles: Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : ['user']),
      is_active: user.is_active,
      alasan_gabung: user.alasan_gabung || '',
      info_dari: user.info_dari || '',
      location: user.location || '',
      address: user.address || '',
      paket: user.paket || ''
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  // Handle save user
  const handleSaveUser = async () => {
    // Validate form
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!userToEdit && !formData.password) {
      errors.password = 'Password is required for new users'
    }
    if (formData.roles.length === 0) {
      errors.roles = 'At least one role is required'
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

      // Prepare payload
      const payload: any = {
        name: formData.name,
        email: formData.email,
        roles: formData.roles,
        is_active: formData.is_active
      }

      if (formData.nama_lengkap) {
        payload.nama_lengkap = formData.nama_lengkap
      }

      if (formData.no_hp) {
        payload.no_hp = formData.no_hp
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (formData.alasan_gabung) {
        payload.alasan_gabung = formData.alasan_gabung
      }

      if (formData.info_dari) {
        payload.info_dari = formData.info_dari
      }

      if (formData.location) {
        payload.location = formData.location
      }

      if (formData.address) {
        payload.address = formData.address
      }

      if (formData.paket) {
        payload.paket = formData.paket
      }

      const url = userToEdit
        ? `${apiUrl}/management/users/${userToEdit.uuid}`
        : `${apiUrl}/management/users`

      const method = userToEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setDialogOpen(false)
        fetchUsers(true)
      } else {
        throw new Error(result.message || 'Failed to save user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
      console.error('Error saving user:', err)
    } finally {
      setSaving(false)
    }
  }

  // Handle delete user
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

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

      const response = await fetch(`${apiUrl}/management/users/${userToDelete.uuid}`, {
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
        setUserToDelete(null)
        fetchUsers(true)
      } else {
        throw new Error(result.message || 'Failed to delete user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      console.error('Error deleting user:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Handle toggle active status
  const handleToggleActive = async (user: User) => {
    try {
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

      const response = await fetch(`${apiUrl}/management/users/${user.uuid}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          is_active: !user.is_active,
          roles: Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : ['user'])
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        fetchUsers(true)
      } else {
        throw new Error(result.message || 'Failed to update user status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
      console.error('Error updating user status:', err)
    }
  }

  // Handle role toggle
  const handleRoleToggle = (role: string) => {
    setFormData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
      return { ...prev, roles }
    })
  }

  // Columns
  const columns = useMemo<ColumnDef<UserWithActionsType, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No',
      cell: ({ row }) => (
        <Typography color="text.primary">
          {pagination.pageIndex * pagination.pageSize + row.index + 1}
        </Typography>
      )
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Typography color="text.primary" className="font-medium">
            {row.original.name}
          </Typography>
          {row.original.store_name && row.original.store_name !== '-' ? (
            <Typography variant="caption" color="text.secondary">
              {row.original.store_name}
            </Typography>
          ): (
            <Typography variant="caption" color="text.secondary">
              -
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: ({ row }) => (
        <Typography>{row.original.email}</Typography>
      )
    }),
    columnHelper.accessor('no_hp', {
      header: 'Phone',
      cell: ({ row }) => (
        <Typography>{row.original.no_hp || '-'}</Typography>
      )
    }),
    columnHelper.display({
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        try {
          let roles: string[] = []

          if (Array.isArray(row.original.roles)) {
            roles = row.original.roles.filter(r => typeof r === 'string')
          } else if (typeof row.original.roles === 'string') {
            roles = [row.original.roles]
          }

          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((role, index) => (
                  <Chip
                    key={`role-${index}-${role}`}
                    label={String(role)}
                    size="small"
                    color="primary"
                    variant="tonal"
                  />
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">-</Typography>
              )}
            </div>
          )
        } catch (error) {
          console.error('Error rendering roles:', error, row.original.roles)
          return <Typography variant="caption" color="error">Error</Typography>
        }
      }
    }),
    columnHelper.accessor('is_active', {
      header: 'Status',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_active}
          onChange={() => handleToggleActive(row.original)}
          color="success"
        />
      )
    }),
    columnHelper.display({
      id: 'action',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center">
          <IconButton onClick={() => handleEditUser(row.original)} title="Edit User">
            <i className="tabler-edit text-textSecondary" />
          </IconButton>
          <IconButton onClick={() => handleDeleteClick(row.original)} title="Delete User">
            <i className="tabler-trash text-textSecondary" />
          </IconButton>
        </div>
      ),
      enableSorting: false
    })
  ], [])

  // Table setup
  const table = useReactTable({
    data: users,
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
          <Typography variant="h5">User Management</Typography>
          {loading && users.length > 0 && (
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
            disabled={users.length === 0 || loading}
            size="small"
            sx={{ minWidth: '90px' }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<i className='tabler-plus' />}
            onClick={handleAddUser}
            size="small"
            sx={{ minWidth: '100px' }}
          >
            Add User
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
            placeholder="Search User"
            className="w-[200px]"
          />
        </div>

        {/* Table */}
        {loading && users.length === 0 ? (
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
            {users.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    {loading ? 'Loading...' : 'No users found'}
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

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {userToEdit ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-4 pt-2">
            <CustomTextField
              fullWidth
              label="Name"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />

            <CustomTextField
              fullWidth
              label="Full Name / Nama Lengkap"
              value={formData.nama_lengkap}
              onChange={e => setFormData(prev => ({ ...prev, nama_lengkap: e.target.value }))}
            />

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

            <CustomTextField
              fullWidth
              label="Phone / No HP"
              value={formData.no_hp}
              onChange={e => setFormData(prev => ({ ...prev, no_hp: e.target.value }))}
            />

            <CustomTextField
              fullWidth
              label="Password"
              type="password"
              required={!userToEdit}
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              error={!!formErrors.password}
              helperText={formErrors.password || (userToEdit ? 'Leave blank to keep current password' : '')}
            />

            <CustomTextField
              fullWidth
              label="Alasan Gabung"
              multiline
              rows={2}
              value={formData.alasan_gabung}
              onChange={e => setFormData(prev => ({ ...prev, alasan_gabung: e.target.value }))}
            />

            <CustomTextField
              select
              fullWidth
              label="Info Dari"
              value={formData.info_dari}
              onChange={e => setFormData(prev => ({ ...prev, info_dari: e.target.value }))}
            >
              <MenuItem value="">Pilih Info Dari</MenuItem>
              <MenuItem value="sosial_media">Sosial Media</MenuItem>
              <MenuItem value="grup_komunitas">Grup Komunitas</MenuItem>
              <MenuItem value="iklan">Iklan</MenuItem>
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="teman_saudara">Teman/Saudara</MenuItem>
              <MenuItem value="umkdigital.id">umkdigital.id</MenuItem>
              <MenuItem value="lainnya">Lainnya</MenuItem>
            </CustomTextField>

            <CustomTextField
              fullWidth
              label="Location / Lokasi"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />

            <CustomTextField
              fullWidth
              label="Address / Alamat"
              multiline
              rows={2}
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />

            <CustomTextField
              fullWidth
              label="Paket"
              value={formData.paket}
              onChange={e => setFormData(prev => ({ ...prev, paket: e.target.value }))}
            />

            <div>
              <Typography variant="body2" className="mb-2">
                Roles {formErrors.roles && <span className="text-error">*</span>}
              </Typography>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ROLES.map(role => (
                  <FormControlLabel
                    key={role}
                    control={
                      <Checkbox
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                    }
                    label={role.charAt(0).toUpperCase() + role.slice(1)}
                  />
                ))}
              </div>
              {formErrors.roles && (
                <Typography variant="caption" color="error" className="mt-1">
                  {formErrors.roles}
                </Typography>
              )}
            </div>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
              }
              label="Active Status"
            />
          </div>
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
            onClick={handleSaveUser}
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
            Are you sure you want to delete user <strong>{userToDelete?.name}</strong>?
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

export default UserManagementTable
