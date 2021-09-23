import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Button,
  TextInput,
  NumberInput,
} from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const [date, setDate] = useState("01-05-2021");
  const [userage, setUserAge] = useState(99);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(response);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const [avail, setAvail] = useState(0);
  const [district, setDistrict] = useState("110001");
  const someRef = React.useRef(0);
  const secToken=process.env.TOKEN_KEY

  var params = {
    method: "get",
    muteHttpExceptions: false,
    headers: {
      authorization:
        `Bearer ${secToken}`,
      "Content-Type": "application/json",
    },
  };

  function mockAPI() {
    return new Promise((resolve, request) => {
      someRef.current = someRef.current + 1;
      setTimeout(
        () => resolve("newData from API call " + someRef.current),
        900
      );
    });
  }

  var user_age;
  if (userage >= 18 && userage < 45) {
    user_age = 18;
  }
  if (userage >= 45) {
    user_age = 45;
  }

  var listofage = [];
  const onSubmit = () => {
    alert(
      "Thanks! We have saved your details. We will now notify you whenever we find a slot for you."
    );
    const timer = setInterval(
      () =>
        mockAPI().then(
          axios
            .get(
              `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${district}&date=${date}`,
              params
            )
            .then((res) => {
              setAvail(res.data.centers.length);
              for (var i = 0; i < res.data.centers.length; i++) {
                for (var j = i; j < res.data.centers[i].sessions.length; j++) {
                  if (
                    res.data.centers[i].sessions[j].min_age_limit == user_age
                  ) {
                    listofage.push(1);
                  }
                }
              }
            })
            .catch((err) => {
              console.log(err);
            })
        ),
      6000
    );
    return () => clearInterval(timer);
  };
  const prevCountRef = useRef();
  useEffect(() => {
    prevCountRef.current = avail;
  });
  const prevCount = prevCountRef.current;

  if (avail > 0 && avail > prevCount && listofage.length > 0) {
    schedulePushNotification();
  }

  const Handler = (enteredText) => {
    setDistrict(enteredText);
  };

  const HandlerDate = (enteredText) => {
    setDate(enteredText);
  };

  const HandlerAge = (enteredNumber) => {
    setUserAge(enteredNumber);
  };

  return (
    <View style={styles.container}>
      {avail > 0 ? (
        <View>
          <Text
            variant="h1"
            style={{
              color: "green",
              fontSize: 30,
              fontWeight: "bold",
              margin: 25,
            }}
          >
            Yes, Vaccine slot available for you 🥳.
          </Text>
          <Text
            variant="h1"
            style={{
              fontSize: 15,
              fontWeight: "bold",
              marginLeft: 20,
              marginRight: 20,
              marginBottom: 20,
            }}
          >
            Go book your slot through cowin portal or Aarogya Setu App ASAP.
          </Text>
        </View>
      ) : (
        <Text
          variant="h1"
          style={{
            color: "red",
            fontSize: 30,
            fontWeight: "bold",
            margin: 20,
          }}
        >
          Sorry, There's no vaccine slot available for you currently ☹️
        </Text>
      )}
      <Text
        variant="h2"
        style={{
          fontWeight: "bold",
          margin: 5,
        }}
      >
        Please set your Pincode and a Date
      </Text>

      <Text
        variant="h2"
        style={{
          color: "darkgray",
          fontWeight: "bold",
          margin: 15,
        }}
      >
        We will keep notifying you if there's any availibility for you for 7
        days from the date you set.
      </Text>
      <TextInput
        value={district}
        style={{
          height: 40,
          width: 200,
          borderWidth: 3,
          borderColor: "orange",
          margin: 15,
          padding: 10,
          borderRadius: 10,
        }}
        placeholder="Your District"
        onChangeText={Handler}
      />

      <TextInput
        value={date}
        style={{
          height: 40,
          width: 200,
          borderWidth: 3,
          padding: 10,
          borderColor: "orange",
          margin: 15,
          borderRadius: 10,
        }}
        placeholder="Date"
        onChangeText={HandlerDate}
      />
      <NumberInput
        value={userage}
        style={{
          height: 40,
          width: 200,
          borderWidth: 3,
          padding: 10,
          borderColor: "orange",
          margin: 15,
          borderRadius: 10,
        }}
        placeholder="Your Age"
        onChangeText={HandlerAge}
      />
      <Button onPress={onSubmit} title="set" />
    </View>
  );
}

async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Yupiee! Vaccine available ",
      body: "Vaccine available for you, Go book ASAP",
      data: { data: "goes here" },
    },
    trigger: { seconds: 2 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const {
      status: existingStatus,
    } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
  },
});
