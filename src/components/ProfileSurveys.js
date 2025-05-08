import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Axios from "axios";
import { APP_ENV } from "../utils/BaseUrl";
import { CheckBox } from "react-native-elements";
import { ActivityIndicator } from "react-native";
import Colors from "../../assets/Colors";


const ProfileSurveys = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [choiceCounts, setChoiceCounts] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [textAnswer, setTextAnswer] = useState({});
  const [textResponses, setTextResponses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchSurveys = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/survey/creator/${userId}`
      );
      if (response.data) {
        const surveys = response.data;

        if (surveys.length > 0) {
          surveys.sort((a, b) => {
            const dateA = new Date(a.postDateTime);
            const dateB = new Date(b.postDateTime);
            return dateB - dateA;
          });
          setData(surveys);
        }

        for (let survey of surveys) {
          const counts = await fetchChoiceCounts(survey.id);
          setChoiceCounts((prevCounts) => ({
            ...prevCounts,
            [survey.id]: counts,
          }));

          for (
            let questionIndex = 0;
            questionIndex < survey.questions.length;
            questionIndex++
          ) {
            const userResponse = await fetchUserSurveyResponses(
              survey.id,
              questionIndex
            );
            if (userResponse) {
              if (
                survey.questions[questionIndex].answerType === "multiple-choice"
              ) {
                setSelectedOptions((prevOptions) => ({
                  ...prevOptions,
                  [`${survey.id}-${questionIndex}`]: userResponse.answers[0],
                }));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error getting resident surveys:", error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSurveyResponses = async (surveyId, questionIndex) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/survey/UserResponse/${surveyId}/${userId}/${questionIndex}`
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error("Error getting user survey responses:", error);
      throw new Error(error);
    }
  };

  const fetchTextResponses = async (surveyId, questionIndex) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/survey/questionTextResponses/${surveyId}/${questionIndex}`
      );
      if (response.data) {
        console.log(response.data);
        setTextResponses(response.data);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching text responses:", error);
      throw new Error(error);
    }
  };

  const fetchChoiceCounts = async (surveyId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/survey/choiceCounts/${surveyId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting choice counts for survey:", error);
      throw new Error(error);
    }
  };

  const RespondToSurvey = async (
    surveyId,
    questionIndex,
    selectedOption,
    textAnswer
  ) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/survey/respondToSurvey/${surveyId}/${userId}`,
        {
          questionIndex,
          selectedOptions: selectedOption ? [selectedOption] : [],
          textAnswer: textAnswer || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data === "Response added successfully.") {
        alert("Response added successfully");
        setTextAnswer("");
      } else {
        alert("You  already responded to this question");
        setTextAnswer("");
      }
    } catch (error) {
      console.error("Error Adding Response to survey:", error);
      throw new Error(error);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginTop: "30%",
        }}
      >
        <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {data.map((survey, index) => (
        <View key={index} style={styles.surveyContainer}>
          <Text style={styles.title}>{survey.title}</Text>
          <Text style={styles.description}>{survey.description}</Text>
          {survey.questions.map((question, qIndex) => (
            <View key={qIndex} style={styles.questionContainer}>
              <Text style={styles.questionText}>{question.questionText}</Text>
              {question.answerType === "multiple-choice" ? (
                question.options.map((option, oIndex) => (
                  <CheckBox
                    key={oIndex}
                    title={`${option} (${
                      choiceCounts[survey.id]?.[question.questionText]?.[
                        option
                      ] || 0
                    })`}
                    checked={
                      selectedOptions[`${survey.id}-${qIndex}`] === option
                    }
                    onPress={() => {
                      setSelectedOptions({
                        ...selectedOptions,
                        [`${survey.id}-${qIndex}`]: option,
                      });
                      RespondToSurvey(survey.id, qIndex, option, null);
                    }}
                  />
                ))
              ) : (
                <View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Your answer"
                    value={textAnswer[`${survey.id}-${qIndex}`] || ""}
                    onChangeText={(text) =>
                      setTextAnswer({
                        ...textAnswer,
                        [`${survey.id}-${qIndex}`]: text,
                      })
                    }
                  />
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() =>
                      RespondToSurvey(
                        survey.id,
                        qIndex,
                        null,
                        textAnswer[`${survey.id}-${qIndex}`]
                      )
                    }
                  >
                    <Text style={styles.buttonText}>Submit Response</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewResponsesButton}
                    onPress={() => fetchTextResponses(survey.id, qIndex)}
                  >
                    <Text style={styles.buttonText}>View Responses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <ScrollView style={styles.modalScroll}>
              {textResponses.map((response, index) => (
                <Text key={index} style={styles.modalText}>
                  {response}
                </Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  surveyContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  questionContainer: {
    marginVertical: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  viewResponsesButton: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalScroll: {
    width: "100%",
    maxHeight: 200,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 5,
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: -10,
    marginLeft:200
  },
  closeButtonText: {
    color: "black",
    textAlign: "center",
    fontSize:20
  },
});

export default ProfileSurveys;
