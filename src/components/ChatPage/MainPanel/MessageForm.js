import React, { useState, useRef } from "react";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import firebase from "../../../firebase";
import { useSelector } from "react-redux"; // 리덕스의 정보 가져오기 위해 import
import mime from "mime-types";
function MessageForm() {
  const chatRoom = useSelector((state) => state.chatRoom.currentChatRoom); // 현재 채팅방의 정보를 리덕스로부터 가져옴
  const user = useSelector((state) => state.user.currentUser); // 현재 사용자의 정보를 리덕스로부터 가져옴
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const messagesRef = firebase.database().ref("messages"); // 테이블명이 messages인 데이터베이스 불러옴
  const inputOpenImageRef = useRef();
  const storageRef = firebase.storage().ref();
  const typingRef = firebase.database().ref("typing");
  const isPrivateChatRoom = useSelector(
    (state) => state.chatRoom.isPrivateChatRoom
  );
  const handleChange = (event) => {
    setContent(event.target.value);
  };

  const createMessage = (fileUrl = null) => {
    // 파일url이 없으면 메시지전송으로 인식 (디폴트값이 null)
    const message = {
      // 메시지에 들어가는 정보
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        // 유저의 정보를 리덕스 스토어로부터 가져옴
        id: user.uid,
        name: user.displayName,
        image: user.photoURL,
      },
    };

    if (fileUrl !== null) {
      message["image"] = fileUrl; // 파일업로드시 이미지 저장 (message의 image칼럼에)
    } else {
      message["content"] = content; // 메시지전송시 글내용 저장 (message의 content칼럼에)
    }
    return message; // 메시지의 정보 리턴
  };

  const handleSubmit = async () => {
    if (!content) {
      setErrors((prev) => prev.concat("Type contents first"));
      return;
    }
    setLoading(true); // 로딩중에 버튼못누르게 설정
    //firebase에 메시지를 저장하는 부분
    try {
      await messagesRef.child(chatRoom.id).push().set(createMessage()); // child안에는 채팅방 아이디 -> 리덕스에서 가져옴
      // 메시지 보내고난다음엔 typingRef에서 제거(타이핑상태X)
      typingRef.child(chatRoom.id).child(user.uid).remove();
      setLoading(false); // 버튼다시 활성화
      setContent("");
      setErrors([]);
    } catch (error) {
      setErrors((pre) => pre.concat(error.message));
      setLoading(false);
      setTimeout(() => {
        setErrors([]);
      }, 5000);
    }
  };
  // 파일업로드 버튼누르면 input이 활성화됨
  const handleOpenImageRef = () => {
    inputOpenImageRef.current.click();
  };
  // DM방이랑 공개방이랑 storage 다르게하기 위해서 만든함수
  const getPath = () => {
    if (isPrivateChatRoom) {
      return `/message/private/${chatRoom.id}`;
    } else {
      return `/message/public`;
    }
  };
  // 파일업로드시 firebase로 보냄
  const handleUploadImage = (event) => {
    const file = event.target.files[0];
    // if (!file) return;
    //const filePath = `${getPath()}/${file.name}`;
    const filePath = `${getPath()}/${file.name}`;
    const metadata = { contentType: mime.lookup(file.name) };
    setLoading(true);
    try {
      //파일을 먼저 스토리지에 저장
      let uploadTask = storageRef.child(filePath).put(file, metadata);

      //파일 저장되는 퍼센티지 구하기
      // uploadTask에 listener(상태가변할때마다 전달)을 달아줌
      uploadTask.on(
        "state_changed",
        (UploadTaskSnapshot) => {
          const percentage = Math.round(
            (UploadTaskSnapshot.bytesTransferred /
              UploadTaskSnapshot.totalBytes) *
              100
          );
          setPercentage(percentage);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        },
        () => {
          //저장이 다 된 후에 파일 메시지 전송 (데이터베이스에 저장)
          //저장된 파일을 다운로드 받을 수 있는 URL 가져오기
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            messagesRef // messages 테이블에접근
              .child(chatRoom.id)
              .push()
              .set(createMessage(downloadURL));
            setLoading(false);
          });
        }
      );
    } catch (error) {
      alert(error);
    }
  };
  const handleKeyDown = (event) => {
    // ctrl + enter 키로 메시지 전송
    if (event.ctrlKey && event.keyCode === 13) {
      handleSubmit();
    }
    // 어떠한 사용자가 지금 메시지를 보내려고하는지 보여줌
    if (content) {
      // 타이핑하고있을때
      typingRef.child(chatRoom.id).child(user.uid).set(user.displayName);
    } else {
      // 타이핑하고있지않을때 지워줌
      typingRef.child(chatRoom.id).child(user.uid).remove();
    }
  };
  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="exampleForm.ControlTextarea1">
          <Form.Control
            onKeyDown={handleKeyDown}
            value={content}
            onChange={handleChange}
            as="textarea"
            rows={3}
          />
        </Form.Group>
      </Form>
      {/* 파일업로드시에만 화면에 보여지게끔 설정 */}
      {!(percentage === 0 || percentage === 100) && (
        <ProgressBar
          variant="warning"
          label={`${percentage}%`}
          now={percentage}
        />
      )}
      {/* 에러 메시지 출력 */}
      <div>
        {errors.map((errorMsg) => (
          <p style={{ color: "red" }} key={errorMsg}>
            {errorMsg}
          </p>
        ))}
      </div>

      <Row>
        <Col>
          <button
            onClick={handleSubmit}
            className="message-form-button"
            style={{ width: "100%" }}
            disabled={loading ? true : false}
          >
            메시지 보내기
          </button>
        </Col>
        <Col>
          <button
            onClick={handleOpenImageRef}
            className="message-form-button"
            style={{ width: "100%" }}
            disabled={loading ? true : false}
          >
            파일 업로드
          </button>
        </Col>
      </Row>
      {/* 업로드버튼 클릭시 나타남 */}
      <input
        accept="image/jpeg, image/png"
        style={{ display: "none" }}
        type="file"
        ref={inputOpenImageRef}
        onChange={handleUploadImage}
      />
    </div>
  );
}

export default MessageForm;
