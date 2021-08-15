import React, { Component } from "react";
import { FaRegSmile } from "react-icons/fa";
import firebase from "../../../firebase";
import { connect } from "react-redux";
import {
  setCurrentChatRoom,
  setPrivateChatRoom,
} from "../../../redux/actions/chatRoom_action";
export class DirectMessages extends Component {
  state = {
    usersRef: firebase.database().ref("users"), // 사용자 db
    users: [], // inital state
    activeChatRoom: "",
  };

  componentDidMount() {
    // 리스너 생성
    if (this.props.user) {
      this.addUsersListeners(this.props.user.uid);
    }
  }

  addUsersListeners = (currentUserId) => {
    // const { usersRef } = this.state;
    let usersArray = [];
    // user 테이블에 add될때 리스너가 데이터가져옴
    this.state.usersRef.on("child_added", (DataSnapshot) => {
      // 현재사용자는 제외 , DataSnapshot.key로 uid 불러옴
      if (currentUserId !== DataSnapshot.key) {
        let user = DataSnapshot.val();
        user["uid"] = DataSnapshot.key;
        user["status"] = "offline"; // 디폴트값은 오프라인 (상태변수)
        usersArray.push(user);
        this.setState({ users: usersArray }); // 사용자배열
      }
    });
  };

  getChatRoomId = (userId) => {
    const currentUserId = this.props.user.uid; // 현재사용자
    // 누가 방을 생성하든 같은 방주소를 생성하기 위한 조건문
    return userId > currentUserId
      ? `${userId}/${currentUserId}`
      : `${currentUserId}/${userId}`;
  };

  changeChatRoom = (user) => {
    const chatRoomId = this.getChatRoomId(user.uid); // DM 방주소
    const chatRoomData = {
      id: chatRoomId,
      name: user.name,
    };
    // 리덕스에 SetCurrentChatrRoom정보저장
    this.props.dispatch(setCurrentChatRoom(chatRoomData));
    // DM은 private 방임을 리덕스에게 알려줌
    this.props.dispatch(setPrivateChatRoom(true));
    this.setActiveChatRoom(user.uid); // 현재채팅방 active 표시
  };

  setActiveChatRoom = (userId) => {
    this.setState({ activeChatRoom: userId });
  };

  // DM 랜더링하는 함수
  renderDirectMessages = (users) =>
    users.length > 0 &&
    users.map((user) => (
      <li
        key={user.uid}
        style={{
          backgroundColor:
            user.uid === this.state.activeChatRoom && "#ffffff45",
        }}
        onClick={() => this.changeChatRoom(user)}
      >
        # {user.name}
      </li>
    ));

  render() {
    return (
      <div>
        <span style={{ display: "flex", alignItems: "center" }}>
          <FaRegSmile style={{ marginRight: 3 }} /> DIRECT MESSAGES(1)
        </span>
        {/* DM 목록보여줌*/}
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {this.renderDirectMessages(this.state.users)}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user.currentUser, // 현재 사용자를 리덕스스토어로부터 가져옴
  };
};

export default connect(mapStateToProps)(DirectMessages);
