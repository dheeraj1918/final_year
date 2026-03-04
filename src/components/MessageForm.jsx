import { useState } from "react";
import { SendOutlined, PaperClipOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { auth } from "../firebase";

// Helper function to determine MIME type from file extension
const getMimeTypeFromExtension = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

const MessageForm = ({ sendMessage, user }) => {
    const [value, setValue] = useState('');
    const [timerValue, setTimerValue] = useState('');
    const [showTimer, setShowTimer] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const text = value.trim();
        const timer = parseInt(timerValue, 10) || 0;
        if (text) {
            sendMessage({ text, timer: timer > 0 ? timer : null });
        }
        setValue('');
        setTimerValue('');
        setShowTimer(false);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Check auth first
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated. Please log in again.');
            }

            console.log('📋 Authentication Check:');
            console.log('  ✓ User logged in:', currentUser.email);
            console.log('  ✓ User UID:', currentUser.uid);
            console.log('  ✓ Auth token available');

            // Validate file size (20 MB limit)
            const maxSize = 20 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('File size exceeds 20 MB limit.');
            }

            console.log('📁 File Check:');
            console.log('  ✓ File name:', file.name);
            console.log('  ✓ File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
            console.log('  ✓ File type:', file.type || 'Not detected');

            const timer = parseInt(timerValue, 10) || 0;
            const fileExtension = file.name.split('.').pop();
            const simpleFileName = `${Date.now()}.${fileExtension}`;
            const storageRef = ref(storage, `files/${currentUser.uid}/${simpleFileName}`);
            
            const contentType = file.type || getMimeTypeFromExtension(file.name);
            
            const metadata = {
                contentType: contentType
            };
            
            console.log('☁️ Firebase Storage Info:');
            console.log('  ✓ Storage path: files/' + currentUser.uid + '/' + simpleFileName);
            console.log('  ✓ Content type:', contentType);
            console.log('  ✓ Storage bucket: chat-appln-c94b0.firebasestorage.app');
            
            console.log('⬆️ Starting file upload...');
            const uploadResult = await uploadBytes(storageRef, file, metadata);
            console.log('✅ Upload successful!');
            
            console.log('🔗 Getting download URL...');
            const downloadURL = await getDownloadURL(uploadResult.ref);
            console.log('✅ Download URL obtained');

            sendMessage({
                attachments: [{ file: downloadURL, type: contentType }],
                timer: timer > 0 ? timer : null
            });
            
            console.log('💬 Message sent successfully!');
            setTimerValue('');
            setShowTimer(false);
        } catch (err) {
            console.error('❌ ERROR DETAILS:');
            console.error('  Code:', err.code);
            console.error('  Message:', err.message);
            console.error('  Server Response:', err.serverResponse);
            console.error('  Full error:', JSON.stringify(err, null, 2));
            
            let userMessage = err.message;
            if (err.code === 'storage/unauthenticated') {
                userMessage = 'Authentication expired. Please refresh page and log in again.';
            } else if (err.code === 'storage/unauthorized') {
                userMessage = 'Permission denied. Check Storage rules in Firebase Console.';
            } else if (err.code === 'storage/unknown') {
                userMessage = 'Unknown error. Check Firebase Console Storage rules. Verify Blaze plan is active.';
            }
            
            alert('Upload failed: ' + userMessage);
        }
    };

    return (
        <div className="message-form-container">
            <form className="message-form" onSubmit={handleSubmit}>
                <input
                    className="message-input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Type a message..."
                    autoFocus
                />
                <div className="message-form-actions">
                    <label htmlFor="upload-button" className="action-btn">
                        <PaperClipOutlined />
                    </label>
                    <input
                        type="file"
                        id="upload-button"
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                        accept="image/*,video/*"
                    />
                    <button type="button" className="action-btn" onClick={() => setShowTimer(!showTimer)}>
                        <ClockCircleOutlined />
                    </button>
                    {showTimer && (
                        <input
                            type="text"
                            className="timer-input"
                            value={timerValue}
                            onChange={(e) => /^\d*$/.test(e.target.value) && setTimerValue(e.target.value)}
                            placeholder="min"
                        />
                    )}
                    <button type="submit" className="send-btn" disabled={!value.trim()}>
                        <SendOutlined />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageForm;