/**
 * Vanilla JS Logic for SocialApp
 * Pure JavaScript, No TypeScript, No React.
 */

// --- Persistence ---
function loadFromStorage(key, defaultVal) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
        console.error("Storage Error", e);
        return defaultVal;
    }
}

function saveToStorage(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

// --- Initial Data & State ---
const state = {
    posts: loadFromStorage('sharpfeed_posts', []),
    users: loadFromStorage('sharpfeed_users', []), 
    filter: "",
    sortBy: "latest", 
    isAuthenticated: false,
    currentUser: null,
    editingId: null
};

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const appView = document.getElementById('app-view');

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');

const signupForm = document.getElementById('signupForm');
const signupEmail = document.getElementById('signupEmail');
const signupUsername = document.getElementById('signupUsername'); 
const signupPassword = document.getElementById('signupPassword');
const signupError = document.getElementById('signupError');

const showSignupLink = document.getElementById('showSignupLink');
const showLoginLink = document.getElementById('showLoginLink');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const userProfile = document.getElementById('userProfile');

const feedContainer = document.getElementById('feed');
const postBtn = document.getElementById('postBtn');
const postText = document.getElementById('postText');
const imageUrl = document.getElementById('imageUrl');
const imageUpload = document.getElementById('imageUpload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const clearImageBtn = document.getElementById('clearImageBtn');

const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const statsDisplay = document.getElementById('statsDisplay');
const emojiContainer = document.getElementById('emojiContainer');

// Profile Modal Elements
const profileModal = document.getElementById('profileModal');
const profileUsernameInput = document.getElementById('profileUsernameInput');
const profileAvatarFile = document.getElementById('profileAvatarFile');
const profileAvatarUrl = document.getElementById('profileAvatarUrl');
const profileAvatarPreview = document.getElementById('profileAvatarPreview');
const profileAvatarInitial = document.getElementById('profileAvatarInitial');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');

const EMOJIS = ['🔥', '❤️', '👍', '😂', '🎉', '🚀', '💀', '👀'];

let uploadedImageBase64 = null;

// --- Helper Functions ---
function formatTime(ms) {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "now";
}

function getUsername(email) {
    const user = state.users.find(u => u.email === email);
    return user && user.username ? user.username : (email ? email.split('@')[0] : 'Anonymous');
}

function getUserAvatar(email) {
    const user = state.users.find(u => u.email === email);
    return user && user.avatar ? user.avatar : null;
}

function getProcessedPosts() {
    let filtered = state.posts.filter(post => 
        post.text.toLowerCase().includes(state.filter.toLowerCase())
    );

    return filtered.sort((a, b) => {
        const getLikes = (p) => Array.isArray(p.likedBy) ? p.likedBy.length : (p.likes || 0);
        if (state.sortBy === 'latest') return b.timestamp - a.timestamp;
        if (state.sortBy === 'oldest') return a.timestamp - b.timestamp;
        if (state.sortBy === 'mostLiked') return getLikes(b) - getLikes(a);
        return 0;
    });
}

function updateStats() {
    const total = state.posts.length;
    const totalLikes = state.posts.reduce((acc, curr) => {
        const likes = Array.isArray(curr.likedBy) ? curr.likedBy.length : (curr.likes || 0);
        return acc + likes;
    }, 0);
    
    if(statsDisplay) {
        statsDisplay.textContent = `${total} Posts • ${totalLikes} Likes`;
    }
}

// --- Core Logic ---

function createPostHTML(post) {
    const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const isLiked = state.currentUser && likedBy.includes(state.currentUser);
    const likeCount = likedBy.length;

    const authorUsername = getUsername(post.author);
    const authorAvatar = getUserAvatar(post.author);
    const authorInitial = authorUsername.charAt(0).toUpperCase();
    const isAuthor = state.currentUser && post.author === state.currentUser;

    const comments = Array.isArray(post.comments) ? post.comments : [];

    // Styling Constants
    const likeBtnClass = isLiked 
        ? "text-destructive hover:bg-destructive/10" 
        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground";
    const heartFill = isLiked ? "currentColor" : "none";

    // --- Edit Mode ---
    if (String(state.editingId) === String(post.id)) {
        return `
            <article class="rounded-lg border border-border bg-card text-card-foreground shadow-sm animate-fade-in">
                <div class="p-6 space-y-4">
                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <div class="h-6 w-6 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                            ${authorInitial}
                        </div>
                        <span>Editing ${authorUsername}'s post</span>
                    </div>
                    <textarea id="edit-input-${post.id}" class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">${post.text}</textarea>
                    <div class="flex gap-2 justify-end">
                        <button class="cancel-btn btn h-8 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80" data-id="${post.id}">
                            Cancel
                        </button>
                        <button class="save-btn btn h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90" data-id="${post.id}">
                            Save
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    // --- Actions Menu (Owner Only) ---
    let actionButtons = '';
    if (isAuthor) {
        actionButtons = `
            <div class="relative group">
                <button class="btn h-8 w-8 p-0 rounded-full hover:bg-secondary text-muted-foreground" aria-label="Options">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                </button>
                <div class="absolute right-0 top-8 w-32 rounded-md border border-border bg-popover text-popover-foreground shadow-md hidden group-hover:block group-focus-within:block z-20 py-1">
                    <button class="edit-btn w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" data-id="${post.id}">Edit</button>
                    <button class="delete-btn w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10" data-id="${post.id}">Delete</button>
                </div>
            </div>
        `;
    }

    // --- Comments HTML ---
    const commentsHTML = comments.map(c => {
        const commentUsername = getUsername(c.author);
        return `
        <div class="text-sm animate-fade-in">
            <span class="font-semibold text-foreground mr-1">${commentUsername}</span>
            <span class="text-muted-foreground">${c.text}</span>
        </div>
        `
    }).join('');

    // --- Standard View ---
    return `
        <article class="rounded-lg border border-border bg-card text-card-foreground shadow-sm animate-slide-up">
            
            <!-- Header -->
            <div class="p-6 pb-3 flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold border border-border overflow-hidden">
                        ${authorAvatar 
                            ? `<img src="${authorAvatar}" class="h-full w-full object-cover">` 
                            : authorInitial}
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold leading-none">${authorUsername}</h3>
                        <p class="text-xs text-muted-foreground mt-1">${formatTime(post.timestamp)}</p>
                    </div>
                </div>
                ${actionButtons}
            </div>

            <!-- Content -->
            <div class="px-6 py-2 space-y-3">
                <p class="text-sm leading-relaxed whitespace-pre-wrap text-foreground">${post.text}</p>
                ${post.image ? `
                    <div class="rounded-md border border-border overflow-hidden bg-muted">
                        <img src="${post.image}" class="w-full h-auto object-cover max-h-[500px]" alt="Post content">
                    </div>
                ` : ''}
            </div>
            
            <!-- Footer Actions -->
            <div class="px-6 py-3 flex items-center gap-4">
                <button class="like-btn btn h-9 px-3 gap-2 ${likeBtnClass}" data-id="${post.id}" aria-label="Like">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isLiked ? 'like-anim' : ''}" fill="${heartFill}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    <span class="text-xs font-medium">${likeCount || ''}</span>
                </button>

                <button class="btn h-9 px-3 gap-2 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground" onclick="document.getElementById('comment-input-${post.id}').focus()" aria-label="Comment">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                    </svg>
                    <span class="text-xs font-medium">${comments.length || ''}</span>
                </button>

                <button class="share-btn btn h-9 px-3 gap-2 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground ml-auto" data-id="${post.id}" aria-label="Share">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                </button>
            </div>

            <!-- Comments Section -->
            <div class="bg-muted/30 border-t border-border px-6 py-4 space-y-4">
                ${comments.length ? `
                    <div class="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                        ${commentsHTML}
                    </div>
                ` : ''}
                
                <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold overflow-hidden">
                        ${(() => {
                            const currentUserAvatar = getUserAvatar(state.currentUser);
                            const currentUsername = getUsername(state.currentUser);
                            return currentUserAvatar 
                                ? `<img src="${currentUserAvatar}" class="h-full w-full object-cover">`
                                : currentUsername.charAt(0).toUpperCase();
                        })()}
                    </div>
                    <div class="flex-1 relative">
                        <input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." 
                            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            onkeydown="if(event.key === 'Enter') document.querySelector('.submit-comment-btn[data-id=\'${post.id}\']').click()">
                    </div>
                    <button class="submit-comment-btn btn h-9 px-3 text-sm font-medium text-primary hover:text-primary/80" data-id="${post.id}">
                        Post
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderFeed() {
    if (!feedContainer) return;
    
    const posts = getProcessedPosts();
    feedContainer.innerHTML = posts.length ? posts.map(createPostHTML).join('') : `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-foreground">No posts yet</h3>
            <p class="text-sm text-muted-foreground mt-1 max-w-xs">It looks a bit empty here. Start the conversation by creating a new post!</p>
        </div>
    `;
    
    updateStats();
}

// --- Auth Logic ---
function handleAuth(e, type) {
    e.preventDefault();

    const errorEl = type === 'login' ? loginError : signupError;
    if (errorEl) errorEl.classList.add('hidden'); 

    if (type === 'login') {
        if (!emailInput || !passwordInput) return;
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) return;

        const user = state.users.find(u => u.email === email && u.password === password);
        if (user) {
            authenticateUser(email);
        } else {
            if(loginError) loginError.classList.remove('hidden');
        }
    } 
    else if (type === 'signup') {
        if (!signupEmail || !signupPassword || !signupUsername) return;
        const email = signupEmail.value.trim();
        const password = signupPassword.value.trim();
        const username = signupUsername.value.trim();
        if (!email || !password || !username) return;

        const exists = state.users.find(u => u.email === email);
        if (exists) {
            if(signupError) signupError.classList.remove('hidden');
            return;
        }
        state.users.push({ email, password, username, avatar: null });
        saveToStorage('sharpfeed_users', state.users);
        authenticateUser(email);
    }
}

function authenticateUser(email) {
    state.isAuthenticated = true;
    state.currentUser = email;
    saveToStorage('sharpfeed_session', email);

    if (userProfile) {
        const username = getUsername(email);
        const avatar = getUserAvatar(email);
        
        userProfile.innerHTML = ''; // Clear content
        if (avatar) {
            const img = document.createElement('img');
            img.src = avatar;
            img.className = "h-full w-full object-cover";
            userProfile.appendChild(img);
        } else {
            userProfile.textContent = username.charAt(0).toUpperCase();
        }
    }

    if(loginView) loginView.classList.add('hidden');
    if(signupView) signupView.classList.add('hidden');
    if(appView) {
        appView.classList.remove('hidden');
        appView.classList.add('animate-fade-in');
    }
    
    renderFeed();
}

function handleLogout() {
    state.isAuthenticated = false;
    state.currentUser = null;
    state.editingId = null;
    localStorage.removeItem('sharpfeed_session');
    
    if(appView) appView.classList.add('hidden');
    if(profileModal) profileModal.classList.add('hidden');
    if(loginView) loginView.classList.remove('hidden');
    
    if(emailInput) emailInput.value = '';
    if(passwordInput) passwordInput.value = '';
}

// --- Profile Modal Logic ---
let tempAvatar = null;

function openProfileModal() {
    if (!state.currentUser) return;
    const user = state.users.find(u => u.email === state.currentUser);
    if (!user) return;

    if(profileUsernameInput) profileUsernameInput.value = user.username || '';
    if(profileAvatarUrl) profileAvatarUrl.value = '';
    if(profileAvatarFile) profileAvatarFile.value = '';
    tempAvatar = user.avatar || null;
    
    updateProfilePreview(tempAvatar, user.username);
    if(profileModal) profileModal.classList.remove('hidden');
}

function closeProfileModal() {
    if(profileModal) profileModal.classList.add('hidden');
    tempAvatar = null;
}

function updateProfilePreview(src, username) {
    if (!profileAvatarPreview || !profileAvatarInitial) return;
    
    if (src) {
        profileAvatarPreview.src = src;
        profileAvatarPreview.classList.remove('hidden');
        profileAvatarInitial.classList.add('hidden');
    } else {
        profileAvatarPreview.src = '';
        profileAvatarPreview.classList.add('hidden');
        profileAvatarInitial.classList.remove('hidden');
        profileAvatarInitial.textContent = (username || 'U').charAt(0).toUpperCase();
    }
}

// --- Actions ---
function clearImagePreview() {
    if(imageUrl) imageUrl.value = '';
    if(imageUpload) imageUpload.value = '';
    uploadedImageBase64 = null;
    if(imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
    if(imagePreview) imagePreview.src = '';
}

function handlePost() {
    if(!postText) return; 
    const text = postText.value.trim();
    const img = uploadedImageBase64 || (imageUrl ? imageUrl.value.trim() : null);

    if (!text && !img) return; 

    const username = getUsername(state.currentUser);

    const newPost = {
        id: Date.now(),
        text: text,
        image: img || null,
        timestamp: Date.now(),
        likes: 0,
        likedBy: [],
        comments: [], 
        author: state.currentUser,
        authorUsername: username 
    };

    state.posts.unshift(newPost);
    saveToStorage('sharpfeed_posts', state.posts);
    
    postText.value = "";
    clearImagePreview();
    renderFeed();
}

async function sharePost(id) {
    const post = state.posts.find(p => String(p.id) === String(id));
    if (!post) return;

    const shareData = {
        title: `Post by ${getUsername(post.author)}`,
        text: post.text,
        url: `${window.location.origin}?post=${post.id}`
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
            alert('Link copied to clipboard!');
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
}

function handleAddComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    const post = state.posts.find(p => String(p.id) === String(postId));
    if (post) {
        if (!Array.isArray(post.comments)) post.comments = [];
        
        const newComment = {
            id: Date.now(),
            text: text,
            author: state.currentUser,
            username: getUsername(state.currentUser),
            timestamp: Date.now()
        };

        post.comments.push(newComment);
        saveToStorage('sharpfeed_posts', state.posts);
        renderFeed();
    }
}

function toggleLike(id) {
    if (!state.currentUser) return;
    const post = state.posts.find(p => String(p.id) === String(id));
    if (post) {
        if (!Array.isArray(post.likedBy)) post.likedBy = [];
        
        const idx = post.likedBy.indexOf(state.currentUser);
        if (idx === -1) {
            post.likedBy.push(state.currentUser);
        } else {
            post.likedBy.splice(idx, 1);
        }
        
        post.likes = post.likedBy.length;
        saveToStorage('sharpfeed_posts', state.posts);
        renderFeed();
    }
}

function deletePost(id) {
    const post = state.posts.find(p => String(p.id) === String(id));
    if (!post || post.author !== state.currentUser) return;

    if(window.confirm("Are you sure you want to delete this post?")) {
        state.posts = state.posts.filter(p => String(p.id) !== String(id));
        saveToStorage('sharpfeed_posts', state.posts);
        renderFeed();
    }
}

function startEdit(id) { state.editingId = id; renderFeed(); }
function cancelEdit() { state.editingId = null; renderFeed(); }

function saveEdit(id, newText) {
    const post = state.posts.find(p => String(p.id) === String(id));
    if (post && post.author === state.currentUser) {
        post.text = newText.trim();
        saveToStorage('sharpfeed_posts', state.posts);
    }
    state.editingId = null;
    renderFeed();
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}

// --- Event Listeners ---
if (loginForm) loginForm.addEventListener('submit', (e) => handleAuth(e, 'login'));
if (signupForm) signupForm.addEventListener('submit', (e) => handleAuth(e, 'signup'));
if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); if(loginView) loginView.classList.add('hidden'); if(signupView) signupView.classList.remove('hidden'); });
if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); if(signupView) signupView.classList.add('hidden'); if(loginView) loginView.classList.remove('hidden'); });
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

