import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const InterestIcons = props => {
  console.log(props)

  const openLink = (num) => {
    window.location.href =  'https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free'
  }

  return (
    <Box style={{ padding: "30px", display: 'flex' }} className={'wrapper'}>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(20)
      }}>Open Interest Website</Button>
    </Box>
  );
};

export default InterestIcons;
