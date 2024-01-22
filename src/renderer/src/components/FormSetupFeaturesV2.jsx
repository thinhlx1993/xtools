/* eslint-disable react/prop-types */
import React from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  TextField,
  Switch,
  Checkbox,
  MenuItem,
  InputLabel,
  Select,
  Typography,
  Tab,
  Tabs
} from '@mui/material'
import {
  FAIR_INTERACT_OPTION,
  FAIR_INTERACT_OPTIONS,
  FEATURE_TYPE,
  STOP_ACTION_OPTION
} from '../helpers/constants'
import { textFieldCommonProps } from '../helpers/style-common'
import InputFromToNumber from './InputFromToNumber'
import InputSelectStopAction from './InputSelectStopAction'
import InputSelectReplayAction from './InputSelectReplayAction'
import InputSelectAllowAction from './InputSelectAllowAction'

const FormSetupFeatureReUpPost = ({ value, onChange, onCheck, onSetValue }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    <Box>
      {value.enable ? (
        <Box sx={{ pb: 2 }}>
          <FormControl fullWidth size="small">
            <TextField
              name="profiles"
              {...textFieldCommonProps}
              multiline
              minRows={3}
              maxRows={5}
              label="Danh sách profiles"
              value={value.profiles}
              onChange={onChange}
            />
            <FormControlLabel
              label="Xáo trộn danh sách profiles"
              sx={{ mt: -1.5, pb: 1.5 }}
              control={
                <Checkbox
                  name="mixRandomProfiles"
                  checked={value.mixRandomProfiles}
                  onChange={onCheck}
                />
              }
            />
            <TextField
              name="chatOpenAIPrefix"
              multiline
              minRows={5}
              maxRows={5}
              label="Nội dung ChatGPT prefix (chỉnh sửa nội dung bài reup)"
              value={value.chatOpenAIPrefix}
              onChange={onChange}
              {...textFieldCommonProps}
            />
            <FormControlLabel
              label="Đăng lại kèm ảnh"
              sx={{ mt: -1.5, pb: 1.5 }}
              control={
                <Checkbox name="reUpWithImage" checked={value.reUpWithImage} onChange={onCheck} />
              }
            />
            <FormControlLabel
              label="Đăng lại kèm video"
              sx={{ mt: -1.5, pb: 1.5 }}
              control={
                <Checkbox name="reUpWithVideo" checked={value.reUpWithVideo} onChange={onCheck} />
              }
            />
            <InputFromToNumber
              label="Random số bài đăng (mỗi lần đăng)"
              values={value.randomTotalPostsReUp}
              onChange={onSetValue.bind(this, 'randomTotalPostsReUp')}
            />
            <TextField
              name="timesReUp"
              {...textFieldCommonProps}
              label="Những giờ đăng (Ví dụ: 00:12, 2:15, 16:30)"
              value={value.timesReUp}
              onChange={onChange}
            />
          </FormControl>
        </Box>
      ) : (
        <Box></Box>
      )}
    </Box>
  </Box>
)