// Profile Event Listeners
if (userProfile) userProfile.addEventListener('click', openProfileModal);
if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', closeProfileModal);
if (profileModal) profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
});

if (profileAvatarFile) {
    profileAvatarFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                tempAvatar = reader.result;
                updateProfilePreview(tempAvatar, profileUsernameInput ? profileUsernameInput.value : '');
                if(profileAvatarUrl) profileAvatarUrl.value = ''; // Clear URL input
            };
            reader.readAsDataURL(file);
        }
    });
}

if (profileAvatarUrl) {
    profileAvatarUrl.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
            tempAvatar = url;
            if(profileAvatarFile) profileAvatarFile.value = ''; // Clear file input
        } else {
            tempAvatar = null;
        }
        updateProfilePreview(tempAvatar, profileUsernameInput ? profileUsernameInput.value : '');
    });
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        if (!state.currentUser) return;
        const newUsername = profileUsernameInput.value.trim();
        if (!newUsername) {
            alert("Username cannot be empty");
            return;
        }

        const userIndex = state.users.findIndex(u => u.email === state.currentUser);
        if (userIndex !== -1) {
            state.users[userIndex].username = newUsername;
            state.users[userIndex].avatar = tempAvatar;
            saveToStorage('sharpfeed_users', state.users);
            
            // Update UI
            authenticateUser(state.currentUser); 
            renderFeed(); 
            closeProfileModal();
        }
    });
}

