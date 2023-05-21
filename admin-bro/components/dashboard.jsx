import React,{ useState, useEffect, useRef } from 'react';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'
import { useCurrentAdmin } from 'admin-bro'

const Dashboard = props => {
  const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()

  useEffect(() => {
    if (currentAdmin.role === 'EMPLOYEE') {
      window.location.href = env.BASE_URL + '/pages/EmployeeChat'
    }
  }, [])

  return (
     <Box style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
       <Label style={{ fontWeight: 'bold', fontSize: '25px' }}>Welcome to Halal Meet Admin Panel</Label>
     </Box>
  );
};

export default Dashboard