import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // For generating unique session IDs

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(() => {
        // Get session ID from session storage, or generate new if not present
        let storedSessionId = sessionStorage.getItem('chatSessionId');
        if (!storedSessionId) {
            storedSessionId = uuidv4();
            sessionStorage.setItem('chatSessionId', storedSessionId);
        }
        return storedSessionId;
    });
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { role: 'user', parts: [{ text: input }] };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/chat', {
                sessionId,
                message: input,
            });

            // Update session ID in case the backend generated a new one
            setSessionId(res.data.sessionId);
            // Update messages with the full history returned by the backend
            setMessages(res.data.history);

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prevMessages) => [
                ...prevMessages,
                { role: 'model', parts: [{ text: "I'm sorry, I couldn't process that. Please try again." }] },
            ]);
            // If there's a server error and the backend invalidates the session,
            // generate a new session ID for the next attempt.
            if (error.response && error.response.data.sessionId === null) {
                const newId = uuidv4();
                sessionStorage.setItem('chatSessionId', newId);
                setSessionId(newId);
                setMessages([]); // Clear messages for the new session
                console.log('Session invalidated by backend. Starting a new session.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gemini Chatbot (Session-Based)</h1>
            <div style={styles.messageList}>
                {messages.length === 0 && (
                    <div style={styles.welcomeMessage}>
                        Start a conversation! Type your message below.
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.messageBubble,
                            ...(msg.role === 'user' ? styles.userMessage : styles.botMessage),
                        }}
                    >
                        {msg.parts.map((part, pIndex) => (
                            <span key={pIndex}>{part.text}</span>
                        ))}
                    </div>
                ))}
                {isLoading && (
                    <div style={styles.loadingMessage}>
                        <span>Bot is typing... 💬</span>
                    </div>
                )}
                <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            </div>
            <div style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    style={styles.inputField}
                    disabled={isLoading}
                />
                <button onClick={sendMessage} style={styles.sendButton} disabled={isLoading}>
                    Send
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        width: 'min(90%, 600px)',
        height: '70vh',
        margin: '50px auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '15px',
        textAlign: 'center',
        margin: 0,
        fontSize: '1.2em',
    },
    messageList: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
    },
    welcomeMessage: {
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
        marginTop: '20px',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: '10px 15px',
        borderRadius: '15px',
        marginBottom: '10px',
        wordWrap: 'break-word',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#DCF8C6',
        color: '#333',
        borderBottomRightRadius: '2px',
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#EAEAEA',
        color: '#333',
        borderBottomLeftRadius: '2px',
    },
    loadingMessage: {
        alignSelf: 'flex-start',
        color: '#555',
        fontStyle: 'italic',
        marginBottom: '10px',
        padding: '10px 15px',
    },
    inputArea: {
        display: 'flex',
        padding: '15px',
        borderTop: '1px solid #ddd',
        backgroundColor: '#fff',
    },
    inputField: {
        flexGrow: 1,
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginRight: '10px',
        fontSize: '1em',
    },
    sendButton: {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#0056b3',
        },
        '&:disabled': {
            backgroundColor: '#cccccc',
            cursor: 'not-allowed',
        },
    },
};

export default Chatbot;
