import React, { Component } from "react";
import MessageHeader from "./MessageHeader";
import Message from "./Message";
import MessageForm from "./MessageForm";
import { connect } from "react-redux"; // class형식에서 리덕스사용하기
import firebase from "../../../firebase";
export class MainPanel extends Component {
  state = {
    messages: [],
    messagesRef: firebase.database().ref("messages"), // db에 접근
    messagesLoading: true,
    // 검색을 위한 state
    searchTerm: "",
    searchResults: [],
    searchLoading: false,
  };

  componentDidMount() {
    const { chatRoom } = this.props; // 리덕스

    if (chatRoom) {
      // chatRoom 이 있는경우만
      this.addMessagesListeners(chatRoom.id);
    }
  }

  handleSearchMessages = () => {
    const chatRoomMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, "gi");
    const searchResults = chatRoomMessages.reduce((acc, message) => {
      if (
        // 내용이나 메시지송신자와 정규표현식이 일치할때
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message); // 검색조건 만족하므로 추가
      }
      return acc; // 검색조건 만족하는 리스트반환
    }, []);
    this.setState({ searchResults });
  };
  // search의 onchange함수
  handleSearchChange = (event) => {
    this.setState(
      {
        searchTerm: event.target.value,
        searchLoading: true,
      },
      () => this.handleSearchMessages()
    );
  };
  // 메시지 데이터 실시간으로 가져오기
  // 방마다 다르기때문에 chatRoomId를 가져와야함
  addMessagesListeners = (chatRoomId) => {
    let messagesArray = [];
    this.state.messagesRef // 데이터베이스에 접근
      .child(chatRoomId)
      .on("child_added", (DataSnapshot) => {
        // 메시지가 들어왔을때 실시간으로 보여줌
        messagesArray.push(DataSnapshot.val());
        // console.log("messageAre", messagesArray);
        this.setState({
          messages: messagesArray,
          messagesLoading: false,
        });
      });
  };
  // 메시지를 화면에 보여줌
  renderMessages = (messages) =>
    messages.length > 0 &&
    messages.map((message) => (
      <Message // Message 컴포넌트 사용
        key={message.timestamp}
        message={message}
        user={this.props.user}
      />
    ));

  render() {
    const { messages, searchTerm, searchResults } = this.state;

    return (
      <div style={{ padding: "2rem 2rem 0 2rem" }}>
        <MessageHeader handleSearchChange={this.handleSearchChange} />

        <div
          style={{
            width: "100%",
            height: "450px",
            border: ".2rem solid #ececec",
            borderRadius: "4px",
            padding: "1rem",
            marginBottom: "1rem",
            overflowY: "auto",
          }}
        >
          {searchTerm
            ? this.renderMessages(searchResults)
            : this.renderMessages(messages)}

          {/* 검색조건에 맞는게 있으면 보여주고 없으면 현재 대화방보여줌 */}
        </div>

        <MessageForm />
      </div>
    );
  }
}
// 리덕스 store안에 있는 state를 전달받음
const mapStateToProps = (state) => {
  return {
    user: state.user.currentUser,
    chatRoom: state.chatRoom.currentChatRoom,
  };
};

export default connect(mapStateToProps)(MainPanel);
