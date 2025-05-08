import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";

const ShareModel = ({ isVisible, onClose }) => {
  const [selectedAudience, setSelectedAudience] = useState("Public");
  const [selectedDestination, setSelectedDestination] = useState("Home");
  const [caption, setCaption] = useState("");

  const handleShare = () => {
    // Handle the share action here
    console.log("Sharing with caption:", caption);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Image
              style={styles.profileImage}
              source={require("../../../assets/default-avatar.jpg")}
            />
            <Text style={styles.userName}>Hamza Ben Ayed</Text>
          </View>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>

            <Picker
              selectedValue={selectedAudience}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedAudience(itemValue)}
            >
              <Picker.Item    label="Public (everyone)" value="Public" />
              <Picker.Item
                label="Friends (Your friends in Tawasalna)"
                value="Friends"
              />
              <Picker.Item label="Only Me" value="Only Me" />
            </Picker>
            </View>
                        <View style={styles.pickerWrapper}>

            <Picker
              selectedValue={selectedDestination}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedDestination(itemValue)}
            >
              <Picker.Item label="Home" value="Home" />
              <Picker.Item label="Profile" value="Profile" />
              <Picker.Item label="Group" value="Group" />
              <Picker.Item label="Page" value="Page" />
            </Picker>
            </View>
          </View>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            value={caption}
            onChangeText={setCaption}
          />
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 20,
    width: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerWrapper: {
    borderRadius: 30,
    overflow: "hidden", // Ensure content within the wrapper is clipped to the rounded border
  },
  picker: {
    height: 50,
    marginBottom: 20,
    backgroundColor: Colors.GunmetalGray,
    color: Colors.WHITE,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.WHITE,
  },
});

export default ShareModel;
