import typeorm from 'typeorm'

const FeatureSchema = new typeorm.EntitySchema({
  name: 'Feature',
  tableName: 'features',
  columns: {
    id: {
      name: 'id',
      primary: true,
      type: 'int',
      generated: true
    },
    accountId: {
      name: 'account_id',
      type: 'int'
    },
    type: {
      name: 'type',
      type: 'varchar',
      length: 50
    },
    enable: {
      name: 'enable',
      type: 'boolean',
      default: false
    },
    profiles: {
      name: 'profiles',
      type: 'text',
      default: ''
    },
    mixRandomProfiles: {
      name: 'mix_random_profiles',
      type: 'boolean',
      default: false
    },
    intervalTimeCheckNewPost: {
      // Units: minutes
      name: 'interval_time_check_new_post',
      type: 'int',
      nullable: true
    },
    timesReUp: {
      name: 'times_re_up',
      type: 'text',
      default: ''
    },
    reUpWithImage: {
      name: 're_up_with_image',
      type: 'boolean',
      nullable: true
    },
    reUpWithVideo: {
      name: 're_up_with_video',
      type: 'boolean',
      nullable: true
    },
    randomTotalPostsReUp: {
      name: 'random_total_posts_re_up',
      type: 'text',
      default: ''
    },
    randomDelayTimesReUp: {
      name: 'random_delay_times_re_up',
      type: 'text',
      default: ''
    },
    randomTotalPostsForInteractAds: {
      name: 'random_total_posts_for_interact_ads',
      type: 'text',
      default: ''
    },
    chatOpenAIPrefix: {
      name: 'chat_open_ai_prefix',
      type: 'text',
      default: ''
    },
    randomTotalFollowProfiles: {
      name: 'random_total_follow_profiles',
      type: 'text',
      default: ''
    },
    entryDetailUrls: {
      name: 'entry_urls',
      type: 'text',
      nullable: true
    },
    mixRandomEntryDetailUrls: {
      name: 'mix_random_entry_detail_urls',
      type: 'boolean',
      nullable: true
    },
    totalViews: {
      name: 'total_views',
      type: 'int',
      nullable: true
    },
    totalPosts: {
      name: 'total_posts',
      type: 'int',
      nullable: true
    },
    fairInteractOptions: {
      name: 'fair_interact_option',
      type: 'varchar',
      length: 50,
      nullable: true
    },
    randomDelayTimeProfiles: {
      // units: seconds
      name: 'random_delay_time_profiles',
      type: 'text',
      nullable: true
    },
    randomDelayTimeActions: {
      // units: seconds
      name: 'random_delay_time_actions',
      type: 'text',
      nullable: true
    },
    allowLikeAction: {
      name: 'allow_like_action',
      type: 'varchar',
      transformer: {
        to: (value) => (value ? JSON.stringify(value) : value),
        from: (value) => (value ? JSON.parse(value) : value)
      },
      length: 20,
      nullable: true
    },
    allowCommentAction: {
      name: 'allow_comment_action',
      type: 'varchar',
      transformer: {
        to: (value) => (value ? JSON.stringify(value) : value),
        from: (value) => (value ? JSON.parse(value) : value)
      },
      length: 20,
      nullable: true
    },
    stopAction: {
      // value: timeout,randomTotalPosts
      name: 'stop_action',
      type: 'varchar',
      length: 20,
      nullable: true
    },
    stopActionTimeout: {
      // unit: minutes
      name: 'stop_action_timeout',
      type: 'int',
      nullable: true
    },
    stopActionRandomTotalPosts: {
      name: 'stop_action_random_total_posts',
      type: 'int',
      nullable: true
    },
    replayAction: {
      // value: off,timeout
      name: 'replay_action',
      type: 'varchar',
      length: 20,
      nullable: true
    },
    replayActionTimeout: {
      // unit: minutes
      name: 'replay_action_timeout',
      type: 'int',
      nullable: true
    }
    // metaData: {
    //   name: "meta_data",
    //   type: "text",
    // },
  }
})

export default FeatureSchema
