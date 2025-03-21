import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 

const PrivacyPolicy = ({ isVisible, onClose }) => {
  return (
    <Modal
      animationType="slide"
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
            borderRadius: 10,
            width: "80%",
            marginTop: "20%",
            marginBottom: "20%",
          }}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              padding: 5,
              zIndex: 1,
            }}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Privacy Policy
          </Text>
          <ScrollView>
            {/* Add your Privacy Policy content here */}
            <Text>
              Our Privacy Policy describes how your personal information is
              collected, used, and shared when you use our mobile application
              ExampleApp.
              {"\n\n"}
              **Personal Information We Collect** When you use ExampleApp, we
              may collect certain information from your device, such as your
              device type, IP address, and usage information.
              {"\n\n"}
              **How We Use Your Information** We use the information we collect
              to improve ExampleApp and provide you with a better user
              experience.
              {"\n\n"}
              **Sharing Your Information** We may share your personal
              information with third-party service providers who assist us in
              operating ExampleApp or conducting our business.
              {"\n\n"}
              **Data Retention** We will retain your personal information only
              for as long as necessary for the purposes outlined in this Privacy
              Policy.
              {"\n\n"}
              **Changes to This Privacy Policy** We may update our Privacy
              Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page.
              {"\n\n"}
              **Contact Us** If you have any questions or concerns about our
              Privacy Policy, please contact us at example@example.com.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacyPolicy;
