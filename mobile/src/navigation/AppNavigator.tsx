import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";

import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import HomeScreen from "../screens/HomeScreen";
import CycleScreen from "../screens/CycleScreen";
import SymptomsScreen from "../screens/SymptomsScreen";
import RemindersScreen from "../screens/RemindersScreen";
import LibraryScreen from "../screens/LibraryScreen";
import ArticleScreen from "../screens/ArticleScreen";
import ForumScreen from "../screens/ForumScreen";
import ForumCategoryScreen from "../screens/ForumCategoryScreen";
import NewPostScreen from "../screens/NewPostScreen";
import ThreadScreen from "../screens/ThreadScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ShareScreen from "../screens/ShareScreen";
import AssistantScreen from "../screens/AssistantScreen";
import CourseScreen from "../screens/CourseScreen";
import TestScreen from "../screens/TestScreen";
import CourseVideosScreen from "../screens/CourseVideosScreen";
import MonCarnetScreen from "../screens/MonCarnetScreen";
import CarnetScreen from "../screens/CarnetScreen";
import FloatingTabBar from "./FloatingTabBar";
import JeunesMamansScreen from "../screens/JeunesMamansScreen";
import CentresScreen from "../screens/CentresScreen";
import LiveScreen from "../screens/LiveLazy";
import FormationsScreen from "../screens/FormationsScreen";
import RevenusScreen from "../screens/RevenusScreen";
import ProfessionnellesScreen from "../screens/ProfessionnellesScreen";
import UrgenceScreen from "../screens/UrgenceScreen";
import ProSpaceScreen from "../screens/ProSpaceScreen";
import AdminScreen from "../screens/AdminScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import GamesHomeScreen from "../screens/games/GamesHomeScreen";
import QuizScreen from "../screens/games/QuizScreen";
import MotsMelesScreen from "../screens/games/MotsMelesScreen";
import AwaleScreen from "../screens/games/AwaleScreen";
import LudoScreen from "../screens/games/LudoScreen";
import SalonScreen from "../screens/games/SalonScreen";
import LeaderboardScreen from "../screens/games/LeaderboardScreen";
import StoriesScreen from "../screens/games/StoriesScreen";

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const CycleStack = createNativeStackNavigator();
const LibraryStack = createNativeStackNavigator();
const ForumStack = createNativeStackNavigator();

function CycleStackNavigator() {
  return (
    <CycleStack.Navigator screenOptions={{ headerShown: false }}>
      <CycleStack.Screen name="CycleHome" component={CycleScreen} />
      <CycleStack.Screen name="Symptoms" component={SymptomsScreen} options={{ headerShown: true, title: "" }} />
      <CycleStack.Screen name="Reminders" component={RemindersScreen} options={{ headerShown: true, title: "" }} />
    </CycleStack.Navigator>
  );
}

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen name="LibraryHome" component={LibraryScreen} />
      <LibraryStack.Screen name="Article" component={ArticleScreen} options={{ headerShown: true, title: "" }} />
    </LibraryStack.Navigator>
  );
}

function ForumStackNavigator() {
  return (
    <ForumStack.Navigator screenOptions={{ headerShown: false }}>
      <ForumStack.Screen name="ForumHome" component={ForumScreen} />
      <ForumStack.Screen name="ForumCategory" component={ForumCategoryScreen} options={{ headerShown: true, title: "" }} />
      <ForumStack.Screen name="NewPost" component={NewPostScreen} options={{ headerShown: true, title: "" }} />
      <ForumStack.Screen name="Thread" component={ThreadScreen} options={{ headerShown: true, title: "" }} />
    </ForumStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useI18n();
  return (
    <Tabs.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: t("tab_home") }} />
      <Tabs.Screen name="Cycle" component={CycleStackNavigator} options={{ title: t("tab_cycle") }} />
      <Tabs.Screen name="Library" component={LibraryStackNavigator} options={{ title: t("tab_library") }} />
      <Tabs.Screen name="Forum" component={ForumStackNavigator} options={{ title: t("tab_forum") }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: t("tab_settings") }} />
    </Tabs.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.rose} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user && user.mustChangePassword ? (
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        ) : user ? (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen name="Assistant" component={AssistantScreen} options={{ headerShown: true, title: "Conseillère IA" }} />
            <RootStack.Screen name="Course" component={CourseScreen} options={{ headerShown: true, title: "Formation" }} />
            <RootStack.Screen name="Test" component={TestScreen} options={{ headerShown: true, title: "Test" }} />
            <RootStack.Screen name="CourseVideos" component={CourseVideosScreen} options={{ headerShown: true, title: "Vidéos" }} />
            <RootStack.Screen name="MonCarnet" component={MonCarnetScreen} options={{ headerShown: true, title: "Mon Carnet" }} />
            <RootStack.Screen name="Carnet" component={CarnetScreen} options={{ headerShown: true, title: "" }} />
            <RootStack.Screen name="JeunesMamans" component={JeunesMamansScreen} options={{ headerShown: true, title: "Jeunes mamans" }} />
            <RootStack.Screen name="Centres" component={CentresScreen} options={{ headerShown: true, title: "Centres de santé" }} />
            <RootStack.Screen name="Live" component={LiveScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Formations" component={FormationsScreen} options={{ headerShown: true, title: "Formations" }} />
            <RootStack.Screen name="Partager" component={ShareScreen} options={{ headerShown: true, title: "Inviter une amie" }} />
            <RootStack.Screen name="Revenus" component={RevenusScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Professionnelles" component={ProfessionnellesScreen} options={{ headerShown: true, title: "Professionnelles" }} />
            <RootStack.Screen name="Urgence" component={UrgenceScreen} options={{ headerShown: true, title: "Urgence" }} />
            <RootStack.Screen name="ProSpace" component={ProSpaceScreen} options={{ headerShown: true, title: "Espace pro" }} />
            <RootStack.Screen name="Games" component={GamesHomeScreen} options={{ headerShown: true, title: "Jeux" }} />
            <RootStack.Screen name="Quiz" component={QuizScreen} options={{ headerShown: true, title: "Quiz" }} />
            <RootStack.Screen name="MotsMeles" component={MotsMelesScreen} options={{ headerShown: true, title: "Mots mêlés" }} />
            <RootStack.Screen name="Awale" component={AwaleScreen} options={{ headerShown: true, title: "Awalé" }} />
            <RootStack.Screen name="Ludo" component={LudoScreen} options={{ headerShown: true, title: "Ludo" }} />
            <RootStack.Screen name="Salon" component={SalonScreen} options={{ headerShown: true, title: "Mon salon" }} />
            <RootStack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: true, title: "Classement" }} />
            <RootStack.Screen name="Stories" component={StoriesScreen} options={{ headerShown: true, title: "Histoires" }} />
            <RootStack.Screen name="Admin" component={AdminScreen} options={{ headerShown: true, title: "Administration" }} />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthFlow} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
