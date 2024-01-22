import { In, IsNull, Not } from 'typeorm'
import dataSource from '.'
import Account from './entities/account'
import Feature from './entities/feature'
import Post from './entities/post'

/**
 * @param {number} id Account's id
 * @returns {Promise<import("../scripts/define-type").Account | null>} Account
 */
const findOneAccount = async (id) => {
  const repo = await dataSource.getRepo(Account)
  return await repo.findOne({ where: { id } })
}

const findAccountByProfileId = async (profileId) => {
  const repo = await dataSource.getRepo(Account)
  return await repo.findOne({ where: { profileId } })
}

const findManyAccount = async () => {
  const repo = await dataSource.getRepo(Account)
  return await repo.find()
}

const saveAccount = async (entity) => {
  const repo = await dataSource.getRepo(Account)
  const profileId = entity.profileId
  const existAccount = await repo.findOne({ where: { profileId } })
  if (!existAccount) {
    return await repo.save(entity)
  }
}

const updateAccount = async (condition, entity) => {
  const repo = await dataSource.getRepo(Account)
  return await repo.update(condition, entity)
}

/**
 *
 * @param {number[]} ids
 * @returns
 */
const getAccounts = async (ids) => {
  const repo = await dataSource.getRepo(Account)
  return await repo.find({
    where: { id: In(ids) },
    select: ['id', 'hideMyAccUsername', 'hideMyAccProfileId']
  })
}

/**
 * @param {number[]} ids AccountIds
 */
const deleteAccounts = async (ids) => {
  const repo = await dataSource.getRepo(Account)
  return await repo.softDelete(ids)
}

/**
 * @param {object[]} entities
 */
const saveFeatures = async (entities) => {
  const repo = await dataSource.getRepo(Feature)
  return await repo.save(entities)
}

/**
 * @param {number[]} accountIds
 */
const deleteFeatures = async (accountIds) => {
  const repo = await dataSource.getRepo(Feature)
  return await repo.delete({ accountId: In(accountIds) })
}

/**
 * @param {number} accountId
 * @return {object[]}
 */
const findFeaturesOptions = async (accountId) => {
  const repo = await dataSource.getRepo(Feature)
  return await repo.find({ where: { accountId } })
}

/**
 * @param {number[]} accountIds
 * @return {Promise<object[]>}
 */
const findFeaturesOptionsByAccountIds = async (accountIds) => {
  const repo = await dataSource.getRepo(Feature)
  return await repo
    .createQueryBuilder('feature')
    .where('feature.accountId IN (:...accountIds)', { accountIds })
    .getMany()
}

const findAndUpdateFeatureOptions = async (condition, entity) => {
  const repo = await dataSource.getRepo(Feature)
  return await repo.update(condition, entity)
}

/**
 *
 * @param {object | object[]} posts
 */
const savePosts = async (posts) => {
  const repo = await dataSource.getRepo(Post)
  return await repo.save(posts)
}

/**
 *
 * @param {number} accountId
 * @param {number} profileId
 * @return {Promise<null | {twPostId: number}>}
 */
const getLastPostSaved = async (accountId, profileId) => {
  const repo = await dataSource.getRepo(Post)
  return await repo.findOne({
    where: { crawlBy: accountId, profileId },
    order: { entryCreatedAt: 'desc' },
    select: ['twPostId']
  })
}

/**
 *
 * @param {number} accountId
 * @param {number} total
 * @return {Promise<{id: number; profileId: string; entry: object}[]>}
 */
const getPostsReUp = async (accountId, total) => {
  const repo = await dataSource.getRepo(Post)
  return await repo.find({
    where: { crawlBy: accountId, entry: Not(IsNull()) },
    order: { entryCreatedAt: 'desc' },
    take: total,
    select: ['id', 'profileId', 'entry']
  })
}

/**
 * @param {number} id
 */
const softDeletePostsReUp = async (id) => {
  const repo = await dataSource.getRepo(Post)
  return await repo.update(id, { entry: null })
}

export default {
  findOneAccount,
  findAccountByProfileId,
  findManyAccount,
  saveAccount,
  updateAccount,
  getAccounts,
  deleteAccounts,
  saveFeatures,
  deleteFeatures,
  findFeaturesOptions,
  findFeaturesOptionsByAccountIds,
  findAndUpdateFeatureOptions,
  savePosts,
  getLastPostSaved,
  getPostsReUp,
  softDeletePostsReUp
}
