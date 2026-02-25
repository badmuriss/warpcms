import { createWarpCMSApp, registerCollections } from '@warpcms/core'
import type { WarpCMSConfig } from '@warpcms/core'

registerCollections([
  // Add your collections here
])

const config: WarpCMSConfig = {
  collections: {
    autoSync: true
  }
}

export default createWarpCMSApp(config)
