import { useState, useEffect } from 'react'
import {
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  TablePagination,
  Grid,
  Tooltip,
  IconButton,
  Box
} from '@mui/material'
import CachedIcon from '@mui/icons-material/Cached'
import { useSnackbar } from '../context/SnackbarContext'
import { getRequest } from '../helpers/backend'

const EventPage = () => {
  const { openSnackbar } = useSnackbar()
  const [events, setEvents] = useState([])
  const [resultCount, setResultCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(25) // Rows per page

  useEffect(() => {
    fetchEvents()
  }, [page, rowsPerPage, searchQuery])

  const fetchEvents = async () => {
    const response = await getRequest(
      `/events/?page=${page}&per_page=${rowsPerPage}&search=${searchQuery}`
    )
    setResultCount(response.data.result_count)
    setEvents(response.data.data)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value)
    setPage(1) // Reset to the first page when changing rows per page
  }

  return (
    <Grid item xs={12} md={6} lg={4} style={{ padding: '20px' }}>
      <Grid container alignItems="center" style={{ marginTop: '20px' }}>
        {/* Event Logs Title */}
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            Events Logs
          </Typography>
        </Grid>

        {/* Refresh Button */}
        <Grid item>
          <Tooltip title="Refresh" onClick={fetchEvents}>
            <IconButton>
              <CachedIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Search Field */}
        <Grid item>
          <TextField
            label="Search by action, notes"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid>
      </Grid>

      <Box sx={{ width: '100%' }}>
        <Paper
          sx={{ width: '100%', mb: 2 }}
          style={{ padding: '20px', marginBottom: '20px', marginTop: '20px' }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>User Receiver</TableCell>
                <TableCell>User Giver</TableCell>
                <TableCell>Day Issue</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCell>{event.event_type}</TableCell>
                  <TableCell>{event.receiver.username}</TableCell>
                  <TableCell>{event.giver.username}</TableCell>
                  <TableCell>{event.created_at}</TableCell>
                  <TableCell
                    style={{
                      maxWidth: '150px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <Tooltip title={event.issue}>
                      <span>{event.issue}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={resultCount} // Total number of items
            page={page - 1} // Current page (0-based index)
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
          {/* Add, Edit, and Delete Dialogs */}
        </Paper>
      </Box>
    </Grid>
  )
}

export default EventPage
