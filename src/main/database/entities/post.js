import typeorm from 'typeorm'

const PostSchema = new typeorm.EntitySchema({
  name: 'Post',
  tableName: 'posts',
  columns: {
    id: {
      name: 'id',
      primary: true,
      type: 'int',
      generated: true
    },
    crawlBy: {
      name: 'crawl_by',
      type: 'int'
    },
    profileId: {
      name: 'profile_id',
      type: 'varchar',
      length: 255
    },
    twPostId: {
      name: 'tw_post_id',
      type: 'varchar',
      length: 255
    },
    entry: {
      name: 'entry',
      type: 'text',
      transformer: {
        to: (value) => (value ? JSON.stringify(value) : value),
        from: (value) => (value ? JSON.parse(value) : value)
      },
      nullable: true
    },
    entryCreatedAt: {
      name: 'entry_created_at',
      type: 'datetime'
    }
  }
})

export default PostSchema
