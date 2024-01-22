import typeorm from 'typeorm'

const ProfileSchema = new typeorm.EntitySchema({
  name: 'Profile',
  tableName: 'profiles',
  columns: {
    id: {
      name: 'id',
      primary: true,
      type: 'int',
      generated: true
    },
    profileId: {
      name: 'profile_id',
      type: 'varchar',
      length: 255,
      nullable: true
    },
    screenName: {
      name: 'screen_name',
      type: 'varchar',
      length: 255,
      nullable: true
    },
    displayName: {
      name: 'display_name',
      type: 'text',
      nullable: true
    },
    cookie: {
      name: 'cookie',
      type: 'varchar',
      length: 100,
      nullable: true
    },
    proxy: {
      name: 'proxy',
      type: 'varchar',
      length: 125,
      nullable: true
    },
    note: {
      name: 'note',
      type: 'varchar',
      length: 255,
      nullable: true
    },
    chatOpenAIKey: {
      name: 'chat_open_ai_key',
      type: 'varchar',
      length: 255
    },
    chatOpenAIPrefix: {
      name: 'chat_open_ai_prefix',
      type: 'text'
    }
  }
})

module.exports = ProfileSchema
