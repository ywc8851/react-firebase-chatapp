import React, { Component } from "react";
import { FaRegSmileBeam } from "react-icons/fa";
import firebase from "../../../firebase";
import { connect } from "react-redux";
import {
  setCurrentChatRoom,
  setPrivateChatRoom,
} from "../../../redux/actions/chatRoom_action";
export class Favorited extends Component {
  state = {
    favoritedChatRooms: [], // favorite 채팅방목록을 담는배열
    usersRef: firebase.database().ref("users"),
    activeChatRoomId: "",
  };

  componentDidMount() {
    if (this.props.user) {
      this.addListeners(this.props.user.uid);
    }
  }
  // 리스너 제거하기
  componentWillUnmount() {
    if (this.props.user) {
      this.removeListener(this.props.user.uid);
    }
  }

  removeListener = (userId) => {
    this.state.usersRef.child(`${userId}/favorited`).off();
  };

  addListeners = (userId) => {
    const { usersRef } = this.state;
    // favorited에 추가되었을 때
    usersRef
      .child(userId)
      .child("favorited")
      .on("child_added", (DataSnapshot) => {
        const favoritedChatRoom = {
          // 추가될 채팅방에 대한 정보
          id: DataSnapshot.key,
          ...DataSnapshot.val(),
        };
        this.setState({
          favoritedChatRooms: [
            ...this.state.favoritedChatRooms, // 기존의 favorite 방들에
            favoritedChatRoom, // 현재방을 favorite에 추가함
          ],
        });
      });
    // favorited에서 삭제되었을 때
    usersRef
      .child(userId)
      .child("favorited")
      .on("child_removed", (DataSnapshot) => {
        const chatRoomToRemove = {
          // 삭제될 채팅방에 대한 정보
          id: DataSnapshot.key,
          ...DataSnapshot.val(),
        };
        const filteredChatRooms = this.state.favoritedChatRooms.filter(
          (chatRoom) => {
            return chatRoom.id !== chatRoomToRemove.id; // 현재방의 id와 같지않은것만 필터링
          }
        );
        this.setState({ favoritedChatRooms: filteredChatRooms }); // 현재채팅방이 삭제된 새로운 배열
      });
  };

  changeChatRoom = (room) => {
    this.props.dispatch(setCurrentChatRoom(room)); // 현재채팅방을 리덕스에
    this.props.dispatch(setPrivateChatRoom(false)); // 현재채팅방이 private인지 리덕스에
    this.setState({ activeChatRoomId: room.id });
  };
  // favorited 채팅방들을 화면에 보여주는 함수
  renderFavoritedChatRooms = (favoritedChatRooms) =>
    favoritedChatRooms.length > 0 &&
    favoritedChatRooms.map((chatRoom) => (
      <li
        key={chatRoom.id}
        onClick={() => this.changeChatRoom(chatRoom)}
        style={{
          backgroundColor:
            chatRoom.id === this.state.activeChatRoomId && "#ffffff45",
        }}
      >
        # {chatRoom.name}
      </li>
    ));

  render() {
    const { favoritedChatRooms } = this.state;
    return (
      <div>
        <span style={{ display: "flex", alignItems: "center" }}>
          <FaRegSmileBeam style={{ marginRight: "3px" }} />
          FAVORITED ({favoritedChatRooms.length})
        </span>
        <ul style={{ listStyleType: "none", padding: "0" }}>
          {this.renderFavoritedChatRooms(favoritedChatRooms)}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user.currentUser, // 현재 사용자정보 가져옴
  };
};

export default connect(mapStateToProps)(Favorited);
