import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Image from "react-bootstrap/Image";
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { FaLock } from "react-icons/fa";
import { FaLockOpen } from "react-icons/fa";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { AiOutlineSearch } from "react-icons/ai";
import { useSelector } from "react-redux";
import firebase from "../../../firebase";
import { Media } from "react-bootstrap";

function MessageHeader({ handleSearchChange }) {
  // 현재 방정보
  const chatRoom = useSelector((state) => state.chatRoom.currentChatRoom);
  const isPrivateChatRoom = useSelector(
    (state) => state.chatRoom.isPrivateChatRoom
  );
  const [isFavorited, setIsFavorited] = useState(false);
  const usersRef = firebase.database().ref("users");
  const user = useSelector((state) => state.user.currentUser); //현재사용자
  const userPosts = useSelector((state) => state.chatRoom.userPosts);
  useEffect(() => {
    if (chatRoom && user) {
      addFavoriteListener(chatRoom.id, user.uid);
    }
  }, []);
  // 새로고침해도 하트상태 읽어올수 있게끔 리스너설정
  const addFavoriteListener = (chatRoomId, userId) => {
    usersRef
      .child(userId)
      .child("favorited")
      .once("value")
      .then((data) => {
        if (data.val() !== null) {
          // 좋아요 누른방이 있는경우
          const chatRoomIds = Object.keys(data.val());
          // data.val()은 채팅방정보를 가르킴
          // chatRoomIds는 좋아요를 누른 채탕방들
          const isAlreadyFavorited = chatRoomIds.includes(chatRoomId);
          // chatRoomId가 chatRoomIds 에 있으면 좋아요눌러져있는상태
          setIsFavorited(isAlreadyFavorited);
        }
      });
  };
  // favorite 관리하는 함수
  const handleFavorite = () => {
    if (isFavorited) {
      // favorite에서 제거하기 ( 이미 좋아요눌러져있는상태 )
      usersRef
        .child(`${user.uid}/favorited`)
        .child(chatRoom.id)
        .remove((err) => {
          if (err !== null) {
            console.error(err);
          }
        });
      setIsFavorited((prev) => !prev); // 하트 상태 변경
    } else {
      // favorite로 추가하기 ( 좋아요 눌러져있지 않는 상태 )
      usersRef.child(`${user.uid}/favorited`).update({
        [chatRoom.id]: {
          // 채팅방정보 추가하기
          name: chatRoom.name,
          description: chatRoom.description,
          createdBy: {
            name: chatRoom.createdBy.name,
            image: chatRoom.createdBy.image,
          },
        },
      });
      setIsFavorited((prev) => !prev); // 하트 상태 변경
    }
  };
  const renderUserPosts = (userPosts) =>
    Object.entries(userPosts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, val], i) => (
        <Media key={i}>
          <img
            style={{ borderRadius: 25 }}
            width={48}
            height={48}
            className="mr-3"
            src={val.image}
            alt={val.name}
          />
          <Media.Body>
            <h6>{key}</h6>
            <p>{val.count} 개</p>
          </Media.Body>
        </Media>
      ));
  return (
    <div
      style={{
        width: "100%",
        height: "170px",
        border: ".2rem solid #ececec",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <Container>
        <Row>
          <Col>
            <h2>
              {/* 공개방이랑 DM방 아이콘 다르게 구별 */}
              {isPrivateChatRoom ? (
                <FaLock style={{ marginBottom: "10px" }} />
              ) : (
                <FaLockOpen style={{ marginBottom: "10px" }} />
              )}

              {chatRoom && chatRoom.name}
              {!isPrivateChatRoom && (
                <span style={{ cursor: "pointer" }} onClick={handleFavorite}>
                  {isFavorited ? (
                    <MdFavorite style={{ marginBottom: "10px" }} />
                  ) : (
                    <MdFavoriteBorder style={{ marginBottom: "10px" }} />
                  )}
                </span>
              )}
            </h2>
          </Col>
          <Col>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon1">
                  <AiOutlineSearch />
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                onChange={handleSearchChange}
                placeholder="Search Messages"
                aria-label="Search"
                aria-describedby="basic-addon1"
              />
            </InputGroup>
          </Col>
        </Row>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <p>
            <Image
              src={chatRoom && chatRoom.createdBy.image}
              roundedCircle
              style={{ width: "30px", height: "30px" }}
            />{" "}
            {chatRoom && chatRoom.createdBy.name}
          </p>
        </div>
        <Row>
          <Col>
            <Accordion>
              <Card>
                <Card.Header style={{ padding: "0 1rem" }}>
                  <Accordion.Toggle as={Button} variant="link" eventKey="0">
                    Description
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="0">
                  <Card.Body>{chatRoom && chatRoom.description}</Card.Body>
                </Accordion.Collapse>
              </Card>
            </Accordion>
          </Col>
          <Col>
            <Accordion>
              <Card>
                <Card.Header style={{ padding: "0 1rem" }}>
                  <Accordion.Toggle as={Button} variant="link" eventKey="0">
                    Posts Count
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="0">
                  <Card.Body>
                    {" "}
                    {userPosts && renderUserPosts(userPosts)}
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            </Accordion>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default MessageHeader;
