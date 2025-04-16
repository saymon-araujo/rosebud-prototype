declare module '@react-navigation/native';
declare module '@react-navigation/native-stack' {
  export type NativeStackScreenProps<
    ParamList extends Record<string, object | undefined>,
    RouteName extends keyof ParamList = string
  > = {
    navigation: any;
    route: any;
  };
}
declare module 'expo-status-bar';
declare module 'react-native-safe-area-context';
declare module 'expo-task-manager';
declare module 'expo-notifications' {
  export const AndroidNotificationPriority: {
    HIGH: string;
  };
  export const DEFAULT_ACTION_IDENTIFIER: string;
  export function cancelScheduledNotificationAsync(id: string): Promise<void>;
  export function scheduleNotificationAsync(options: any): Promise<string>;
  export function setNotificationCategoryAsync(categoryId: string, actions: any[]): Promise<void>;
  export function addNotificationReceivedListener(callback: (notification: any) => void): any;
  export function addNotificationResponseReceivedListener(callback: (response: any) => void): any;
  export function removeNotificationSubscription(subscription: any): void;
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  
  export interface Notification {
    request: any;
    date: Date;
  }
  
  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
  }
  
  export type Subscription = any;
};
declare module '@react-native-async-storage/async-storage';
declare module '@supabase/supabase-js';
declare module 'react-native-url-polyfill/auto';

declare module 'react' {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
}

declare module 'react-native' {
  export interface TextInputProps {
    style?: any;
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    secureTextEntry?: boolean;
  }
  
  export interface TouchableOpacityProps {
    style?: any;
    onPress?: () => void;
    disabled?: boolean;
  }
  
  export interface KeyboardAvoidingViewProps {
    behavior?: 'height' | 'position' | 'padding';
    style?: any;
  }
  
  export const Platform: {
    OS: string;
  };
  
  export const StyleSheet: {
    create: (styles: Record<string, any>) => Record<string, any>;
  };
  
  export const Alert: {
    alert: (title: string, message: string, buttons: Array<{ text: string; style?: string; onPress?: () => void }>) => void;
  };
  
  export const Linking: {
    openSettings: () => Promise<void>;
  };
  
  export function TextInput(props: TextInputProps): JSX.Element;
  export function TouchableOpacity(props: TouchableOpacityProps): JSX.Element;
  export function KeyboardAvoidingView(props: KeyboardAvoidingViewProps): JSX.Element;
  export function ActivityIndicator(props: any): JSX.Element;
  export function View(props: any): JSX.Element;
  export function Text(props: any): JSX.Element;
}

// React JSX namespace
declare namespace JSX {
  interface Element {}
} 