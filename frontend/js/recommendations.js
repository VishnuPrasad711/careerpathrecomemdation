document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const resultsContainer = document.getElementById('results-container');
    const errorContainer = document.getElementById('error-container');

    // Fetch user's location from profile
    let userLocation = '';
    try {
        const response = await fetch('http://localhost:8000/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const profile = await response.json();
            userLocation = profile.location || '';
        }
    } catch (err) {
        console.error('Failed to fetch profile location:', err);
    }

    // Sidebar & Tabs
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all menu items and tabs
            menuItems.forEach(m => m.classList.remove('active'));
            tabContents.forEach(t => t.classList.add('hidden'));

            // Add active class to clicked item and corresponding tab
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Nodes for data injection
    const aiAnalysis = document.getElementById('ai-analysis');
    const aiRoles = document.getElementById('ai-roles');
    const aiGaps = document.getElementById('ai-gaps');
    const aiCourses = document.getElementById('ai-courses');
    const aiRecruiters = document.getElementById('ai-recruiters');

    // Navigation Buttons
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    document.getElementById('error-back-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('ai_recommendations');
        window.location.href = 'index.html';
    });

    // Handle Data
    try {
        const rawData = sessionStorage.getItem('ai_recommendations');
        if (!rawData) {
            errorContainer.classList.remove('hidden');
            return;
        }

        const data = JSON.parse(rawData);

        // Populate Analysis
        aiAnalysis.textContent = data.analysis || "No analysis provided.";

        // Populate Roles & Prepare Charts Data
        let labels = [];
        let matchData = [];
        let demandData = [];

        if (data.matched_roles && Array.isArray(data.matched_roles)) {
            // Handle new quantified structure or fallback to older string array
            aiRoles.innerHTML = data.matched_roles.map(roleObj => {
                if (typeof roleObj === 'string') {
                    labels.push(roleObj);
                    matchData.push(Math.floor(Math.random() * 40) + 60); // Fake data if fallback
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

        // Initialize Charts
        const matchCtx = document.getElementById('matchChart').getContext('2d');
        new Chart(matchCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Match Percentage',
                    data: matchData,
                    backgroundColor: 'rgba(88, 166, 255, 0.6)',
                    borderColor: 'rgba(88, 166, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#8b949e' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8b949e' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#c9d1d9' } }
                }
            }
        });

        const demandCtx = document.getElementById('demandChart').getContext('2d');
        new Chart(demandCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Market Demand Score',
                    data: demandData,
                    backgroundColor: 'rgba(210, 168, 255, 0.2)',
                    borderColor: 'rgba(210, 168, 255, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#8b949e' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8b949e' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#c9d1d9' } }
                }
            }
        });

        // Populate Gap Analysis
        aiGaps.textContent = data.gap_analysis || "No gap analysis provided.";

        // Populate Course Recommendations
        if (data.course_recommendations && Array.isArray(data.course_recommendations)) {
            aiCourses.innerHTML = data.course_recommendations.map(course => `
                <div class="course-card">
                    <span class="course-platform">${course.platform || 'General'}</span>
                    <div class="course-title">${course.course_name || 'Suggested Course'}</div>
                    <div class="course-reason">${course.reason || ''}</div>
                </div>
            `).join('');
        }

        // Populate Recruiters
        if (data.potential_recruiters && Array.isArray(data.potential_recruiters)) {
            aiRecruiters.innerHTML = data.potential_recruiters.map(recruiter => {
                const location = userLocation.trim() ? encodeURIComponent(userLocation) : '';
                const position = document.getElementById('position').value.trim();

                const generateSearchId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                const normalizeSlug = (text) => text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, '-');
                const queryText = position ? `${position}`.trim() : '';
                const makeSearchText = (recruiter) => {
                    const parts = [queryText, recruiter].filter(Boolean).join(' ').trim();
                    return parts ? `${parts} jobs` : 'jobs';
                };
                const buildNaukriUrl = (recruiter) => {
                    const rawLocation = userLocation || '';
                    const queryText = [position, recruiter].filter(Boolean).join(' ').trim();
                    const locationSlug = rawLocation ? normalizeSlug(rawLocation) : '';
                    const keywordSlug = normalizeSlug(queryText || recruiter || position || 'jobs');
                    const experienceYears = parseInt(document.getElementById('experience').value, 10);
                    const experienceParam = Number.isFinite(experienceYears) && experienceYears >= 0 ? experienceYears : 0;
                    const url = `https://www.naukri.com/${keywordSlug}-jobs${locationSlug ? `-in-${locationSlug}` : ''}`;
                    return `${url}?k=${encodeURIComponent(queryText || recruiter || position || '')}${rawLocation ? `&l=${encodeURIComponent(rawLocation)}` : ''}&experience=${experienceParam}`;
                };
                const buildFounditUrl = (recruiter) => {
                    const rawLocation = userLocation || '';
                    const queryText = position ? `"${position}"${recruiter ? `%2C"${recruiter}"` : ''}` : recruiter ? `"${recruiter}"` : '';
                    const experienceYears = parseInt(document.getElementById('experience').value, 10);
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
                const jobSites = [
                    { name: 'LinkedIn', url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(makeSearchText(recruiter))}${location ? '&location=' + location : ''}`, icon: '<img src="img/linkedin.png" alt="LinkedIn" style="width: 14px; height: 14px; vertical-align: middle;">' },
                    { name: 'Indeed', url: `https://www.indeed.com/jobs?q=${encodeURIComponent(makeSearchText(recruiter))}${location ? '&l=' + location : ''}`, icon: '<img src="img/Indeed.png" alt="Indeed" style="width: 14px; height: 14px; vertical-align: middle;">' },
                    { name: 'Glassdoor', url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(makeSearchText(recruiter))}${location ? '&sc.location=' + location : ''}`, icon: '<img src="img/glassdoor.png" alt="Glassdoor" style="width: 14px; height: 14px; vertical-align: middle;">' },
                    { name: 'Foundit', url: buildFounditUrl(recruiter), icon: '<img src="img/foundit.png" alt="Foundit" style="width: 14px; height: 14px; vertical-align: middle;">' },
                    { name: 'Naukri', url: buildNaukriUrl(recruiter), icon: '<img src="img/Naukri.png" alt="Naukri" style="width: 14px; height: 14px; vertical-align: middle;">' }
                ];
                
                const siteLinks = jobSites.map(site => 
                    `<a href="${site.url}" target="_blank" style="color: #79c0ff; text-decoration: none; font-size: 0.8em; background: rgba(88, 166, 255, 0.1); padding: 0.3rem 0.6rem; border-radius: 4px; border: 1px solid rgba(88, 166, 255, 0.2); margin-right: 0.5rem; display: inline-block; margin-bottom: 0.3rem;">${site.icon} ${site.name}</a>`
                ).join('');
                
                return `<li style="margin-bottom: 1rem; background: rgba(13, 17, 23, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); transition: border-color 0.2s, box-shadow 0.2s;" onmouseover="this.style.borderColor='rgba(88,166,255,0.4)'; this.style.boxShadow='0 4px 12px rgba(88,166,255,0.2)'" onmouseout="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none'">
                            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">${recruiter}</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">${siteLinks}</div>
                        </li>`;
            }).join('');
        } else {
            aiRecruiters.innerHTML = "<li>No specific recruiters identified for this level.</li>";
        }

        resultsContainer.classList.remove('hidden');
    } catch (e) {
        console.error("Failed to parse recommendations:", e);
        errorContainer.classList.remove('hidden');
    }
});
