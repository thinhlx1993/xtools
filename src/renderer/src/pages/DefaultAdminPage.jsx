import { useState, useEffect } from 'react'
import {
  Grid,
  Container,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material'
import Box from '@mui/material/Box'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import Paper from '@mui/material/Paper'
import AppTrafficBySite from '../helpers/app-traffic-by-site'
import { getRequest } from '../helpers/backend'
const AdminComponent = () => {
  const [data, setData] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const response = await getRequest('/dashboard/')
    setData(response.data)
  }

  return (
    <Container>
      <Grid item xs={12} md={6} lg={4} style={{ marginTop: '20px' }}>
        <AppTrafficBySite
          title="Teams statistic"
          list={[
            {
              name: 'Users',
              value: `${data.user_count}`
            },
            {
              name: 'Total Profiles',
              value: `${data.profiles_count}`
            },
            {
              name: 'Clone',
              value: `${data.unverified_profiles_count}`
            },
            {
              name: 'Profiles Click',
              value: `${data.verified_profiles_count}`
            },
            {
              name: 'Momentizable',
              value: `${data.monetizable_profiles_count}`
            },
            {
              name: 'Cumulative Earning',
              value: `${data.total_earnings}`
            }
          ]}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4} style={{ marginTop: '20px' }}>
        <Card>
          <CardHeader title="Details by User" />
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Profiles</TableCell>
                <TableCell>Clone</TableCell>
                <TableCell>Profiles Click</TableCell>
                <TableCell>Momentizable</TableCell>
                <TableCell>Earning</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.summaries?.map((event) => (
                <TableRow key={event.username}>
                  <TableCell>{event.username}</TableCell>
                  <TableCell>{event.profiles_count}</TableCell>
                  <TableCell>{event.unverified_profiles_count}</TableCell>
                  <TableCell>{event.verified_profiles_count}</TableCell>
                  <TableCell>{event.monetizable_profiles_count}</TableCell>
                  <TableCell>{event.total_earnings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Grid>
    </Container>
  )
}

export default AdminComponent
