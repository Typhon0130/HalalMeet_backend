import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button, TextArea } from '@admin-bro/design-system'
import { useCurrentAdmin } from 'admin-bro'
import moment from 'moment'

let socket

const EmployeeChat = props => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()
  const [employees, setEmployees] = useState([]);
  const [activeEmployeeId, setActiveEmployeeId] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [employeeMatches, setEmployeeMatches] = useState([]);
  const [messageToSend, setMessageToSend] = useState('');
  const [activeTab, setActiveTab] = useState('CHAT');
  const [messages, setMessages] = useState([]);
  const [publicProf, setPublicProf] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const [employeeToken, setEmployeeToken] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [conversationId, setConversationId] = useState();

  const something=(event)=> {
    if (event.keyCode === 13) {
      sendMessage()
    }
  }

  const getPubProf = async (userId) => {
    try {
      console.log(userId)
      const res = await axios.get(`${env.API_URL}/user/${userId}/public-profile`, { headers: {"Authorization" : employeeToken } });
      setPublicProf(res.data);
      console.log('LOADED PUBLIC PROFILE FOR: ', res.data.firstName + ' ' + res.data.lastName + '  with ID: ' + res.data.id + ' MATCHSTATUS: ' + res.data.matchStatus)
    } catch (e) {
      console.log(e)
    }
  }

  const sendMessage = async () => {
    try {
      console.log('SENDING MESSAGE: ' + messageToSend)
      console.log('ACTIVE CHAT:', activeChat)
      socket.emit('send-message', {text: messageToSend, receiverId: activeChat.user1id, senderId: activeChat.user2id, isDirectMessage: false });
      setMessageToSend('');
    } catch (e) {
      console.log('ERROR SENDING MESSAGE: ', e)
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js";
    document.body.appendChild(script);

    setTimeout(async () => {
      if (currentAdmin.role === 'ADMIN') {
        setScriptLoaded(true);
      } else {
        await logIntoEmployee(currentAdmin.id)
      }
    }, 1000);

    return () => {
      document.body.removeChild(script);
      socket.emit('disconnect-me', { userId: currentAdmin.id ,employeeMatches: employeeMatches})
      socket.emit('im-offline', employeeId)
    }
  }, []);

  const openProfile = async (userId) => {
    await getPubProf(userId)
    console.log('OPENING PROFIEL FOR: ' + userId)
    setActiveTab('PROFILE')
  }

  const logIntoEmployee = async (employeeId) => {
    try {
      const resp = await axios.get(env.API_URL + '/admin/generate-token-for-employee/' + employeeId)
      console.log('LOGGING INTO EMPLYOEE AND socket: ', socket)
      if (socket && activeEmployeeId) {
        console.log('LEAVING CONVERSATION: ' + conversationId)
        await socket.emit('disconnect-me', { userId: activeEmployeeId, employeeMatches})
        console.log('DISCONNECTED SOCKET')
      }
      socket = io(env.SOCKET_URL, {  // DEV
        transports: ['websocket'],
        jsonp: false,
        query: { token: resp.data.token }
      });
      console.log(socket)
      setEmployeeToken(resp.data.token)
      setEmployeeId(employeeId)
      socket.on('employee-matches', (matches) => {
        console.log('RECEIVED EMPLOYEE MATCHES LENGTH: ', matches)
        setEmployeeMatches(matches)
      })
      socket.on('notification', async (res) => {
        console.log("RECEIVED_NOTIFICATION", res);
        const { data, messageType, type, duration } = res
        let config = { message: null, type: null, duration: null }
        try {
          switch (messageType) {
            case 'NEW_MESSAGE': {
              await findEmployeeMatches();
              config = { message: data.senderInfo.firstName + ' sent you a new message', type: type, duration: duration };
              break;
            }
          }
          if (config.message) {
            setLastNotification(config);
            setTimeout(() => {
              setLastNotification(null)
            }, 1000)
          };
        } catch (e) {
          console.log('ERROR IN RECEIVER NOTIFICATION: ', e)
        }
      });
      setActiveEmployeeId(employeeId)
      await findEmployeeMatches()
      setScriptLoaded(true);
      console.log('MATCHES SOCKETS SETUP')
    } catch (e) {
      console.log('ERROR SETTING UP POSSIBLE-MATCHES, ERROR: ', e)
    }
  }

  useEffect(() => {
    (async () => {
      if (scriptLoaded) {
        try {
          const resp = await axios.get(env.API_URL + '/admin/serve-employees')
          setEmployees(resp.data)
        } catch (e) {
          console.log('ERR LOADING EMPL: ', e)
        }

      }
    })()
  }, [scriptLoaded])

  const joinChat = (fakeMatch) => {
    console.log('LEAVEING CONVERSATION: ' + conversationId)
    conversationId ? socket.emit('leave-conversation', conversationId) : null
    socket.off('prior-messages')
    socket.off('notification')
    socket.off('incoming-message')
    socket.on('prior-messages', (res) => {
      console.log('PRIOR MESSAGES LENGTH: ', res.Messages.length);
      setMessages(res.Messages);
      setConversationId(res.id);
      document.getElementById("bottom").scrollIntoView()
    });
    socket.on('incoming-message', (res) => {
      console.log('INCOMING MESsAGE: ', res)
      setMessages(oldArray => {
        if (oldArray) {
          return oldArray.concat([res])
        }
        return [res]
      });
      document.getElementById("bottom").scrollIntoView()
    });
    socket.emit('join-conversation', { receiverId: fakeMatch.user1id, senderId: fakeMatch.user2id, })
    setActiveChat(fakeMatch)
    setActiveTab('CHAT')
  }

  const findEmployeeMatches = async () => {
    socket.emit('find-employee-matches')
    console.log('LOADING EMPLOYEE MATCHES')
  }

  return (
    <div>
      { scriptLoaded === true ? (
        <div>
          { currentAdmin.role === 'ADMIN' ?
            <div style={{ display:'flex', marginLeft: 30, marginTop: 30, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box style={{ textAlign: 'center' }}>
                <Label style={{fontSize: 20, fontWeight: 'bold'}}>Select an Employee to see their activity</Label>
              </Box>
              <div style={{ display:'flex', marginLeft: 30, marginTop: 15, alignItems: 'center', flexWrap: 'wrap' }}>
                { employees && employees.map(e => {
                  return <Button onClick={async () => {
                    await logIntoEmployee(e.id)
                  }} key={e.id} style={{ padding: "5px", marginLeft: 10, marginRight: 10, marginTop: 5, color: currentAdmin.id === activeEmployeeId }} variant={ activeEmployeeId === e.id ? 'success' : 'info'} value={e.id}>
                    { e.firstName + ' ' + e.lastName }
                  </Button>
                })}
              </div>
            </div> : null
          }





            { employeeMatches.length > 0 ? (
              <div style={{ display:'flex', height: '80vh', marginTop: 15, padding: 30, alignItems: 'center', flexWrap: 'wrap', border: '1px solid grey' }}>
                <div style={{width: '100%', textAlign: 'center', fontSize: 25, fontWeight: 'bolder', margin: 10 }}> Halal Meet Chat Application</div>
                { lastNotification && (
                  <div style={{width: '100%', textAlign: 'center', margin: 10 }}>
                    <Label style={{ fontSize: 18, fontWeight: 'bold' }}>Last Notification</Label>
                    <Label style={{ color: 'white', padding: 10, backgroundColor: lastNotification.type === 'info' ? '#0099FF' : 'green' }}>{lastNotification.message}</Label>
                  </div>
                )}
                <div style={{ width: '100%', borderBottom: '2px solid grey', marginTop: 5, marginBottom: 10 }}></div>
                <Box style={{ flex: '0 40%', height: '75vh', overflow: 'auto', padding: 10 }}>
                  <Label style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Employee matches</Label>
                  <div style={{ width: '100%', borderBottom: '1px solid grey', marginTop: 5, marginBottom: 10 }}></div>
                  { employeeMatches.map(item => {
                    return (
                      <div onClick={async() => { await joinChat(item)}} key={item.matchid}
                       style={{
                        display:'flex',
                        flexDirection: 'row',
                        background: activeChat && activeChat.matchid === item.matchid ? '#DCDCDC' : '#F6F7FB',
                        cursor: 'pointer',
                        flexWrap: 'wrap',
                        padding: 8,
                        borderRadius: 5,
                        marginTop: 5,
                        marginBottom: 5
                      }}>
                        <div style={{ flex: '0 40%', display: 'flex', alignItems: 'center' }}>
                          <img src={ env.API_URL + '/file/' + item.user1avatar}
                               style={{
                                 width: 40,
                                 height: 40,
                                 borderRadius: 50
                               }}
                          />
                          <div style={{cursor: 'pointer', marginLeft: 10 }}>
                            <Label style={{fontSize: 14, fontWeight: 'bold', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>{item.user1firstname + ' ' + item.user1lastname}</Label>
                            {
                              item.seen === false && item.receiver === currentAdmin.id
                                ?
                                <Label style={{fontSize: 12, fontWeight: "bold", color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer'}}>
                                  { item.sender === currentAdmin.id ? 'You: ' : null}{item.text?.substring(0, 20)}
                                </Label>
                                :
                                <Label style={{fontSize: 12, fontWeight: '200', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>
                                  {item.sender === currentAdmin.id ? 'You: ' : null}{item.text?.substring(0, 20)}
                                </Label>
                            }
                          </div>
                        </div>

                        <div style={{ flex: '0 20%', alignItems: 'center', display: 'flex' }}>
                          Talking with
                        </div>

                        <div style={{ flex: '0 40%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <div style={{cursor: 'pointer', marginLeft: 10 }}>
                            <Label style={{fontSize: 14, fontWeight: 'bold', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>{item.user2firstname + ' ' + item.user2lastname}</Label>
                            {
                              item.seen === false && item.receiver === currentAdmin.id
                                ?
                                <Label style={{fontSize: 12, fontWeight: "bold", color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer'}}>
                                  { item.sender === currentAdmin.id ? 'You: ' : null}{item.text?.substring(0, 20)}
                                </Label>
                                :
                                <Label style={{fontSize: 12, fontWeight: '200', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>
                                  {item.sender === currentAdmin.id ? 'You: ' : null}{item.text?.substring(0, 20)}
                                </Label>
                            }
                          </div>
                          <img src={ env.API_URL + '/file/' + item.user2avatar}
                               style={{
                                 width: 40,
                                 height: 40,
                                 borderRadius: 50,
                                 marginLeft: 10
                               }}
                          />
                        </div>
                        {/*<div style={{ cursor: 'pointer', marginLeft: 10 }}>*/}
                        {/*  <div style={{flexDirection: 'row', alignItems: 'center', cursor: 'pointer'}}>*/}
                        {/*    <Label style={{cursor: 'pointer'}}>{ moment(item.createdAt).format('hh:mm A') }</Label>*/}
                        {/*  </div>*/}
                        {/*</div>*/}
                      </div>
                    )
                  })}
                </Box>




                { activeTab === 'CHAT' ? (
                  <>
                    { activeChat ? (
                      <Box style={{ flex: '0 60%', height: '100%', overflow: 'auto', padding: 15 }}>
                        <div style={{ alignItems: 'center' }}>
                          <div key={activeChat.user1id} style={{
                            display:'flex',
                            flexDirection: 'row',
                            cursor: 'pointer',
                            flexWrap: 'wrap',
                            borderColor: '#EAEAEA',
                            borderRadius: 10,
                            marginTop: 5,
                            marginBottom: 5
                          }}>
                            <div onClick={async() => { await openProfile(activeChat.user1id)}} style={{ flex: '0 40%', display: 'flex', alignItems: 'center' }}>
                              <img src={ env.API_URL + '/file/' + activeChat.user1avatar}
                                   style={{
                                     width: 40,
                                     height: 40,
                                     borderRadius: 50
                                   }}
                              />
                              <div style={{cursor: 'pointer', marginLeft: 10 }}>
                                <Label style={{fontSize: 14, fontWeight: 'bold', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>{activeChat.user1firstname + ' ' + activeChat.user1lastname}</Label>
                                {
                                  activeChat.seen === false && activeChat.receiver === currentAdmin.id
                                    ?
                                    <Label style={{position: relative,
                                      background: '#388ed9',
                                      color: '#FFFFFF',
                                      fontFamily: 'Arial',
                                      fontSize: 20,
                                      lineHeight: 120,
                                      textAlign: 'center',
                                      width: 250,
                                      height: 120,
                                      borderRadius: 10,
                                      padding: 0, }}>
                                      { activeChat.sender === currentAdmin.id ? 'You: ' : null}{activeChat.text?.substring(0, 20)}
                                    </Label>
                                    :
                                    <Label style={{fontSize: 12, fontWeight: '200', color: '#0099FF', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>
                                      {activeChat.sender === currentAdmin.id ? 'You: ' : null}{activeChat.text?.substring(0, 20)}
                                    </Label>
                                }
                              </div>
                            </div>

                            <div style={{ flex: '0 20%', alignItems: 'center', display: 'flex' }}>
                              Talking with
                            </div>

                            <div onClick={async() => { await openProfile(activeChat.user2id)}} style={{ flex: '0 40%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <div style={{cursor: 'pointer', marginLeft: 10 }}>
                                <Label style={{fontSize: 14, fontWeight: 'bold', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>{activeChat.user2firstname + ' ' + activeChat.user2lastname}</Label>
                                {
                                  activeChat.seen === false && activeChat.receiver === currentAdmin.id
                                    ?
                                    <Label style={{fontSize: 12, fontWeight: "bold", color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer'}}>
                                      { activeChat.sender === currentAdmin.id ? 'You: ' : null}{activeChat.text?.substring(0, 20)}
                                    </Label>
                                    :
                                    <Label style={{fontSize: 12, fontWeight: '200', color: '#191465', flexShrink: 1, flexWrap: 'wrap', cursor: 'pointer' }}>
                                      {activeChat.sender === currentAdmin.id ? 'You: ' : null}{activeChat.text?.substring(0, 20)}
                                    </Label>
                                }
                              </div>
                              <img src={ env.API_URL + '/file/' + activeChat.user2avatar}
                                   style={{
                                     width: 40,
                                     height: 40,
                                     borderRadius: 50,
                                     marginLeft: 10
                                   }}
                              />
                            </div>
                          </div>

                          <div style={{backgroundColor: '#FFFFFF', width: '100%', paddingLeft: 10, paddingRight: 10, paddingBottom: 8, marginBottom: 10}}>
                            <div style={{paddingBottom: 20, height: '55vh', overflow: 'auto' }}>
                              <div style={{width: '90%', marginBottom: 10, padding: 20 }}>
                                { messages && messages.map((msg, index) => (
                                  <div key={index} style={{
                                    marginBottom: 13,
                                    display: 'flex',
                                    justifyContent: activeChat.user2id === msg.sender ? 'flex-end' : 'flex-start'
                                  }}>
                                    <div style={{ width: 200, backgroundColor: '#2D67FF', borderRadius: 5, padding: 7 }}>
                                      <Label style={{ color: 'white' }}>{msg.text}</Label>
                                    </div>
                                  </div>
                                ))}
                                <div id="bottom"></div>
                              </div>
                            </div>
                          </div>

                          <div style={{display: 'flex', flexDirection: 'row', marginTop: 5 }}>
                            <TextArea
                              style={{ marginRight: 12, paddingLeft: 10, width: '90%', padding: 10, borderColor: '#E9EDF2', borderWidth: 2,  borderRadius: 6, marginBottom: 10 }}
                              onChange={e => {
                                setMessageToSend(e.target.value)
                              }}
                              rows={2}
                              onKeyDown={(e) => something(e) }
                              placeholder={'Start typing here...'}
                              value={messageToSend}
                            />
                            <Button style={{ width: 100 }} onClick={async () => {
                              if (messageToSend.length > 20000) {
                                alert(`The longest allowed message length is 20000 characters. Your message is ${messageToSend.length} characters`)
                                return;
                              }
                              if (messageToSend.length > 0 ){
                                await sendMessage()
                              }
                            }} size={'icon'} variant={ messageToSend.length > 0 ? 'success' : 'info'} >Send</Button>
                          </div>

                        </div>
                      </Box>
                    ) : null}
                  </>
                ) : null}









                { activeTab === 'PROFILE' ? (
                  <>
                    {!!(publicProf) ? (
                      <Box style={{ flex: '0 60%', height: '100%', overflow: 'auto', padding: 15 }}>
                        <div>
                          <div style={{alignItems: 'center', justifyContent: 'center', width: 380}}>
                            <div style={{ width: '100%' }}>
                              <div style={{paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <div>
                                  <img src={ env.API_URL + '/file/' + publicProf.avatar}
                                       style={{
                                         width: 200,
                                         height: 200,
                                         marginLeft: 10
                                       }}
                                  />
                                </div>
                                <div>
                                  <Label style={{ fontSize: 17, fontWeight: 'bold', color: 'black' }}>{publicProf.firstName + ' ' + publicProf.lastName}</Label>
                                  <Label style={{ fontSize: 14, fontWeight: '100', color: '#C1C0C9' }}>{moment().diff(publicProf.bornAt, 'years')}, {publicProf.height}</Label>
                                </div>

                                <div>
                                  <Label style={{ fontSize: 14, fontWeight: 'bold', color: 'black' }}>{publicProf.swipeCity}, {publicProf.swipeCountry}</Label>
                                  <div style={{flexDirection: 'row'}}>
                                    <Label>Country of Origines</Label>
                                    { publicProf.UserCountries?.map((item, index) => {
                                      return <Label key={index} style={{marginRight: 5}}>{item.name}</Label>
                                    }) }
                                  </div>
                                </div>
                              </div>
                              <div style={{paddingTop: 10, paddingBottom: 10}}>
                                <Label style={{fontSize: 17, fontWeight: 'bold'}}>Highlights</Label>
                                <Label style={{color: '#42436A' }}>{publicProf.highlights}</Label>
                              </div>
                              { publicProf.UserInterests && publicProf.UserInterests.length > 0 &&
                              <div style={{paddingTop: 10, paddingBottom: 10}}>
                                <Label style={{fontSize: 17, marginBottom: 5, fontWeight: 'bold'}}>Interests</Label>
                                <div style={{flexDirection: 'row'}}>
                                  {
                                    publicProf.UserInterests.length > 0 && publicProf.UserInterests.map((interest, index) => {
                                      return (
                                        <div>
                                          <div>{interest.icon}</div>
                                          <div>{interest.i18nName}</div>
                                        </div>
                                      )
                                    })
                                  }
                                </div>
                              </div>
                              }
                            </div>
                          </div>

                          <div style={{paddingTop: 10, paddingBottom: 10}}>
                            <Label style={{fontSize: 17, marginBottom: 5, fontWeight: 'bold'}}>Languages</Label>
                            <div style={{flexDirection: 'row'}}>
                              {
                                publicProf.UserLanguages.length > 0 && publicProf.UserLanguages.map((lang, index) => {
                                  return (
                                    <div key={index} style={{justifyContent: 'center', alignItems: 'center', marginRight: 5, marginBottom: 5}}>
                                      <Label>{lang.name}</Label>
                                    </div>
                                  )
                                })
                              }
                            </div>
                          </div>

                          { publicProf.highestEducation &&
                          <div style={{paddingTop: 10, paddingBottom: 10}}>
                            <Label style={{fontSize: 17, marginBottom: 5, fontWeight: 'bold'}}>Highest Education</Label>
                            <Label>{publicProf.highestEducation}</Label>
                          </div>
                          }

                          { publicProf.martialStatus &&
                          <div style={{paddingTop: 10, paddingBottom: 10}}>
                            <Label style={{fontSize: 17, marginBottom: 5, fontWeight: 'bold'}}>Martial Status</Label>
                            <Label>{publicProf.martialStatus}</Label>
                          </div>
                          }

                          { publicProf.hasChildren === true &&
                          <div style={{paddingTop: 10, paddingBottom: 10}}>
                            <Label style={{fontSize: 17, marginBottom: 5, fontWeight: 'bold'}}>Has Children</Label>
                            <Label>{publicProf.hasChildren}</Label>
                          </div>
                          }

                          { publicProf.hasChildren &&
                          <div style={{paddingTop: 10, paddingBottom: 10}}>
                            <Label style={{fontSize: 17, marginBottom: 5, fontWeight: 'bold'}}>Occupation</Label>
                            <Label>{publicProf.occupation}</Label>
                          </div>
                          }

                        </div>
                      </Box>) : null}
                  </>
                ) : null}
              </div>
            ) : null
            }
        </div>
      ) : <div style={{width: '100%', marginTop: 100, height: '100vh', textAlign: 'center', verticalAlign: 'middle', fontSize: 20, fontWeight: 'bold' }}>Loading...</div>
      }
    </div>
  );
};

export default EmployeeChat