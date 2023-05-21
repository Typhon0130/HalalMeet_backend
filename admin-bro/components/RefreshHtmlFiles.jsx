import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const RefreshHtmlFiles = () => {
  const submit = async () => {
      try {
        await axios.get(env.API_URL + '/admin/refresh-html-files');
        alert('Finished refreshing html files. Redirecting...');
        window.location.href =  env.BASE_URL + "/resources/Events";      } catch(e) {
        console.log(e);
      }
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>
      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="maxprice">This operation will reload all the html files for all the events.</Label>
        <a style={{ marginBottom: 50 }} href={'https://s3.console.aws.amazon.com/s3/buckets/halalmeet?region=eu-north-1&prefix=emailTemplates/'}>Open Email Templates Folder</a>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Button style={{ padding: "10px", width: "100%", cursor: "pointer" }} variant={'success'}  onClick={submit}>Refresh</Button>
      </Box>
    </Box>
  );
};

export default RefreshHtmlFiles;
