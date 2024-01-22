import { Grid, Container } from '@mui/material'
import AppTrafficBySite from '../helpers/app-traffic-by-site'

const AdminComponent = () => {
  return (
    <Container>
      <Grid item xs={12} md={6} lg={4} style={{ marginTop: '20px' }}>
        <AppTrafficBySite
          title="Teams statistic"
          list={[
            {
              name: 'Teams',
              value: 4
            },
            {
              name: 'Groups',
              value: 3
            },
            {
              name: 'Profiles',
              value: 1000
            },
            {
              name: 'Users',
              value: 500
            }
          ]}
        />
      </Grid>
    </Container>
  )
}

export default AdminComponent
