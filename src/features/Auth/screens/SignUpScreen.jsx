import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SignUpScreen = ({onLogin, onBackPress, onContinuePress, onSignUp}) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    return (
        <View style={styles.container}>
        
        <View style={styles.header}> 
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thrail</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.pageTitle}>Sign Up</Text>

          <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.continueButton} onPress={() => onSignUp(email, password)}>
                <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>

            <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
                <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        maxWidth: 412,       
        alignSelf: 'center', 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 32,
        paddingTop: 32,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 8,
        marginBottom: 16, 
        paddingHorizontal: 16,
        height: 50,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        color: 'black',
        height: '100%',
        outlineStyle: 'none',
    },
    buttonContainer: {
        marginTop: 16,
        gap: 16,
    },
    continueButton: {
        backgroundColor: '#808080', 
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginButton: {
        backgroundColor: '#C0C0C0', 
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
})

export default SignUpScreen