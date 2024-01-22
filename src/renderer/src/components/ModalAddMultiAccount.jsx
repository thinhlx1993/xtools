/* eslint-disable react/prop-types */
import React from 'react'
import {
  Alert,
  Button,
  TextField,
  Stepper,
  Box,
  Tooltip,
  IconButton,
  CircularProgress,
  Step,
  StepLabel,
  FormControl,
  Modal
} from '@mui/material'
import { ListAlt as IconListAlt } from '@mui/icons-material'
import { FEATURE_OPTION_DEFAULT, MAXIMUM_ADD_MULTI_ACC } from '../helpers/constants'
import { boxModalCommon, textFieldCommonProps } from '../helpers/style-common'
import { ipcMainConsumer } from '../helpers/api'
import FormSetupFeaturesV2 from './FormSetupFeaturesV2'

const ModalAddMultiAccountModalBodyStepperSettingFeature = ({ data, setData }) => (
  // <FormSetupFeatures
  <FormSetupFeaturesV2
    values={data.feature}
    onChange={({ type, value }) => {
      setData((prevData) => ({
        ...prevData,
        feature: {
          ...prevData.feature,
          [type]: {
            ...prevData.feature[type],
            ...value
          }
        }
      }))
    }}
  />
)

const ADD_MULTI_ACCOUNT_STEPS = [
  {
    label: 'Nhập danh sách tài khoản',
    alert: `\nMỗi cooke 1 dòng.\nTối đa add thêm được ${MAXIMUM_ADD_MULTI_ACC} tài khoản.`,
    textFieldLabel: 'Danh sách cookie',
    dataKey: 'accountList'
  },
  {
    label: 'Nhập danh sách ChatGPTKey',
    alert: 'Mỗi key 1 dòng',
    textFieldLabel: 'Danh sách ChatGPTKey',
    dataKey: 'chatGPTKeyList'
  },
  {
    label: 'Nhập danh sách proxy',
    alert: 'Mỗi proxy 1 dòng',
    textFieldLabel: 'Danh sách proxy',
    dataKey: 'proxyList'
  },
  // {
  //   label: "Nhập danh sách dường dẫn Profile trình duyệt",
  //   alert:
  //     "\nMỗi dường dẫn 1 dòng.\nSố lượng dường dẫn bằng só lượng tài khoản.\nChỉ áp dụng với HideMyAcc.",
  //   textFieldLabel: "Danh sách dường dẫn Profile trình duyệt",
  //   dataKey: "hideMyAccProfileDirList",
  // },
  {
    label: 'Cấu hình chức năng',
    alert: 'Cấu hình áp dụng cho toàn bộ tài khoản đang thêm',
    component: ModalAddMultiAccountModalBodyStepperSettingFeature
  }
]
const ADD_MULTI_ACCOUNT_STEPS_LENGTH = ADD_MULTI_ACCOUNT_STEPS.length

const ModalAddMultiAccountModalBody = ({ loading, onCancel, onSave }) => {
  const [activeStep, setActiveStep] = React.useState(0)
  const [isEnableNextBtn, setEnableNextBtn] = React.useState(true)
  const [data, setData] = React.useState({
    accountList: '',
    chatGPTKeyList: '',
    proxyList: '',
    // hideMyAccProfileDirList: '',
    feature: FEATURE_OPTION_DEFAULT
  })

  React.useEffect(() => {
    if (activeStep === ADD_MULTI_ACCOUNT_STEPS_LENGTH) {
      onSave(data)
    }
  }, [activeStep])

  React.useEffect(() => {
    switch (activeStep) {
      // case 3:
      //   setEnableNextBtn(
      //     data.hideMyAccProfileDirList.split("\n").length ===
      //       data.accountList.split("\n").length
      //   );
      //   return;
      case 0:
        // setEnableNextBtn(!!data.accountList);
        return
      // case 1:
      //   return;
      default:
        setEnableNextBtn(true)
    }
  }, [activeStep, data])

  const component = React.useMemo(() => {
    const step = ADD_MULTI_ACCOUNT_STEPS[activeStep]
    if (!step) {
      return <></>
    }
    if (step.component) {
      return step.component({ data, setData })
    }
    return (
      <TextField
        name={step.dataKey}
        multiline
        minRows={5}
        maxRows={5}
        label={step.textFieldLabel}
        value={data[step.dataKey]}
        onChange={(event) => {
          const value = event.target.value
          if (value.split('\n').length > MAXIMUM_ADD_MULTI_ACC) return
          setData((prevData) => ({
            ...prevData,
            [step.dataKey]: value
          }))
        }}
        {...textFieldCommonProps}
      />
    )
  }, [activeStep, data])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
        <Box sx={{ display: 'flex' }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }
  return (
    <Box sx={{ width: '100%' }}>
      {ADD_MULTI_ACCOUNT_STEPS[activeStep]?.alert && (
        <Box sx={{ pb: 1 }}>
          <Alert severity="warning" sx={{ whiteSpace: 'pre-line' }}>
            Lưu ý: {ADD_MULTI_ACCOUNT_STEPS[activeStep].alert}
          </Alert>
        </Box>
      )}
      <Stepper activeStep={activeStep}>
        {ADD_MULTI_ACCOUNT_STEPS.map(({ label }) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === ADD_MULTI_ACCOUNT_STEPS_LENGTH ? (
        <React.Fragment>
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Box sx={{ display: 'flex' }}>
              <CircularProgress />
            </Box>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Box sx={{ pt: 2 }}>
            <Box>
              <FormControl fullWidth size="small">
                {component}
              </FormControl>
            </Box>
          </Box>
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
              {activeStep === ADD_MULTI_ACCOUNT_STEPS_LENGTH - 1 ? 'Hoàn tất' : 'Tiếp'}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  )
}

const ModalAddMultiAccount = ({ title }) => {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    ipcMainConsumer.on('replyAddAccounts', () => {
      setOpen(false)
      setLoading(false)
    })
  }, [])

  const handleSave = (data) => {
    setLoading(true)
    const chatGPTKeyList = data.chatGPTKeyList
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
    const chatGPTKeyListLength = chatGPTKeyList.length
    const proxyList = data.proxyList
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
    const proxyListLength = proxyList.length
    const accounts = data.accountList
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
      .reduce((result, cookie, index) => {
        const account = {
          cookie,
          chatOpenAIKey: chatGPTKeyList[index % chatGPTKeyListLength],
          proxy: proxyList[index % proxyListLength]
        }
        result.push(account)
        return result
      }, [])
    ipcMainConsumer.emit('addAccounts', { accounts, feature: data.feature })
  }

  return (
    <>
      <Tooltip title={title}>
        <IconButton onClick={() => setOpen(true)}>
          <IconListAlt />
        </IconButton>
      </Tooltip>
      <Modal open={open}>
        <Box sx={{ ...boxModalCommon, width: 700 }} noValidate>
          <ModalAddMultiAccountModalBody
            loading={loading}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
          />
        </Box>
      </Modal>
    </>
  )
}

export default ModalAddMultiAccount