if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                uploadedImageBase64 = reader.result;
                if(imagePreview) imagePreview.src = uploadedImageBase64;
                if(imagePreviewContainer) imagePreviewContainer.classList.remove('hidden');
                if(imageUrl) imageUrl.value = '';
            };
            reader.readAsDataURL(file);
        }
    });
}

if (imageUrl) imageUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
        uploadedImageBase64 = null;
        if(imagePreview) imagePreview.src = url;
        if(imagePreviewContainer) imagePreviewContainer.classList.remove('hidden');
    } else {
        if(imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
    }
});

if (imagePreview) {
    imagePreview.addEventListener('error', () => {
         if(imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
    });
    imagePreview.addEventListener('load', () => {
        if(imagePreview.src && imagePreview.src !== window.location.href) {
             if(imagePreviewContainer) imagePreviewContainer.classList.remove('hidden');
        }
    });
}

if (clearImageBtn) clearImageBtn.addEventListener('click', (e) => { e.preventDefault(); clearImagePreview(); });

if (postBtn) postBtn.addEventListener('click', handlePost);
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (searchInput) searchInput.addEventListener('input', (e) => { state.filter = e.target.value; renderFeed(); });
if (sortSelect) sortSelect.addEventListener('change', (e) => { state.sortBy = e.target.value; renderFeed(); });

if (emojiContainer) {
    EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.className = "btn h-8 w-8 p-0 text-lg hover:bg-accent rounded-md transition-colors";
        btn.onclick = () => { if(postText) { postText.value += emoji; postText.focus(); } };
        emojiContainer.appendChild(btn);
    });
}

if (feedContainer) {
    feedContainer.addEventListener('click', (e) => {
        const t = e.target;
        const likeBtn = t.closest('.like-btn');
        const editBtn = t.closest('.edit-btn');
        const delBtn = t.closest('.delete-btn');
        const saveBtn = t.closest('.save-btn');
        const cancelBtn = t.closest('.cancel-btn');
        const submitCommentBtn = t.closest('.submit-comment-btn');
        const shareBtn = t.closest('.share-btn');

        if (likeBtn) toggleLike(likeBtn.dataset.id);
        if (delBtn) deletePost(delBtn.dataset.id);
        if (editBtn) startEdit(editBtn.dataset.id);
        if (cancelBtn) cancelEdit();
        if (submitCommentBtn) handleAddComment(submitCommentBtn.dataset.id);
        if (shareBtn) sharePost(shareBtn.dataset.id);
        if (saveBtn) {
            const id = saveBtn.dataset.id;
            const txt = document.getElementById(`edit-input-${id}`);
            if (txt) saveEdit(id, txt.value);
        }
    });
}

initTheme();
const savedSession = loadFromStorage('sharpfeed_session', null);
if (savedSession) authenticateUser(savedSession);