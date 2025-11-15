'use client'

// MUI Imports
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

type Props = {
  searchValue: string
  setSearchValue: (val: string) => void
}

const ProductDigitalHeader = (props: Props) => {
  // Props
  const { searchValue, setSearchValue } = props

  return (
    <TextField
      placeholder='Search products...'
      size='small'
      value={searchValue}
      onChange={e => setSearchValue(e.target.value)}
      className='is-full sm:is-[250px]'
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <i className='tabler-search' />
          </InputAdornment>
        )
      }}
    />
  )
}

export default ProductDigitalHeader
