// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import { CartProvider } from '@/contexts/CartContext'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Metadata is handled by child layouts (subdomain and product pages)
// Removed static metadata to allow child layouts to properly set OG tags

const StoreLayout = async ({ children }: ChildrenType) => {
  // Vars
  const systemMode = await getSystemMode()

  return (
    <Providers direction='ltr'>
      <BlankLayout systemMode={systemMode}>
        <CartProvider>
          {children}
        </CartProvider>
      </BlankLayout>
    </Providers>
  )
}

export default StoreLayout