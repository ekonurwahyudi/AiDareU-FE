'use client'

// React Imports
import { useState } from 'react'

// Component Imports
import ProductDigitalHeader from './ProductDigitalHeader'
import ProductDigitalCard from './ProductDigitalCard'

// Type Imports
import type { ProductDigital } from './ProductDigitalCard'

type Props = {
  productData?: ProductDigital[]
}

const ProductDigitalList = ({ productData }: Props) => {
  // States
  const [searchValue, setSearchValue] = useState('')

  return (
    <ProductDigitalCard
      productData={productData}
      searchValue={searchValue}
      searchComponent={<ProductDigitalHeader searchValue={searchValue} setSearchValue={setSearchValue} />}
    />
  )
}

export default ProductDigitalList
