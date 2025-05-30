import styled from 'styled-components';

export const Container = styled.View`
  flex: 1;
  padding-left: 20px;
  padding-right: 20px;
  align-items: center;
  background-color: #ffffff;
`;

export const Card = styled.TouchableOpacity`
  width: 100%;
`;

export const UserInfo = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

export const UserImgWrapper = styled.View`
  padding-top: 15px;
  padding-bottom: 15px;
`;

export const UserImg = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 25px;
`;

export const TextSection = styled.View`
  flex-direction: column;
  justify-content: center;
  padding: 15px;
  padding-left: 0;
  margin-left: 10px;
  width: 300px;
  border-bottom-width: 1px;
  border-bottom-color: #cccccc;
`;

export const UserInfoText = styled.View`
  flex-direction: row;
  margin-bottom: 5px;
`;

export const UserName = styled.Text`
  font-size: 12px;
  font-weight: bold;
  margin-left: 5px;
  margin-top: 2px;
`;

export const PostTime = styled.Text`
  font-size: 12px;
  color: #666;
`;

export const MessageText = styled.Text`
  font-size: 13px;
  margin-left: 5px;
  color: #333333;
`;

export const CommentContainer = styled.View`
  background-color: #d3d3d3;
  border-radius: 20px;
  padding: 5px;
  margin-top:3px;
  margin-bottom: 10px;
  margin-right: 80px;
  width: 200px;
`;