const FormSetupFeatureInteractProfileAds = ({ value, onChange, onCheck, onSetValue }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    <Box>
      {value.enable ? (
        <Box sx={{ pb: 2 }}>
          <FormControl fullWidth size="small">
            <TextField
              name="profiles"
              {...textFieldCommonProps}
              multiline
              minRows={3}
              maxRows={5}
              label="Danh sách profiles"
              value={value.profiles}
              onChange={onChange}
            />
            <FormControlLabel
              label="Xáo trộn danh sách profiles"
              sx={{ mt: -1.5, pb: 1.5 }}
              control={
                <Checkbox
                  name="mixRandomProfiles"
                  checked={value.mixRandomProfiles}
                  onChange={onCheck}
                />
              }
            />
            {/* <InputSelectReplayAction
              formControlProps={{
                fullWidth: true,
                size: "small",
                sx: { pb: 1.5 },
              }}
              name="replayAction"
              label="Chạy lại sau khi kết thúc"
              value={value.replayAction}
              onChange={onSetValue}
            /> */}
            {/* {value.replayAction === "timeout" && ( */}
            <TextField
              name="replayActionTimeout"
              {...textFieldCommonProps}
              type="number"
              inputProps={{
                min: 1
              }}
              value={value.replayActionTimeout}
              label="Chạy lại tương tác quảng cáo sau (phút)"
              onChange={onChange}
            />
            {/* )} */}
            {/* <InputSelectAllowAction
              formControlProps={{
                fullWidth: true,
                size: "small",
                sx: { pb: 1.5 },
              }}
              name="allowLikeAction"
              label="Like bài viết"
              value={value.allowLikeAction}
              onChange={onSetValue}
            />
            <InputSelectAllowAction
              formControlProps={{
                fullWidth: true,
                size: "small",
                sx: { pb: 1.5 },
              }}
              name="allowCommentAction"
              label="Comment bài viết"
              value={value.allowCommentAction}
              onChange={onSetValue}
            />
            {value.allowCommentAction.includes(true) && (
              <TextField
                name="chatOpenAIPrefix"
                multiline
                minRows={5}
                maxRows={5}
                label="Nội dung ChatGPT prefix (tạo nội dung bình luận) (bỏ qua bài đăng là ads)"
                value={value.chatOpenAIPrefix}
                onChange={onChange}
                {...textFieldCommonProps}
              />
            )} */}
            <InputFromToNumber
              label="Random số bài tìm kiếm (mỗi profile)"
              values={value.randomTotalPostsForInteractAds}
              onChange={onSetValue.bind(this, 'randomTotalPostsForInteractAds')}
            />
            <InputFromToNumber
              label="Random thời gian delay chuyển profile (Đơn vị: giây)"
              values={value.randomDelayTimeProfiles}
              onChange={onSetValue.bind(this, 'randomDelayTimeProfiles')}
            />
            <InputFromToNumber
              label="Random thời gian delay giữa các hành động (Đơn vị: giây)"
              values={value.randomDelayTimeActions}
              onChange={onSetValue.bind(this, 'randomDelayTimeActions')}
            />
          </FormControl>
        </Box>
      ) : (
        <Box></Box>
      )}
    </Box>
  </Box>
)

const FormSetupFeatureFollowProfiles = ({ value, onChange, onCheck, onSetValue }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    {value.enable ? (
      <Box sx={{ pb: 2 }}>
        <FormControl fullWidth size="small">
          <TextField
            name="profiles"
            {...textFieldCommonProps}
            multiline
            minRows={3}
            maxRows={5}
            label="Danh sách profiles"
            value={value.profiles}
            onChange={onChange}
          />
          <FormControlLabel
            label="Xáo trộn danh sách profiles"
            sx={{ mt: -1.5, pb: 1.5 }}
            control={
              <Checkbox
                name="mixRandomProfiles"
                checked={value.mixRandomProfiles}
                onChange={onCheck}
              />
            }
          />
          <InputFromToNumber
            label="Random số follow"
            values={value.randomTotalFollowProfiles}
            onChange={onSetValue.bind(this, 'randomTotalFollowProfiles')}
          />
        </FormControl>
      </Box>
    ) : (
      <Box></Box>
    )}
  </Box>
)

const FormSetupFeatureBuffViews = ({ value, onChange, onCheck }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    {value.enable ? (
      <Box sx={{ pb: 2 }}>
        <FormControl fullWidth size="small">
          <TextField
            name="entryDetailUrls"
            {...textFieldCommonProps}
            multiline
            minRows={3}
            maxRows={5}
            label="Danh sách bài viết (đường dẫn chi tiết)"
            helperText="Ví dụ: https://twitter.com/username/status/123456789 | /username/status/123456789"
            value={value.entryDetailUrls}
            onChange={onChange}
          />
          <FormControlLabel
            label="Xáo trộn danh sách bài viết"
            sx={{ mt: -1.5, pb: 1.5 }}
            control={
              <Checkbox
                name="mixRandomEntryDetailUrls"
                checked={value.mixRandomEntryDetailUrls}
                onChange={onCheck}
              />
            }
          />

          <TextField
            name="totalViews"
            {...textFieldCommonProps}
            type="number"
            inputProps={{
              min: 0
            }}
            value={value.totalViews}
            label="Số view mỗi profile"
            onChange={onChange}
          />
        </FormControl>
      </Box>
    ) : (
      <Box></Box>
    )}
  </Box>
)

