import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "../presentation/Utils/Colors";
import { useNavigation } from "@react-navigation/native";




const AccountActivated = () => {
  const navigation = useNavigation();
  const HandleLoginNavigation = () => {
    navigation.navigate("Log-In");
  };
  return (
    <SafeAreaView style={{ backgroundColor: Colors.WHITE, height: 760 }}>
      <View style={{ marginTop: "5%" }}>
        <View style={{ marginTop: "40%", marginLeft: "23%" , marginBottom:"5%" }}>
          <Image source={require("../../../assets/AccountActivated.jpg")} />
        </View>
        <View style={{ marginTop: "5%", marginLeft: "10%" , marginBottom:"5%"  }}>
          <Text style={{fontWeight:"bold"}}>You account have been successfully activated!</Text>
        </View>
        <View style={{ marginTop: "5%", marginLeft: "1%" , alignItems:"center" }}>
          <TouchableOpacity
            onPress={HandleLoginNavigation}
            style={{
              flexDirection: "row",
              borderColor: Colors.PURPLE,
              borderWidth: 2,
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
              width: 270,
              marginLeft: "2%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name="arrow-forward"
              size={24}
              color={Colors.BLACK}
            />

            <Text style={{ fontWeight:"bold" , marginLeft: 5  }}>
              Proceed  with  login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AccountActivated;
