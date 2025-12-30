// Next Imports
import type { Metadata } from 'next'

// Component Imports
import CoinAiDareU from '@views/apps/user/coin'

export const metadata: Metadata = {
  title: 'Coin AiDareU - Manage Your Coins',
  description: 'View and manage your AiDareU coin transactions, balance, and transaction history'
}

const CoinAiDareUPage = () => {
  return <CoinAiDareU />
}

export default CoinAiDareUPage
