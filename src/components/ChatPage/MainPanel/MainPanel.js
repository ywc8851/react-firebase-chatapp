import React, { Component } from "react";
import MessageHeader from "./MessageHeader";
import Message from "./Message";
import MessageForm from "./MessageForm";
import { connect } from "react-redux"; // class형식에서 리덕스사용하기
import firebase from "../../../firebase";
import { setUserPosts } from "../../../redux/actions/chatRoom_action";
export class MainPanel extends Component {
  state = {
    messages: [],
    messagesRef: firebase.database().ref("messages"), // db에 접근
    messagesLoading: true,
    // 검색을 위한 state
    searchTerm: "",
    searchResults: [],
    searchLoading: false,
    typingRef: firebase.database().ref("typing"),
    typingUsers: [],
    listenerLists: [], // 리스너 입력받는 배열
  };

  componentDidMount() {
    const { chatRoom } = this.props; // 리덕스

    if (chatRoom) {
      // chatRoom 이 있는경우만 message,typing 리스너추가
      this.addMessagesListeners(chatRoom.id);
      this.addTypingListeners(chatRoom.id);
    }
  }
  componentWillUnmount() {
    this.state.messagesRef.off();
    this.removeListeners(this.state.listenerLists);
    // 리스너 리스트 제거
  }
  removeListeners = (listeners) => {
    // 모든 리스너제거하기
    listeners.forEach((listner) => {
      listner.ref.child(listner.id).off(listner.event);
    });
  };
  addTypingListeners = (chatRoomId) => {
    let typingUsers = [];
    //typing이 새로 들어올 때
    this.state.typingRef.child(chatRoomId).on("child_added", (DataSnapshot) => {
      // 메시지 작성자가 현재 사용자가 아닌 경우에만
      if (DataSnapshot.key !== this.props.user.uid) {
        typingUsers = typingUsers.concat({
          id: DataSnapshot.key,
          name: DataSnapshot.val(),
        });
        this.setState({ typingUsers });
      }
    });
    //listenersList state에 등록된 리스너를 넣어주기
    this.addToListenerLists(chatRoomId, this.state.typingRef, "child_added");

    //typing을 지워줄 때
    this.state.typingRef
      .child(chatRoomId)
      .on("child_removed", (DataSnapshot) => {
        const index = typingUsers.findIndex(
          (user) => user.id === DataSnapshot.key
        );
        if (index !== -1) {
          // 유저정보가 있는경우 빼줌
          typingUsers = typingUsers.filter(
            (user) => user.id !== DataSnapshot.key
          );
          this.setState({ typingUsers });
        }
      });
    //listenersList state에 등록된 리스너를 넣어주기
    this.addToListenerLists(chatRoomId, this.state.typingRef, "child_removed");
  };
  addToListenerLists = (id, ref, event) => {
    //이미 등록된 리스너인지 확인
    const index = this.state.listenerLists.findIndex((listener) => {
      return (
        listener.id === id && listener.ref === ref && listener.event === event
      );
    });
    // 등록되지 않은 리스너인 경우
    if (index === -1) {
      const newListener = { id, ref, event };
      this.setState({
        // 리스너리스트에 추가하기
        listenerLists: this.state.listenerLists.concat(newListener),
      });
    }
  };
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
        this.userPostsCount(messagesArray);
      });
  };
  userPostsCount = (messages) => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        // 이미 acc에 있는 사용자
        acc[message.user.name].count += 1; // 메시지 보낸 횟수 +1
      } else {
        // acc에 없는 사용자
        acc[message.user.name] = {
          // 유저의 정보저장
          image: message.user.image,
          count: 1, // 첫메시지 이므로 count는 1
        };
      }
      return acc;
    }, {});
    // MessageHeader 컴포넌트에서 userPosts를 사용해야 하기 때문에 리덕스에 넣어줌
    this.props.dispatch(setUserPosts(userPosts));
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
  renderTypingUsers = (typingUsers) =>
    typingUsers.length > 0 &&
    typingUsers.map((user) => (
      <span>{user.name}님이 채팅을 입력하고 있습니다...</span>
    ));
  render() {
    const { messages, searchTerm, searchResults, typingUsers } = this.state;

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
          {/* 검색조건에 맞는게 있으면 보여주고 없으면 현재 대화방보여줌 */}
          {searchTerm
            ? this.renderMessages(searchResults)
            : this.renderMessages(messages)}
          {/* 타이핑 치고있는 유저 보여주는 부분*/}
          {this.renderTypingUsers(typingUsers)}
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
