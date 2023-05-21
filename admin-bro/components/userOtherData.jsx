import { env } from 'admin-bro'
import { Input, Box, Label, Button, TextArea, Badge } from '@admin-bro/design-system'
import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';

const userOtherData = props => {
  console.log(props)
  const [userData, setUserData] = useState(null);
  const [userReports, setUserReports] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.get(env.API_URL + '/user/' + props.record.id + '/public-profile')
        console.log('RESP: ', resp)
        setUserData(resp.data)
      } catch (e) {
        console.log('ERROR LOADING OTHER USER DATA: ', e)
      }
      try {
        const resp2 = await axios.get(env.API_URL + '/user/' + props.record.id + '/user-reports')
        console.log('RESP2: ', resp2)
        setUserReports(resp2.data)
      } catch (e) {
        console.log('ERROR LOADING USER REPORTS: ', e)
      }
    })()
  }, [])

  console.log(props)
  return (
    <Box>
      <Box style={{  border: '1px solid grey', marginTop: 10, marginBottom: 10, padding: 15, borderRadius: 10, boxShadow: '3px 3px grey'}}>
        <Label style={{ fontSize: 14 }}>Reports</Label>
        { userReports && userReports.map(e => {
          return (
            <Box style={{ display: 'flex', flexDirection: 'row', marginTop: 5, marginBottom: 5, padding: 5, borderRadius: 5, boxShadow: '2px 2px grey'}}>
              <Button size="icon" style={{ padding: 5, margin: 5, height: 20, fontSize: 12}} variant={'info'} onClick={() => { window.location.href =  env.BASE_URL + `/resources/Users/records/${e.user1Id}/show`; }}>{ e.u1firstname + ' ' + e.u1lastname}</Button>
              <Label style={{ textAlign: 'center', marginTop: 8, fontWeight: 'bold', fontSize: 13 }}>reported</Label>
              <Button size="icon" style={{ padding: 5, margin: 5, height: 20, fontSize: 12}} variant={'info'} onClick={() => { window.location.href =  env.BASE_URL + `/resources/Users/records/${e.user2Id}/show`; }}>{ e.u2firstname + ' ' + e.u2lastname}</Button>
              <Label style={{ textAlign: 'center', marginTop: 8, marginLeft: 3, fontWeight: 'bold', fontSize: 13 }}>at {e.createdAt}</Label>
              <Label style={{ textAlign: 'center', marginTop: 8, marginLeft: 3, fontSize: 13 }}>With the following message:</Label>
              <Label style={{ textAlign: 'center', marginTop: 8, marginLeft: 3, fontWeight: 'bold', fontSize: 13 }}>{ e.reason }</Label>
            </Box>
          )
        })}
      </Box>
      <Box style={{ border: '1px solid grey', marginTop: 10, marginBottom: 10, padding: 15, borderRadius: 10, boxShadow: '3px 3px grey'}}>
        <Label style={{ fontSize: 14 }}>Badges</Label>
        <Box style={{ marginBottom: 15}}>
          {userData && userData.UserBadges?.map(e => {
            return (<span key={e}>{e}, </span>)
          })}
        </Box>
      </Box>

      <Box style={{ border: '1px solid grey', marginTop: 10, marginBottom: 10, padding: 15, borderRadius: 10, boxShadow: '3px 3px grey'}}>
        <Label style={{ fontSize: 14 }}>Languages</Label>
        <Box style={{ marginBottom: 15}}>
          {userData && userData.UserLanguages?.map(e => {
            return (<span key={e}>{e}, </span>)
          })}
        </Box>
      </Box>

      <Box style={{ border: '1px solid grey', marginTop: 10, marginBottom: 10, padding: 15, borderRadius: 10, boxShadow: '3px 3px grey'}}>
        <Label style={{ fontSize: 14 }}>Countries</Label>
        <Box style={{ marginBottom: 15}}>
          {userData && userData.UserCountries?.map(e => {
            return (<span key={e.id}>{e.name}, </span>)
          })}
        </Box>
      </Box>

      <Box style={{ border: '1px solid grey', marginTop: 10, marginBottom: 10, padding: 15, borderRadius: 10, boxShadow: '3px 3px grey'}}>
        <Label style={{ fontSize: 14 }}>Interests</Label>
        <Box style={{ marginBottom: 15}}>
          {userData && userData.UserInterests?.map(e => {
            return (<span key={e.id}>{e.i18nName}, </span>)
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default userOtherData