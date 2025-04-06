import {
    View,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
    TextInput,
  } from "react-native";
  import React, { useState } from "react";
  import Colors from "../../../assets/Colors";
  const { width, height } = Dimensions.get("window");
  
  const SuccessUpdatingProfile = ({
    modalVisible,
    handleCloseSubmit,
    showToastSuccess,
    onConfirm,
  }) => {
    return (
      <View>
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => handleCloseSubmit()}
        >
          <View style={styles.container}>
            <View style={styles.overlay}></View>
            <View style={styles.modalContent}>
              <View style={styles.TextContainer}>
                <View style={styles.contText}>
                  <Text style={styles.text1}>
                    Are you sure you want to save your changes?
                  </Text>
                </View>
              </View>
              <View style={styles.btnsContainer}>
                <TouchableOpacity
                  style={styles.cancelbtn}
                  onPress={() => handleCloseSubmit()}
                >
                  <Text style={styles.textCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitbtn}>
                  <Text
                    style={styles.textSubmit}
                    onPress={() => {
                      showToastSuccess();
                      handleCloseSubmit();
                      onConfirm();
                    }}
                  >
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };
  
  export default SuccessUpdatingProfile;
  
  const styles = StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      padding: 10,
      height: height * 1,
      width: width * 1,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
      flexDirection: "column",
      gap: 30,
      height: height * 0.2,
      width: width * 0.9,
      backgroundColor: "white",
      borderRadius: 10,
    },
    TextContainer:{
      justifyContent: "center",
      alignItems: "center",
      flexDirection:"column",
      gap:10,
      width:width*0.8
    },
    btnsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 20,
    },
    cancelbtn:{
      height:height*0.05,
      width:width*0.30,
      backgroundColor: "#dedede",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
    },
    submitbtn:{
      height:height*0.05,
      width:width*0.30,
      backgroundColor: Colors.PURPLE,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
    },
    textCancel:{
      fontSize:18,
      fontWeight:"500",
    },
    textSubmit:{
      fontSize:18,
      fontWeight:"500",
      color:"white"
    },
    text1:{
      fontSize:16,
      fontWeight:"500",
    },
    text2:{
      fontSize:16,
      fontWeight:"500",
      color:"#d5d5d5",
      
      
    },
    contText:{
      justifyContent: "center",
      alignItems: "center",
      
    }
  });
  