const FormSetupFeatureFairInteract = ({ value, onChange, onCheck }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    {value.enable ? (
      <Box sx={{ pb: 2 }}>
        <FormControl fullWidth size="small">
          <FormControl fullWidth size="small" sx={{ pb: 1.5 }}>
            <InputLabel id="fairInteractOptions-label">Lựa chọn</InputLabel>
            <Select
              labelId="fairInteractOptions-label"
              label="Lựa chọn"
              value={value.fairInteractOptions || ''}
              name="fairInteractOptions"
              onChange={onChange}
            >
              {FAIR_INTERACT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="totalPosts"
            {...textFieldCommonProps}
            type="number"
            inputProps={{
              min: 0
            }}
            value={value.totalPosts}
            disabled={value.fairInteractOptions !== FAIR_INTERACT_OPTION.totalPost}
            label="Tương tác trong số bài đăng"
            onChange={onChange}
          />
          <TextField
            name="entryDetailUrls"
            {...textFieldCommonProps}
            multiline
            minRows={3}
            maxRows={5}
            label="Danh sách bài viết (đường dẫn chi tiết)"
            helperText="Ví dụ: https://twitter.com/username/status/123456789 | /username/status/123456789"
            value={value.entryDetailUrls}
            disabled={value.fairInteractOptions !== FAIR_INTERACT_OPTION.entryUrl}
            onChange={onChange}
          />
          <FormControlLabel
            label="Xáo trộn danh sách bài viết"
            sx={{ mt: -1.5, pb: 1.5 }}
            control={
              <Checkbox
                name="mixRandomEntryDetailUrls"
                checked={value.mixRandomEntryDetailUrls}
                disabled={value.fairInteractOptions !== FAIR_INTERACT_OPTION.entryUrl}
                onChange={onCheck}
              />
            }
          />
          <TextField
            name="chatOpenAIPrefix"
            multiline
            minRows={5}
            maxRows={5}
            label="Nội dung ChatGPT prefix (tạo nội dung trả lời và bình luận)"
            value={value.chatOpenAIPrefix}
            onChange={onChange}
            {...textFieldCommonProps}
          />
        </FormControl>
      </Box>
    ) : (
      <Box></Box>
    )}
  </Box>
)

const FormSetupFeatureDefault = () => (
  <Box sx={{ textAlign: 'center', p: 5 }}>
    <Typography gutterBottom display="block">
      Vui lòng chọn tính năng
    </Typography>
  </Box>
)

const FormSetupFeatureNewsFeed = ({ value, onChange, onCheck, onSetValue }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    {value.enable ? (
      <Box sx={{ pb: 2 }}>
        <FormControl fullWidth size="small">
          <InputSelectReplayAction
            formControlProps={{
              fullWidth: true,
              size: 'small',
              sx: { pb: 1.5 }
            }}
            name="replayAction"
            label="Chạy lại sau khi kết thúc"
            value={value.replayAction}
            onChange={onSetValue}
          />
          {value.replayAction === 'timeout' && (
            <TextField
              name="replayActionTimeout"
              {...textFieldCommonProps}
              type="number"
              inputProps={{
                min: 1
              }}
              value={value.replayActionTimeout}
              label="Chạy lại lướt newsfeed sau (phút)"
              onChange={onChange}
            />
          )}
          <InputSelectStopAction
            formControlProps={{
              fullWidth: true,
              size: 'small',
              sx: { pb: 1.5 }
            }}
            name="stopAction"
            label="Dừng sau khi lướt"
            value={value.stopAction}
            onChange={onSetValue}
          />
          {value.stopAction === STOP_ACTION_OPTION.timeout && (
            <TextField
              name="stopActionTimeout"
              {...textFieldCommonProps}
              type="number"
              inputProps={{
                min: 1
              }}
              value={value.stopActionTimeout}
              label="Dừng sau khi lướt trong thời gian (phút)"
              onChange={onChange}
            />
          )}
          {value.stopAction === STOP_ACTION_OPTION.randomTotalPosts && (
            <InputFromToNumber
              label="Dừng sau khi lướt ngẫu nhiên số bài"
              values={value.stopActionRandomTotalPosts}
              onChange={onSetValue.bind(this, 'stopActionRandomTotalPosts')}
            />
          )}
          <InputSelectAllowAction
            formControlProps={{
              fullWidth: true,
              size: 'small',
              sx: { pb: 1.5 }
            }}
            name="allowLikeAction"
            label="Like bài viết"
            value={value.allowLikeAction}
            onChange={onSetValue}
          />
          <InputSelectAllowAction
            formControlProps={{
              fullWidth: true,
              size: 'small',
              sx: { pb: 1.5 }
            }}
            name="allowCommentAction"
            label="Comment bài viết"
            value={value.allowCommentAction}
            onChange={onSetValue}
          />
          {value.allowCommentAction.includes(true) && (
            <TextField
              name="chatOpenAIPrefix"
              multiline
              minRows={5}
              maxRows={5}
              label="Nội dung ChatGPT prefix (tạo nội dung bình luận)"
              value={value.chatOpenAIPrefix}
              onChange={onChange}
              {...textFieldCommonProps}
            />
          )}
          <InputFromToNumber
            label="Random thời gian delay giữa các hành động (Đơn vị: giây)"
            values={value.randomDelayTimeActions}
            onChange={onSetValue.bind(this, 'randomDelayTimeActions')}
          />
        </FormControl>
      </Box>
    ) : (
      <Box></Box>
    )}
  </Box>
)

const FormSetupFeatureInteractSpecialization = ({ value, onChange, onCheck, onSetValue }) => (
  <Box>
    <FormControlLabel
      label="Bật tính năng"
      sx={{ pb: 2 }}
      control={<Switch name="enable" checked={value.enable} onChange={onCheck} />}
    />
    {value.enable ? (
      <Box sx={{ pb: 2 }}>
        <FormControl fullWidth size="small">
          <TextField
            name="entryDetailUrls"
            {...textFieldCommonProps}
            multiline
            minRows={3}
            maxRows={5}
            label="Danh sách bài viết (đường dẫn chi tiết)"
            helperText="Ví dụ: https://twitter.com/username/status/123456789 | /username/status/123456789"
            value={value.entryDetailUrls}
            onChange={onChange}
          />
          <FormControlLabel
            label="Xáo trộn danh sách bài viết"
            sx={{ mt: -1.5, pb: 1.5 }}
            control={
              <Checkbox
                name="mixRandomEntryDetailUrls"
                checked={value.mixRandomEntryDetailUrls}
                onChange={onCheck}
              />
            }
          />
          <InputSelectAllowAction
            formControlProps={{
              fullWidth: true,
              size: 'small',
              sx: { pb: 1.5 }
            }}
            name="allowLikeAction"
            label="Like bài viết"
            value={value.allowLikeAction}
            onChange={onSetValue}
          />
          <InputSelectAllowAction
            formControlProps={{
              fullWidth: true,
              size: 'small',
              sx: { pb: 1.5 }
            }}
            name="allowCommentAction"
            label="Comment bài viết"
            value={value.allowCommentAction}
            onChange={onSetValue}
          />
          {value.allowCommentAction.includes(true) && (
            <TextField
              name="chatOpenAIPrefix"
              multiline
              minRows={5}
              maxRows={5}
              label="Nội dung ChatGPT prefix (tạo nội dung bình luận)"
              value={value.chatOpenAIPrefix}
              onChange={onChange}
              {...textFieldCommonProps}
            />
          )}
          <InputFromToNumber
            label="Random thời gian delay giữa các hành động (Đơn vị: giây)"
            values={value.randomDelayTimeActions}
            onChange={onSetValue.bind(this, 'randomDelayTimeActions')}
          />
        </FormControl>
      </Box>
    ) : (
      <Box></Box>
    )}
  </Box>
)

const FEATURES = [
  {
    key: false,
    hidden: true
  },
  {
    key: FEATURE_TYPE.reUpPost,
    label: 'Đăng lại bài'
  },
  {
    key: FEATURE_TYPE.interactAds,
    label: 'Tương tác quảng cáo'
  },
  {
    key: FEATURE_TYPE.followProfiles,
    label: 'Theo dõi tích xanh'
  },
  {
    key: FEATURE_TYPE.fairInteract,
    label: 'Tương tác công bằng'
  },
  {
    key: FEATURE_TYPE.interactSpecialization,
    label: 'Tương tác chỉ định'
  },
  {
    key: FEATURE_TYPE.newsFeed,
    label: 'Lướt news feed'
  },
  {
    key: FEATURE_TYPE.buffViews,
    label: 'Buff view'
  }
]

const FormSetupFeaturesV2 = ({ values, onChange }) => {
  const [selected, setTabSelected] = React.useState(false)

  const handleCheckValue = (featType, event) => {
    onChange({
      type: featType,
      value: {
        [event.target.name]: event.target.checked
      }
    })
  }

  const handleChangeValue = (featType, event) =>
    onChange({
      type: featType,
      value: {
        [event.target.name]: [
          'profiles',
          'entryDetailUrls',
          'allowLikeAction',
          'allowCommentAction'
        ].includes(event.target.name)
          ? event.target.value
          : event.target.value.trim()
      }
    })

  const handleSetValue = (featType, key, value) =>
    onChange({
      type: featType,
      value: { [key]: value }
    })

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selected}
          onChange={(event, newValue) => setTabSelected(newValue)}
          aria-label="features-tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {FEATURES.map(
            (feature) =>
              !feature.hidden && (
                <Tab
                  {...feature}
                  value={feature.key}
                  key={feature.key}
                  id={`feature-tab-${feature.key}`}
                  aria-controls={`feature-tabpanel-${feature.key}`}
                />
              )
          )}
        </Tabs>
      </Box>
      {FEATURES.map((feature) => {
        const featureKey = feature.key
        const componentProps = {
          value: values[featureKey],
          onCheck: handleCheckValue.bind(this, featureKey),
          onChange: handleChangeValue.bind(this, featureKey),
          onSetValue: handleSetValue.bind(this, featureKey)
        }
        return (
          <Box
            key={featureKey}
            sx={{ height: 320, overflowY: 'auto' }}
            role="tabpanel"
            hidden={selected !== featureKey}
            id={`feature-tabpanel-${featureKey}`}
            aria-labelledby={`feature-tab-${featureKey}`}
          >
            {(() => {
              if (selected !== featureKey) {
                return <Box></Box>
              }
              switch (feature.key) {
                case FEATURE_TYPE.reUpPost:
                  return <FormSetupFeatureReUpPost {...componentProps} />
                case FEATURE_TYPE.interactAds:
                  return <FormSetupFeatureInteractProfileAds {...componentProps} />
                case FEATURE_TYPE.followProfiles:
                  return <FormSetupFeatureFollowProfiles {...componentProps} />
                case FEATURE_TYPE.fairInteract:
                  return <FormSetupFeatureFairInteract {...componentProps} />
                case FEATURE_TYPE.buffViews:
                  return <FormSetupFeatureBuffViews {...componentProps} />
                case FEATURE_TYPE.newsFeed:
                  return <FormSetupFeatureNewsFeed {...componentProps} />
                case FEATURE_TYPE.interactSpecialization:
                  return <FormSetupFeatureInteractSpecialization {...componentProps} />
                default:
                  return <FormSetupFeatureDefault {...componentProps} />
              }
            })()}
          </Box>
        )
      })}
    </Box>
  )
}
export default FormSetupFeaturesV2
