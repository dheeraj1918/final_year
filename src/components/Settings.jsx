import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';

// Helper function to determine MIME type from file extension
const getMimeTypeFromExtension = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
};

const Settings = ({ user, setCurrentUser }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [photo, setPhoto] = useState(null);
    const [photoURL, setPhotoURL] = useState(user.photoURL || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!auth.currentUser) {
                throw new Error('User not authenticated. Please log in again.');
            }

            let newPhotoURL = photoURL;
            if (photo) {
                // Validate file size (5 MB limit)
                const maxSize = 5 * 1024 * 1024;
                if (photo.size > maxSize) {
                    throw new Error('Image size exceeds 5 MB limit.');
                }

                // Generate a unique filename to avoid conflicts and special character issues
                const timestamp = Date.now();
                const fileExtension = photo.name.split('.').pop();
                const fileName = `avatar_${timestamp}.${fileExtension}`;
                const photoRef = ref(storage, `images/${user.uid}/${fileName}`);
                
                // Get MIME type from file object or fallback to extension-based detection
                const contentType = photo.type || getMimeTypeFromExtension(photo.name);
                
                const metadata = {
                    contentType: contentType,
                    cacheControl: 'public, max-age=3600'
                };
                
                console.log('Uploading avatar for user:', user.uid);
                await uploadBytes(photoRef, photo, metadata);
                console.log('✓ Avatar uploaded successfully!');
                
                console.log('Getting download URL...');
                newPhotoURL = await getDownloadURL(photoRef);
                console.log('✓ Avatar download URL obtained');
            }

            await updateProfile(auth.currentUser, {
                displayName: displayName,
                photoURL: newPhotoURL,
            });
            
            setPhotoURL(newPhotoURL);
            alert('Profile updated successfully! Refresh to see changes everywhere.');

        } catch (err) {
            console.error('❌ Profile update error:');
            console.error('  Code:', err.code);
            console.error('  Message:', err.message);
            
            let userMessage = err.message;
            if (err.code === 'storage/unauthenticated') {
                userMessage = 'Authentication expired. Please refresh and log in again.';
            } else if (err.code === 'storage/unknown') {
                userMessage = 'Upload failed. Please check your internet connection and try again.';
            }
            
            setError(`Error: ${userMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoURL(e.target.result);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="settings-page">
            <h2>User Profile</h2>
            <form onSubmit={handleSubmit}>
                <div className="avatar-section">
                    <img src={photoURL} alt="Avatar" className="profile-avatar" />
                    <input type="file" onChange={handlePhotoChange} accept="image/*" />
                </div>
                <div className="input-group">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={user.email}
                        disabled
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
};

export default Settings;
