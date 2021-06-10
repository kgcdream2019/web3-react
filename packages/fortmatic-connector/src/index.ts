import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import invariant from 'tiny-invariant'

const chainIdToNetwork: { [network: number]: string } = {
  1: 'mainnet',
  3: 'ropsten',
  4: 'rinkeby',
  42: 'kovan',
  56: 'bscmainnet',
  97: 'bsctestnet',
  
}

interface FortmaticConnectorArguments {
  apiKey: string
  chainId: number
}

export class FortmaticConnector extends AbstractConnector {
  private readonly apiKey: string
  private readonly chainId: number

  public fortmatic: any

  constructor({ apiKey, chainId }: FortmaticConnectorArguments) {
    invariant(Object.keys(chainIdToNetwork).includes(chainId.toString()), `Unsupported chainId ${chainId}`)
    super({ supportedChainIds: [chainId] })

    this.apiKey = apiKey
    this.chainId = chainId
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.fortmatic) {
      const Fortmatic = await import('fortmatic').then(m => m?.default ?? m)
      const BSCOptions = {
        /* Smart Chain mainnet RPC URL */
        rpcUrl: this.chainId === 56 ? 'https://bsc-dataseed.binance.org/' :  'https://data-seed-prebsc-1-s1.binance.org:8545/', 
        chainId: 56 // Smart Chain mainnet chain id
      }
      this.fortmatic = new Fortmatic(
        this.apiKey,
        (this.chainId === 1 || this.chainId === 4) ? undefined : ((this.chainId === 56 || this.chainId === 97) ? BSCOptions : chainIdToNetwork[this.chainId])
      )
    }

    const account = await this.fortmatic
      .getProvider()
      .enable()
      .then((accounts: string[]): string => accounts[0])

    return { provider: this.fortmatic.getProvider(), chainId: this.chainId, account }
  }

  public async getProvider(): Promise<any> {
    return this.fortmatic.getProvider()
  }

  public async getChainId(): Promise<number | string> {
    return this.chainId
  }

  public async getAccount(): Promise<null | string> {
    return this.fortmatic
      .getProvider()
      .send('eth_accounts')
      .then((accounts: string[]): string => accounts[0])
  }

  public deactivate() {}

  public async close() {
    await this.fortmatic.user.logout()
    this.emitDeactivate()
  }
}
