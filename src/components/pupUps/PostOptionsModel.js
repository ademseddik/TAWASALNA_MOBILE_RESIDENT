import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from "react";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"; 
import Colors from '../../../assets/Colors';
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfirmActionModel from './ConfirmActionModel';
import Toast from "react-native-toast-message";

import { APP_ENV } from "../../utils/BaseUrl";
import Axios from 'axios';



const PostOptionsModel = ({
  isVisible,
  onClose,
  postId,
  refreshPosts,
  refreshImages,
  refreshProfileStatus,
}) => {
  const [isConfirmLogOutModalVisible, setConfirmLogOutModalVisible] =
    useState(false);

  const toggleConfirmLogOutModal = () => {
    setConfirmLogOutModalVisible(!isConfirmLogOutModalVisible);
  };
  //////////////////////////////////////////////////////////////////////////////
const showErroDeletingToast = () => {
  Toast.show({
    type: "info",
    text1: "You are not authorized to delete this post!",
    visibilityTime: 3000,
    autoHide: true,
  });
};
  //////////////////////////////////////////////////////////////////////////
  const DeleteProfilePost = async () => {
    if (!postId) {
      console.error("postId is null or undefined.");
      return;
    }
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/deleteresidentpost/${userId}/${postId}`
      );
              console.log(
                "PostId from Post Options  Model : ",
                postId,
                response.data.length
              );

      if (response.status === 401 ){
                showErroDeletingToast()
                return;
      }
        if (refreshImages && refreshPosts) {
          refreshPosts();
          refreshImages();
        } else if (refreshProfileStatus) {
          refreshProfileStatus();
        }
    } catch (error) {
      console.error("Error Deleting Resident Post:", error);
    }
  };

  //////////////////////////////////////////////////////////////////////////////////
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              width: "100%",
              marginTop: "163%",
            }}
          >
            <View
              style={{
                borderTopColor: Colors.GunmetalGray,
                borderRadius: 13,
                borderTopWidth: 4,
                marginTop: -5,
                width: 40,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />

            <View
              style={{
                marginTop: "5%",
                marginBottom: "5%",
                marginLeft: "auto",
                marginRight: "auto",
                flexDirection: "row",
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  backgroundColor: Colors.LIGHT_PURPLE,
                  borderRadius: 10,
                  width: 310,
                  height: 60,
                }}
                onPress={toggleConfirmLogOutModal}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={19}
                  color={"white"}
                  style={{ marginTop: 5, marginLeft: 5 }}
                />
                <View
                  style={{
                    flexDirection: "column",
                    marginLeft: 5,
                    marginTop: 5,
                  }}
                >
                  <Text style={{ color: "white" }}>Delete Post</Text>
                </View>
                <Text style={{ marginTop: 25, color: "white", marginLeft:"-27%" }}>
                  You are going to delete this post permanently.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <ConfirmActionModel
            isVisible={isConfirmLogOutModalVisible}
            onClose={toggleConfirmLogOutModal}
            message1={"Delete confirmation"}
            message2={"Do you really want to delete this?"}
            onConfirm={() => {
              toggleConfirmLogOutModal();
              DeleteProfilePost();
              onClose();
            }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

export default PostOptionsModel