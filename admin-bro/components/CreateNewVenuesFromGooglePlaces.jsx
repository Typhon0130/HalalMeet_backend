import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const CreateNewVenuesFromGooglePlaces = () => {
  const submit = async () => {
      try {
        await axios.get(env.API_URL + '/admin/google-places-to-venues');
        alert('Finished transforming Google Places to Venues. Redirecting...');
        window.location.href =  env.BASE_URL + "/resources/Venues";
      } catch(e) {
        console.log(e);
      }
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>
      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="maxprice">This operation will transform all the Google Places in the table to Venues, please delete the not needed ones before continuing.</Label>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Button style={{ padding: "10px", width: "100%", cursor: "pointer" }} variant={'success'}  onClick={submit}>Create New Venues</Button>
      </Box>
    </Box>
  );
};

export default CreateNewVenuesFromGooglePlaces;
