import React,{ useState, useEffect } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Box, Label, Button, Input } from '@admin-bro/design-system'

const ManageFakeUserMatches = () => {
  const [fakeUserMatches, setFakeUserMatches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedServiceArea, setSelectedServiceArea] = useState('ca');
  const [limit, setLimit] = useState(10);
  const [skip, setSkip] = useState(0);
  const [searchText, setSearchText] = useState(null);

  const handleServiceAreaChange = (e) => {
    console.log('handleServiceAreaChange ', e.target.value)
    setSelectedServiceArea(e.target.value);
  }

  useEffect(() => {
    (async () => {
      try {
        loadFakeUserMatches()
      } catch (e) {
        console.log('ERROR LOADING SERVICE AREAS: ', e)
      }
    })()
  }, [skip, limit, searchText, selectedServiceArea])

  useEffect(() => {
    (async () => {
      await loadFakeUserMatches()
      try {
        const resp = await axios.get(env.API_URL + '/user/me/change-location/service-areas')
        setServiceAreas(resp.data)
        setSelectedServiceArea(resp.data[0].iso)
      } catch (e) {
        console.log('ERROR LOADING SERVICE AREAS: ', e)
      }
      try {
        const resp = await axios.get(env.API_URL + '/admin/serve-employees')
        setEmployees(resp.data)
      } catch (e) {
        console.log('ERROR LOADING FAKE USER MATCHES: ', e)
      }
    })()
  }, [])

  const loadFakeUserMatches = async () => {
    try {
      const resp = await axios.get(env.API_URL + '/admin/serve-fake-user-matches', { params: { skip, limit, searchText, serviceArea: selectedServiceArea }})
      setFakeUserMatches(resp.data)
      console.log(resp)
    } catch (e) {
      console.log('ERROR LOADING FAKE USER MATCHES: ', e)
    }
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>
      <Box style={{ padding: "30px", display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button size="icon" style={{ padding: "10px", width: "100px", cursor: "pointer" }} variant={'success'}
                  onClick={async () => { setSkip(skip - limit) }}>Prev Page</Button>
          <Button size="icon" style={{ padding: "10px", width: "100px", cursor: "pointer" }} variant={'success'}
                  onClick={async () => { setSkip(skip + limit) }}>Next Page</Button>
        </div>
        <div style={{ display: 'flex' }}>
          <select style={{width: "300px", padding: "10px", background: 'transparent' }} name="rankby" value={selectedServiceArea} onChange={handleServiceAreaChange}>
            { serviceAreas && serviceAreas.map(e => {
              return <option key={e.iso} style={{ padding: "5px" }} value={e.iso}>{ e.iso }</option>
            })}
          </select>
          <Input style={{width: "300px", padding: "10px"}} placeholder={'Search here.. (firstName, lastName)'} value={searchText} onChange={(e) => setSearchText(e.target.value)}/>
        </div>
      </Box>
      <div style={{ display:'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{textAlign: 'center', verticalAlign: 'middle', flex: '0 33%'}}>
          <Label style={{ fontWeight: 'bold', fontSize: 20 }}>Real Users</Label>
        </div>
        <div style={{textAlign: 'center', verticalAlign: 'middle', flex: '0 33%'}}>
          <Label style={{ fontWeight: 'bold', fontSize: 20 }}>Fake Users</Label>
        </div>
        <div style={{textAlign: 'center', verticalAlign: 'middle', flex: '0 33%'}}>
          <Label style={{ fontWeight: 'bold', fontSize: 20 }}>Assign to Employee</Label>
        </div>
      </div>
      <div style={{ borderBottom: '2px solid black', marginTop: 5, marginBottom: 20}}></div>
      { fakeUserMatches && fakeUserMatches.map((fakeUserMatch, fakeUserMatchIndex) => {
        return (
          <div key={fakeUserMatch.userId}>
            <div style={{ display:'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{textAlign: 'center', verticalAlign: 'middle', flex: '0 33%'}}>
                <Label style={{ fontSize: 16 }}>{fakeUserMatch.name}</Label>
              </div>
              <div style={{ flex: '0 66%' }}>
                {fakeUserMatch.fakeSwipes.map((fakeSwipe, fakeSwipeIndex) => {
                  return (
                    <div key={fakeSwipe.matchId} style={{ display:'flex', justifyContent: 'space-between', flexWrap: 'wrap', margin: 10 }}>
                      <div style={{ flex: '0 50%'}}>
                        <div style={{ display:'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <div style={{ flex: '0 50%', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Label style={{ marginTop: 7 }}>{fakeSwipe.name}</Label>
                          </div>
                          <div style={{ flex: '0 50%'}}>
                            <div style={{ textAlign: 'center', verticalAlign: 'middle', paddingRight: 10 }}>
                              { fakeSwipe.matched === true ? (
                                <Button size="icon" rounded={true} style={{ padding: "10px", width: "100%", cursor: "pointer" }} variant={'success'} onClick={async () => {
                                  await axios.get(env.API_URL + '/admin/decline-fake-match/' + fakeSwipe.matchId)
                                  let qwe = JSON.parse(JSON.stringify(fakeUserMatches))
                                  qwe[fakeUserMatchIndex].fakeSwipes[fakeSwipeIndex].matched = false
                                  setFakeUserMatches(qwe)
                                }}>Matched</Button>
                              ) : <Button size="icon" rounded={true} style={{ padding: "10px", width: "100%", cursor: "pointer" }} variant={'danger'} onClick={async () => {
                                await axios.get(env.API_URL + '/admin/accept-fake-match/' + fakeSwipe.matchId)
                                let qwe = JSON.parse(JSON.stringify(fakeUserMatches))
                                qwe[fakeUserMatchIndex].fakeSwipes[fakeSwipeIndex].matched = true
                                setFakeUserMatches(qwe)
                              }}>Not matched</Button>}
                            </div>
                          </div>
                          </div>
                        </div>
                      <div style={{ flex: '0 50%'}}>
                        <select style={{width: "100%", padding: "5px"}} name="rankby" value={fakeSwipe.employeeId} onChange={async (e) => {
                          try {
                            console.log('VALUE: ', e.target.value)
                            console.log('MATCHID: ', fakeSwipe.matchId)
                            await axios.post(env.API_URL + '/admin/assign-to-employee', { employeeId: e.target.value, matchId: fakeSwipe.matchId })
                            let qwe = JSON.parse(JSON.stringify(fakeUserMatches))
                            qwe[fakeUserMatchIndex].fakeSwipes[fakeSwipeIndex].employeeId = e.target.value
                            setFakeUserMatches(qwe)
                          } catch (e) {
                            console.log('ERROR ASSIGNIN TO EMPLOYEE: ', e)
                          }
                        }}>
                          <option value={'Please select an employee'}>Please select an employee</option>
                          { employees && employees.map(e => {
                            return <option key={e.id} style={{ padding: "5px" }} value={e.id}>{ e.firstName + ' ' + e.lastName }</option>
                          })}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ borderBottom: '2px solid black', marginTop: 5, marginBottom: 20}}></div>
          </div>
        )
      })}
    </Box>
  );
};

export default ManageFakeUserMatches;
