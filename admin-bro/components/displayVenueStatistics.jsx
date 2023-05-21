import { env} from 'admin-bro'
import { Input, Box, Label, Button, TextArea, Badge } from '@admin-bro/design-system'
import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';

const displayVenueStatistics = props => {
  const [total, setTotal] = useState(0);
  const [monthly, setMonthly] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.get(env.API_URL + '/admin/venue-statistic/' + props.record.id)
        setTotal(resp.data.total)
        setMonthly(resp.data.monthly)
      } catch (e) {
        console.log('ERROR LOADING OTHER USER DATA: ', e)
      }
    })()
  }, [])

  return (
    <Box>
      <Label>Total: {total}</Label>
      <Label>Monthly: {monthly}</Label>
    </Box>
  );
};

export default displayVenueStatistics