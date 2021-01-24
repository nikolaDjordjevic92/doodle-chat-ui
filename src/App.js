import React, {Component} from 'react';
import SockJsClient from 'react-stomp';
import './App.css';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import './css/MessageStyle.css';
import NameComponent from "./components/NameComponent";
import dateFormat from 'dateformat';
import axios from 'axios';

class App extends Component {

  constructor(props) {
      super(props);
      this.state = {
          messages: [],
          typedMessage: "",
          name: "",
          hasMore: true,
          time: new Date()
      }

      this.handleTypedMessageChange = this.handleTypedMessageChange.bind(this);

      this.mesageHolderRef = React.createRef();
  }

  convertDate = (date) => {
    return dateFormat(date.toString(),"dd mmm yyyy HH:MM");
  }

  setName = (name) => {
      console.log(name);
      this.getMessages();
      this.setState({name: name});
      this.scrollToBottom();
  };

  loadMore = () => {
    this.getMessages(this.state.messages[this.state.messages.length - 1].id);
  };

  getMessages = (id) => {
    axios.get(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/${id ? id : ''}`)
    .then(res => {
      const topTenMessages = res.data;
      if (topTenMessages.length < 10) {
          this.setState({hasMore: false});
      }
      this.setState({messages: [...this.state.messages, ...topTenMessages]});
      console.log(this.state.messages)
    });
  }

  sendMessage = () => {
      this.clientRef.sendMessage('/app/user-all', JSON.stringify({
          name: this.state.name,
          message: this.state.typedMessage,
          time: new Date()
      }));
     
      this.setState({typedMessage: ''});
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
  };

  handleTypedMessageChange(event) {
    this.setState({typedMessage: event.target.value});
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  displayMessages = () => {
    let newarray = this.state.messages.slice().reverse();

      return (
          <div className="recieved-messages">
              {newarray.map(msg => {
                  return (
                      <div key={msg.id}>
                          {this.state.name === msg.name ?
                              <div>
                                  <p className="style-sender-time">You</p>
                                  <p className="recieved-text-message">{msg.message}</p>
                                  <p className="style-sender-time"> {this.convertDate(msg.time)}</p>
                              </div> :
                              <div>
                                  <p className="style-sender-time">{msg.name}</p>
                                  <p className="recieved-text-message">{msg.message}</p>
                                  <p className="style-sender-time"> {this.convertDate(msg.time)}</p>
                              </div>
                          }
                      </div>)
              })}
          </div>
      );
  };

  render() {
      return (
          <div>
              <NameComponent setName={this.setName}/>
              <div>
                  <div className="messages-holder" ref={this.mesageHolderRef}>
                      <div className="load-more-button-holder">
                      <Button variant="contained" color="primary" onClick={this.loadMore} disabled={!this.state.hasMore}>Load more..</Button>
                      </div>
                    <div>
                        {this.displayMessages()}
                    </div>
                    <div style={{ float:"left", clear: "both" }}
                            ref={(el) => { this.messagesEnd = el; }}>
                    </div>
                  </div>
                  <div className="input-holder">
                      <br/><br/>
                      <table>
                          <thead></thead>
                          <tbody>
                              <tr>
                                  <td id="text-field-message">
                                      <TextField id="outlined-basic" variant="outlined"
                                                // onChange={(event) => {
                                                    // this.setState({typedMessage: event.target.value});
                                                // }}
                                                value={this.state.typedMessage}
                                                onChange={this.handleTypedMessageChange}
                                                />
                                  </td>
                                  <td>
                                      <Button onClick={this.sendMessage}>Send</Button>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
              <br/><br/>
              
              <SockJsClient url={`${process.env.REACT_APP_BACKEND_BASE_URL}/websocket-chat/`}
                            topics={['/topic/user']}
                            onConnect={() => {
                                console.log('connected');
                            }}
                            onDisconnect={() => {
                                console.log('Disconnected');
                            }}
                            onMessage={(msg) => {
                                let jobs = this.state.messages;
                                jobs.unshift(msg);
                                this.setState({messages: jobs});
                            }}
                            ref={(client) => {
                                this.clientRef = client
                            }}/>
          </div>
      )
  }
}

export default App;