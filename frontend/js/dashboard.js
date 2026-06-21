const API_BASE_URL = 'http://localhost:8000/api';

let chatHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Sidebar & Tabs
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(m => m.classList.remove('active'));
            tabContents.forEach(t => t.classList.add('hidden'));
            
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Platform Tabs
    const platformTabs = document.querySelectorAll('.platform-tab');
    let currentPlatform = 'linkedin';

    platformTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            platformTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentPlatform = tab.getAttribute('data-platform');
            renderRecruitersForPlatform(currentPlatform);
        });
    });

    // Elements
    const skillsInput = document.getElementById('skills');
    const experienceInput = document.getElementById('experience');
    const educationInput = document.getElementById('education');
    const positionInput = document.getElementById('position');
    const locationInput = document.getElementById('location');
    const profileForm = document.getElementById('profile-form');
    const recommendBtn = document.getElementById('recommend-btn');
    const saveBtn = document.getElementById('save-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const msgBox = document.getElementById('msg-box');
    const loader = document.getElementById('loader');
    const streakCount = document.getElementById('streak-count');

    function showMessage(msg, isError = true) {
        msgBox.textContent = msg;
        msgBox.className = isError ? 'error-message' : 'success-message';
        msgBox.classList.remove('hidden');
        setTimeout(() => msgBox.classList.add('hidden'), 5000);
    }

    // Load Profile
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, { headers });
        if (response.ok) {
            const profile = await response.json();
            skillsInput.value = profile.skills || '';
            experienceInput.value = profile.experience || '';
            educationInput.value = profile.education || '';
            positionInput.value = profile.position || '';
            locationInput.value = profile.location || '';
            streakCount.textContent = profile.current_streak || 0;
            
            if (profile.recommendations_data) {
                const data = JSON.parse(profile.recommendations_data);
                renderRecommendations(data);
                sessionStorage.setItem('ai_recommendations', profile.recommendations_data);
                recommendBtn.classList.add('hidden');
                document.querySelectorAll('.recomm-tab').forEach(el => el.classList.remove('hidden'));
            }
        } else if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('Failed to load profile', err);
    }
    
    // Load Scores
    try {
        const scoreRes = await fetch(`${API_BASE_URL}/games/scores`, { headers });
        if (scoreRes.ok) {
            const scores = await scoreRes.json();
            const scoreHistory = document.getElementById('score-history');
            if (scores.length > 0) {
                scoreHistory.innerHTML = scores.map(s => 
                    `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--primary-color); font-weight: 600;">${s.score} pts</span> in ${s.game_name} 
                        <span style="font-size: 0.8rem; color: #666; float:right;">${new Date(s.played_at).toLocaleDateString()}</span>
                    </li>`
                ).join('');
            } else {
                scoreHistory.innerHTML = '<li>No games played yet. Let\'s get started!</li>';
            }
        }
    } catch (e) {
        console.error(e);
    }

    // Notifications System
    const notifBell = document.getElementById('notification-bell');
    const notifDropdown = document.getElementById('notification-dropdown');
    const notifBadge = document.getElementById('notification-badge');
    const notifList = document.getElementById('notification-list');
    
    // Toggle dropdown
    notifBell.addEventListener('click', () => {
        notifDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!notifBell.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.add('hidden');
        }
    });

    // Fetch Notifications
    try {
        const notifRes = await fetch(`${API_BASE_URL}/notifications`, { headers });
        if (notifRes.ok) {
            const notifications = await notifRes.json();
            
            if (notifications.length > 0) {
                notifBadge.textContent = notifications.length;
                notifBadge.classList.remove('hidden');
                
                notifList.innerHTML = notifications.map(n => {
                    const typeClass = n.type === 'jobfair' ? 'notification-type-jobfair' : 'notification-type-interview';
                    const typeIcon = n.type === 'jobfair' ? '🎪' : '👔';
                    const dateParsed = new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    
                    return `
                        <li class="notification-item">
                            <div style="display:flex; justify-content: space-between; align-items: center;">
                                <span class="${typeClass}">${typeIcon} ${n.type}</span>
                                <span style="font-size: 0.7rem; color: #666;">${dateParsed}</span>
                            </div>
                            <div class="notification-title">${n.title}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${n.message}</div>
                        </li>
                    `;
                }).join('');
                
                // Also populate alerts section
                const alertsList = document.getElementById('alerts-list');
                alertsList.innerHTML = notifList.innerHTML;
            } else {
                notifList.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No new notifications</li>';
                const alertsList = document.getElementById('alerts-list');
                alertsList.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No notifications available</li>';
            }
        }
    } catch (e) {
        console.error('Failed to load notifications', e);
    }

    // Save Profile
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const requestBody = {
            skills: skillsInput.value,
            experience: experienceInput.value,
            education: educationInput.value,
            position: positionInput.value,
            location: locationInput.value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                showMessage('Profile saved successfully!', false);
            } else {
                showMessage('Failed to save profile.');
            }
        } catch (err) {
            showMessage('Network error.');
        } finally {
            saveBtn.textContent = 'Save Profile';
            saveBtn.disabled = false;
        }
    });

    // Get Recommendations
    recommendBtn.addEventListener('click', async () => {
        if (!skillsInput.value && !experienceInput.value) {
            showMessage('Please add some skills or experience first before analyzing!');
            return;
        }
        saveBtn.click();
        recommendBtn.disabled = true;
        saveBtn.disabled = true;
        loader.classList.remove('hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/recommendations`, { method: 'POST', headers });
            if (response.ok) {
                const data = await response.json();
                renderRecommendations(data);
                sessionStorage.setItem('ai_recommendations', JSON.stringify(data));
                document.querySelectorAll('.recomm-tab').forEach(el => el.classList.remove('hidden'));
                recommendBtn.classList.add('hidden');
                showMessage('AI Analysis Complete!', false);
                
                // Auto switch to overview tab
                document.querySelector('[data-target="overview-section"]').click();
            } else {
                const errData = await response.json();
                showMessage(errData.detail || 'Failed to get recommendations.');
            }
        } catch (err) {
            showMessage('Network error. Failed to reach the server.');
        } finally {
            recommendBtn.disabled = false;
            saveBtn.disabled = false;
            loader.classList.add('hidden');
        }
    });

    // Chatbot Submit
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryEl = document.getElementById('chat-history');
    const chatSendBtn = document.getElementById('chat-send-btn');
    
    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `chat-message ${role}`;
        div.style.padding = '1rem';
        div.style.borderRadius = '8px';
        div.style.maxWidth = '80%';
        div.style.color = 'var(--text-primary)';
        div.style.marginBottom = '1rem';
        
        if (role === 'user') {
            div.style.alignSelf = 'flex-end';
            div.style.background = 'rgba(46, 160, 67, 0.1)';
            div.style.border = '1px solid rgba(46, 160, 67, 0.3)';
        } else {
            div.style.alignSelf = 'flex-start';
            div.style.background = 'rgba(88, 166, 255, 0.1)';
            div.style.border = '1px solid rgba(88, 166, 255, 0.3)';
        }
        div.innerHTML = text.replace(/\n/g, '<br>');
        chatHistoryEl.appendChild(div);
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if(!text) return;
        
        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });
        chatInput.value = '';
        chatSendBtn.disabled = true;
        
        try {
            const res = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ messages: chatHistory })
            });
            if (res.ok) {
                const data = await res.json();
                appendMessage('assistant', data.reply);
                chatHistory.push({ role: 'assistant', content: data.reply });
            } else {
                appendMessage('assistant', 'Sorry, I encountered an error answering that.');
            }
        } catch (e) {
            appendMessage('assistant', 'Network error reaching the AI coach.');
        } finally {
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    });

    // Resume Upload handlers...
    const resumeUpload = document.getElementById('resume-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadBtn = document.getElementById('upload-btn');
    
    resumeUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            uploadBtn.classList.remove('hidden');
        }
    });

    uploadBtn.addEventListener('click', async () => {
        const file = resumeUpload.files[0];
        if (!file) return;
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Extracting...';
        loader.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/upload-resume`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (response.ok) {
                const data = await response.json();
                if (data.skills) skillsInput.value = data.skills;
                if (data.experience) experienceInput.value = data.experience;
                if (data.education) educationInput.value = data.education;
                if (data.position) positionInput.value = data.position;
                showMessage('Profile extracted from resume! Review and save.', false);
                uploadBtn.classList.add('hidden');
            } else {
                showMessage('Failed to extract profile.');
            }
        } catch (err) {
            showMessage('Network error.');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Extract Profile';
            loader.classList.add('hidden');
        }
    });

    // ATS Scanner Logic
    const atsForm = document.getElementById('ats-form');
    const atsResumeFile = document.getElementById('ats-resume-file');
    const atsFileName = document.getElementById('ats-file-name');
    const atsJobDesc = document.getElementById('ats-job-desc');
    const atsScanBtn = document.getElementById('ats-scan-btn');
    const atsLoader = document.getElementById('ats-loader');
    const atsResults = document.getElementById('ats-results');
    const atsScore = document.getElementById('ats-score');
    const atsFound = document.getElementById('ats-found');
    const atsMissing = document.getElementById('ats-missing');
    const atsSuggestions = document.getElementById('ats-suggestions');

    atsResumeFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            atsFileName.textContent = e.target.files[0].name;
            atsFileName.style.color = 'var(--primary-color)';
        } else {
            atsFileName.textContent = 'No file chosen';
            atsFileName.style.color = 'var(--text-secondary)';
        }
    });

    atsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = atsResumeFile.files[0];
        if (!file) {
            alert("Please select a PDF resume to scan.");
            return;
        }
        
        const jobDescText = atsJobDesc.value.trim();
        if (!jobDescText) return;

        atsScanBtn.disabled = true;
        atsScanBtn.textContent = 'Scanning...';
        atsLoader.classList.remove('hidden');
        atsResults.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('job_description', jobDescText);

        try {
            const response = await fetch(`${API_BASE_URL}/ats/check`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                
                // Render score
                atsScore.textContent = `${data.match_score}%`;
                if (data.match_score >= 80) atsScore.style.color = 'var(--success-color)';
                else if (data.match_score >= 50) atsScore.style.color = '#d2a8ff';
                else atsScore.style.color = 'var(--error-color)';

                // Render found keywords
                atsFound.innerHTML = data.found_keywords.map(kw => 
                    `<span class="badge" style="background: rgba(46, 160, 67, 0.15); color: var(--success-color); border: 1px solid rgba(46,160,67,0.3);">${kw}</span>`
                ).join('');

                // Render missing keywords
                atsMissing.innerHTML = data.missing_keywords.map(kw => 
                    `<span class="badge" style="background: rgba(248, 81, 73, 0.15); color: var(--error-color); border: 1px solid rgba(248,81,73,0.3);">${kw}</span>`
                ).join('');

                // Render suggestions
                atsSuggestions.innerHTML = data.suggested_changes ? data.suggested_changes.replace(/\\n/g, '<br>') : 'No suggestions provided.';
                
                atsResults.classList.remove('hidden');
            } else {
                alert('Failed to scan resume. Please try again.');
            }
        } catch (err) {
            alert('Network error during scanning.');
        } finally {
            atsScanBtn.disabled = false;
            atsScanBtn.textContent = 'Scan Match against Job';
            atsLoader.classList.add('hidden');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('access_token');
        window.location.href = 'index.html';
    });

let potentialRecruiters = [];

    function renderRecommendations(data) {
        document.getElementById('ai-analysis').textContent = data.analysis || "No analysis provided.";
        document.getElementById('ai-gaps').textContent = data.gap_analysis || "No gap analysis provided.";
        
        let labels = [];
        let matchData = [];
        let demandData = [];
        
        const aiRoles = document.getElementById('ai-roles');
        if (data.matched_roles && Array.isArray(data.matched_roles)) {
            aiRoles.innerHTML = data.matched_roles.map(roleObj => {
                if (typeof roleObj === 'string') {
                    labels.push(roleObj);
                    matchData.push(Math.floor(Math.random() * 40) + 60);
                    demandData.push(Math.floor(Math.random() * 40) + 60);
                    return `<span class="badge">${roleObj}</span>`;
                } else {
                    labels.push(roleObj.role);
                    matchData.push(roleObj.match_percentage);
                    demandData.push(roleObj.market_demand_score);
                    return `<span class="badge">${roleObj.role} - Match ${roleObj.match_percentage}%</span>`;
                }
            }).join('');
        }
        
        initCharts(labels, matchData, demandData);
        
        const aiCourses = document.getElementById('ai-courses');
        if (data.course_recommendations) {
            aiCourses.innerHTML = data.course_recommendations.map(course => `
                <div class="course-card">
                    <span class="course-platform">${course.platform || 'General'}</span>
                    <div class="course-title">${course.course_name || 'Suggested Course'}</div>
                    <div class="course-reason">${course.reason || ''}</div>
                </div>
            `).join('');
        }
        
        if (data.potential_recruiters) {
            potentialRecruiters = data.potential_recruiters;
            renderRecruitersForPlatform(currentPlatform);
        }
    }

function renderRecruitersForPlatform(platform) {
 const aiRecruiters = document.getElementById('ai-recruiters');
 const recruitersCount = document.getElementById('recruiters-count');
 const location = locationInput.value.trim() ? encodeURIComponent(locationInput.value) : '';
 const position = positionInput.value.trim() ? positionInput.value.trim() : '';

 const generateSearchId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
   const r = Math.random() * 16 | 0;
   const v = c === 'x' ? r : (r & 0x3 | 0x8);
   return v.toString(16);
 });

 const normalizeSlug = (text) => text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, '-');
 const makeSearchText = (recruiter) => {
   const parts = [position, recruiter].filter(Boolean).join(' ').trim();
   return parts ? `${parts} jobs` : 'jobs';
 };
 const buildNaukriUrl = (recruiter) => {
   const queryText = [position, recruiter].filter(Boolean).join(' ').trim();
   const rawLocation = locationInput.value.trim();
   const locationSlug = rawLocation ? normalizeSlug(rawLocation) : '';
   const keywordSlug = normalizeSlug(queryText || recruiter || position || 'jobs');
   const experienceYears = parseInt(experienceInput.value, 10);
   const experienceParam = Number.isFinite(experienceYears) && experienceYears >= 0 ? experienceYears : 0;
   const url = `https://www.naukri.com/${keywordSlug}-jobs${locationSlug ? `-in-${locationSlug}` : ''}`;
   return `${url}?k=${encodeURIComponent(queryText || recruiter || position || '')}${rawLocation ? `&l=${encodeURIComponent(rawLocation)}` : ''}&experience=${experienceParam}`;
 };
 const buildFounditUrl = (recruiter) => {
   const rawLocation = locationInput.value.trim();
   const queryText = position ? `"${position}"${recruiter ? `%2C"${recruiter}"` : ''}` : recruiter ? `"${recruiter}"` : '';
   const experienceYears = parseInt(experienceInput.value, 10);
   const experienceParam = Number.isFinite(experienceYears) && experienceYears >= 0 ? experienceYears : 0;
   const locationsParam = rawLocation ? rawLocation.replace(/\s*\/\s*/g, '+%2F+').replace(/,/g, '').replace(/\s+/g, '+') : '';
   const entityParams = [];
   if (position) entityParams.push(`queryEntity=${encodeURIComponent(position.toLowerCase())}%3Adesignation`);
   if (recruiter) entityParams.push(`queryEntity=${encodeURIComponent(recruiter.toLowerCase())}%3Acompany`);
   let url = `https://www.foundit.in/srp/results?query=${queryText}`;
   if (locationsParam) url += `&locations=${locationsParam}`;
   url += `&experienceRanges=${experienceParam}%7E${experienceParam}&experience=${experienceParam}`;
   if (entityParams.length) url += `&${entityParams.join('&')}`;
   url += `&searchId=${generateSearchId()}`;
   return url;
 };

 const platformUrls = {
 linkedin: (recruiter) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(makeSearchText(recruiter))}${location ? '&location=' + location : ''}`,
 indeed: (recruiter) => `https://www.indeed.com/jobs?q=${encodeURIComponent(makeSearchText(recruiter))}${location ? '&l=' + location : ''}`,
 glassdoor: (recruiter) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(makeSearchText(recruiter))}${location ? '&sc.location=' + location : ''}`,
 monster: (recruiter) => buildFounditUrl(recruiter),
 naukri: (recruiter) => buildNaukriUrl(recruiter)
 };

 const platformIcons = {
 linkedin: '<img src="img/linkedin.png" alt="LinkedIn" style="width: 16px; height: 16px; vertical-align: middle;">',
 indeed: '<img src="img/Indeed.png" alt="Indeed" style="width: 16px; height: 16px; vertical-align: middle;">',
 glassdoor: '<img src="img/glassdoor.png" alt="Glassdoor" style="width: 16px; height: 16px; vertical-align: middle;">',
 monster: '<img src="img/foundit.png" alt="Foundit" style="width: 16px; height: 16px; vertical-align: middle;">',
 naukri: '<img src="img/Naukri.png" alt="Naukri" style="width: 16px; height: 16px; vertical-align: middle;">'
 };

 const platformNames = {
 linkedin: 'LinkedIn',
 indeed: 'Indeed',
 glassdoor: 'Glassdoor',
 monster: 'Monster',
 naukri: 'Naukri'
 };

 // Update count
 if (recruitersCount) {
 recruitersCount.innerHTML = `${potentialRecruiters.length} companies found on ${platformNames[platform]} ${platformIcons[platform]}`;
 }

 // Render company cards
 aiRecruiters.innerHTML = potentialRecruiters.map(recruiter => {
 const url = platformUrls[platform](recruiter);
 const icon = platformIcons[platform];
 const name = platformNames[platform];

 return `
 <div class="company-card" onclick="window.open('${url}', '_blank')">
 <div class="company-name">${recruiter}</div>
 <a href="${url}" target="_blank" class="company-link">
 <span class="platform-icon">${icon}</span>
 <span>Search on ${name}</span>
 </a>
 </div>
 `;
 }).join('');
}

    let matchChartInstance = null;
    let demandChartInstance = null;
    function initCharts(labels, matchData, demandData) {
        if (matchChartInstance) matchChartInstance.destroy();
        if (demandChartInstance) demandChartInstance.destroy();
        
        const matchCtx = document.getElementById('matchChart').getContext('2d');
        matchChartInstance = new Chart(matchCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Match Percentage', data: matchData, backgroundColor: 'rgba(88, 166, 255, 0.6)', borderColor: 'rgba(88, 166, 255, 1)', borderWidth: 1, borderRadius: 4 }]
            },
            options: { responsive: true, scales: { y: { max: 100, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: '#c9d1d9' } } } }
        });

        const demandCtx = document.getElementById('demandChart').getContext('2d');
        demandChartInstance = new Chart(demandCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Market Demand Score', data: demandData, backgroundColor: 'rgba(210, 168, 255, 0.2)', borderColor: 'rgba(210, 168, 255, 1)', borderWidth: 2, fill: true, tension: 0.3 }]
            },
            options: { responsive: true, scales: { y: { max: 100, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: '#c9d1d9' } } } }
        });
    }

});

// Global game functions
let currentGame = '';
let currentScore = 0;

window.startTriviaGame = () => {
    document.getElementById('game-play-area').classList.remove('hidden');
    document.getElementById('active-game-title').textContent = "Developer Trivia Quiz";
    document.getElementById('game-content').innerHTML = `
        <p>What does CSS stand for?</p>
        <button onclick="finishGame('Trivia', 10)" style="margin: 0.5rem; width: auto;">Cascading Style Sheets</button>
        <button onclick="finishGame('Trivia', 0)" style="margin: 0.5rem; width: auto; background: var(--surface-color);">Computer Style System</button>
    `;
    document.getElementById('submit-score-btn').classList.add('hidden');
};

window.startTypingGame = () => {
    document.getElementById('game-play-area').classList.remove('hidden');
    document.getElementById('active-game-title').textContent = "Code Speed Typing";
    document.getElementById('game-content').innerHTML = `
        <p>Type this: <code>const x = (y) => y * 2;</code></p>
        <input type="text" id="typing-input" onkeyup="checkTyping(this.value)" style="width: 80%; text-align:center;">
    `;
    document.getElementById('submit-score-btn').classList.add('hidden');
    setTimeout(() => { document.getElementById('typing-input').focus(); }, 100);
};

window.checkTyping = (val) => {
    if (val === "const x = (y) => y * 2;") {
        finishGame('Speed Typing', 15);
    }
};

window.finishGame = (game, score) => {
    currentGame = game;
    currentScore = score;
    document.getElementById('game-content').innerHTML = `
        <h3 style="color:var(--success-color)">Game Over!</h3>
        <p>You scored ${score} pts.</p>
    `;
    const btn = document.getElementById('submit-score-btn');
    btn.classList.remove('hidden');
    btn.onclick = async () => {
        btn.textContent = "Saving...";
        btn.disabled = true;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8000/api/games/scores`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_name: currentGame, score: currentScore })
            });
            if (res.ok) {
                alert("Score Saved!");
                window.location.reload();
            }
        } catch (e) {
            alert("Error saving score");
        }
    };
};

window.closeGameArea = () => {
    document.getElementById('game-play-area').classList.add('hidden');
};
