import typeorm from 'typeorm'

const AccountSchema = new typeorm.EntitySchema({
  name: 'Account',
  tableName: 'accounts',
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
      default: ''
    },
    screenName: {
      name: 'screen_name',
      type: 'varchar',
      length: 255,
      default: ''
    },
    phoneNumber: {
      name: 'phone_number',
      type: 'varchar',
      length: 255,
      default: ''
    },
    pass: {
      name: 'pass',
      type: 'varchar',
      length: 255,
      default: ''
    },
    displayName: {
      name: 'display_name',
      type: 'text',
      default: ''
    },
    cookie: {
      name: 'cookie',
      type: 'varchar',
      length: 100,
      default: ''
    },
    proxy: {
      name: 'proxy',
      type: 'varchar',
      length: 255,
      default: ''
    },
    note: {
      name: 'note',
      type: 'varchar',
      length: 255,
      default: ''
    },
    chatOpenAIKey: {
      name: 'chat_open_ai_key',
      type: 'varchar',
      length: 255,
      default: ''
    },
    browserProfileName: {
      name: 'browser_profile_name',
      type: 'text',
      default: ''
    },
    hideMyAccUsername: {
      name: 'hide_my_acc_username',
      type: 'text',
      nullable: true
    },
    // hideMyAccProfileDir: {
    //   name: "hide_my_acc_profile_dir",
    //   type: "text",
    //   default: "",
    // },
    hideMyAccProfileId: {
      name: 'hide_my_acc_profile_id',
      type: 'varchar',
      length: 255,
      nullable: true
    },
    deletedAt: {
      name: 'deleted_at',
      type: 'datetime',
      deleteDate: true
    }
  }
})

export default AccountSchema
