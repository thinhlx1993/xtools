import { DataSource } from 'typeorm'
import utils from '../utils'
import logger from '../logger'
import Account from './entities/account'
import Feature from './entities/feature'
import Post from './entities/post'

const _dataSourceOptions = {
  type: 'sqlite',
  database: utils.getAppPath('database.sqlite'),
  synchronize: true,
  logging: true,
  entities: [Account, Feature, Post]
}
const AppDataSource = new DataSource(_dataSourceOptions)

const initConnection = async () => {
  if (AppDataSource.isInitialized) {
    // logger.info("USE_EXISTED_DATA_SOURCE");
    return AppDataSource
  }
  logger.info('INIT_DATA_SOURCE')
  return AppDataSource.initialize()
    .then((dataSource) => {
      logger.info('INIT_DATA_SOURCE_SUCCESS')
      return dataSource
    })
    .catch((error) => {
      logger.error('INIT_DATA_SOURCE_ERROR', error)
      throw new Error('initDBSourceError')
    })
}

const getRepo = async (entity) => {
  const dataSource = await initConnection()
  return dataSource.getRepository(entity)
}

export default {
  initConnection,
  getRepo
}
