import React from "react";
import Media from "react-bootstrap/Media";
import moment from "moment"; // 시간계산하기위해
// 2개의 props를 받음
function Message({ message, user }) {
  const timeFromNow = (timestamp) => moment(timestamp).fromNow();

  const isImage = (message) => {
    // 이미지를 갖고있으면 true를 반환
    return (
      message.hasOwnProperty("image") && !message.hasOwnProperty("content")
    );
  };
  // 자신이 보낸 메시지이면 회색처리
  const isMessageMine = (message, user) => {
    return message.user.id === user.uid;
  };

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <Media style={{ marginBottom: "3px", marginRight: "10px" }}>
        <img
          style={{ borderRadius: "10px" }}
          width={48}
          height={48}
          className="mr-3"
          src={message.user.image}
          alt={message.user.name}
        />
      </Media>
      <Media style={{ marginBottom: "3px" }}>
        <Media.Body
          style={{
            backgroundColor: isMessageMine(message, user) && "#ECECEC",
          }}
        >
          <h6>
            {message.user.name}{" "}
            <span style={{ fontSize: "10px", color: "gray" }}>
              {/* 현재로부터 얼마전에 전송했는지 알 수 있음 */}
              {timeFromNow(message.timestamp)}
            </span>
          </h6>
          {isImage(message) ? (
            <img
              style={{ maxWidth: "300px" }}
              alt="이미지"
              src={message.image}
            />
          ) : (
            <p>{message.content}</p>
          )}
        </Media.Body>
      </Media>
    </div>
  );
}

export default Message;
