// MessageStyles.js
import styled from 'styled-components';
import { Animated, TouchableOpacity, TextInput, View, Text, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '../../../assets/Colors';

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
  padding: 10px;
  padding-left: 0;
  margin-left: 10px;
  width: 300px;
  border-bottom-width: 0px;
  border-bottom-color: #cccccc;
`;

export const UserInfoText = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px; 
  margin-bottom: 5px;
`;

export const UserName = styled.Text`
  font-size: 12px;
  font-weight: bold;
  margin-left: 5px;
`;

export const PostTime = styled.Text`
  font-size: 12px;
  color: #666;
  font-weight: 150;
  top:1;
`;

export const Replytext = styled.Text`
  font-size: 12px;
  font-weight:350;
  top:3px;
  color: #666;
  left:5px;
`;

export const MessageText = styled.Text`
  font-size: 13px;
  font-weight:450;
  margin-left: 5px;
  bottom:3;
`;
export const ReactionSummary = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${Colors.LIGHT_PURPLE_OPACITY};
  border-radius: 10px;

  margin-top: 5px;
  align-self: flex-start;
  left:200px;
  bottom:25px;
`;

export const CommentContainer = styled.View`
  background-color:rgb(255, 255, 255);
  border-radius: 20px;
  paddingHorizontal: 5px;
  margin-bottom: 3px;
  margin-right: 90px;
  width: 200px;
`;

// New styled components for CommentModel
export const ModalContainer = styled.View`
  flex: 1;
  background-color: transparent;
  justify-content: flex-end;
`;

export const ModalContent = styled.View`
  background-color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  max-height: 80%;
  padding: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
  elevation: 5;
`;

export const ModalHandle = styled.View`
  width: 40px;
  height: 5px;
  background-color: ${Colors.GRAY};
  border-radius: 3px;
  align-self: center;
  margin-bottom: 10px;
`;

export const ModalTitle = styled.Text`
  font-size: 19px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
`;

export const Separator = styled.View`
  border-top-color: ${Colors.GRAY};
  border-top-width: 0.5px;
  margin-vertical: 10px;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-top: 10%;
  margin-bottom: 10%;
`;

export const NoCommentsContainer = styled.View`
  align-items: center;
  margin-top: 10%;
  margin-bottom: 10%;
`;

export const CommentHeader = styled.View`
  flex-direction: row;
  margin-bottom: 5px;
`;

export const CommentFooter = styled.View`
  flex-direction: row;
  margin-left: 5px;
  margin-top: -5px;
`;

export const RepliesCounter = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-left: 15px;
`;

export const RepliesText = styled.Text`
  color: ${Colors.PURPLE};
  margin-right: 4px;
  font-size: 12px;
`;

export const ReplyInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-left: 20px;
  margin-top: 10px;
  margin-bottom: 15px;
  background-color: #f0f0f0;
  border-radius: 25px;
  padding: 8px;
  padding-right: 15px;
  z-index: 10;
`;

export const SmallProfileImage = styled.Image`
  width: 30px;
  height: 30px;
  border-radius: 15px;
  margin-right: 10px;
`;

export const ReplyInput = styled.TextInput`
  flex: 1;
  padding-vertical: 5px;
  padding-horizontal: 12px;
  font-size: 14px;
  max-height: 100px;
`;

export const SendReplyButton = styled.TouchableOpacity`
  margin-left: 10px;
  padding: 5px;
`;

export const RepliesContainer = styled.View`
  margin-left: 0;
  margin-top: 10px;
`;

export const ReplyItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-left: 50px;
  margin-top: 10px;
`;

export const ReplyLine = styled.View`
  width: 1px;
  background-color: ${Colors.GRAY};
  height: 100%;
  margin-right: 10px;
  position: absolute;
  left: 25px;
  top: 0;
  bottom: 0;
`;

export const ReplyAvatar = styled.Image`
  width: 35px;
  height: 35px;
  border-radius: 25px;
  margin-right: 10px;
`;

export const ReplyContent = styled.View`
  flex: 1;
`;

export const ReplyTime = styled.Text`
  color: grey;
  font-size: 12px;
  margin-top: 2px;
`;


export const ReactionEmoji = styled.Text`
  font-size: 14px;
  margin-right: 2px;
`;

export const ReactionCount = styled.Text`
  font-size: 12px;
  color: ${Colors.DARK_GRAY};
`;
export const ActionButtonText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${Colors.WHITE};

`;
export const ReactionPickerContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  background-color: ${Colors.WHITE};
  border-radius: 25px;
  padding: 10px;
  margin-top: 5px;
  margin-left: 5px;
  position: relative;
  z-index: 10;

  /* iOS shadow */
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;

  /* Android shadow */
  elevation: 10;
`;

export const ActionDialog = styled(Animated.View)`
  margin-left: 10px;
  background-color: ${Colors.WHITE};
  width: 150px;
  border-width: 2.4px;
  border-color: ${Colors.WHITE};
  border-radius: 20px;
  overflow: hidden;
  z-index: 20;
   elevation: 10;
  shadow-color:  ${Colors.LIGHT_PURPLE};;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;

`;

export const ActionButton = styled.TouchableOpacity`
  background-color: ${Colors.LIGHT_PURPLE};
  justify-content: center;
  align-items: center;
  height:40px;
  border-bottom-width: 1.4px;
  marginBottom:1px;
  border-color: ${Colors.WHITE};
  width: 100%;
`;

export const CancelButton = styled.TouchableOpacity`
  background-color: ${Colors.RED};
  justify-content: center;
  align-items: center;
  width: 100%;
   border-top-width: 0.5px;
height:40px;
  border-color: ${Colors.WHITE};
`;


export const ActionContainer = styled.View`
  flex-direction: column;

  justify-content: space-evenly;
  align-items: center;
`;



export const AddCommentContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding-top: 10px;
  border-top-width: 1px;
  border-top-color: ${Colors.LIGHT_GRAY};
`;

export const UserProfileImage = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-right: 10px;
`;

export const CommentInput = styled.TextInput`
  flex: 1;
  background-color: ${Colors.LIGHT_GRAY};
  border-radius: 20px;
  padding-horizontal: 15px;
  padding-vertical: 8px;
  min-height: 40px;
`;

export const BlurOverlay = styled(BlurView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
`;

export const ReplyOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  z-index: 5;
`;

export const EditCommentContainer = styled(Animated.View)`
  background-color: #ccc;
  border-radius: 30px;
  padding-vertical: 5px;
  padding-horizontal: 15px;
  border-width: 1px;
  border-color: ${Colors.LIGHT_PURPLE};
  width: 280px;
  overflow: hidden;
`;

export const EditInput = styled.TextInput`
  min-height: 80px;
  font-size: 16px;
  padding: 10px;
  background-color: #ccc;
  border-radius: 10px;
  margin-bottom: 10px;
`;

export const EditButtons = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

export const CancelEditButton = styled.Text`
  color: ${Colors.RED};
  font-weight: bold;
  margin-right: 15px;
  padding: 5px;
`;

export const SaveEditButton = styled.Text`
  color: ${Colors.PURPLE};
  font-weight: bold;
  padding: 5px;
`;

export const ReactionIcon = styled.TouchableOpacity`
  margin-left: 10px;
  padding: 4px;
`;

export const ReactionIconText = styled.Text`
  font-size: 16px;
`;



export const ReactionOption = styled.TouchableOpacity`
  padding: 5px;
`;

export const ReactionOptionEmoji = styled.Text`
  font-size: 20px;
`;