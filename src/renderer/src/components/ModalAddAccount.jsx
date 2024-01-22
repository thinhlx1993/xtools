/* eslint-disable react/prop-types */
import React from 'react'
import {
  Box,
  FormControl,
  Button,
  Modal,
  TextField,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material'
import { ipcMainConsumer } from '../helpers/api'
import { ACCOUNT_SETTING_DEFAULT, FEATURE_OPTION_DEFAULT } from '../helpers/constants'
import { boxModalCommon } from '../helpers/style-common'
import { textFieldCommonProps } from '../helpers/style-common'
import FormSetupFeaturesV2 from './FormSetupFeaturesV2'

const StepperAddAccount = ({ data, setData }) => {
  const onChangeValue = (event) =>
    setData((prevData) => ({
      ...prevData,
      account: {
        ...prevData.account,
        [event.target.name]: event.target.value
      }
    }))

  return (
    <Box>
      <FormControl fullWidth>
        <TextField
          name="cookie"
          multiline
          minRows={5}
          maxRows={5}
          label="Cookie"
          value={data.account.cookie}
          onChange={onChangeValue}
          {...textFieldCommonProps}
        />
        <TextField
          name="chatOpenAIKey"
          label="ChatGPTKey"
          value={data.account.chatOpenAIKey}
          onChange={onChangeValue}
          {...textFieldCommonProps}
        />
        <TextField
          name="proxy"
          label="Proxy (Ví dụ: ip:port:username:password)"
          value={data.account.proxy}
          onChange={onChangeValue}
          {...textFieldCommonProps}
        />
        {/* <TextField
          name="browserProfileName"
          label="Tên profile"
          helperText="Chỉ áp dụng với HideMyAcc"
          value={data.account.browserProfileName}
          onChange={onChangeValue}
          {...textFieldCommonProps}
        /> */}
        {/* <TextField
          name="hideMyAccProfileDir"
          label="Profile trình duyệt"
          helperText="Chỉ áp dụng với HideMyAcc"
          value={data.account.hideMyAccProfileDir}
          onChange={onChangeValue}
          {...textFieldCommonProps}
        /> */}
        <TextField
          name="note"
          label="Ghi chú"
          value={data.account.note}
          onChange={onChangeValue}
          {...textFieldCommonProps}
        />
      </FormControl>
    </Box>
  )
}

const StepperSettingFeature = ({ data, setData }) => (
  // <FormSetupFeatures
  <FormSetupFeaturesV2
    values={data.features}
    onChange={({ type, value }) => {
      setData((prevData) => ({
        ...prevData,
        features: {
          ...prevData.features,
          [type]: {
            ...prevData.features[type],
            ...value
          }
        }
      }))
    }}
  />
)

const STEPS = [
  {
    label: 'Nhập tài khoản',
    component: StepperAddAccount
  },
  {
    label: 'Cấu hình chức năng',
    component: StepperSettingFeature
  }
]
const stepsLength = STEPS.length

const StepperBody = ({ onCancel, onSave, accountSelected }) => {
  const [activeStep, setActiveStep] = React.useState(0)
  const [isEnableNextBtn, setEnableNextBtn] = React.useState(true)
  const [data, setData] = React.useState({
    account: ACCOUNT_SETTING_DEFAULT,
    features: FEATURE_OPTION_DEFAULT
  })

  React.useEffect(() => {
    if (accountSelected) {
      setData({
        id: accountSelected?.id,
        account: {
          ...ACCOUNT_SETTING_DEFAULT,
          ...(accountSelected?.account || {})
        },
        features: {
          reUpPost: {
            ...FEATURE_OPTION_DEFAULT.reUpPost,
            ...(accountSelected?.features?.reUpPost || {})
          },
          interactAds: {
            ...FEATURE_OPTION_DEFAULT.interactAds,
            ...(accountSelected?.features?.interactAds || {})
          },
          followProfiles: {
            ...FEATURE_OPTION_DEFAULT.followProfiles,
            ...(accountSelected?.features?.followProfiles || {})
          },
          fairInteract: {
            ...FEATURE_OPTION_DEFAULT.fairInteract,
            ...(accountSelected?.features?.fairInteract || {})
          },
          newsFeed: {
            ...FEATURE_OPTION_DEFAULT.newsFeed,
            ...(accountSelected?.features?.newsFeed || {})
          },
          buffViews: {
            ...FEATURE_OPTION_DEFAULT.buffViews,
            ...(accountSelected?.features?.buffViews || {})
          },
          interactSpecialization: {
            ...FEATURE_OPTION_DEFAULT.interactSpecialization,
            ...(accountSelected?.features?.interactSpecialization || {})
          }
        }
      })
    }
  }, [accountSelected])

  React.useEffect(() => {
    if (activeStep === stepsLength) {
      onSave(data)
    }
  }, [activeStep])

  React.useEffect(() => {
    switch (activeStep) {
      case 0:
        // setEnableNextBtn(!!data.account.cookie);
        return
      case 1:
        return
      default:
        setEnableNextBtn(true)
    }
  }, [activeStep, data])

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {STEPS.map(({ label }) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === stepsLength ? (
        <React.Fragment>
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Box sx={{ display: 'flex' }}>
              <CircularProgress />
            </Box>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Box sx={{ pt: 3 }}>{STEPS[activeStep].component({ data, setData })}</Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              size="small"
              color="inherit"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prevActiveStep) => prevActiveStep - 1)}
              sx={{ mr: 1 }}
            >
              Quay lại
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button size="small" color="inherit" onClick={onCancel} sx={{ mr: 1 }}>
              Huỷ bỏ
            </Button>
            <Button
              size="small"
              disabled={!isEnableNextBtn}
              onClick={() =>
                setActiveStep((prevActiveStep) => prevActiveStep + (isEnableNextBtn ? 1 : 0))
              }
            >
              {activeStep === stepsLength - 1 ? 'Hoàn tất' : 'Tiếp'}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  )
}

const ModalAddAccount = ({ accountId, open, onClose, onSave }) => {
  const [accountSelected, setAccountSelected] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setIsLoading(true)
    if (!accountId || !open) {
      setIsLoading(false)
      setAccountSelected(null)
      return
    }
    ipcMainConsumer.emit('getDetailedAccount', accountId)
    ipcMainConsumer.on('replyGetDetailedAccount', (event, data) => {
      const account = data.account
      delete account.id
      const features = data.features.reduce((result, feat) => {
        delete feat.accountId
        const options = Object.keys(feat).reduce((optResult, key) => {
          const value = feat[key]
          if (![null, undefined, ''].includes(value)) {
            optResult[key] = value
          }
          return optResult
        }, {})
        result[feat.type] = options
        return result
      }, {})
      setAccountSelected({
        id: accountId,
        account,
        features
      })
      setTimeout(() => setIsLoading(false), 500)
    })
  }, [accountId, open])

  return (
    <Modal
      open={open}
      // onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={{ ...boxModalCommon, width: 600 }} noValidate>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Box sx={{ display: 'flex' }}>
              <CircularProgress />
            </Box>
          </Box>
        ) : (
          <StepperBody accountSelected={accountSelected} onCancel={onClose} onSave={onSave} />
        )}
      </Box>
    </Modal>
  )
}

export default ModalAddAccount
