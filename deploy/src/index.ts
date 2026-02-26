import { createWarpCMSApp } from '@warpcms/core'
import type { WarpCMSConfig } from '@warpcms/core'


const config: WarpCMSConfig = {
  collections: {
    autoSync: true
  }
}

export default createWarpCMSApp(config)
