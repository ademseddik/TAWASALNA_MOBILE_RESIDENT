import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet,Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
const { width, height } = Dimensions.get("window");

const ConfirmActionModel = ({
  isVisible,
  onClose,
  message1,
  message2,
  onConfirm,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.message1}>{message1}</Text>
          <Text style={styles.message2}>{message2}</Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection:"column",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    marginTop: "20%",
    marginBottom: "20%",
    gap:10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: -2,
    right: -2,
    padding: 5,
    zIndex: 1,
  },
  message1: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message2: {
    fontSize: 15,
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "80%",
  },
  confirmButton: {
    height:height*0.05,
    width:width*0.24,
    backgroundColor: Colors.PURPLE,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  cancelButton: {
    height:height*0.05,
    width:width*0.24,
    backgroundColor: "#dedede",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  confirmButtonText: {
    fontSize:16,
    color: "white",
    fontWeight:"bold",
  },
  cancelButtonText: {
    fontSize:16,

    color: "black",
    fontWeight:"500"
  },
});

export default ConfirmActionModel;
