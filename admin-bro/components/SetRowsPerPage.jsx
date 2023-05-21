import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const SetRowsPerPage = props => {
  console.log(props)

  const openLink = (num) => {
    window.location.href =  env.BASE_URL + "/resources/" + props.resource.id.replace(' ', '').replace(' ', '').replace(' ', '') + "?perPage=" + num
  }

  return (
    <Box style={{ padding: "30px", display: 'flex' }} className={'wrapper'}>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(20)
      }}>20</Button>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(30)
      }}>30</Button>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(50)
      }}>50</Button>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(80)
      }}>80</Button>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(100)
      }}>100</Button>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(200)
      }}>200</Button>
      <Button style={{ padding: "10px", margin: 10, width: "100%", cursor: "pointer" }} variant={'success'}  onClick={() => {
        openLink(500)
      }}>500</Button>
    </Box>
  );
};

export default SetRowsPerPage;
