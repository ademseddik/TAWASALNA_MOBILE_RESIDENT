import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";

const GroupMembersModal = ({ isVisible, onClose, members }) => {
  const [profilePics, setProfilePics] = useState([]);

  useEffect(() => {
    if (members && members.length > 0) {
      // Since members are now just user IDs, we'll use default avatars
      // or we could fetch user details if needed in the future
      setProfilePics([]);
    }
  }, [members]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
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
            padding: 20,
            borderRadius: 20,
            borderColor: Colors.LIGHT_PURPLE,
            width: "80%",
            height: "60%",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              padding: 5,
              zIndex: 1,
            }}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          
          <Text style={{ 
            fontSize: 18, 
            fontWeight: "bold", 
            textAlign: "center", 
            marginBottom: 15,
            color: Colors.LIGHT_PURPLE 
          }}>
            Group Members ({members ? members.length : 0})
          </Text>
          
          {members && members.length > 0 ? (
            <FlatList
              data={members}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 15,
                    paddingHorizontal: 10,
                  }}
                >
                  <Image
                    source={require("../../../assets/photoprofil.png")}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 10,
                    }}
                  />
                  <Text style={{ fontSize: 16, color: "#333" }}>
                    Member {index + 1}
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 16, color: "#666" }}>No members available</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default GroupMembersModal;
