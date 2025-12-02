// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

// Third Party Imports
import type { useReactTable } from '@tanstack/react-table'

const TablePaginationComponent = ({ table }: { table: ReturnType<typeof useReactTable> }) => {
  // For server-side pagination, use getRowCount() which returns the total from pageCount
  const totalRows = table.getRowCount()
  const currentRows = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>
        {`Showing ${
          totalRows === 0
            ? 0
            : pageIndex * pageSize + 1
        }
        to ${Math.min(
          (pageIndex + 1) * pageSize,
          totalRows
        )} of ${totalRows} entries`}
      </Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={table.getPageCount()}
        page={pageIndex + 1}
        onChange={(_, page) => {
          table.setPageIndex(page - 1)
        }}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default TablePaginationComponent
