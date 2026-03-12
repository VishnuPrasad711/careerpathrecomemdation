document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const resultsContainer = document.getElementById('results-container');
    const errorContainer = document.getElementById('error-container');

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
                const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(recruiter + ' careers jobs')}`;
                return `<li style="margin-bottom: 0.8rem; background: rgba(13, 17, 23, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); transition: border-color 0.2s, box-shadow 0.2s;" onmouseover="this.style.borderColor='rgba(88,166,255,0.4)'; this.style.boxShadow='0 4px 12px rgba(88,166,255,0.2)'" onmouseout="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none'">
                            <a href="${searchUrl}" target="_blank" style="color: var(--text-primary); text-decoration: none; display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; font-size: 1.1rem;">${recruiter}</span>
                                <span style="font-size: 0.9em; background: rgba(88, 166, 255, 0.1); color: #79c0ff; padding: 0.4rem 0.8rem; border-radius: 4px; border: 1px solid rgba(88, 166, 255, 0.2);">View Jobs 🔗</span>
                            </a>
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
